import * as vscode from 'vscode';
import { StateManager, ErrorHandler, ErrorType, ErrorSeverity } from '../services';
import { PastebinProvider } from '../pastebinProvider';

export function registerSettingsCommands(
    context: vscode.ExtensionContext,
    pastebinProvider: PastebinProvider
): vscode.Disposable[] {
    const commands: vscode.Disposable[] = [];
    const stateManager = StateManager.getInstance();
    const errorHandler = ErrorHandler.getInstance();

    // Toggle paste grouping command
    const togglePasteGrouping = vscode.commands.registerCommand('pastepad.togglePasteGrouping', async () => {
        try {
            const preferences = await stateManager.getUserPreferences();
            const newGroupingState = !preferences.groupPastesByVisibility;

            await stateManager.setUserPreferences({
                groupPastesByVisibility: newGroupingState
            });

            pastebinProvider.refresh();

            const message = newGroupingState
                ? 'Paste grouping enabled - pastes will be grouped by visibility'
                : 'Paste grouping disabled - pastes will be shown in a flat list';

            vscode.window.showInformationMessage(message);

        } catch (error) {
            await errorHandler.handleError(error as Error, {
                operation: 'togglePasteGrouping'
            });
        }
    });

    // Toggle default listing behavior command
    const toggleDefaultListing = vscode.commands.registerCommand('pastepad.toggleDefaultListing', async () => {
        try {
            const preferences = await stateManager.getUserPreferences();
            const newListingState = !preferences.defaultListNewPastes;

            await stateManager.setUserPreferences({
                defaultListNewPastes: newListingState
            });

            const message = newListingState
                ? 'New pastes will be public by default'
                : 'New pastes will be private by default';

            vscode.window.showInformationMessage(message);

        } catch (error) {
            await errorHandler.handleError(error as Error, {
                operation: 'toggleDefaultListing'
            });
        }
    });

    // Show paste statistics command
    const showPasteStats = vscode.commands.registerCommand('pastepad.showPasteStats', async () => {
        try {
            // This would need to be called from a context where pastes are available
            // For now, show user preferences
            const preferences = await stateManager.getUserPreferences();

            const statsMessage = `
**Pastepad Settings:**
• Grouping by visibility: ${preferences.groupPastesByVisibility ? 'Enabled' : 'Disabled'}
• Default visibility for new pastes: ${preferences.defaultListNewPastes ? 'Public' : 'Private'}
• Sort by: ${preferences.sortBy || 'modified'}
• Auto-save: ${preferences.autoSave ? 'Enabled' : 'Disabled'}
            `.trim();

            vscode.window.showInformationMessage(statsMessage, { modal: true });

        } catch (error) {
            await errorHandler.handleError(error as Error, {
                operation: 'showPasteStats'
            });
        }
    });

    commands.push(togglePasteGrouping, toggleDefaultListing, showPasteStats);
    return commands;
}