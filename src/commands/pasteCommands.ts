import * as vscode from 'vscode';
import { AuthenticationManager } from '../authentication';
import { PastebinProvider } from '../pastebinProvider';
import { ErrorHandler, StateManager, ErrorType, ErrorSeverity } from '../services';

export function registerPasteCommands(
    context: vscode.ExtensionContext,
    authManager: AuthenticationManager,
    pastebinProvider: PastebinProvider
): vscode.Disposable[] {
    const commands: vscode.Disposable[] = [];
    const errorHandler = ErrorHandler.getInstance();
    const stateManager = StateManager.getInstance();

    // Open paste command
    const openPasteCommand = vscode.commands.registerCommand('pastepad.openPaste', async (item: any) => {
        try {
            const title = item?.title;
            if (!title) {
                await errorHandler.handleError(
                    errorHandler.createError(
                        ErrorType.USER_INPUT,
                        ErrorSeverity.LOW,
                        'No paste title provided',
                        'Unable to open paste - no title specified'
                    )
                );
                return;
            }

            // Add to recently opened pastes
            await stateManager.addRecentlyOpenedPaste(title);

            const uri = vscode.Uri.parse(`pastepad:/${title}`);
            const doc = await vscode.workspace.openTextDocument(uri);
            await vscode.window.showTextDocument(doc, { preview: false });

        } catch (error) {
            await errorHandler.handleError(error as Error, {
                operation: 'openPaste',
                title: item?.title
            });
        }
    });

    // New paste command
    const newPasteCommand = vscode.commands.registerCommand('pastepad.newPaste', async () => {
        try {
            if (!await authManager.isAuthenticated()) {
                await errorHandler.handleError(
                    errorHandler.createError(
                        ErrorType.AUTHENTICATION,
                        ErrorSeverity.MEDIUM,
                        'Not authenticated',
                        'Please authenticate first to create a new paste',
                        {
                            suggestedActions: ['Authenticate with omg.lol'],
                            recoveryAction: async () => {
                                vscode.commands.executeCommand('pastepad.authenticate');
                            }
                        }
                    )
                );
                return;
            }

            const title = await vscode.window.showInputBox({
                prompt: 'Enter a title for the new paste',
                validateInput: (value) => {
                    if (!value || value.trim().length === 0) {
                        return 'Title is required';
                    }
                    if (value.length > 100) {
                        return 'Title must be less than 100 characters';
                    }
                    return null;
                }
            });

            if (!title || title.trim().length === 0) {
                return; // User cancelled or provided empty title
            }

            const trimmedTitle = title.trim();
            const uri = vscode.Uri.parse(`pastepad:/${trimmedTitle}`);
            await vscode.workspace.fs.writeFile(uri, new Uint8Array());
            const doc = await vscode.workspace.openTextDocument(uri);
            await vscode.window.showTextDocument(doc, { preview: false });

            // Add to recently opened
            await stateManager.addRecentlyOpenedPaste(trimmedTitle);

        } catch (error) {
            await errorHandler.handleError(error as Error, {
                operation: 'newPaste'
            });
        }
    });

    // Delete paste command
    const deletePasteCommand = vscode.commands.registerCommand('pastepad.deletePaste', async (item: any) => {
        try {
            const title = item?.title;
            if (!title) {
                await errorHandler.handleError(
                    errorHandler.createError(
                        ErrorType.USER_INPUT,
                        ErrorSeverity.LOW,
                        'No paste title provided',
                        'Unable to delete paste - no title specified'
                    )
                );
                return;
            }

            const confirmation = await vscode.window.showWarningMessage(
                `Are you sure you want to delete "${title}"? This action cannot be undone.`,
                { modal: true },
                'Delete',
                'Cancel'
            );

            if (confirmation !== 'Delete') {
                return; // User cancelled
            }

            const uri = vscode.Uri.parse(`pastepad:/${title}`);
            await vscode.workspace.fs.delete(uri);
            pastebinProvider.refresh();

            vscode.window.showInformationMessage(`Successfully deleted "${title}"`);

        } catch (error) {
            await errorHandler.handleError(error as Error, {
                operation: 'deletePaste',
                title: item?.title
            });
        }
    });

    // Save paste command
    const savePasteCommand = vscode.commands.registerCommand('pastepad.savePaste', async () => {
        try {
            if (!await authManager.isAuthenticated()) {
                await errorHandler.handleError(
                    errorHandler.createError(
                        ErrorType.AUTHENTICATION,
                        ErrorSeverity.MEDIUM,
                        'Not authenticated',
                        'Please authenticate first to save paste',
                        {
                            suggestedActions: ['Authenticate with omg.lol'],
                            recoveryAction: async () => {
                                vscode.commands.executeCommand('pastepad.authenticate');
                            }
                        }
                    )
                );
                return;
            }

            const activeEditor = vscode.window.activeTextEditor;
            if (!activeEditor || activeEditor.document.uri.scheme !== 'pastepad') {
                await errorHandler.handleError(
                    errorHandler.createError(
                        ErrorType.USER_INPUT,
                        ErrorSeverity.LOW,
                        'No active paste document',
                        'No active paste document to save. Please open a paste first.',
                        {
                            suggestedActions: ['Open a paste from the sidebar', 'Create a new paste']
                        }
                    )
                );
                return;
            }

            const title = activeEditor.document.uri.path.substring(1);
            await activeEditor.document.save();
            vscode.window.showInformationMessage(`Successfully saved "${title}"`);
            pastebinProvider.refresh();

        } catch (error) {
            await errorHandler.handleError(error as Error, {
                operation: 'savePaste',
                documentUri: vscode.window.activeTextEditor?.document.uri.toString()
            });
        }
    });

    // Force sync command
    const forceSyncCommand = vscode.commands.registerCommand('pastepad.forceSync', async () => {
        try {
            if (!await authManager.isAuthenticated()) {
                await errorHandler.handleError(
                    errorHandler.createError(
                        ErrorType.AUTHENTICATION,
                        ErrorSeverity.MEDIUM,
                        'Not authenticated',
                        'Please authenticate first to sync paste',
                        {
                            suggestedActions: ['Authenticate with omg.lol'],
                            recoveryAction: async () => {
                                vscode.commands.executeCommand('pastepad.authenticate');
                            }
                        }
                    )
                );
                return;
            }

            const activeEditor = vscode.window.activeTextEditor;
            if (!activeEditor || activeEditor.document.uri.scheme !== 'pastepad') {
                await errorHandler.handleError(
                    errorHandler.createError(
                        ErrorType.USER_INPUT,
                        ErrorSeverity.LOW,
                        'No active paste document',
                        'No active paste document to sync. Please open a paste first.',
                        {
                            suggestedActions: ['Open a paste from the sidebar', 'Create a new paste']
                        }
                    )
                );
                return;
            }

            const title = activeEditor.document.uri.path.substring(1);

            // Show progress for sync operation
            await vscode.window.withProgress({
                location: vscode.ProgressLocation.Notification,
                title: `Syncing "${title}"...`,
                cancellable: false
            }, async () => {
                // Force save the document to sync changes
                await activeEditor.document.save();
            });

            vscode.window.showInformationMessage(`Successfully synced "${title}"`);
            pastebinProvider.refresh();

            // Clear the unsaved changes context
            vscode.commands.executeCommand('setContext', 'pastepad.hasUnsyncedChanges', false);

        } catch (error) {
            await errorHandler.handleError(error as Error, {
                operation: 'forceSync',
                documentUri: vscode.window.activeTextEditor?.document.uri.toString()
            });
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