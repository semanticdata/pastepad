import * as vscode from 'vscode';
import { AuthenticationManager } from './authentication';
import { getLanguageFromTitle } from './languageDetection';

export class PasteDocumentProvider implements vscode.TextDocumentContentProvider {
	private _onDidChange = new vscode.EventEmitter<vscode.Uri>();
	private openPastes = new Map<string, string>(); // URI string -> paste title
	private pasteContent = new Map<string, string>(); // paste title -> content

	constructor(private authManager: AuthenticationManager) {}

	get onDidChange(): vscode.Event<vscode.Uri> {
		return this._onDidChange.event;
	}

	async provideTextDocumentContent(uri: vscode.Uri): Promise<string> {
		const pasteTitle = this.getPasteTitleFromUri(uri);

		if (!pasteTitle) {
			return '';
		}

		// Check if we already have the content cached
		let content = this.pasteContent.get(pasteTitle);

		if (!content) {
			// Fetch the content from the API
			const fetchedContent = await this.authManager.fetchPasteContent(pasteTitle);
			if (fetchedContent) {
				content = fetchedContent;
				this.pasteContent.set(pasteTitle, content);
			}
		}

		return content || '';
	}

	private getPasteTitleFromUri(uri: vscode.Uri): string | null {
		// URI format: pastepad://paste/{title}
		const pathParts = uri.path.split('/');
		return pathParts.length >= 2 ? decodeURIComponent(pathParts[1]) : null;
	}

	public createPasteUri(pasteTitle: string): vscode.Uri {
		return vscode.Uri.parse(`pastepad://paste/${encodeURIComponent(pasteTitle)}`);
	}

	public async openPaste(pasteTitle: string): Promise<vscode.TextEditor | null> {
		// Check if this paste is already open using a custom scheme
		const customUriString = `pastepad-edit:${pasteTitle}`;
		const existingEditor = vscode.window.visibleTextEditors.find(
			editor => editor.document.uri.toString().includes(pasteTitle) &&
			(editor.document.uri.scheme === 'untitled' || editor.document.uri.toString().includes('pastepad-edit'))
		);

		if (existingEditor) {
			// Focus the existing editor
			await vscode.window.showTextDocument(existingEditor.document, {
				viewColumn: existingEditor.viewColumn,
				preserveFocus: false
			});
			return existingEditor;
		}

		try {
			// Check if we have cached content first, otherwise fetch it
			let content = this.pasteContent.get(pasteTitle);

			if (!content) {
				// Fetch the content from API
				const fetchedContent = await this.authManager.fetchPasteContent(pasteTitle);

				if (fetchedContent === null) {
					vscode.window.showErrorMessage(`Failed to load paste: ${pasteTitle}`);
					return null;
				}

				content = fetchedContent;
				// Cache the content
				this.pasteContent.set(pasteTitle, content);
			}

			// Create an editable document with the content
			const language = getLanguageFromTitle(pasteTitle);
			const document = await vscode.workspace.openTextDocument({
				content: content,
				language: language
			});

			// Track this as an existing paste for save logic
			this.openPastes.set(document.uri.toString(), pasteTitle);

			// Show the document
			const editor = await vscode.window.showTextDocument(document, {
				preview: false,
				viewColumn: vscode.ViewColumn.Active
			});

			return editor;

		} catch (error) {
			console.error('Error opening paste:', error);
			vscode.window.showErrorMessage(`Failed to open paste: ${error}`);
			return null;
		}
	}

	public isPasteDocument(uri: vscode.Uri): boolean {
		return uri.scheme === 'pastepad' && uri.authority === 'paste';
	}

	public isOpenedPasteDocument(uri: vscode.Uri): boolean {
		return this.openPastes.has(uri.toString());
	}

	public getPasteTitle(uri: vscode.Uri): string | null {
		if (this.isPasteDocument(uri)) {
			return this.getPasteTitleFromUri(uri);
		}
		// Check if this is an opened paste document
		return this.openPastes.get(uri.toString()) || null;
	}

	public isNewPaste(uri: vscode.Uri): boolean {
		return uri.scheme === 'untitled' || (uri.scheme === 'pastepad' && uri.authority === 'new');
	}

	public createNewPasteUri(pasteTitle: string): vscode.Uri {
		return vscode.Uri.parse(`pastepad://new/${encodeURIComponent(pasteTitle)}`);
	}

	public async createNewPaste(pasteTitle: string): Promise<vscode.TextEditor | null> {
		try {
			const language = getLanguageFromTitle(pasteTitle);

			// Create a new untitled document with the specified language
			const document = await vscode.workspace.openTextDocument({
				content: '',
				language: language
			});

			const editor = await vscode.window.showTextDocument(document, {
				preview: false,
				viewColumn: vscode.ViewColumn.Active
			});

			return editor;

		} catch (error) {
			console.error('Error creating new paste:', error);
			vscode.window.showErrorMessage(`Failed to create new paste: ${error}`);
			return null;
		}
	}

	public updatePasteContent(pasteTitle: string, content: string): void {
		this.pasteContent.set(pasteTitle, content);

		// Find any open documents for this paste and trigger a refresh
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

	public dispose(): void {
		this._onDidChange.dispose();
		this.clearCache();
	}
}