import * as vscode from 'vscode';
import { AuthenticationManager } from './authentication';
import { PastebinProvider } from './pastebinProvider';

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
		logoutCommand
	);
}

export function deactivate() {}
