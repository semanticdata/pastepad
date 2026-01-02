import * as vscode from 'vscode';

export enum LogLevel {
    DEBUG = 'debug',
    INFO = 'info',
    WARN = 'warn',
    ERROR = 'error'
}

export class LoggerService {
    private static instance: LoggerService | undefined;
    private channel: vscode.OutputChannel;
    private logLevel: LogLevel;

    private constructor(context: vscode.ExtensionContext) {
        this.channel = vscode.window.createOutputChannel('PastePad');
        this.logLevel = this.getLogLevelFromConfig();
        this.info('PastePad Logger initialized');
    }

    public static getInstance(context?: vscode.ExtensionContext): LoggerService {
        if (!LoggerService.instance) {
            if (!context) {
                throw new Error('LoggerService requires ExtensionContext on first initialization');
            }
            LoggerService.instance = new LoggerService(context);
        }
        return LoggerService.instance;
    }

    public debug(message: string, metadata?: Record<string, any>): void {
        this.log(LogLevel.DEBUG, message, metadata);
    }

    public info(message: string, metadata?: Record<string, any>): void {
        this.log(LogLevel.INFO, message, metadata);
    }

    public warn(message: string, metadata?: Record<string, any>): void {
        this.log(LogLevel.WARN, message, metadata);
    }

    public error(message: string, metadata?: Record<string, any>): void {
        this.log(LogLevel.ERROR, message, metadata);
    }

    private shouldLog(level: LogLevel): boolean {
        const levels = [LogLevel.ERROR, LogLevel.WARN, LogLevel.INFO, LogLevel.DEBUG];
        const currentLevelIndex = levels.indexOf(this.logLevel);
        const requestedLevelIndex = levels.indexOf(level);
        return requestedLevelIndex <= currentLevelIndex;
    }

    private getLogLevelFromConfig(): LogLevel {
        const config = vscode.workspace.getConfiguration('pastepad');
        const logLevel = config.get<string>('logLevel', LogLevel.INFO);

        // Validate the log level
        if (Object.values(LogLevel).includes(logLevel as LogLevel)) {
            return logLevel as LogLevel;
        }

        // Default to INFO if invalid
        return LogLevel.INFO;
    }

    private formatMessage(level: LogLevel, message: string, metadata?: Record<string, any>): string {
        const timestamp = new Date().toISOString();
        let formattedMessage = `[${timestamp}] [${level.toUpperCase()}] ${message}`;

        if (metadata && Object.keys(metadata).length > 0) {
            // Sanitize metadata to remove sensitive information
            const sanitized = this.sanitizeMetadata(metadata);
            formattedMessage += ` ${JSON.stringify(sanitized)}`;
        }

        return formattedMessage;
    }

    private sanitizeMetadata(metadata: Record<string, any>): Record<string, any> {
        const sanitized: Record<string, any> = {};
        const sensitiveKeys = ['password', 'token', 'secret', 'authorization', 'apikey'];

        for (const [key, value] of Object.entries(metadata)) {
            const lowerKey = key.toLowerCase();
            if (sensitiveKeys.some(sensitive => lowerKey.includes(sensitive))) {
                sanitized[key] = '[REDACTED]';
            } else if (typeof value === 'object' && value !== null) {
                // Recursively sanitize nested objects
                sanitized[key] = this.sanitizeMetadata(value);
            } else {
                sanitized[key] = value;
            }
        }

        return sanitized;
    }

    private log(level: LogLevel, message: string, metadata?: Record<string, any>): void {
        if (!this.shouldLog(level)) {
            return;
        }

        const formattedMessage = this.formatMessage(level, message, metadata);
        this.channel.appendLine(formattedMessage);
    }

    public dispose(): void {
        this.channel.dispose();
    }
}
