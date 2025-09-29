import * as vscode from 'vscode';
import { OmgLolApi } from './api';
import { PasteItem } from './types';
import { AuthenticationManager } from './authentication';

export class PastebinProvider implements vscode.TreeDataProvider<PasteTreeItem> {
	private _onDidChangeTreeData: vscode.EventEmitter<PasteTreeItem | undefined | null | void> = new vscode.EventEmitter<PasteTreeItem | undefined | null | void>();
	readonly onDidChangeTreeData: vscode.Event<PasteTreeItem | undefined | null | void> = this._onDidChangeTreeData.event;

	constructor(private api: OmgLolApi, private authManager: AuthenticationManager) {}

	refresh(): void {
		this._onDidChangeTreeData.fire();
	}

	getTreeItem(element: PasteTreeItem): vscode.TreeItem {
		return element;
	}

	async getChildren(element?: PasteTreeItem): Promise<PasteTreeItem[]> {
		if (!await this.authManager.isAuthenticated()) {
			return [new PasteTreeItem('Not authenticated', '', 'Click the key icon to authenticate', vscode.TreeItemCollapsibleState.None, false)];
		}

        try {
            const pastes = await this.api.getPastes();
            if (pastes.length === 0) {
                return [new PasteTreeItem('No pastes found', '', 'Create your first paste at paste.lol', vscode.TreeItemCollapsibleState.None, false)];
            }

            pastes.sort((a, b) => parseInt(b.modified_on) - parseInt(a.modified_on));

            return pastes.map(paste => {
                const modifiedDate = new Date(parseInt(paste.modified_on) * 1000);
                const tooltip = `Modified: ${modifiedDate.toLocaleString()}`;
    
                return new PasteTreeItem(
                    paste.title,
                    paste.modified_on,
                    tooltip,
                    vscode.TreeItemCollapsibleState.None,
                    true
                );
            });
        } catch (error) {
            vscode.window.showErrorMessage(`Failed to load pastes: ${error}`);
            return [];
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
            this.command = {
                command: 'pastepad.openPaste',
                title: 'Open Paste',
                arguments: [this]
            };
		} else {
			this.contextValue = 'status';
		}
	}
}