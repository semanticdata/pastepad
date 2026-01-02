import * as vscode from 'vscode';
import { AuthenticationManager } from './authentication';
import { PasteItem } from './types';
import { ErrorHandler, RetryManager, CacheManager, StateManager, ErrorType, ErrorSeverity, LoggerService } from './services';

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
    private stateManager: StateManager;
    private logger: LoggerService;

    constructor(private authManager: AuthenticationManager) {
        this.errorHandler = ErrorHandler.getInstance();
        this.retryManager = RetryManager.getInstance();
        this.cacheManager = CacheManager.getInstance();
        this.stateManager = StateManager.getInstance();
        this.logger = LoggerService.getInstance();
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

            // Get all pastes (authenticated) and listed pastes (unauthenticated) in parallel
            const [allPastesResult, listedPastesResult] = await Promise.all([
                this.retryManager.retryApiCall(async () => {
                    const response = await fetch(`${API_URL}/address/${address}/pastebin`, {
                        headers: await this.getHeaders()
                    });

                    if (!response.ok) {
                        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
                    }

                    return response.json() as Promise<GetPastesResponse>;
                }),
                this.retryManager.retryApiCall(async () => {
                    const response = await fetch(`${API_URL}/address/${address}/pastebin`);

                    if (!response.ok) {
                        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
                    }

                    return response.json() as Promise<GetPastesResponse>;
                })
            ]);

            if (!allPastesResult.success) {
                // Try to return cached data as fallback
                const fallback = await this.cacheManager.getOfflinePasteList();
                if (fallback) {
                    vscode.window.showWarningMessage('Using cached data due to connection issues');
                    return fallback;
                }
                throw allPastesResult.error || new Error('Failed to fetch pastes');
            }

            const allPastes = allPastesResult.result!.response.pastebin || [];
            const listedPastes = listedPastesResult.success ? (listedPastesResult.result!.response.pastebin || []) : [];

            // Create a Set of listed paste titles for quick lookup
            const listedTitles = new Set(listedPastes.map(paste => paste.title));

            // Add the listed property to each paste
            const pastesWithListedInfo: PasteItem[] = allPastes.map(paste => ({
                ...paste,
                listed: listedTitles.has(paste.title)
            }));

            // Cache the results
            await this.cacheManager.setPasteList(pastesWithListedInfo);

            return pastesWithListedInfo;

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
                // Check if this paste is listed by fetching the listed pastebin
                try {
                    const listedResponse = await fetch(`${API_URL}/address/${address}/pastebin`);
                    if (listedResponse.ok) {
                        const listedData = await listedResponse.json() as GetPastesResponse;
                        const listedPastes = listedData.response.pastebin || [];
                        const isListed = listedPastes.some(listedPaste => listedPaste.title === title);
                        paste.listed = isListed;
                    } else {
                        // Default to unlisted if we can't determine
                        paste.listed = false;
                    }
                } catch {
                    // Default to unlisted if there's an error
                    paste.listed = false;
                }

                // Cache the result with listed info
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

    async createPaste(title: string, content: string, listed?: boolean): Promise<void> {
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

            // Get user preference for listing new pastes if not explicitly specified
            let shouldList = listed;
            if (shouldList === undefined) {
                const preferences = await this.stateManager.getUserPreferences();
                shouldList = preferences.defaultListNewPastes ?? false; // Default to unlisted for safety
            }

            this.logger.info('Creating new paste', { title, listed: shouldList });
            vscode.window.showInformationMessage(`Creating "${title}" as ${shouldList ? 'listed' : 'unlisted'}`);

            const result = await this.retryManager.retryApiCall(async () => {
                // The API expects 'listed' as 1 for listed, or omitted/0 for unlisted
                const requestBody: any = { title, content };
                if (shouldList) {
                    requestBody.listed = 1;
                }
                // Omit 'listed' entirely for unlisted pastes
                this.logger.debug('API create request body', { requestBody });

                const response = await fetch(`${API_URL}/address/${address}/pastebin/`, {
                    method: 'POST',
                    headers: await this.getHeaders(),
                    body: JSON.stringify(requestBody)
                });

                this.logger.debug('API create response status', { status: response.status, statusText: response.statusText });

                if (!response.ok) {
                    const errorText = await response.text();
                    this.logger.error('API create error response', { status: response.status, statusText: response.statusText, errorText });
                    throw new Error(`HTTP ${response.status}: ${response.statusText} - ${errorText}`);
                }

                const responseData = await response.json();
                this.logger.debug('API create response data', { responseData });
                return responseData;
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

    async updatePaste(title: string, content: string, listed?: boolean): Promise<void> {
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

            // If listed status is not provided, preserve the current visibility
            let shouldList = listed;
            if (shouldList === undefined) {
                try {
                    // Get the existing paste to determine its current visibility
                    const existingPaste = await this.getPaste(title);
                    if (existingPaste && existingPaste.listed !== undefined) {
                        shouldList = existingPaste.listed;
                        this.logger.debug('Preserving existing visibility', { title, listed: shouldList });
                    } else {
                        // If we can't determine, default to unlisted for safety
                        shouldList = false;
                        this.logger.debug('Could not determine visibility, defaulting to unlisted', { title });
                    }
                } catch (error) {
                    // Default to unlisted if there's an error
                    shouldList = false;
                    this.logger.debug('Error determining visibility, defaulting to unlisted', { title, error });
                }
            }

            this.logger.info('Updating paste', { title, listed: shouldList });

            const result = await this.retryManager.retryApiCall(async () => {
                // The API expects 'listed' as 1 for listed, or omitted/0 for unlisted
                const requestBody: any = { title, content };
                if (shouldList) {
                    requestBody.listed = 1;
                }
                // Omit 'listed' entirely for unlisted pastes
                this.logger.debug('API update request body', { requestBody });

                const response = await fetch(`${API_URL}/address/${address}/pastebin/`, {
                    method: 'POST',
                    headers: await this.getHeaders(),
                    body: JSON.stringify(requestBody)
                });

                this.logger.debug('API update response status', { status: response.status, statusText: response.statusText });

                if (!response.ok) {
                    const errorText = await response.text();
                    this.logger.error('API update error response', { status: response.status, statusText: response.statusText, errorText });
                    throw new Error(`HTTP ${response.status}: ${response.statusText} - ${errorText}`);
                }

                const responseData = await response.json();
                this.logger.debug('API update response data', { responseData });
                return responseData;
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