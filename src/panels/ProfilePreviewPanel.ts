import * as vscode from 'vscode';
import { OmgLolApi } from '../api';
import { LoggerService } from '../services';

export class ProfilePreviewPanel {
    public static currentPanel: ProfilePreviewPanel | undefined;
    private readonly panel: vscode.WebviewPanel;
    private disposables: vscode.Disposable[] = [];
    private updateTimeout: NodeJS.Timeout | undefined;
    private logger: LoggerService;

    /**
     * Create or show the profile preview panel
     */
    public static async createOrShow(
        extensionUri: vscode.Uri,
        documentUri: vscode.Uri,
        api: OmgLolApi,
        viewColumn?: vscode.ViewColumn,
        takeFocus: boolean = true
    ): Promise<ProfilePreviewPanel> {
        const logger = LoggerService.getInstance();
        logger.info('Creating profile preview panel', { documentUri: documentUri.toString(), takeFocus });

        // Determine the column to use
        let targetColumn = viewColumn;
        if (!targetColumn) {
            // If no column specified, put it beside the active editor
            const activeColumn = vscode.window.activeTextEditor?.viewColumn;
            if (activeColumn === vscode.ViewColumn.One) {
                targetColumn = vscode.ViewColumn.Two;
            } else if (activeColumn === vscode.ViewColumn.Two) {
                targetColumn = vscode.ViewColumn.Three;
            } else {
                targetColumn = vscode.ViewColumn.Beside;
            }
        }

        // If we already have a panel, show it
        if (ProfilePreviewPanel.currentPanel) {
            ProfilePreviewPanel.currentPanel.panel.reveal(targetColumn, takeFocus);
            return ProfilePreviewPanel.currentPanel;
        }

        // Otherwise, create a new panel
        const panel = vscode.window.createWebviewPanel(
            'omgProfilePreview',
            'Profile Preview',
            { viewColumn: targetColumn, preserveFocus: !takeFocus },
            {
                enableScripts: true,
                retainContextWhenHidden: true,
                localResourceRoots: [
                    vscode.Uri.joinPath(extensionUri, 'media'),
                    vscode.Uri.joinPath(extensionUri, 'node_modules')
                ]
            }
        );

        ProfilePreviewPanel.currentPanel = new ProfilePreviewPanel(panel, extensionUri, documentUri, api);
        return ProfilePreviewPanel.currentPanel;
    }

    private constructor(
        panel: vscode.WebviewPanel,
        private readonly extensionUri: vscode.Uri,
        private documentUri: vscode.Uri,
        private api: OmgLolApi
    ) {
        this.panel = panel;
        this.logger = LoggerService.getInstance();

        // Set the webview's initial HTML content
        this.update();

        // Listen for when the panel is disposed
        this.panel.onDidDispose(() => this.dispose(), null, this.disposables);

        // Update the content when the panel becomes visible
        this.panel.onDidChangeViewState(
            () => {
                if (this.panel.visible) {
                    this.update();
                }
            },
            null,
            this.disposables
        );
    }

    public updatePreview(content: string): void {
        // Debounce updates to avoid too many refreshes
        if (this.updateTimeout) {
            clearTimeout(this.updateTimeout);
        }

        this.updateTimeout = setTimeout(() => {
            this.update(content);
        }, 500);
    }

    private async update(content?: string): Promise<void> {
        try {
            const document = await vscode.workspace.openTextDocument(this.documentUri);
            const previewContent = content || document.getText();
            const isNowPage = this.documentUri.scheme === 'omgnow';

            this.logger.debug('Updating profile preview', {
                uri: this.documentUri.toString(),
                contentLength: previewContent.length,
                isNowPage
            });

            const address = await this.api.getAuthorizationManager().getAddress();
            if (!address) {
                this.panel.webview.html = this.getErrorHtml('Not authenticated');
                return;
            }

            // Fetch profile data to get theme information
            let profileData;
            try {
                profileData = isNowPage
                    ? await this.api.getNowPage()
                    : await this.api.getProfile();
            } catch (error) {
                this.logger.warn('Could not fetch profile data, using default theme', { error });
            }

            const html = this.getHtmlForWebview(previewContent, address || '', profileData, isNowPage);
            this.panel.webview.html = html;
        } catch (error) {
            this.logger.error('Failed to update preview', { error });
            this.panel.webview.html = this.getErrorHtml(`Failed to load preview: ${error}`);
        }
    }

    private getHtmlForWebview(
        content: string,
        address: string,
        profileData?: any,
        isNowPage: boolean = false
    ): string {
        const nonce = this.getNonce();

        // Basic omg.lol styling (using default theme)
        const themeCss = this.getThemeCss();

        // Process content - replace placeholders and render markdown
        const processedContent = this.processContent(content, address, profileData);

        const title = isNowPage ? `/now - ${address}` : `${address} - Profile`;

        return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src 'unsafe-inline'; img-src https: data:; script-src 'nonce-${nonce}';">
    <title>${title}</title>
    <style>
        ${themeCss}
        body {
            padding: 20px;
            max-width: 800px;
            margin: 0 auto;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
            line-height: 1.6;
        }
        .preview-header {
            text-align: center;
            margin-bottom: 30px;
            padding-bottom: 20px;
            border-bottom: 1px solid #eee;
        }
        .preview-header h1 {
            margin: 0 0 10px 0;
        }
        .preview-header .meta {
            color: #666;
            font-size: 0.9em;
        }
        .preview-content {
            line-height: 1.8;
        }
        .preview-content h1,
        .preview-content h2,
        .preview-content h3 {
            margin-top: 1.5em;
            margin-bottom: 0.5em;
        }
        .preview-content p {
            margin-bottom: 1em;
        }
        .preview-content ul,
        .preview-content ol {
            margin-bottom: 1em;
            padding-left: 2em;
        }
        .preview-content a {
            color: #0066cc;
            text-decoration: none;
        }
        .preview-content a:hover {
            text-decoration: underline;
        }
        .preview-content code {
            background: #f4f4f4;
            padding: 2px 6px;
            border-radius: 3px;
            font-family: 'Courier New', monospace;
        }
        .preview-content pre {
            background: #f4f4f4;
            padding: 15px;
            border-radius: 5px;
            overflow-x: auto;
        }
        .preview-content pre code {
            background: none;
            padding: 0;
        }
        .preview-footer {
            margin-top: 30px;
            padding-top: 20px;
            border-top: 1px solid #eee;
            text-align: center;
            color: #666;
            font-size: 0.9em;
        }
    </style>
</head>
<body>
    <div class="preview-header">
        <h1>${isNowPage ? `/now - ${address}` : address}</h1>
        <div class="meta">Live Preview</div>
    </div>
    <div class="preview-content">
        ${processedContent}
    </div>
    <div class="preview-footer">
        Preview - ${new Date().toLocaleString()}
    </div>
</body>
</html>`;
    }

    private getThemeCss(): string {
        // Default omg.lol theme CSS
        return `
            body {
                background: linear-gradient(0deg, #3fb6b6 0%, #d56b86 100%);
                background-repeat: no-repeat;
                background-attachment: fixed;
                color: #000;
            }
            .preview-content {
                background: rgba(255, 255, 255, 0.95);
                padding: 30px;
                border-radius: 10px;
                box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
            }
        `;
    }

    private processContent(content: string, address: string, profileData?: any): string {
        // Replace omg.lol placeholders
        let processed = content;

        // Replace {profile-picture}
        if (profileData?.pfp) {
            processed = processed.replace(/\{profile-picture\}/g, `<img src="${profileData.pfp}" alt="Profile Picture" style="max-width: 150px; border-radius: 50%; display: block; margin: 20px auto;">`);
        } else {
            processed = processed.replace(/\{profile-picture\}/g, '');
        }

        // Replace {address}
        processed = processed.replace(/\{address\}/g, address);

        // Replace {last-updated}
        const now = new Date().toLocaleString();
        processed = processed.replace(/\{last-updated\}/g, now);

        // Simple markdown-like processing
        // Headers
        processed = processed.replace(/^### (.*$)/gim, '<h3>$1</h3>');
        processed = processed.replace(/^## (.*$)/gim, '<h2>$1</h2>');
        processed = processed.replace(/^# (.*$)/gim, '<h1>$1</h1>');

        // Bold and italic
        processed = processed.replace(/\*\*\*(.*?)\*\*\*/gim, '<strong><em>$1</em></strong>');
        processed = processed.replace(/\*\*(.*?)\*\*/gim, '<strong>$1</strong>');
        processed = processed.replace(/\*(.*?)\*/gim, '<em>$1</em>');

        // Links
        processed = processed.replace(/\[([^\]]+)\]\(([^)]+)\)/gim, '<a href="$2" target="_blank">$1</a>');

        // Images
        processed = processed.replace(/!\[([^\]]*)\]\(([^)]+)\)/gim, '<img src="$2" alt="$1" style="max-width: 100%;">');

        // Line breaks and paragraphs
        processed = processed.replace(/\n\n/g, '</p><p>');
        processed = processed.replace(/\n/g, '<br>');

        return `<p>${processed}</p>`;
    }

    private getErrorHtml(message: string): string {
        return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Preview Error</title>
    <style>
        body {
            font-family: sans-serif;
            padding: 20px;
            color: #333;
        }
        .error {
            background: #fee;
            border: 1px solid #fcc;
            padding: 20px;
            border-radius: 5px;
            color: #c33;
        }
    </style>
</head>
<body>
    <div class="error">
        <h2>Preview Error</h2>
        <p>${this.escapeHtml(message)}</p>
    </div>
</body>
</html>`;
    }

    private escapeHtml(text: string): string {
        const map: { [key: string]: string } = {
            '&': '&amp;',
            '<': '&lt;',
            '>': '&gt;',
            '"': '&quot;',
            "'": '&#039;'
        };
        return text.replace(/[&<>"']/g, m => map[m]);
    }

    private getNonce(): string {
        let text = '';
        const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
        for (let i = 0; i < 32; i++) {
            text += possible.charAt(Math.floor(Math.random() * possible.length));
        }
        return text;
    }

    public dispose(): void {
        ProfilePreviewPanel.currentPanel = undefined;
        this.panel.dispose();

        while (this.disposables.length) {
            const disposable = this.disposables.pop();
            if (disposable) {
                disposable.dispose();
            }
        }

        if (this.updateTimeout) {
            clearTimeout(this.updateTimeout);
        }
    }
}
