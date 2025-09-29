import * as vscode from 'vscode';
import { AuthenticationManager } from './authentication';
import { OmgLolApi } from './api';
import { PastebinProvider } from './pastebinProvider';
import { PastepadFileSystemProvider } from './PastepadFileSystemProvider';

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

	const authenticateCommand = vscode.commands.registerCommand('pastepad.authenticate', async () => {
		await authManager.authenticate();
	});

	const refreshCommand = vscode.commands.registerCommand('pastepad.refresh', () => {
		pastebinProvider.refresh();
	});

	const logoutCommand = vscode.commands.registerCommand('pastepad.logout', async () => {
		await authManager.logout();
	});

	const openPasteCommand = vscode.commands.registerCommand('pastepad.openPaste', async (item: any) => {
        const title = item.title;
        if (!title) {
            return;
        }
        const uri = vscode.Uri.parse(`pastepad:/${title}`);
        const doc = await vscode.workspace.openTextDocument(uri);
        await vscode.window.showTextDocument(doc, { preview: false });
	});

	const newPasteCommand = vscode.commands.registerCommand('pastepad.newPaste', async () => {
		if (!await authManager.isAuthenticated()) {
			vscode.window.showErrorMessage('Please authenticate first');
			return;
		}

        const title = await vscode.window.showInputBox({ prompt: 'Enter a title for the new paste' });
        if (!title) {
            return;
        }

        const uri = vscode.Uri.parse(`pastepad:/${title}`);
        await vscode.workspace.fs.writeFile(uri, new Uint8Array());
        const doc = await vscode.workspace.openTextDocument(uri);
        await vscode.window.showTextDocument(doc, { preview: false });
    });

    const deletePasteCommand = vscode.commands.registerCommand('pastepad.deletePaste', async (item: any) => {
        const title = item.title;
        if (!title) {
            return;
        }

        const confirmation = await vscode.window.showWarningMessage(`Are you sure you want to delete "${title}"?`, { modal: true }, 'Delete');
        if (confirmation !== 'Delete') {
            return;
        }

        const uri = vscode.Uri.parse(`pastepad:/${title}`);
        await vscode.workspace.fs.delete(uri);
        pastebinProvider.refresh();
    });

	const updateContext = async () => {
		vscode.commands.executeCommand('setContext', 'pastepad.authenticated', await authManager.isAuthenticated());
	};

	authManager.onAuthenticationChanged(() => {
		updateContext();
		pastebinProvider.refresh();
	});

	updateContext();

	context.subscriptions.push(
		pastebinView,
		authenticateCommand,
		refreshCommand,
		logoutCommand,
		openPasteCommand,
		newPasteCommand,
        deletePasteCommand
	);
}

export function deactivate() {}