import * as vscode from 'vscode';
import { OmgLolApi } from './api';
import { getLanguageFromTitle } from './languageDetection';
import { LoggerService } from './services';

export class PasteDocumentProvider implements vscode.TextDocumentContentProvider {
	private _onDidChange = new vscode.EventEmitter<vscode.Uri>();
	private openPastes = new Map<string, string>(); // URI string -> paste title
	private pasteContent = new Map<string, string>(); // paste title -> content
	private logger: LoggerService;

	constructor(private api: OmgLolApi) {
		this.logger = LoggerService.getInstance();
	}

	get onDidChange(): vscode.Event<vscode.Uri> {
		return this._onDidChange.event;
	}

	async provideTextDocumentContent(uri: vscode.Uri): Promise<string> {
		const pasteTitle = this.getPasteTitleFromUri(uri);

		if (!pasteTitle) {
			return '';
		}

		let content = this.pasteContent.get(pasteTitle);

		if (content === undefined) {
			const paste = await this.api.getPaste(pasteTitle);
			if (paste && typeof paste.content === 'string') {
				content = paste.content;
				this.pasteContent.set(pasteTitle, content);
			}
		}

		return content || '';
	}

	private getPasteTitleFromUri(uri: vscode.Uri): string | null {
		const pathParts = uri.path.split('/');
		return pathParts.length >= 2 ? decodeURIComponent(pathParts[1]) : null;
	}

	public createPasteUri(pasteTitle: string): vscode.Uri {
		return vscode.Uri.parse(`pastepad://paste/${encodeURIComponent(pasteTitle)}`);
	}

	public async openPaste(pasteTitle: string): Promise<vscode.TextEditor | null> {
		const existingEditor = vscode.window.visibleTextEditors.find(
			editor => {
				const editorPasteTitle = this.getPasteTitle(editor.document.uri);
				return editorPasteTitle === pasteTitle;
			}
		);

		if (existingEditor) {
			await vscode.window.showTextDocument(existingEditor.document, {
				viewColumn: existingEditor.viewColumn,
				preserveFocus: false
			});
			return existingEditor;
		}

		try {
			let content = this.pasteContent.get(pasteTitle);

			if (content === undefined) {
				const paste = await this.api.getPaste(pasteTitle);

				if (!paste || typeof paste.content !== 'string') {
					vscode.window.showErrorMessage(`Failed to load paste: ${pasteTitle}`);
					return null;
				}

				content = paste.content;
				this.pasteContent.set(pasteTitle, content);
			}

			const language = getLanguageFromTitle(pasteTitle);
			const document = await vscode.workspace.openTextDocument({
				content: content,
				language: language
			});

			this.openPastes.set(document.uri.toString(), pasteTitle);

			const editor = await vscode.window.showTextDocument(document, {
				preview: false,
				viewColumn: vscode.ViewColumn.Active
			});

			return editor;

		} catch (error) {
			this.logger.error('Paste document opening failed', { error });
			vscode.window.showErrorMessage(`Failed to open paste: ${error}`);
			return null;
		}
	}

	public isPasteDocument(uri: vscode.Uri): boolean {
		return uri.scheme === 'pastepad' && uri.authority === 'paste';
	}

	public getPasteTitle(uri: vscode.Uri): string | null {
		if (this.isPasteDocument(uri)) {
			return this.getPasteTitleFromUri(uri);
		}
		return this.openPastes.get(uri.toString()) || null;
	}

	public updatePasteContent(pasteTitle: string, content: string): void {
		this.pasteContent.set(pasteTitle, content);
		const uri = this.createPasteUri(pasteTitle);
		this._onDidChange.fire(uri);
	}

	public clearCache(): void {
		this.pasteContent.clear();
		this.openPastes.clear();
	}

	public removePasteTracking(uri: vscode.Uri): void {
		this.openPastes.delete(uri.toString());
	}

    public async savePaste(document: vscode.TextDocument): Promise<boolean> {
        const title = this.getPasteTitle(document.uri);
        if (!title) {
            return false;
        }

        const content = document.getText();

        try {
            await this.api.updatePaste(title, content);
            this.pasteContent.set(title, content);
            return true;
        } catch (error) {
            vscode.window.showErrorMessage(`Failed to save paste: ${error}`);
            return false;
        }
    }

    public async createPaste(title: string, content: string): Promise<boolean> {
        try {
            await this.api.createPaste(title, content);
            this.pasteContent.set(title, content);
            return true;
        } catch (error) {
            vscode.window.showErrorMessage(`Failed to create paste: ${error}`);
            return false;
        }
    }
}