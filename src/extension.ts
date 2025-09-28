import * as vscode from 'vscode';
import { AuthenticationManager } from './authentication';
import { PastebinProvider } from './pastebinProvider';
import { getLanguageFromTitle, getFileNameFromTitle } from './languageDetection';

export function activate(context: vscode.ExtensionContext) {
	console.log('Pastepad extension activated!');

	// Initialize authentication manager
	const authManager = new AuthenticationManager(context);

	// Initialize pastebin provider
	const pastebinProvider = new PastebinProvider(authManager);

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
		pastebinProvider.refresh();
	});

	const logoutCommand = vscode.commands.registerCommand('pastepad.logout', async () => {
		await authManager.logout();
		pastebinProvider.refresh();
	});

	const openPasteCommand = vscode.commands.registerCommand('pastepad.openPaste', async (pasteTitle: string) => {
		if (!authManager.isAuthenticated()) {
			vscode.window.showErrorMessage('Please authenticate first');
			return;
		}

		try {
			// Show loading message
			vscode.window.withProgress({
				location: vscode.ProgressLocation.Notification,
				title: `Loading paste: ${pasteTitle}`,
				cancellable: false
			}, async () => {
				// Fetch the paste content
				const content = await authManager.fetchPasteContent(pasteTitle);

				if (content === null) {
					vscode.window.showErrorMessage(`Failed to load paste: ${pasteTitle}`);
					return;
				}

				// Determine the language based on the title
				const language = getLanguageFromTitle(pasteTitle);
				const fileName = getFileNameFromTitle(pasteTitle);

				// Create a virtual URI for the paste
				const uri = vscode.Uri.parse(`untitled:${fileName}`);

				// Open a new document with the content
				const document = await vscode.workspace.openTextDocument({
					content: content,
					language: language
				});

				// Show the document in the editor
				await vscode.window.showTextDocument(document, {
					preview: false,
					viewColumn: vscode.ViewColumn.Active
				});
			});

		} catch (error) {
			vscode.window.showErrorMessage(`Error opening paste: ${error}`);
		}
	});

	// Update context based on authentication status
	const updateContext = () => {
		vscode.commands.executeCommand('setContext', 'pastepad.authenticated', authManager.isAuthenticated());
	};

	// Listen for authentication changes
	authManager.onAuthenticationChanged(() => {
		updateContext();
		pastebinProvider.refresh();
	});

	// Set initial context
	updateContext();

	context.subscriptions.push(
		pastebinView,
		authenticateCommand,
		refreshCommand,
		logoutCommand,
		openPasteCommand
	);
}

export function deactivate() {}
