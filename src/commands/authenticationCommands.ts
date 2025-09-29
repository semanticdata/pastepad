import * as vscode from 'vscode';
import { AuthenticationManager } from '../authentication';

export function registerAuthenticationCommands(
    context: vscode.ExtensionContext,
    authManager: AuthenticationManager
): vscode.Disposable[] {
    const commands: vscode.Disposable[] = [];

    // Authenticate command
    const authenticateCommand = vscode.commands.registerCommand('pastepad.authenticate', async () => {
        await authManager.authenticate();
    });

    // Logout command
    const logoutCommand = vscode.commands.registerCommand('pastepad.logout', async () => {
        await authManager.logout();
    });

    commands.push(authenticateCommand, logoutCommand);

    return commands;
}