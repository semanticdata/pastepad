import * as vscode from 'vscode';
import { StateManager } from './stateManager';

export enum ErrorType {
    NETWORK = 'network',
    AUTHENTICATION = 'authentication',
    API = 'api',
    FILESYSTEM = 'filesystem',
    USER_INPUT = 'user_input',
    UNKNOWN = 'unknown'
}

export enum ErrorSeverity {
    LOW = 'low',
    MEDIUM = 'medium',
    HIGH = 'high',
    CRITICAL = 'critical'
}

export interface PastepadError {
    type: ErrorType;
    severity: ErrorSeverity;
    message: string;
    userMessage: string;
    code?: string;
    originalError?: Error;
    context?: Record<string, any>;
    timestamp: number;
    actionable: boolean;
    suggestedActions?: string[];
    recoveryAction?: () => Promise<void>;
}

export interface ErrorMetrics {
    totalErrors: number;
    errorsByType: Record<ErrorType, number>;
    errorsBySeverity: Record<ErrorSeverity, number>;
    recentErrors: PastepadError[];
}

export class ErrorHandler {
    private static instance: ErrorHandler | undefined;
    private stateManager: StateManager;

    private constructor() {
        this.stateManager = StateManager.getInstance();
    }

    public static getInstance(): ErrorHandler {
        if (!ErrorHandler.instance) {
            ErrorHandler.instance = new ErrorHandler();
        }
        return ErrorHandler.instance;
    }

    async handleError(error: Error | PastepadError, context?: Record<string, any>): Promise<void> {
        let pastepadError: PastepadError;

        if (this.isPastepadError(error)) {
            pastepadError = error;
        } else {
            pastepadError = this.categorizeError(error, context);
        }

        // Log error for metrics
        await this.logError(pastepadError);

        // Show user-appropriate message
        await this.showUserMessage(pastepadError);

        // Attempt recovery if available
        if (pastepadError.recoveryAction) {
            try {
                await pastepadError.recoveryAction();
            } catch (recoveryError) {
                console.error('Recovery action failed:', recoveryError);
            }
        }
    }

    private categorizeError(error: Error, context?: Record<string, any>): PastepadError {
        const message = error.message.toLowerCase();
        const timestamp = Date.now();

        // Network errors
        if (message.includes('fetch') || message.includes('network') ||
            message.includes('timeout') || message.includes('connection') ||
            message.includes('cors') || message.includes('http')) {

            if (message.includes('401') || message.includes('unauthorized')) {
                return this.createAuthenticationError(error, context);
            }

            if (message.includes('403') || message.includes('forbidden')) {
                return {
                    type: ErrorType.API,
                    severity: ErrorSeverity.MEDIUM,
                    message: error.message,
                    userMessage: 'Access denied. Please check your permissions.',
                    originalError: error,
                    context,
                    timestamp,
                    actionable: true,
                    suggestedActions: ['Check your authentication', 'Verify account permissions'],
                    recoveryAction: async () => {
                        vscode.commands.executeCommand('pastepad.authenticate');
                    }
                };
            }

            if (message.includes('404') || message.includes('not found')) {
                return {
                    type: ErrorType.API,
                    severity: ErrorSeverity.LOW,
                    message: error.message,
                    userMessage: 'The requested resource was not found.',
                    originalError: error,
                    context,
                    timestamp,
                    actionable: false,
                    suggestedActions: ['Refresh the paste list', 'Check if the paste still exists']
                };
            }

            if (message.includes('429') || message.includes('rate limit')) {
                return {
                    type: ErrorType.API,
                    severity: ErrorSeverity.MEDIUM,
                    message: error.message,
                    userMessage: 'Rate limit exceeded. Please wait a moment before trying again.',
                    originalError: error,
                    context,
                    timestamp,
                    actionable: true,
                    suggestedActions: ['Wait a few minutes', 'Reduce request frequency']
                };
            }

            if (message.includes('500') || message.includes('503') || message.includes('server error')) {
                return {
                    type: ErrorType.API,
                    severity: ErrorSeverity.HIGH,
                    message: error.message,
                    userMessage: 'Server error. The service may be temporarily unavailable.',
                    originalError: error,
                    context,
                    timestamp,
                    actionable: true,
                    suggestedActions: ['Try again later', 'Check service status']
                };
            }

            return {
                type: ErrorType.NETWORK,
                severity: ErrorSeverity.MEDIUM,
                message: error.message,
                userMessage: 'Network connection issue. Please check your internet connection.',
                originalError: error,
                context,
                timestamp,
                actionable: true,
                suggestedActions: ['Check internet connection', 'Try again', 'Work offline']
            };
        }

        // Authentication errors
        if (message.includes('auth') || message.includes('token') ||
            message.includes('login') || message.includes('credential')) {
            return this.createAuthenticationError(error, context);
        }

        // File system errors
        if (message.includes('file') || message.includes('permission') ||
            message.includes('directory') || error.name?.includes('FileSystem')) {
            return {
                type: ErrorType.FILESYSTEM,
                severity: ErrorSeverity.MEDIUM,
                message: error.message,
                userMessage: 'File system operation failed.',
                originalError: error,
                context,
                timestamp,
                actionable: true,
                suggestedActions: ['Check file permissions', 'Ensure file exists', 'Try saving again']
            };
        }

        // User input errors
        if (message.includes('invalid') || message.includes('required') ||
            message.includes('validation') || message.includes('format')) {
            return {
                type: ErrorType.USER_INPUT,
                severity: ErrorSeverity.LOW,
                message: error.message,
                userMessage: 'Invalid input provided. Please check your input and try again.',
                originalError: error,
                context,
                timestamp,
                actionable: true,
                suggestedActions: ['Check input format', 'Verify required fields']
            };
        }

        // Default unknown error
        return {
            type: ErrorType.UNKNOWN,
            severity: ErrorSeverity.MEDIUM,
            message: error.message,
            userMessage: 'An unexpected error occurred.',
            originalError: error,
            context,
            timestamp,
            actionable: false,
            suggestedActions: ['Try again', 'Restart VS Code if the issue persists']
        };
    }

    private createAuthenticationError(error: Error, context?: Record<string, any>): PastepadError {
        return {
            type: ErrorType.AUTHENTICATION,
            severity: ErrorSeverity.HIGH,
            message: error.message,
            userMessage: 'Authentication failed. Please sign in again.',
            originalError: error,
            context,
            timestamp: Date.now(),
            actionable: true,
            suggestedActions: ['Re-authenticate with omg.lol', 'Check API credentials'],
            recoveryAction: async () => {
                vscode.commands.executeCommand('pastepad.authenticate');
            }
        };
    }

    private async logError(error: PastepadError): Promise<void> {
        // Increment error counters
        await this.stateManager.incrementErrorCount(error.type);
        await this.stateManager.incrementErrorCount(`severity_${error.severity}`);

        // Store recent errors (keep last 50)
        const recentErrors = await this.getRecentErrors();
        recentErrors.unshift(error);
        if (recentErrors.length > 50) {
            recentErrors.splice(50);
        }

        // Don't store the recovery function in state
        const { recoveryAction, ...errorToStore } = error;
        await this.stateManager.setCachedData('recentErrors', recentErrors, 86400000); // 24 hours

        // Log to console for debugging
        console.error(`[Pastepad ${error.severity.toUpperCase()}] ${error.type}: ${error.message}`, {
            context: error.context,
            originalError: error.originalError
        });
    }

    private async showUserMessage(error: PastepadError): Promise<void> {
        const actions = error.suggestedActions || [];
        const actionButtons = error.actionable ? actions.slice(0, 2) : []; // Max 2 buttons

        switch (error.severity) {
            case ErrorSeverity.CRITICAL:
            case ErrorSeverity.HIGH:
                await vscode.window.showErrorMessage(error.userMessage, ...actionButtons);
                break;
            case ErrorSeverity.MEDIUM:
                await vscode.window.showWarningMessage(error.userMessage, ...actionButtons);
                break;
            case ErrorSeverity.LOW:
                await vscode.window.showInformationMessage(error.userMessage, ...actionButtons);
                break;
        }
    }

    private isPastepadError(error: any): error is PastepadError {
        return error && typeof error === 'object' && 'type' in error && 'severity' in error;
    }

    async getErrorMetrics(): Promise<ErrorMetrics> {
        const errorCounts = await this.stateManager.getErrorCounts();
        const recentErrors = await this.getRecentErrors();

        const totalErrors = Object.values(errorCounts).reduce((sum, count) => sum + count, 0);

        const errorsByType = Object.values(ErrorType).reduce((acc, type) => {
            acc[type] = errorCounts[type] || 0;
            return acc;
        }, {} as Record<ErrorType, number>);

        const errorsBySeverity = Object.values(ErrorSeverity).reduce((acc, severity) => {
            acc[severity] = errorCounts[`severity_${severity}`] || 0;
            return acc;
        }, {} as Record<ErrorSeverity, number>);

        return {
            totalErrors,
            errorsByType,
            errorsBySeverity,
            recentErrors: recentErrors.slice(0, 10) // Only return recent 10
        };
    }

    async clearErrorHistory(): Promise<void> {
        await Promise.all([
            this.stateManager.clearErrorCounts(),
            this.stateManager.clearCache('recentErrors')
        ]);
    }

    private async getRecentErrors(): Promise<PastepadError[]> {
        return await this.stateManager.getCachedData<PastepadError[]>('recentErrors') || [];
    }

    // Utility method for creating custom errors
    createError(
        type: ErrorType,
        severity: ErrorSeverity,
        message: string,
        userMessage: string,
        options: Partial<Pick<PastepadError, 'code' | 'context' | 'suggestedActions' | 'recoveryAction'>> = {}
    ): PastepadError {
        return {
            type,
            severity,
            message,
            userMessage,
            timestamp: Date.now(),
            actionable: !!(options.suggestedActions?.length || options.recoveryAction),
            ...options
        };
    }
}