import * as vscode from 'vscode';
import { AuthenticationManager } from '../authentication';
import { PastebinProvider } from '../pastebinProvider';
import { ErrorHandler, StateManager, ErrorType, ErrorSeverity } from '../services';
import { OmgLolApi } from '../api';

export function registerPasteCommands(
    context: vscode.ExtensionContext,
    authManager: AuthenticationManager,
    pastebinProvider: PastebinProvider
): vscode.Disposable[] {
    const commands: vscode.Disposable[] = [];
    const errorHandler = ErrorHandler.getInstance();
    const stateManager = StateManager.getInstance();

    // Get API instance
    const api = new OmgLolApi(authManager);

    // Open paste command
    const openPasteCommand = vscode.commands.registerCommand('pastepad.openPaste', async (item: any) => {
        try {
            // Handle both old format (direct title) and new format (tree item with pasteData)
            const title = item?.pasteData?.title || item?.title;
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
                title: item?.pasteData?.title || item?.title
            });
        }
    });

    // New paste command with multi-step input flow
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

            // Multi-step input flow
            const input = vscode.window.createInputBox();
            let currentStep = 1;
            const totalSteps = 3;
            let title = '';
            let content = '';
            let isListed = false;

            return new Promise<void>((resolve, reject) => {
                input.onDidTriggerButton((item) => {
                    if (item === vscode.QuickInputButtons.Back) {
                        if (currentStep > 1) {
                            currentStep--;
                            updateInputForStep();
                        }
                    }
                });

                input.onDidAccept(async () => {
                    const value = input.value.trim();

                    if (currentStep === 1) {
                        // Step 1: Title
                        if (!value) {
                            input.validationMessage = 'Title is required';
                            return;
                        }
                        if (value.length > 100) {
                            input.validationMessage = 'Title must be less than 100 characters';
                            return;
                        }
                        title = value;
                        currentStep++;
                        updateInputForStep();
                    } else if (currentStep === 2) {
                        // Step 2: Content
                        if (!value) {
                            input.validationMessage = 'Content is required';
                            return;
                        }
                        content = value;
                        currentStep++;
                        updateInputForStep();
                    } else if (currentStep === 3) {
                        // Step 3: Visibility
                        const answer = value.toLowerCase();
                        if (answer === 'listed' || answer === 'l') {
                            isListed = true;
                        } else if (answer === 'unlisted' || answer === 'u') {
                            isListed = false;
                        } else {
                            input.validationMessage = 'Please enter "listed" or "unlisted"';
                            return;
                        }

                        // All steps complete, create the paste
                        input.hide();
                        try {
                            await vscode.window.withProgress({
                                location: vscode.ProgressLocation.Notification,
                                title: `Creating paste "${title}"...`,
                                cancellable: false
                            }, async () => {
                                await api.createPaste(title, content, isListed);
                            });

                            vscode.window.showInformationMessage(`Successfully created ${isListed ? 'listed' : 'unlisted'} paste "${title}"`);

                            // Open the newly created paste
                            const uri = vscode.Uri.parse(`pastepad:/${title}`);
                            const doc = await vscode.workspace.openTextDocument(uri);
                            await vscode.window.showTextDocument(doc, { preview: false });

                            // Add to recently opened and refresh tree
                            await stateManager.addRecentlyOpenedPaste(title);
                            pastebinProvider.refresh();

                            resolve();
                        } catch (error) {
                            await errorHandler.handleError(error as Error, {
                                operation: 'newPaste',
                                title,
                                contentLength: content.length
                            });
                            reject(error);
                        }
                    }
                });

                input.onDidHide(() => {
                    resolve(); // User cancelled
                });

                function updateInputForStep() {
                    input.validationMessage = '';
                    input.buttons = currentStep > 1 ? [vscode.QuickInputButtons.Back] : [];

                    switch (currentStep) {
                        case 1:
                            input.title = 'New Paste';
                            input.step = 1;
                            input.totalSteps = totalSteps;
                            input.placeholder = 'Enter paste title (e.g., "my-code-snippet")';
                            input.prompt = 'What should this paste be called?';
                            input.value = title;
                            break;
                        case 2:
                            input.title = 'New Paste';
                            input.step = 2;
                            input.totalSteps = totalSteps;
                            input.placeholder = 'Enter paste content';
                            input.prompt = 'What content should this paste contain?';
                            input.value = content;
                            break;
                        case 3:
                            input.title = 'New Paste';
                            input.step = 3;
                            input.totalSteps = totalSteps;
                            input.placeholder = 'listed or unlisted';
                            input.prompt = 'Should this paste be listed or unlisted? (default: unlisted)';
                            input.value = '';
                            break;
                    }
                }

                updateInputForStep();
                input.show();
            });

        } catch (error) {
            await errorHandler.handleError(error as Error, {
                operation: 'newPaste'
            });
        }
    });

    // Delete paste command
    const deletePasteCommand = vscode.commands.registerCommand('pastepad.deletePaste', async (item: any) => {
        try {
            const title = item?.pasteData?.title || item?.title;
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
            await pastebinProvider.forceRefresh();

            vscode.window.showInformationMessage(`Successfully deleted "${title}"`);

        } catch (error) {
            await errorHandler.handleError(error as Error, {
                operation: 'deletePaste',
                title: item?.pasteData?.title || item?.title
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
            await pastebinProvider.forceRefresh();

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
            await pastebinProvider.forceRefresh();

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