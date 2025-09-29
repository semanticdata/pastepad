import * as vscode from 'vscode';
import { PastebinProvider } from '../pastebinProvider';

export function registerViewCommands(
    context: vscode.ExtensionContext,
    pastebinProvider: PastebinProvider
): vscode.Disposable[] {
    const commands: vscode.Disposable[] = [];

    // Refresh command - force fresh API call to get updated visibility status
    const refreshCommand = vscode.commands.registerCommand('pastepad.refresh', async () => {
        await pastebinProvider.forceRefresh();
    });

    commands.push(refreshCommand);

    return commands;
}