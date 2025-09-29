export { StateManager, UserPreferences, UIState, CacheMetadata } from './stateManager';
export { ErrorHandler, ErrorType, ErrorSeverity, PastepadError, ErrorMetrics } from './errorHandler';
export { CacheManager, CacheEntry, CacheOptions } from './cacheManager';
export { RetryManager, RetryOptions, RetryResult } from './retryManager';

// Initialize services with context when extension activates
import * as vscode from 'vscode';
import { StateManager } from './stateManager';
import { ErrorHandler } from './errorHandler';
import { CacheManager } from './cacheManager';
import { RetryManager } from './retryManager';

export function initializeServices(context: vscode.ExtensionContext): void {
    // Initialize StateManager singleton with context
    StateManager.getInstance(context);

    // Other services will be initialized as singletons when first accessed
    ErrorHandler.getInstance();
    CacheManager.getInstance();
    RetryManager.getInstance();
}