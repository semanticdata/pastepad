import * as vscode from 'vscode';
import { AuthenticationManager } from './authentication';
import { PasteItem } from './types';
import { ErrorHandler, RetryManager, CacheManager, ErrorType, ErrorSeverity } from './services';

const API_URL = 'https://api.omg.lol';

interface GetPastesResponse {
    request: { success: boolean };
    response: { pastebin?: PasteItem[] };
}

interface GetPasteResponse {
    request: { success: boolean };
    response: { paste?: PasteItem };
}

export class OmgLolApi {
    private errorHandler: ErrorHandler;
    private retryManager: RetryManager;
    private cacheManager: CacheManager;

    constructor(private authManager: AuthenticationManager) {
        this.errorHandler = ErrorHandler.getInstance();
        this.retryManager = RetryManager.getInstance();
        this.cacheManager = CacheManager.getInstance();
    }

    private async getHeaders(): Promise<{ [key: string]: string }> {
        const accessToken = await this.authManager.getAccessToken();
        if (!accessToken) {
            throw new Error('Not authenticated');
        }
        return {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json'
        };
    }

    async getPastes(forceRefresh: boolean = false): Promise<PasteItem[]> {
        try {
            // Check cache first unless forcing refresh
            if (!forceRefresh) {
                const cached = await this.cacheManager.getPasteList();
                if (cached) {
                    return cached;
                }
            }

            const address = await this.authManager.getAddress();
            if (!address) {
                throw this.errorHandler.createError(
                    ErrorType.AUTHENTICATION,
                    ErrorSeverity.HIGH,
                    'No address found',
                    'Please authenticate first'
                );
            }

            const result = await this.retryManager.retryApiCall(async () => {
                const response = await fetch(`${API_URL}/address/${address}/pastebin`, {
                    headers: await this.getHeaders()
                });

                if (!response.ok) {
                    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
                }

                return response.json() as Promise<GetPastesResponse>;
            });

            if (!result.success) {
                // Try to return cached data as fallback
                const fallback = await this.cacheManager.getOfflinePasteList();
                if (fallback) {
                    vscode.window.showWarningMessage('Using cached data due to connection issues');
                    return fallback;
                }
                throw result.error || new Error('Failed to fetch pastes');
            }

            const pastes = result.result!.response.pastebin || [];

            // Cache the results
            await this.cacheManager.setPasteList(pastes);

            return pastes;

        } catch (error) {
            await this.errorHandler.handleError(error as Error, {
                operation: 'getPastes',
                forceRefresh
            });

            // Try to return cached data as last resort
            const fallback = await this.cacheManager.getOfflinePasteList();
            return fallback || [];
        }
    }

    async getPaste(title: string, forceRefresh: boolean = false): Promise<PasteItem | undefined> {
        try {
            // Check cache first unless forcing refresh
            if (!forceRefresh) {
                const cached = await this.cacheManager.getPasteContent(title);
                if (cached) {
                    return cached;
                }
            }

            const address = await this.authManager.getAddress();
            if (!address) {
                throw this.errorHandler.createError(
                    ErrorType.AUTHENTICATION,
                    ErrorSeverity.HIGH,
                    'No address found',
                    'Please authenticate first'
                );
            }

            const result = await this.retryManager.retryApiCall(async () => {
                const response = await fetch(`${API_URL}/address/${address}/pastebin/${title}`, {
                    headers: await this.getHeaders()
                });

                if (!response.ok) {
                    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
                }

                return response.json() as Promise<GetPasteResponse>;
            });

            if (!result.success) {
                // Try to return cached data as fallback
                const fallback = await this.cacheManager.getOfflinePasteContent(title);
                if (fallback) {
                    vscode.window.showWarningMessage('Using cached paste due to connection issues');
                    return fallback;
                }
                throw result.error || new Error(`Failed to fetch paste: ${title}`);
            }

            const paste = result.result!.response.paste;
            if (paste) {
                // Cache the result
                await this.cacheManager.setPasteContent(title, paste);
            }

            return paste;

        } catch (error) {
            await this.errorHandler.handleError(error as Error, {
                operation: 'getPaste',
                title,
                forceRefresh
            });

            // Try to return cached data as last resort
            const fallback = await this.cacheManager.getOfflinePasteContent(title);
            return fallback;
        }
    }

    async createPaste(title: string, content: string): Promise<void> {
        try {
            const address = await this.authManager.getAddress();
            if (!address) {
                throw this.errorHandler.createError(
                    ErrorType.AUTHENTICATION,
                    ErrorSeverity.HIGH,
                    'No address found',
                    'Please authenticate first'
                );
            }

            const result = await this.retryManager.retryApiCall(async () => {
                const response = await fetch(`${API_URL}/address/${address}/pastebin`, {
                    method: 'POST',
                    headers: await this.getHeaders(),
                    body: JSON.stringify({ title, content, listed: 1 })
                });

                if (!response.ok) {
                    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
                }

                return response.json();
            });

            if (!result.success) {
                throw result.error || new Error(`Failed to create paste: ${title}`);
            }

            // Invalidate cache to ensure fresh data on next fetch
            await this.cacheManager.invalidateAllPastes();

        } catch (error) {
            await this.errorHandler.handleError(error as Error, {
                operation: 'createPaste',
                title,
                contentLength: content.length
            });
            throw error;
        }
    }

    async updatePaste(title: string, content: string): Promise<void> {
        try {
            const address = await this.authManager.getAddress();
            if (!address) {
                throw this.errorHandler.createError(
                    ErrorType.AUTHENTICATION,
                    ErrorSeverity.HIGH,
                    'No address found',
                    'Please authenticate first'
                );
            }

            const result = await this.retryManager.retryApiCall(async () => {
                const response = await fetch(`${API_URL}/address/${address}/pastebin/${title}`, {
                    method: 'PUT',
                    headers: await this.getHeaders(),
                    body: JSON.stringify({ content })
                });

                if (!response.ok) {
                    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
                }

                return response.json();
            });

            if (!result.success) {
                throw result.error || new Error(`Failed to update paste: ${title}`);
            }

            // Invalidate cache for this specific paste and the paste list
            await this.cacheManager.invalidatePaste(title);

        } catch (error) {
            await this.errorHandler.handleError(error as Error, {
                operation: 'updatePaste',
                title,
                contentLength: content.length
            });
            throw error;
        }
    }

    async deletePaste(title: string): Promise<void> {
        try {
            const address = await this.authManager.getAddress();
            if (!address) {
                throw this.errorHandler.createError(
                    ErrorType.AUTHENTICATION,
                    ErrorSeverity.HIGH,
                    'No address found',
                    'Please authenticate first'
                );
            }

            const result = await this.retryManager.retryApiCall(async () => {
                const response = await fetch(`${API_URL}/address/${address}/pastebin/${title}`, {
                    method: 'DELETE',
                    headers: await this.getHeaders()
                });

                if (!response.ok) {
                    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
                }

                return { success: true };
            });

            if (!result.success) {
                throw result.error || new Error(`Failed to delete paste: ${title}`);
            }

            // Remove from cache
            await this.cacheManager.invalidatePaste(title);

        } catch (error) {
            await this.errorHandler.handleError(error as Error, {
                operation: 'deletePaste',
                title
            });
            throw error;
        }
    }
}