import * as vscode from 'vscode';
import { AuthenticationManager } from './authentication';
import { getLanguageFromTitle } from './languageDetection';

export class PasteDocumentProvider implements vscode.TextDocumentContentProvider {
	private _onDidChange = new vscode.EventEmitter<vscode.Uri>();
	private openPastes = new Map<string, string>(); // URI string -> paste title
	private pasteContent = new Map<string, string>(); // paste title -> content
	private unsyncedFiles = new Set<string>(); // Track files with unsaved changes
	private autoSaveTimers = new Map<string, NodeJS.Timeout>(); // Document URI -> timeout
	private autoSaveDelay = 2000; // 2 seconds delay for auto-save

	constructor(private authManager: AuthenticationManager) {
		// Listen for document changes to implement auto-sync
		vscode.workspace.onDidChangeTextDocument((event) => {
			this.handleDocumentChange(event);
		});
	}

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

	// URI scheme management - different schemes for different document states
	public createPasteUri(pasteTitle: string): vscode.Uri {
		return vscode.Uri.parse(`pastepad://paste/${encodeURIComponent(pasteTitle)}`);
	}

	public createEditableUri(pasteTitle: string): vscode.Uri {
		return vscode.Uri.parse(`pastepad-edit://paste/${encodeURIComponent(pasteTitle)}`);
	}

	public createViewUri(pasteTitle: string): vscode.Uri {
		return vscode.Uri.parse(`pastepad-view://paste/${encodeURIComponent(pasteTitle)}`);
	}

	public createNewPasteUri(pasteTitle: string): vscode.Uri {
		return vscode.Uri.parse(`pastepad-new://paste/${encodeURIComponent(pasteTitle)}`);
	}

	public async openPaste(pasteTitle: string): Promise<vscode.TextEditor | null> {
		// Check if this paste is already open
		const existingEditor = vscode.window.visibleTextEditors.find(
			editor => {
				const editorPasteTitle = this.getPasteTitle(editor.document.uri);
				return editorPasteTitle === pasteTitle;
			}
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
		return (uri.scheme === 'pastepad' || uri.scheme === 'pastepad-edit' ||
			uri.scheme === 'pastepad-view' || uri.scheme === 'pastepad-new') &&
			uri.authority === 'paste';
	}

	public isEditablePasteDocument(uri: vscode.Uri): boolean {
		return uri.scheme === 'pastepad-edit' || this.isOpenedPasteDocument(uri);
	}

	public isViewOnlyPasteDocument(uri: vscode.Uri): boolean {
		return uri.scheme === 'pastepad-view';
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
		return uri.scheme === 'untitled' || uri.scheme === 'pastepad-new';
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

	// Auto-sync functionality
	private handleDocumentChange(event: vscode.TextDocumentChangeEvent): void {
		const uri = event.document.uri;

		// Only handle paste documents
		if (!this.isOpenedPasteDocument(uri) && !this.isEditablePasteDocument(uri)) {
			return;
		}

		// Mark as unsynced
		this.unsyncedFiles.add(uri.toString());

		// Clear existing timer for this document
		const existingTimer = this.autoSaveTimers.get(uri.toString());
		if (existingTimer) {
			clearTimeout(existingTimer);
		}

		// Set new timer for auto-save
		const timer = setTimeout(() => {
			this.autoSaveDocument(event.document);
		}, this.autoSaveDelay);

		this.autoSaveTimers.set(uri.toString(), timer);
	}

	private async autoSaveDocument(document: vscode.TextDocument): Promise<void> {
		try {
			const pasteTitle = this.getPasteTitle(document.uri);
			if (!pasteTitle) {
				return;
			}

			const content = document.getText();

			// Only auto-save if there are actual changes
			const cachedContent = this.pasteContent.get(pasteTitle);
			if (content === cachedContent) {
				this.unsyncedFiles.delete(document.uri.toString());
				return;
			}

			// Perform the save
			const success = await this.authManager.savePaste(pasteTitle, content);

			if (success) {
				// Update cached content
				this.pasteContent.set(pasteTitle, content);
				// Remove from unsynced files
				this.unsyncedFiles.delete(document.uri.toString());

				// Show subtle notification
				vscode.window.setStatusBarMessage(`Auto-saved: ${pasteTitle}`, 2000);
			} else {
				// Keep in unsynced state on failure
				console.warn(`Auto-save failed for paste: ${pasteTitle}`);
			}
		} catch (error) {
			console.error('Auto-save error:', error);
		} finally {
			// Clean up timer
			this.autoSaveTimers.delete(document.uri.toString());
		}
	}

	public hasUnsyncedChanges(uri: vscode.Uri): boolean {
		return this.unsyncedFiles.has(uri.toString());
	}

	public getUnsyncedFiles(): string[] {
		return Array.from(this.unsyncedFiles);
	}

	public async forceSyncDocument(document: vscode.TextDocument): Promise<boolean> {
		const pasteTitle = this.getPasteTitle(document.uri);
		if (!pasteTitle) {
			return false;
		}

		try {
			const content = document.getText();
			const success = await this.authManager.savePaste(pasteTitle, content);

			if (success) {
				this.pasteContent.set(pasteTitle, content);
				this.unsyncedFiles.delete(document.uri.toString());
			}

			return success;
		} catch (error) {
			console.error('Force sync error:', error);
			return false;
		}
	}

	public dispose(): void {
		// Clear all auto-save timers
		for (const timer of this.autoSaveTimers.values()) {
			clearTimeout(timer);
		}
		this.autoSaveTimers.clear();

		this._onDidChange.dispose();
		this.clearCache();
	}
}