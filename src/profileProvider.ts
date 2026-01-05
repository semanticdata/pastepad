import * as vscode from 'vscode';
import { AuthenticationManager } from './authentication';

export class ProfileProvider implements vscode.TreeDataProvider<ProfileTreeItem> {
    private _onDidChangeTreeData = new vscode.EventEmitter<ProfileTreeItem | undefined | void>();
    readonly onDidChangeTreeData = this._onDidChangeTreeData.event;

    constructor(private authManager: AuthenticationManager) {}

    refresh(): void {
        this._onDidChangeTreeData.fire();
    }

    getTreeItem(element: ProfileTreeItem): vscode.TreeItem {
        return element;
    }

    async getChildren(element?: ProfileTreeItem): Promise<ProfileTreeItem[]> {
        if (!this.authManager.isAuthenticated()) {
            return [new ProfileTreeItem('Please authenticate to use omg.lol profiles', vscode.TreeItemCollapsibleState.None, 'info')];
        }

        if (element) {
            // If it's a parent item, return children
            return [];
        } else {
            // Root level items
            const address = await this.authManager.getAddress();
            const addressLabel = address ? ` (${address})` : '';

            return [
                new ProfileTreeItem(
                    `Main Profile${addressLabel}`,
                    vscode.TreeItemCollapsibleState.None,
                    'profile',
                    { command: 'pastepad.openProfile', title: 'Open Profile', arguments: [] }
                ),
                new ProfileTreeItem(
                    '/Now Page',
                    vscode.TreeItemCollapsibleState.None,
                    'now',
                    { command: 'pastepad.openNowPage', title: 'Open /Now Page', arguments: [] }
                )
            ];
        }
    }
}

export class ProfileTreeItem extends vscode.TreeItem {
    constructor(
        public readonly label: string,
        public readonly collapsibleState: vscode.TreeItemCollapsibleState,
        public readonly type: 'profile' | 'now' | 'info',
        public readonly command?: vscode.Command
    ) {
        super(label, collapsibleState);

        this.tooltip = this.label;
        this.contextValue = type;

        if (type === 'profile') {
            this.iconPath = new vscode.ThemeIcon('account');
        } else if (type === 'now') {
            this.iconPath = new vscode.ThemeIcon('calendar');
        } else {
            this.iconPath = new vscode.ThemeIcon('info');
        }

        if (command) {
            this.command = command;
        }
    }
}
