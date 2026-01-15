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
            let themeId = 'default'; // Default theme
            let customCss = '';
            let customHead = '';

            try {
                // Always fetch profile to get the theme ID and custom CSS
                profileData = await this.api.getProfile();
                themeId = (profileData as any)?.theme || 'default';
                customCss = (profileData as any)?.css || '';
                customHead = (profileData as any)?.head || '';

                this.logger.debug('Fetched profile theme', { themeId, hasCustomCss: !!customCss, hasCustomHead: !!customHead });
            } catch (error) {
                this.logger.warn('Could not fetch profile data, using default theme', { error });
            }

            const html = await this.getHtmlForWebview(previewContent, address, themeId, isNowPage, customCss, customHead);
            this.panel.webview.html = html;
        } catch (error) {
            this.logger.error('Failed to update preview', { error });
            this.panel.webview.html = this.getErrorHtml(`Failed to load preview: ${error}`);
        }
    }

    private async getHtmlForWebview(
        content: string,
        address: string,
        themeId: string,
        isNowPage: boolean,
        customCss: string,
        customHead: string
    ): Promise<string> {
        const nonce = this.getNonce();

        // Fetch the theme preview HTML to extract the stylesheet link
        let stylesheetUrl = 'https://static.omg.lol/profiles/themes/css/base.css?v=20220807';
        let themeStyleTag = '';

        try {
            const themePreview = await this.api.getThemePreviewHtml(themeId);
            if (themePreview?.response?.html) {
                // Extract the stylesheet link from the HTML
                const linkMatch = themePreview.response.html.match(/<link href="([^"]+)" rel="stylesheet">/);
                if (linkMatch && linkMatch[1]) {
                    stylesheetUrl = linkMatch[1];
                }

                // Also try to extract inline styles from the body tag for themes that have them
                const bodyStyleMatch = themePreview.response.html.match(/<body style="([^"]+)">/);
                if (bodyStyleMatch && bodyStyleMatch[1]) {
                    themeStyleTag = bodyStyleMatch[1];
                }
            }
        } catch (error) {
            this.logger.warn('Could not fetch theme preview HTML, using default stylesheet', { error });
        }

        // Process content - replace placeholders and render markdown
        const processedContent = this.processContent(content, address);

        const title = isNowPage ? `/now - ${address}` : `${address} - Profile`;

        // Build the HTML using omg.lol's actual structure and stylesheet
        return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${title}</title>
    <link href="${stylesheetUrl}" rel="stylesheet">
    ${customHead}
    <style>
        body {
            ${themeStyleTag}
            padding: 20px;
        }
        .preview-indicator {
            position: fixed;
            top: 10px;
            right: 10px;
            background: rgba(0, 0, 0, 0.7);
            color: white;
            padding: 5px 10px;
            border-radius: 5px;
            font-size: 12px;
            z-index: 1000;
        }
        /* Custom CSS from profile */
        ${customCss}
    </style>
</head>
<body>
    <div class="preview-indicator">Live Preview - ${new Date().toLocaleString()}</div>
    <main>
        ${processedContent}
    </main>
</body>
</html>`;
    }

    private processContent(content: string, address: string): string {
        let processed = content;

        // Replace {address}
        processed = processed.replace(/\{address\}/g, address);

        // Replace {last-updated}
        const now = new Date().toLocaleString();
        processed = processed.replace(/\{last-updated\}/g, now);

        // Replace {profile-picture} with empty string for now
        // In the future we could fetch and display the actual profile picture
        processed = processed.replace(/\{profile-picture\}/g, '');

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
        processed = processed.replace(/!\[([^\]]*)\]\(([^)]+)\)/gim, '<img src="$2" alt="$1">');

        // Line breaks and paragraphs
        processed = processed.replace(/\n\n/g, '</p><p>');
        processed = processed.replace(/\n/g, '<br>');

        return `<div id="bio"><p>${processed}</p></div>`;
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
