import * as vscode from 'vscode';
import { OmgLolApi } from './api';
import { PasteItem } from './types';
import { AuthenticationManager } from './authentication';
import { ErrorHandler, CacheManager, StateManager } from './services';

export class PastebinProvider implements vscode.TreeDataProvider<PasteTreeItem> {
	private _onDidChangeTreeData: vscode.EventEmitter<PasteTreeItem | undefined | null | void> = new vscode.EventEmitter<PasteTreeItem | undefined | null | void>();
	readonly onDidChangeTreeData: vscode.Event<PasteTreeItem | undefined | null | void> = this._onDidChangeTreeData.event;
	private errorHandler: ErrorHandler;
	private cacheManager: CacheManager;
	private stateManager: StateManager;

	constructor(private api: OmgLolApi, private authManager: AuthenticationManager) {
		this.errorHandler = ErrorHandler.getInstance();
		this.cacheManager = CacheManager.getInstance();
		this.stateManager = StateManager.getInstance();
	}

	refresh(): void {
		this._onDidChangeTreeData.fire();
	}

	async forceRefresh(): Promise<void> {
		try {
			// Force fresh API call to get updated paste data including visibility changes
			await this.api.getPastes(true);
			// Now refresh the tree view with fresh data
			this._onDidChangeTreeData.fire();
		} catch (error) {
			// If refresh fails, still fire the tree update to show cached data
			await this.errorHandler.handleError(error as Error, {
				operation: 'forceRefresh'
			});
			this._onDidChangeTreeData.fire();
		}
	}

	getTreeItem(element: PasteTreeItem): vscode.TreeItem {
		return element;
	}

	async getChildren(element?: PasteTreeItem): Promise<PasteTreeItem[]> {
		if (!await this.authManager.isAuthenticated()) {
			return [new PasteTreeItem('Not authenticated', '', 'Click the key icon to authenticate', vscode.TreeItemCollapsibleState.None, false)];
		}

		// If this is a group element, return its children
		if (element && element.itemType === 'group' && element.children) {
			return element.children.map(paste => {
				const modifiedDate = new Date(parseInt(paste.modified_on) * 1000);
				const isListed = paste.listed === 1 || paste.listed === '1';
				const visibilityIcon = isListed ? '🌐' : '🔒';
				const tooltip = `${visibilityIcon} ${isListed ? 'Listed' : 'Unlisted'} • Modified: ${modifiedDate.toLocaleString()}`;

				return new PasteTreeItem(
					paste.title,
					paste.modified_on,
					tooltip,
					vscode.TreeItemCollapsibleState.None,
					true,
					paste,
					'paste'
				);
			});
		}

		try {
			// Get user preferences for sorting
			const preferences = await this.stateManager.getUserPreferences();
			const sortBy = preferences.sortBy || 'modified';

			// Try to get pastes (API handles caching internally)
			const pastes = await this.api.getPastes();

			if (pastes.length === 0) {
				// Check if we have offline data
				const offlineData = await this.cacheManager.hasOfflineData('paste_list');
				const message = offlineData
					? 'No pastes available offline'
					: 'No pastes found';
				const description = offlineData
					? 'Connect to internet to refresh'
					: 'Create your first paste at paste.lol';

				return [new PasteTreeItem(message, '', description, vscode.TreeItemCollapsibleState.None, false)];
			}

			// Check if we should group by visibility
			if (preferences.groupPastesByVisibility) {
				return this.createGroupedTreeItems(pastes, sortBy);
			} else {
				// Apply sorting based on user preferences
				const sortedPastes = this.sortPastes(pastes, sortBy);

				return sortedPastes.map(paste => {
					const modifiedDate = new Date(parseInt(paste.modified_on) * 1000);
					const isListed = paste.listed === 1 || paste.listed === '1';
					const visibilityIcon = isListed ? '🌐' : '🔒';
					const tooltip = `${visibilityIcon} ${isListed ? 'Listed' : 'Unlisted'} • Modified: ${modifiedDate.toLocaleString()}`;

					return new PasteTreeItem(
						paste.title,
						paste.modified_on,
						tooltip,
						vscode.TreeItemCollapsibleState.None,
						true,
						paste
					);
				});
			}

		} catch (error) {
			// Let the error handler deal with it, but also try to show cached data
			try {
				const offlineData = await this.cacheManager.getOfflinePasteList();
				if (offlineData && offlineData.length > 0) {
					// Show warning but display cached data
					vscode.window.showWarningMessage('Showing cached data. Check your connection.');

					const preferences = await this.stateManager.getUserPreferences();
					const sortedPastes = this.sortPastes(offlineData, preferences.sortBy || 'modified');

					return sortedPastes.map(paste => {
						const modifiedDate = new Date(parseInt(paste.modified_on) * 1000);
						return new PasteTreeItem(
							paste.title,
							paste.modified_on,
							`Modified: ${modifiedDate.toLocaleString()} (Cached)`,
							vscode.TreeItemCollapsibleState.None,
							true
						);
					});
				}
			} catch (cacheError) {
				// Ignore cache errors
			}

			// Handle error through error handler
			await this.errorHandler.handleError(error as Error, {
				operation: 'loadPastes'
			});

			return [new PasteTreeItem('Failed to load pastes', '', 'Try refreshing or check your connection', vscode.TreeItemCollapsibleState.None, false)];
		}
	}

	private createGroupedTreeItems(pastes: PasteItem[], sortBy: 'modified' | 'name' | 'created'): PasteTreeItem[] {
		const listedPastes = pastes.filter(paste => paste.listed === 1 || paste.listed === '1');
		const unlistedPastes = pastes.filter(paste => paste.listed === 0 || paste.listed === '0' || !paste.listed);

		const groups: PasteTreeItem[] = [];

		// Listed pastes group
		if (listedPastes.length > 0) {
			groups.push(new PasteTreeItem(
				`🌐 Listed Pastes (${listedPastes.length})`,
				'',
				`${listedPastes.length} listed paste${listedPastes.length !== 1 ? 's' : ''}`,
				vscode.TreeItemCollapsibleState.Expanded,
				false,
				undefined,
				'group',
				this.sortPastes(listedPastes, sortBy)
			));
		}

		// Unlisted pastes group
		if (unlistedPastes.length > 0) {
			groups.push(new PasteTreeItem(
				`🔒 Unlisted Pastes (${unlistedPastes.length})`,
				'',
				`${unlistedPastes.length} unlisted paste${unlistedPastes.length !== 1 ? 's' : ''}`,
				vscode.TreeItemCollapsibleState.Expanded,
				false,
				undefined,
				'group',
				this.sortPastes(unlistedPastes, sortBy)
			));
		}

		return groups;
	}

	private sortPastes(pastes: PasteItem[], sortBy: 'modified' | 'name' | 'created'): PasteItem[] {
		switch (sortBy) {
			case 'name':
				return [...pastes].sort((a, b) => a.title.localeCompare(b.title));
			case 'created':
				// Assuming modified_on represents creation time if no created field exists
				return [...pastes].sort((a, b) => parseInt(a.modified_on) - parseInt(b.modified_on));
			case 'modified':
			default:
				return [...pastes].sort((a, b) => parseInt(b.modified_on) - parseInt(a.modified_on));
		}
	}
}

export class PasteTreeItem extends vscode.TreeItem {
	constructor(
		public readonly title: string,
		public readonly modifiedOn: string,
		public readonly tooltip: string,
		public readonly collapsibleState: vscode.TreeItemCollapsibleState,
		public readonly isPaste: boolean = true,
		public readonly pasteData?: PasteItem,
		public readonly itemType?: 'paste' | 'group' | 'status',
		public readonly children?: PasteItem[]
	) {
		super(title, collapsibleState);

		this.tooltip = tooltip;
		this.description = modifiedOn ? new Date(parseInt(modifiedOn) * 1000).toLocaleDateString() : '';

		// Set icons based on item type
		if (itemType === 'group') {
			this.iconPath = new vscode.ThemeIcon('folder');
			this.contextValue = 'group';
		} else if (isPaste) {
			// Set icon based on visibility
			const isListed = pasteData?.listed === 1 || pasteData?.listed === '1';
			this.iconPath = new vscode.ThemeIcon(isListed ? 'globe' : 'lock');
			this.contextValue = 'paste';
            this.command = {
                command: 'pastepad.openPaste',
                title: 'Open Paste',
                arguments: [this]
            };
		} else {
			this.iconPath = new vscode.ThemeIcon('info');
			this.contextValue = 'status';
		}
	}
}