import * as vscode from 'vscode';
import { AuthenticationManager } from './authentication';

export interface PasteItem {
	title: string;
	content: string;
	modified_on: string;
}

export class PastebinProvider implements vscode.TreeDataProvider<PasteTreeItem> {
	private _onDidChangeTreeData: vscode.EventEmitter<PasteTreeItem | undefined | null | void> = new vscode.EventEmitter<PasteTreeItem | undefined | null | void>();
	readonly onDidChangeTreeData: vscode.Event<PasteTreeItem | undefined | null | void> = this._onDidChangeTreeData.event;

	private pastes: PasteItem[] = [];

	constructor(private authManager: AuthenticationManager) {}

	refresh(): void {
		this.loadPastes();
		this._onDidChangeTreeData.fire();
	}

	getTreeItem(element: PasteTreeItem): vscode.TreeItem {
		return element;
	}

	async getChildren(element?: PasteTreeItem): Promise<PasteTreeItem[]> {
		if (!this.authManager.isAuthenticated()) {
			return [new PasteTreeItem('Not authenticated', '', 'Click the key icon to authenticate', vscode.TreeItemCollapsibleState.None)];
		}

		if (this.pastes.length === 0) {
			await this.loadPastes();
		}

		if (this.pastes.length === 0) {
			return [new PasteTreeItem('No pastes found', '', 'Create your first paste at paste.lol', vscode.TreeItemCollapsibleState.None)];
		}

		return this.pastes.map(paste => {
			const modifiedDate = new Date(parseInt(paste.modified_on) * 1000);
			const tooltip = `Modified: ${modifiedDate.toLocaleString()}\n\nContent preview:\n${paste.content.substring(0, 200)}${paste.content.length > 200 ? '...' : ''}`;

			return new PasteTreeItem(
				paste.title,
				paste.modified_on,
				tooltip,
				vscode.TreeItemCollapsibleState.None
			);
		});
	}

	private async loadPastes(): Promise<void> {
		if (!this.authManager.isAuthenticated()) {
			return;
		}

		try {
			const address = this.authManager.getAddress();
			const apiKey = this.authManager.getApiKey();

			const response = await fetch(`https://api.omg.lol/address/${address}/pastebin`, {
				headers: {
					'Authorization': `Bearer ${apiKey}`,
					'Content-Type': 'application/json'
				}
			});

			if (!response.ok) {
				throw new Error(`HTTP ${response.status}: ${response.statusText}`);
			}

			const data = await response.json() as {
				request: { success: boolean };
				response: { pastebin?: PasteItem[] };
			};

			if (data.request.success && data.response.pastebin) {
				this.pastes = data.response.pastebin;
				// Sort by modification date (newest first)
				this.pastes.sort((a, b) => parseInt(b.modified_on) - parseInt(a.modified_on));
			} else {
				this.pastes = [];
			}

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
		public readonly collapsibleState: vscode.TreeItemCollapsibleState
	) {
		super(title, collapsibleState);

		this.tooltip = tooltip;
		this.description = modifiedOn ? new Date(parseInt(modifiedOn) * 1000).toLocaleDateString() : '';
		this.iconPath = new vscode.ThemeIcon('file-text');

		// Add context value for potential future menu items
		this.contextValue = 'paste';
	}
}