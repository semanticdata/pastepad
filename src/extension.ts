import * as vscode from 'vscode';
import { AuthenticationManager } from './authentication';
import { PastebinProvider } from './pastebinProvider';
import { getLanguageFromTitle, getFileNameFromTitle } from './languageDetection';
import { PasteDocumentProvider } from './pasteDocumentProvider';

export function activate(context: vscode.ExtensionContext) {
	console.log('Pastepad extension activated!');

	// Initialize authentication manager
	const authManager = new AuthenticationManager(context);

	// Initialize document provider
	const pasteDocumentProvider = new PasteDocumentProvider(authManager);

	// Initialize pastebin provider
	const pastebinProvider = new PastebinProvider(authManager);

	// Register the document content provider
	const documentProviderDisposable = vscode.workspace.registerTextDocumentContentProvider('pastepad', pasteDocumentProvider);

	// Register the tree data provider
	const pastebinView = vscode.window.createTreeView('pastepad.pastebin', {
		treeDataProvider: pastebinProvider,
		showCollapseAll: true
	});

	// Register commands
	const authenticateCommand = vscode.commands.registerCommand('pastepad.authenticate', async () => {
		await authManager.authenticate();
		pastebinProvider.refresh();
	});

	const refreshCommand = vscode.commands.registerCommand('pastepad.refresh', () => {
		pasteDocumentProvider.clearCache();
		pastebinProvider.refresh();
	});

	const logoutCommand = vscode.commands.registerCommand('pastepad.logout', async () => {
		await authManager.logout();
		pasteDocumentProvider.clearCache();
		pastebinProvider.refresh();
	});

	const openPasteCommand = vscode.commands.registerCommand('pastepad.openPaste', async (pasteTitleOrTreeItem: string | any) => {
		if (!authManager.isAuthenticated()) {
			vscode.window.showErrorMessage('Please authenticate first');
			return;
		}

		try {
			// Handle both string title and tree item object
			const pasteTitle = typeof pasteTitleOrTreeItem === 'string'
				? pasteTitleOrTreeItem
				: pasteTitleOrTreeItem?.title || pasteTitleOrTreeItem?.label;

			if (!pasteTitle) {
				vscode.window.showErrorMessage('Unable to determine paste title');
				return;
			}

			// Show loading message
			await vscode.window.withProgress({
				location: vscode.ProgressLocation.Notification,
				title: `Loading paste: ${pasteTitle}`,
				cancellable: false
			}, async () => {
				await pasteDocumentProvider.openPaste(pasteTitle);
			});

		} catch (error) {
			vscode.window.showErrorMessage(`Error opening paste: ${error}`);
		}
	});

	const newPasteCommand = vscode.commands.registerCommand('pastepad.newPaste', async () => {
		if (!authManager.isAuthenticated()) {
			vscode.window.showErrorMessage('Please authenticate first');
			return;
		}

		try {
			// Prompt for paste title
			const title = await vscode.window.showInputBox({
				prompt: 'Enter the title for your new paste',
				placeHolder: 'e.g., my-script.py',
				validateInput: (value) => {
					if (!value || value.trim().length === 0) {
						return 'Title is required';
					}
					// Basic validation for valid filename characters
					if (!/^[a-zA-Z0-9._-]+$/.test(value)) {
						return 'Title can only contain letters, numbers, dots, hyphens, and underscores';
					}
					return null;
				}
			});

			if (!title) {
				return;
			}

			// Create the new paste document
			const editor = await pasteDocumentProvider.createNewPaste(title);

			if (editor) {
				// Store the paste title for later saving
				context.workspaceState.update(`pasteTitle:${editor.document.uri.toString()}`, title);
				vscode.window.showInformationMessage(`New paste "${title}" created. Start typing and save when ready.`);
			}

		} catch (error) {
			vscode.window.showErrorMessage(`Error creating new paste: ${error}`);
		}
	});

	const savePasteCommand = vscode.commands.registerCommand('pastepad.savePaste', async () => {
		if (!authManager.isAuthenticated()) {
			vscode.window.showErrorMessage('Please authenticate first');
			return;
		}

		const activeEditor = vscode.window.activeTextEditor;
		if (!activeEditor) {
			vscode.window.showErrorMessage('No active editor found');
			return;
		}

		const document = activeEditor.document;
		const content = document.getText();

		try {
			let title: string | undefined;
			let isUpdate = false;

			// Check if this is an existing paste document
			if (pasteDocumentProvider.isPasteDocument(document.uri) || pasteDocumentProvider.isOpenedPasteDocument(document.uri)) {
				title = pasteDocumentProvider.getPasteTitle(document.uri) || undefined;
				isUpdate = true;
			} else if (document.uri.scheme === 'untitled') {
				// Check if we have a stored paste title for new pastes
				title = context.workspaceState.get<string>(`pasteTitle:${document.uri.toString()}`);
			}

			if (!title) {
				// Prompt for title if not found
				title = await vscode.window.showInputBox({
					prompt: 'Enter the title for this paste',
					placeHolder: 'e.g., my-script.py',
					validateInput: (value) => {
						if (!value || value.trim().length === 0) {
							return 'Title is required';
						}
						if (!/^[a-zA-Z0-9._-]+$/.test(value)) {
							return 'Title can only contain letters, numbers, dots, hyphens, and underscores';
						}
						return null;
					}
				});

				if (!title) {
					return;
				}
			}

			// If this is an update to an existing paste, confirm the action
			if (isUpdate) {
				const confirmation = await vscode.window.showInformationMessage(
					`Update existing paste "${title}"?`,
					{ modal: true },
					'Update',
					'Cancel'
				);

				if (confirmation !== 'Update') {
					return;
				}
			}

			// Save the paste
			await vscode.window.withProgress({
				location: vscode.ProgressLocation.Notification,
				title: `${isUpdate ? 'Updating' : 'Saving'} paste: ${title}`,
				cancellable: false
			}, async () => {
				const success = await authManager.savePaste(title!, content);

				if (success) {
					vscode.window.showInformationMessage(`Paste "${title}" ${isUpdate ? 'updated' : 'saved'} successfully!`);

					// Update the document provider cache
					pasteDocumentProvider.updatePasteContent(title!, content);

					// Refresh the tree view to show the new/updated paste
					pastebinProvider.refresh();

					// Clean up stored title for new pastes
					if (!isUpdate) {
						context.workspaceState.update(`pasteTitle:${document.uri.toString()}`, undefined);
					}
				} else {
					vscode.window.showErrorMessage(`Failed to ${isUpdate ? 'update' : 'save'} paste "${title}"`);
				}
			});

		} catch (error) {
			vscode.window.showErrorMessage(`Error saving paste: ${error}`);
		}
	});

	const deletePasteCommand = vscode.commands.registerCommand('pastepad.deletePaste', async (treeItem?: any) => {
		if (!authManager.isAuthenticated()) {
			vscode.window.showErrorMessage('Please authenticate first');
			return;
		}

		try {
			// Get the paste title from the tree item
			const pasteTitle = treeItem?.title || treeItem?.label;

			if (!pasteTitle) {
				vscode.window.showErrorMessage('Unable to determine paste title');
				return;
			}

			// Confirm deletion
			const confirmation = await vscode.window.showWarningMessage(
				`Are you sure you want to delete the paste "${pasteTitle}"?`,
				{ modal: true },
				'Delete',
				'Cancel'
			);

			if (confirmation !== 'Delete') {
				return;
			}

			// Delete the paste
			await vscode.window.withProgress({
				location: vscode.ProgressLocation.Notification,
				title: `Deleting paste: ${pasteTitle}`,
				cancellable: false
			}, async () => {
				const success = await authManager.deletePaste(pasteTitle);

				if (success) {
					vscode.window.showInformationMessage(`Paste "${pasteTitle}" deleted successfully!`);
					// Refresh the tree view to remove the deleted paste
					pastebinProvider.refresh();
				} else {
					vscode.window.showErrorMessage(`Failed to delete paste "${pasteTitle}"`);
				}
			});

		} catch (error) {
			vscode.window.showErrorMessage(`Error deleting paste: ${error}`);
		}
	});

	// Update context based on authentication status
	const updateContext = () => {
		vscode.commands.executeCommand('setContext', 'pastepad.authenticated', authManager.isAuthenticated());
	};

	// Update context when active editor changes to detect paste documents
	const updateEditorContext = () => {
		const activeEditor = vscode.window.activeTextEditor;
		const isPasteDoc = activeEditor && (
			pasteDocumentProvider.isOpenedPasteDocument(activeEditor.document.uri) ||
			context.workspaceState.get<string>(`pasteTitle:${activeEditor.document.uri.toString()}`)
		);
		vscode.commands.executeCommand('setContext', 'pastepad.isPasteDocument', !!isPasteDoc);
	};

	// Listen for active editor changes
	const editorChangeListener = vscode.window.onDidChangeActiveTextEditor(() => {
		updateEditorContext();
	});

	// Listen for authentication changes
	authManager.onAuthenticationChanged(() => {
		updateContext();
		pasteDocumentProvider.clearCache();
		pastebinProvider.refresh();
	});

	// Set initial context
	updateContext();
	updateEditorContext();

	// Listen for document close events to clean up paste tracking
	const documentCloseListener = vscode.workspace.onDidCloseTextDocument((document) => {
		pasteDocumentProvider.removePasteTracking(document.uri);
	});

	context.subscriptions.push(
		documentProviderDisposable,
		pastebinView,
		authenticateCommand,
		refreshCommand,
		logoutCommand,
		openPasteCommand,
		newPasteCommand,
		savePasteCommand,
		deletePasteCommand,
		pasteDocumentProvider,
		documentCloseListener,
		editorChangeListener
	);
}

export function deactivate() {}
