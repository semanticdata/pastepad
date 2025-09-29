import * as vscode from 'vscode';
import { AuthenticationManager } from '../authentication';
import { PastebinProvider } from '../pastebinProvider';

export function registerPasteCommands(
    context: vscode.ExtensionContext,
    authManager: AuthenticationManager,
    pastebinProvider: PastebinProvider
): vscode.Disposable[] {
    const commands: vscode.Disposable[] = [];

    // Open paste command
    const openPasteCommand = vscode.commands.registerCommand('pastepad.openPaste', async (item: any) => {
        const title = item.title;
        if (!title) {
            return;
        }
        const uri = vscode.Uri.parse(`pastepad:/${title}`);
        const doc = await vscode.workspace.openTextDocument(uri);
        await vscode.window.showTextDocument(doc, { preview: false });
    });

    // New paste command
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

    // Delete paste command
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

    // Save paste command
    const savePasteCommand = vscode.commands.registerCommand('pastepad.savePaste', async () => {
        if (!await authManager.isAuthenticated()) {
            vscode.window.showErrorMessage('Please authenticate first');
            return;
        }

        const activeEditor = vscode.window.activeTextEditor;
        if (!activeEditor || activeEditor.document.uri.scheme !== 'pastepad') {
            vscode.window.showErrorMessage('No active paste document to save');
            return;
        }

        try {
            await activeEditor.document.save();
            vscode.window.showInformationMessage('Paste saved successfully');
            pastebinProvider.refresh();
        } catch (error) {
            vscode.window.showErrorMessage(`Failed to save paste: ${error}`);
        }
    });

    // Force sync command
    const forceSyncCommand = vscode.commands.registerCommand('pastepad.forceSync', async () => {
        if (!await authManager.isAuthenticated()) {
            vscode.window.showErrorMessage('Please authenticate first');
            return;
        }

        const activeEditor = vscode.window.activeTextEditor;
        if (!activeEditor || activeEditor.document.uri.scheme !== 'pastepad') {
            vscode.window.showErrorMessage('No active paste document to sync');
            return;
        }

        try {
            // Force save the document to sync changes
            await activeEditor.document.save();
            vscode.window.showInformationMessage('Paste synced successfully');
            pastebinProvider.refresh();

            // Clear the unsaved changes context
            vscode.commands.executeCommand('setContext', 'pastepad.hasUnsyncedChanges', false);
        } catch (error) {
            vscode.window.showErrorMessage(`Failed to sync paste: ${error}`);
        }
    });

    commands.push(
        openPasteCommand,
        newPasteCommand,
        deletePasteCommand,
        savePasteCommand,
        forceSyncCommand
    );

    return commands;
}