import * as vscode from 'vscode';
import { AuthenticationManager } from './authentication';
import { PasteItem } from './types';
import { ErrorHandler, RetryManager, CacheManager, StateManager, ErrorType, ErrorSeverity } from './services';

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

    constructor(private authManager: AuthenticationManager) {
        this.errorHandler = ErrorHandler.getInstance();
        this.retryManager = RetryManager.getInstance();
        this.cacheManager = CacheManager.getInstance();
        this.stateManager = StateManager.getInstance();
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
                listed: listedTitles.has(paste.title) ? 1 : 0
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
                        paste.listed = isListed ? 1 : 0;
                    } else {
                        // Default to unlisted if we can't determine
                        paste.listed = 0;
                    }
                } catch {
                    // Default to unlisted if there's an error
                    paste.listed = 0;
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

            console.log(`Creating new paste "${title}" with listed=${shouldList}`);
            vscode.window.showInformationMessage(`Creating "${title}" as ${shouldList ? 'listed' : 'unlisted'}`);

            const result = await this.retryManager.retryApiCall(async () => {
                const requestBody = { title, content, listed: shouldList };
                console.log(`CREATE REQUEST BODY:`, JSON.stringify(requestBody, null, 2));

                const response = await fetch(`${API_URL}/address/${address}/pastebin/`, {
                    method: 'POST',
                    headers: await this.getHeaders(),
                    body: JSON.stringify(requestBody)
                });

                console.log(`CREATE RESPONSE: ${response.status} ${response.statusText}`);

                if (!response.ok) {
                    const errorText = await response.text();
                    console.error(`CREATE ERROR RESPONSE:`, errorText);
                    throw new Error(`HTTP ${response.status}: ${response.statusText} - ${errorText}`);
                }

                const responseData = await response.json();
                console.log(`CREATE RESPONSE DATA:`, JSON.stringify(responseData, null, 2));
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

            // CRITICAL: We must preserve the current visibility status
            // The API seems to default to listed=true if not specified, so we need to explicitly preserve it
            let listed = false; // Default to unlisted for safety

            try {
                // Make a synchronous call to get just the listed pastes to determine current visibility
                const listedResponse = await fetch(`${API_URL}/address/${address}/pastebin`);
                if (listedResponse.ok) {
                    const listedData = await listedResponse.json() as GetPastesResponse;
                    const listedPastes = listedData.response.pastebin || [];
                    const isCurrentlyListed = listedPastes.some(paste => paste.title === title);
                    listed = isCurrentlyListed;

                    console.log(`LISTED PASTES:`, listedPastes.map(p => p.title));
                    console.log(`Looking for paste: "${title}"`);
                    console.log(`Found in listed list: ${isCurrentlyListed}`);
                    console.log(`Setting listed to: ${listed}`);
                    console.log(`Paste "${title}" is currently ${isCurrentlyListed ? 'listed' : 'unlisted'}, preserving this status`);
                    vscode.window.showInformationMessage(`Preserving paste "${title}" as ${isCurrentlyListed ? 'listed' : 'unlisted'}`);
                } else {
                    console.warn(`Could not determine current visibility for paste "${title}", defaulting to unlisted for safety`);
                vscode.window.showWarningMessage(`Could not determine visibility for "${title}", defaulting to unlisted`);
                }
            } catch (visibilityError) {
                console.warn(`Error determining current visibility for paste "${title}", defaulting to unlisted for safety:`, visibilityError);
                vscode.window.showWarningMessage(`Error checking visibility for "${title}": ${visibilityError}`);
            }

            // WORKAROUND: omg.lol API has a bug where "create or update" endpoint ignores
            // the `listed` parameter for existing pastes. We need to delete and recreate
            // to preserve the correct visibility.
            console.log(`WORKAROUND: Delete and recreate paste "${title}" to preserve visibility`);
            vscode.window.showInformationMessage(`API Bug Workaround: Recreating "${title}" to preserve visibility`);

            const result = await this.retryManager.retryApiCall(async () => {
                // Step 1: Delete the existing paste
                console.log(`Step 1: Deleting existing paste "${title}"`);
                const deleteResponse = await fetch(`${API_URL}/address/${address}/pastebin/${title}`, {
                    method: 'DELETE',
                    headers: await this.getHeaders()
                });

                if (!deleteResponse.ok) {
                    throw new Error(`Failed to delete paste: ${deleteResponse.status} ${deleteResponse.statusText}`);
                }

                console.log(`Step 1 complete: Paste "${title}" deleted`);

                // Step 2: Recreate with correct visibility
                console.log(`Step 2: Recreating paste "${title}" with listed=${listed}`);
                const createResponse = await fetch(`${API_URL}/address/${address}/pastebin/`, {
                    method: 'POST',
                    headers: await this.getHeaders(),
                    body: JSON.stringify({ title, content, listed })
                });

                console.log(`API RESPONSE: ${createResponse.status} ${createResponse.statusText}`);

                if (!createResponse.ok) {
                    throw new Error(`Failed to recreate paste: ${createResponse.status} ${createResponse.statusText}`);
                }

                const responseData = await createResponse.json();
                console.log(`Step 2 complete: Paste "${title}" recreated with correct visibility`);
                console.log(`API RESPONSE DATA:`, JSON.stringify(responseData, null, 2));

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