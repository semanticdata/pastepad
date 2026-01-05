import * as vscode from 'vscode';
import { AuthenticationManager } from '../authentication';
import { PastebinProvider } from '../pastebinProvider';
import { OmgLolApi } from '../api';
import { ProfileProvider } from '../profileProvider';
import { registerAuthenticationCommands } from './authenticationCommands';
import { registerPasteCommands } from './pasteCommands';
import { registerViewCommands } from './viewCommands';
import { registerSettingsCommands } from './settingsCommands';
import { registerProfileCommands } from './profileCommands';

export interface CommandDependencies {
    authManager: AuthenticationManager;
    pastebinProvider: PastebinProvider;
    api: OmgLolApi;
    profileProvider: ProfileProvider;
}

export function registerAllCommands(
    context: vscode.ExtensionContext,
    dependencies: CommandDependencies
): vscode.Disposable[] {
    const { authManager, pastebinProvider, api, profileProvider } = dependencies;
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

    // Register settings commands
    const settingsCommands = registerSettingsCommands(context, pastebinProvider);
    allCommands.push(...settingsCommands);

    // Register profile commands
    const profileCommands = registerProfileCommands(context, api, profileProvider);
    allCommands.push(...profileCommands);

    return allCommands;
}