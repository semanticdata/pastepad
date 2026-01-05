import * as vscode from 'vscode';
import { AuthenticationManager } from './authentication';
import { OmgLolApi } from './api';
import { PastebinProvider } from './pastebinProvider';
import { PastepadFileSystemProvider } from './PastepadFileSystemProvider';
import { ProfileProvider } from './profileProvider';
import { ProfileFileSystemProvider } from './ProfileFileSystemProvider';
import { NowFileSystemProvider } from './NowFileSystemProvider';
import { ProfilePreviewPanel } from './panels/ProfilePreviewPanel';
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

    // Register file system providers
    const fileSystemProvider = new PastepadFileSystemProvider(api);
    context.subscriptions.push(vscode.workspace.registerFileSystemProvider('pastepad', fileSystemProvider, { isCaseSensitive: true }));

    const profileFileSystemProvider = new ProfileFileSystemProvider(api);
    context.subscriptions.push(vscode.workspace.registerFileSystemProvider('omgprofile', profileFileSystemProvider, { isCaseSensitive: true }));

    const nowFileSystemProvider = new NowFileSystemProvider(api);
    context.subscriptions.push(vscode.workspace.registerFileSystemProvider('omgnow', nowFileSystemProvider, { isCaseSensitive: true }));

	// Create tree data providers
	const pastebinProvider = new PastebinProvider(api, authManager);
	const profileProvider = new ProfileProvider(authManager);

	const pastebinView = vscode.window.createTreeView('pastepad.pastebin', {
		treeDataProvider: pastebinProvider,
		showCollapseAll: true
	});

	const profileView = vscode.window.createTreeView('pastepad.profiles', {
		treeDataProvider: profileProvider,
		showCollapseAll: true
	});

	// Register all commands using the modular structure
	const commandDependencies: CommandDependencies = {
		authManager,
		pastebinProvider,
		api,
		profileProvider
	};
	const allCommands = registerAllCommands(context, commandDependencies);

	const updateContext = async () => {
		vscode.commands.executeCommand('setContext', 'pastepad.authenticated', await authManager.isAuthenticated());
	};

	const updateDocumentContext = () => {
		const activeEditor = vscode.window.activeTextEditor;
		const isPasteDocument = activeEditor?.document.uri.scheme === 'pastepad';
		const isProfileDocument = activeEditor?.document.uri.scheme === 'omgprofile';
		const isNowPageDocument = activeEditor?.document.uri.scheme === 'omgnow';

		vscode.commands.executeCommand('setContext', 'pastepad.isPasteDocument', isPasteDocument);
		vscode.commands.executeCommand('setContext', 'pastepad.isProfileDocument', isProfileDocument);
		vscode.commands.executeCommand('setContext', 'pastepad.isNowPageDocument', isNowPageDocument);

		if (isPasteDocument) {
			// Set initial unsynced changes state to false
			vscode.commands.executeCommand('setContext', 'pastepad.hasUnsyncedChanges', activeEditor?.document.isDirty || false);
		}
	};

	// Listen for active editor changes to update document context
	const onDidChangeActiveTextEditor = vscode.window.onDidChangeActiveTextEditor(updateDocumentContext);

	// Listen for document changes to update unsynced changes context and preview
	const onDidChangeTextDocument = vscode.workspace.onDidChangeTextDocument(async (e) => {
		if (e.document.uri.scheme === 'pastepad') {
			vscode.commands.executeCommand('setContext', 'pastepad.hasUnsyncedChanges', e.document.isDirty);
		}

		// Update preview for profile and now pages
		if (e.document.uri.scheme === 'omgprofile' || e.document.uri.scheme === 'omgnow') {
			if (ProfilePreviewPanel.currentPanel) {
				ProfilePreviewPanel.currentPanel.updatePreview(e.document.getText());
			}
		}
	});

	authManager.onAuthenticationChanged(async () => {
		updateContext();
		await pastebinProvider.forceRefresh();
		profileProvider.refresh();
	});

	// Initialize contexts
	updateContext();
	updateDocumentContext();

	context.subscriptions.push(
		pastebinView,
		profileView,
		onDidChangeActiveTextEditor,
		onDidChangeTextDocument,
		...allCommands
	);
}

export function deactivate() {}