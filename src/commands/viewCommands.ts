import * as vscode from 'vscode';
import { PastebinProvider } from '../pastebinProvider';

export function registerViewCommands(
    context: vscode.ExtensionContext,
    pastebinProvider: PastebinProvider
): vscode.Disposable[] {
    const commands: vscode.Disposable[] = [];

    // Refresh command
    const refreshCommand = vscode.commands.registerCommand('pastepad.refresh', () => {
        pastebinProvider.refresh();
    });

    commands.push(refreshCommand);

    return commands;
}