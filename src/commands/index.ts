import * as vscode from 'vscode';
import { AuthenticationManager } from '../authentication';
import { PastebinProvider } from '../pastebinProvider';
import { registerAuthenticationCommands } from './authenticationCommands';
import { registerPasteCommands } from './pasteCommands';
import { registerViewCommands } from './viewCommands';

export interface CommandDependencies {
    authManager: AuthenticationManager;
    pastebinProvider: PastebinProvider;
}

export function registerAllCommands(
    context: vscode.ExtensionContext,
    dependencies: CommandDependencies
): vscode.Disposable[] {
    const { authManager, pastebinProvider } = dependencies;
    const allCommands: vscode.Disposable[] = [];

    // Register authentication commands
    const authCommands = registerAuthenticationCommands(context, authManager);
    allCommands.push(...authCommands);

    // Register paste management commands
    const pasteCommands = registerPasteCommands(context, authManager, pastebinProvider);
    allCommands.push(...pasteCommands);

    // Register view commands
    const viewCommands = registerViewCommands(context, pastebinProvider);
    allCommands.push(...viewCommands);

    return allCommands;
}