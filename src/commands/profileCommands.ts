import * as vscode from 'vscode';
import { OmgLolApi } from '../api';
import { ProfileProvider } from '../profileProvider';
import { ProfilePreviewPanel } from '../panels/ProfilePreviewPanel';
import { LoggerService } from '../services';

export function registerProfileCommands(
    context: vscode.ExtensionContext,
    api: OmgLolApi,
    profileProvider: ProfileProvider
): vscode.Disposable[] {
    const logger = LoggerService.getInstance();
    const commands: vscode.Disposable[] = [];

    // Open profile command
    const openProfileCommand = vscode.commands.registerCommand(
        'pastepad.openProfile',
        async () => {
            try {
                logger.info('Opening profile document');
                const uri = vscode.Uri.parse('omgprofile:///profile.md');
                const doc = await vscode.workspace.openTextDocument(uri);
                await vscode.window.showTextDocument(doc, { preview: false });

                // Automatically show preview
                await ProfilePreviewPanel.createOrShow(context.extensionUri, uri, api);
            } catch (error) {
                logger.error('Failed to open profile', { error });
                vscode.window.showErrorMessage(`Failed to open profile: ${error}`);
            }
        }
    );
    commands.push(openProfileCommand);

    // Open /now page command
    const openNowPageCommand = vscode.commands.registerCommand(
        'pastepad.openNowPage',
        async () => {
            try {
                logger.info('Opening /now page document');
                const uri = vscode.Uri.parse('omgnow:///now.md');
                const doc = await vscode.workspace.openTextDocument(uri);
                await vscode.window.showTextDocument(doc, { preview: false });

                // Automatically show preview
                await ProfilePreviewPanel.createOrShow(context.extensionUri, uri, api);
            } catch (error) {
                logger.error('Failed to open /now page', { error });
                vscode.window.showErrorMessage(`Failed to open /now page: ${error}`);
            }
        }
    );
    commands.push(openNowPageCommand);

    // Toggle preview command
    const previewProfileCommand = vscode.commands.registerCommand(
        'pastepad.previewProfile',
        async () => {
            try {
                const activeEditor = vscode.window.activeTextEditor;
                if (!activeEditor) {
                    vscode.window.showWarningMessage('No active editor');
                    return;
                }

                const uri = activeEditor.document.uri;
                if (uri.scheme !== 'omgprofile' && uri.scheme !== 'omgnow') {
                    vscode.window.showWarningMessage('Not a profile or /now page document');
                    return;
                }

                logger.info('Toggling profile preview', { uri: uri.toString() });
                await ProfilePreviewPanel.createOrShow(context.extensionUri, uri, api);
            } catch (error) {
                logger.error('Failed to show preview', { error });
                vscode.window.showErrorMessage(`Failed to show preview: ${error}`);
            }
        }
    );
    commands.push(previewProfileCommand);

    // Publish profile command (force sync)
    const publishProfileCommand = vscode.commands.registerCommand(
        'pastepad.publishProfile',
        async () => {
            try {
                const activeEditor = vscode.window.activeTextEditor;
                if (!activeEditor) {
                    vscode.window.showWarningMessage('No active editor');
                    return;
                }

                const uri = activeEditor.document.uri;
                if (uri.scheme !== 'omgprofile' && uri.scheme !== 'omgnow') {
                    vscode.window.showWarningMessage('Not a profile or /now page document');
                    return;
                }

                logger.info('Publishing profile/now page', { uri: uri.toString() });
                await activeEditor.document.save();
                vscode.window.showInformationMessage('Published successfully!');
            } catch (error) {
                logger.error('Failed to publish', { error });
                vscode.window.showErrorMessage(`Failed to publish: ${error}`);
            }
        }
    );
    commands.push(publishProfileCommand);

    // Open profile in browser command
    const openProfileInBrowserCommand = vscode.commands.registerCommand(
        'pastepad.openProfileInBrowser',
        async () => {
            try {
                const address = await api.getAuthorizationManager().getAddress();
                if (!address) {
                    vscode.window.showWarningMessage('Please authenticate first');
                    return;
                }

                const activeEditor = vscode.window.activeTextEditor;
                if (!activeEditor) {
                    vscode.window.showWarningMessage('No active editor');
                    return;
                }

                const uri = activeEditor.document.uri;
                let url = '';

                if (uri.scheme === 'omgprofile') {
                    url = `https://${address}.omg.lol`;
                } else if (uri.scheme === 'omgnow') {
                    url = `https://${address}.omg.lol/now`;
                } else {
                    vscode.window.showWarningMessage('Not a profile or /now page document');
                    return;
                }

                logger.info('Opening profile in browser', { url });
                await vscode.env.openExternal(vscode.Uri.parse(url));
            } catch (error) {
                logger.error('Failed to open in browser', { error });
                vscode.window.showErrorMessage(`Failed to open in browser: ${error}`);
            }
        }
    );
    commands.push(openProfileInBrowserCommand);

    // Upload profile picture command
    const uploadProfilePictureCommand = vscode.commands.registerCommand(
        'pastepad.uploadProfilePicture',
        async () => {
            try {
                logger.info('Opening profile picture upload dialog');

                const fileUri = await vscode.window.showOpenDialog({
                    canSelectFiles: true,
                    canSelectFolders: false,
                    canSelectMany: false,
                    filters: {
                        'Images': ['png', 'jpg', 'jpeg', 'gif', 'webp']
                    }
                });

                if (!fileUri || fileUri.length === 0) {
                    return;
                }

                const address = await api.getAuthorizationManager().getAddress();
                if (!address) {
                    vscode.window.showWarningMessage('Please authenticate first');
                    return;
                }

                vscode.window.showInformationMessage('Uploading profile picture...');

                // TODO: Implement actual upload API call
                // For now, just show a message that this feature is coming soon
                vscode.window.showInformationMessage('Profile picture upload will be implemented in a future update!');
                logger.info('Profile picture upload requested', { fileUri: fileUri[0].toString() });
            } catch (error) {
                logger.error('Failed to upload profile picture', { error });
                vscode.window.showErrorMessage(`Failed to upload profile picture: ${error}`);
            }
        }
    );
    commands.push(uploadProfilePictureCommand);

    return commands;
}
