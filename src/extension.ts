import * as vscode from 'vscode';
import { AuthenticationManager } from './authentication';
import { OmgLolApi } from './api';
import { PastebinProvider } from './pastebinProvider';
import { PastepadFileSystemProvider } from './PastepadFileSystemProvider';
import { registerAllCommands, CommandDependencies } from './commands';
import { initializeServices } from './services';

class PastepadUriHandler implements vscode.UriHandler {
    constructor(private authManager: AuthenticationManager) {}

    public async handleUri(uri: vscode.Uri) {
        if (uri.path === '/authenticate') {
            const query = new URLSearchParams(uri.query);
            const code = query.get('code');
            const state = query.get('state');

            if (code && state) {
                await this.authManager.handleAuthorizationCode(code, state);
            }
        }
    }
}

export function activate(context: vscode.ExtensionContext) {
	console.log('Pastepad extension activated!');

	// Initialize services first
	initializeServices(context);

	const authManager = new AuthenticationManager(context);
    const api = new OmgLolApi(authManager);

    const uriHandler = new PastepadUriHandler(authManager);
    context.subscriptions.push(vscode.window.registerUriHandler(uriHandler));

    const fileSystemProvider = new PastepadFileSystemProvider(api);
    context.subscriptions.push(vscode.workspace.registerFileSystemProvider('pastepad', fileSystemProvider, { isCaseSensitive: true }));

	const pastebinProvider = new PastebinProvider(api, authManager);

	const pastebinView = vscode.window.createTreeView('pastepad.pastebin', {
		treeDataProvider: pastebinProvider,
		showCollapseAll: true
	});

	// Register all commands using the modular structure
	const commandDependencies: CommandDependencies = {
		authManager,
		pastebinProvider
	};
	const allCommands = registerAllCommands(context, commandDependencies);

	const updateContext = async () => {
		vscode.commands.executeCommand('setContext', 'pastepad.authenticated', await authManager.isAuthenticated());
	};

	const updateDocumentContext = () => {
		const activeEditor = vscode.window.activeTextEditor;
		const isPasteDocument = activeEditor?.document.uri.scheme === 'pastepad';
		vscode.commands.executeCommand('setContext', 'pastepad.isPasteDocument', isPasteDocument);

		if (isPasteDocument) {
			// Set initial unsynced changes state to false
			vscode.commands.executeCommand('setContext', 'pastepad.hasUnsyncedChanges', activeEditor?.document.isDirty || false);
		}
	};

	// Listen for active editor changes to update document context
	const onDidChangeActiveTextEditor = vscode.window.onDidChangeActiveTextEditor(updateDocumentContext);

	// Listen for document changes to update unsynced changes context
	const onDidChangeTextDocument = vscode.workspace.onDidChangeTextDocument((e) => {
		if (e.document.uri.scheme === 'pastepad') {
			vscode.commands.executeCommand('setContext', 'pastepad.hasUnsyncedChanges', e.document.isDirty);
		}
	});

	authManager.onAuthenticationChanged(async () => {
		updateContext();
		await pastebinProvider.forceRefresh();
	});

	// Initialize contexts
	updateContext();
	updateDocumentContext();

	context.subscriptions.push(
		pastebinView,
		onDidChangeActiveTextEditor,
		onDidChangeTextDocument,
		...allCommands
	);
}

export function deactivate() {}