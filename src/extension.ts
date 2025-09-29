import * as vscode from 'vscode';
import { AuthenticationManager } from './authentication';
import { OmgLolApi } from './api';
import { PastebinProvider } from './pastebinProvider';
import { PasteDocumentProvider } from './pasteDocumentProvider';

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

	const pasteDocumentProvider = new PasteDocumentProvider(api);
	const pastebinProvider = new PastebinProvider(api, authManager);

	context.subscriptions.push(vscode.workspace.registerTextDocumentContentProvider('pastepad', pasteDocumentProvider));

	const pastebinView = vscode.window.createTreeView('pastepad.pastebin', {
		treeDataProvider: pastebinProvider,
		showCollapseAll: true
	});

	const authenticateCommand = vscode.commands.registerCommand('pastepad.authenticate', async () => {
		await authManager.authenticate();
	});

	const refreshCommand = vscode.commands.registerCommand('pastepad.refresh', () => {
		pasteDocumentProvider.clearCache();
		pastebinProvider.refresh();
	});

	const logoutCommand = vscode.commands.registerCommand('pastepad.logout', async () => {
		await authManager.logout();
	});

	const openPasteCommand = vscode.commands.registerCommand('pastepad.openPaste', async (pasteTitleOrTreeItem: string | any) => {
		if (!await authManager.isAuthenticated()) {
			vscode.window.showErrorMessage('Please authenticate first');
			return;
		}

		try {
			const pasteTitle = typeof pasteTitleOrTreeItem === 'string'
				? pasteTitleOrTreeItem
				: pasteTitleOrTreeItem?.title || pasteTitleOrTreeItem?.label;

			if (!pasteTitle) {
				vscode.window.showErrorMessage('Unable to determine paste title');
				return;
			}

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
		if (!await authManager.isAuthenticated()) {
			vscode.window.showErrorMessage('Please authenticate first');
			return;
		}

        const title = await vscode.window.showInputBox({ prompt: 'Enter a title for the new paste' });
        if (!title) {
            return;
        }

        const content = await vscode.window.showInputBox({ prompt: 'Enter the content for the new paste' });
        if (content === undefined) {
            return;
        }

        const success = await pasteDocumentProvider.createPaste(title, content);
        if (success) {
            pastebinProvider.refresh();
            vscode.window.showInformationMessage(`Paste "${title}" created successfully!`);
        }
    });

    const savePasteCommand = vscode.commands.registerCommand('pastepad.savePaste', async () => {
        const editor = vscode.window.activeTextEditor;
        if (!editor) {
            return;
        }

        const success = await pasteDocumentProvider.savePaste(editor.document);
        if (success) {
            vscode.window.showInformationMessage('Paste saved successfully!');
        }
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

        try {
            await api.deletePaste(title);
            pastebinProvider.refresh();
            vscode.window.showInformationMessage(`Paste "${title}" deleted successfully!`);
        } catch (error) {
            vscode.window.showErrorMessage(`Failed to delete paste: ${error}`);
        }
    });

	const updateContext = async () => {
		vscode.commands.executeCommand('setContext', 'pastepad.authenticated', await authManager.isAuthenticated());
	};

	authManager.onAuthenticationChanged(() => {
		updateContext();
		pasteDocumentProvider.clearCache();
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
        savePasteCommand,
        deletePasteCommand
	);
}

export function deactivate() {}
