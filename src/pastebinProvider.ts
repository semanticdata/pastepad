import * as vscode from 'vscode';
import { OmgLolApi } from './api';
import { PasteItem } from './types';

export class PastebinProvider implements vscode.TreeDataProvider<PasteTreeItem> {
	private _onDidChangeTreeData: vscode.EventEmitter<PasteTreeItem | undefined | null | void> = new vscode.EventEmitter<PasteTreeItem | undefined | null | void>();
	readonly onDidChangeTreeData: vscode.Event<PasteTreeItem | undefined | null | void> = this._onDidChangeTreeData.event;

	private pastes: PasteItem[] = [];

	constructor(private api: OmgLolApi, private authManager: any) {}

	refresh(): void {
		this.loadPastes();
		this._onDidChangeTreeData.fire();
	}

	getTreeItem(element: PasteTreeItem): vscode.TreeItem {
		return element;
	}

	async getChildren(element?: PasteTreeItem): Promise<PasteTreeItem[]> {
		if (!await this.authManager.isAuthenticated()) {
			return [new PasteTreeItem('Not authenticated', '', 'Click the key icon to authenticate', vscode.TreeItemCollapsibleState.None, false)];
		}

		if (this.pastes.length === 0) {
			await this.loadPastes();
		}

		if (this.pastes.length === 0) {
			return [new PasteTreeItem('No pastes found', '', 'Create your first paste at paste.lol', vscode.TreeItemCollapsibleState.None, false)];
		}

		return this.pastes.map(paste => {
			const modifiedDate = new Date(parseInt(paste.modified_on) * 1000);
			const tooltip = `Modified: ${modifiedDate.toLocaleString()}\n\nContent preview:\n${paste.content.substring(0, 200)}${paste.content.length > 200 ? '...' : ''}`;

			return new PasteTreeItem(
				paste.title,
				paste.modified_on,
				tooltip,
				vscode.TreeItemCollapsibleState.None,
				true
			);
		});
	}

	private async loadPastes(): Promise<void> {
		if (!await this.authManager.isAuthenticated()) {
			return;
		}

		try {
            this.pastes = await this.api.getPastes();
			// Sort by modification date (newest first)
			this.pastes.sort((a, b) => parseInt(b.modified_on) - parseInt(a.modified_on));
		} catch (error) {
			console.error('Error loading pastes:', error);
			vscode.window.showErrorMessage(`Failed to load pastes: ${error}`);
			this.pastes = [];
		}
	}
}

export class PasteTreeItem extends vscode.TreeItem {
	constructor(
		public readonly title: string,
		public readonly modifiedOn: string,
		public readonly tooltip: string,
		public readonly collapsibleState: vscode.TreeItemCollapsibleState,
		public readonly isPaste: boolean = true
	) {
		super(title, collapsibleState);

		this.tooltip = tooltip;
		this.description = modifiedOn ? new Date(parseInt(modifiedOn) * 1000).toLocaleDateString() : '';
		this.iconPath = new vscode.ThemeIcon('file-text');

		if (isPaste) {
			this.contextValue = 'paste';
			this.resourceUri = vscode.Uri.parse(`pastepad:${this.title}`);
		} else {
			this.contextValue = 'status';
		}
	}
}
