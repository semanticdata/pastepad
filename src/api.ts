import * as vscode from 'vscode';
import { AuthenticationManager } from './authentication';
import { PasteItem, ProfileData, NowPageData, WeblogEntry, WeblogConfiguration, WeblogTemplate } from './types';
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

interface GetNowPageResponse {
    request: { success: boolean };
    response: {
        now?: NowPageData;
    };
}

interface UpdateNowPageResponse {
    request: { success: boolean };
    response: {
        message?: string;
    };
}

interface UploadProfilePictureResponse {
    request: { success: boolean; status_code: number };
    response: { message: string };
}

// Weblog response interfaces
interface GetWeblogEntriesResponse {
    request: { success: boolean };
    response: {
        message?: string;
        entries?: WeblogEntry[];
    };
}

interface GetWeblogEntryResponse {
    request: { success: boolean };
    response: {
        message?: string;
        entry?: WeblogEntry;
    };
}

interface CreateWeblogEntryResponse {
    request: { success: boolean };
    response: {
        message?: string;
        entry?: WeblogEntry;
    };
}

interface DeleteWeblogEntryResponse {
    request: { success: boolean };
    response: {
        message?: string;
    };
}

interface GetWeblogConfigurationResponse {
    request: { success: boolean };
    response: {
        message?: string;
        configuration?: WeblogConfiguration;
    };
}

interface UpdateWeblogConfigurationResponse {
    request: { success: boolean };
    response: {
        message?: string;
    };
}

interface GetWeblogTemplateResponse {
    request: { success: boolean };
    response: {
        message?: string;
        template?: string;
    };
}

interface UpdateWeblogTemplateResponse {
    request: { success: boolean };
    response: {
        message?: string;
    };
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

    getAuthorizationManager(): AuthenticationManager {
        return this.authManager;
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

    // Profile and Now Page methods

    async getProfile(address?: string, forceRefresh: boolean = false): Promise<ProfileData | undefined> {
        try {
            // Check cache first unless forcing refresh
            if (!forceRefresh) {
                const cached = await this.cacheManager.get<ProfileData>('profile');
                if (cached) {
                    return cached;
                }
            }

            const targetAddress = address || await this.authManager.getAddress();
            if (!targetAddress) {
                throw this.errorHandler.createError(
                    ErrorType.AUTHENTICATION,
                    ErrorSeverity.HIGH,
                    'No address found',
                    'Please authenticate first'
                );
            }

            this.logger.info('Fetching profile', { address: targetAddress });

            const result = await this.retryManager.retryApiCall(async () => {
                const response = await fetch(`${API_URL}/address/${targetAddress}/web`, {
                    headers: await this.getHeaders()
                });

                // Return empty profile if not found (404)
                if (response.status === 404) {
                    this.logger.info('Profile not found, returning empty profile');
                    return {
                        success: true,
                        result: {
                            response: { content: '', type: 'profile', theme: 'default', css: '', head: '', verified: '0', pfp: '', metadata: '', branding: 'default' }
                        }
                    };
                }

                if (!response.ok) {
                    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
                }

                return response.json();
            });

            if (!result.success || !result.result) {
                throw result.error || new Error('Failed to fetch profile');
            }

            const apiResponse = result.result as any;
            const profile: ProfileData = {
                content: apiResponse.response?.content || '',
                theme: apiResponse.response?.theme,
                css: apiResponse.response?.css,
                head: apiResponse.response?.head,
                verified: apiResponse.response?.verified,
                pfp: apiResponse.response?.pfp,
                metadata: apiResponse.response?.metadata,
                branding: apiResponse.response?.branding,
                type: apiResponse.response?.type
            };

            // Cache the result with 5 minute TTL (300 seconds)
            await this.cacheManager.set('profile', profile, { ttl: 300 });

            return profile;

        } catch (error) {
            await this.errorHandler.handleError(error as Error, {
                operation: 'getProfile',
                address,
                forceRefresh
            });

            // Try to return cached data as last resort
            const fallback = await this.cacheManager.getOfflineData<ProfileData>('profile');
            return fallback;
        }
    }

    async updateProfile(content: string, address?: string): Promise<void> {
        try {
            const targetAddress = address || await this.authManager.getAddress();
            if (!targetAddress) {
                throw this.errorHandler.createError(
                    ErrorType.AUTHENTICATION,
                    ErrorSeverity.HIGH,
                    'No address found',
                    'Please authenticate first'
                );
            }

            this.logger.info('Updating profile', { address: targetAddress, contentLength: content.length });

            const result = await this.retryManager.retryApiCall(async () => {
                const response = await fetch(`${API_URL}/address/${targetAddress}/web`, {
                    method: 'POST',
                    headers: await this.getHeaders(),
                    body: JSON.stringify({ content, publish: true })
                });

                if (!response.ok) {
                    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
                }

                return response.json();
            });

            if (!result.success) {
                throw result.error || new Error('Failed to update profile');
            }

            // Invalidate cache
            await this.cacheManager.invalidate('profile');

        } catch (error) {
            await this.errorHandler.handleError(error as Error, {
                operation: 'updateProfile',
                address,
                contentLength: content.length
            });
            throw error;
        }
    }

    async getNowPage(address?: string, forceRefresh: boolean = false): Promise<NowPageData | undefined> {
        try {
            // Check cache first unless forcing refresh
            if (!forceRefresh) {
                const cached = await this.cacheManager.get<NowPageData>('now');
                if (cached) {
                    return cached;
                }
            }

            const targetAddress = address || await this.authManager.getAddress();
            if (!targetAddress) {
                throw this.errorHandler.createError(
                    ErrorType.AUTHENTICATION,
                    ErrorSeverity.HIGH,
                    'No address found',
                    'Please authenticate first'
                );
            }

            this.logger.info('Fetching now page', { address: targetAddress });

            const result = await this.retryManager.retryApiCall(async () => {
                const response = await fetch(`${API_URL}/address/${targetAddress}/now`);

                // Return empty now page if not found (404)
                if (response.status === 404) {
                    this.logger.info('Now page not found, returning empty now page');
                    return {
                        success: true,
                        result: {
                            response: { now: { content: '', updated: '', listed: '0' } }
                        }
                    };
                }

                if (!response.ok) {
                    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
                }

                return response.json() as Promise<GetNowPageResponse>;
            });

            if (!result.success || !result.result) {
                throw result.error || new Error('Failed to fetch now page');
            }

            const nowPage = (result.result as any).response.now;

            // Cache the result with 5 minute TTL
            if (nowPage) {
                await this.cacheManager.set('now', nowPage, { ttl: 300 });
            }

            return nowPage;

        } catch (error) {
            await this.errorHandler.handleError(error as Error, {
                operation: 'getNowPage',
                address,
                forceRefresh
            });

            // Try to return cached data as last resort
            const fallback = await this.cacheManager.getOfflineData<NowPageData>('now');
            return fallback;
        }
    }

    async updateNowPage(content: string, listed: boolean = true, address?: string): Promise<void> {
        try {
            const targetAddress = address || await this.authManager.getAddress();
            if (!targetAddress) {
                throw this.errorHandler.createError(
                    ErrorType.AUTHENTICATION,
                    ErrorSeverity.HIGH,
                    'No address found',
                    'Please authenticate first'
                );
            }

            this.logger.info('Updating now page', { address: targetAddress, contentLength: content.length, listed });

            const result = await this.retryManager.retryApiCall(async () => {
                const requestBody: any = { content, listed: listed ? '1' : '0' };

                const response = await fetch(`${API_URL}/address/${targetAddress}/now`, {
                    method: 'POST',
                    headers: await this.getHeaders(),
                    body: JSON.stringify(requestBody)
                });

                if (!response.ok) {
                    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
                }

                return response.json() as Promise<UpdateNowPageResponse>;
            });

            if (!result.success) {
                throw result.error || new Error('Failed to update now page');
            }

            // Invalidate cache
            await this.cacheManager.invalidate('now');

        } catch (error) {
            await this.errorHandler.handleError(error as Error, {
                operation: 'updateNowPage',
                address,
                contentLength: content.length,
                listed
            });
            throw error;
        }
    }

    async uploadProfilePicture(filePath: string, address?: string): Promise<string> {
        try {
            const targetAddress = address || await this.authManager.getAddress();
            if (!targetAddress) {
                throw this.errorHandler.createError(
                    ErrorType.AUTHENTICATION,
                    ErrorSeverity.HIGH,
                    'No address found',
                    'Please authenticate first'
                );
            }

            this.logger.info('Uploading profile picture', {
                address: targetAddress,
                filePath
            });

            // Read file and validate
            const fs = require('fs').promises;
            const path = require('path');

            const fileStats = await fs.stat(filePath);

            // Validate file size (max 5MB)
            const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
            if (fileStats.size > MAX_FILE_SIZE) {
                throw this.errorHandler.createError(
                    ErrorType.USER_INPUT,
                    ErrorSeverity.MEDIUM,
                    'File too large',
                    'Profile picture must be under 5MB. Please choose a smaller file.',
                    {
                        suggestedActions: ['Compress the image', 'Choose a different file']
                    }
                );
            }

            // Validate file type
            const validExtensions = ['.png', '.jpg', '.jpeg', '.gif', '.webp', '.svg'];
            const fileExtension = path.extname(filePath).toLowerCase();
            if (!validExtensions.includes(fileExtension)) {
                throw this.errorHandler.createError(
                    ErrorType.USER_INPUT,
                    ErrorSeverity.MEDIUM,
                    'Invalid file type',
                    'Profile picture must be PNG, JPG, GIF, WebP, or SVG.',
                    {
                        suggestedActions: ['Convert image to valid format', 'Choose a different file']
                    }
                );
            }

            // Read file content
            const fileBuffer = await fs.readFile(filePath);
            const fileName = path.basename(filePath);
            const contentType = this.getContentType(fileExtension);

            // Create multipart/form-data body
            const boundary = `----ProfilePictureBoundary${Date.now()}`;
            const formData = this.createMultipartFormData(boundary, fileName, contentType, fileBuffer);

            const result = await this.retryManager.retryApiCall(async () => {
                const response = await fetch(`${API_URL}/address/${targetAddress}/pfp`, {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${await this.authManager.getAccessToken()}`,
                        'Content-Type': `multipart/form-data; boundary=${boundary}`
                    },
                    body: formData
                });

                if (!response.ok) {
                    const errorText = await response.text();
                    throw new Error(`HTTP ${response.status}: ${response.statusText} - ${errorText}`);
                }

                return response.json() as Promise<UploadProfilePictureResponse>;
            });

            if (!result.request.success) {
                throw new Error(result.response.message || 'Failed to upload profile picture');
            }

            const message = result.response.message;
            this.logger.info('Profile picture uploaded successfully', { message });

            // Invalidate profile cache to force refresh
            await this.cacheManager.invalidate('profile');

            return message;

        } catch (error) {
            await this.errorHandler.handleError(error as Error, {
                operation: 'uploadProfilePicture',
                address,
                filePath
            });
            throw error;
        }
    }

    private getContentType(extension: string): string {
        const contentTypes: Record<string, string> = {
            '.png': 'image/png',
            '.jpg': 'image/jpeg',
            '.jpeg': 'image/jpeg',
            '.gif': 'image/gif',
            '.webp': 'image/webp',
            '.svg': 'image/svg+xml'
        };
        return contentTypes[extension] || 'application/octet-stream';
    }

    private createMultipartFormData(boundary: string, fileName: string, contentType: string, fileBuffer: Buffer): string {
        const header = [
            `--${boundary}`,
            `Content-Disposition: form-data; name="file"; filename="${fileName}"`,
            `Content-Type: ${contentType}`,
            '',
            ''
        ].join('\r\n');

        const footer = `\r\n--${boundary}--\r\n`;

        // For binary data, we need to use Buffer.concat
        const headerBuffer = Buffer.from(header, 'utf8');
        const footerBuffer = Buffer.from(footer, 'utf8');

        return Buffer.concat([headerBuffer, fileBuffer, footerBuffer]).toString('binary');
    }

    // ============ WEBLOG METHODS ============

    /**
     * Retrieve all weblog entries
     */
    async getWeblogEntries(address?: string): Promise<WeblogEntry[]> {
        try {
            const targetAddress = address || await this.authManager.getAddress();
            if (!targetAddress) {
                throw this.errorHandler.createError(
                    ErrorType.AUTHENTICATION,
                    ErrorSeverity.HIGH,
                    'No address found',
                    'Please authenticate first'
                );
            }

            this.logger.info('Retrieving weblog entries', { address: targetAddress });

            const result = await this.retryManager.retryApiCall(async () => {
                const response = await fetch(`${API_URL}/address/${targetAddress}/weblog/entries`, {
                    method: 'GET',
                    headers: {
                        'Authorization': `Bearer ${await this.authManager.getAccessToken()}`
                    }
                });

                if (!response.ok) {
                    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
                }

                return response.json() as Promise<GetWeblogEntriesResponse>;
            });

            if (!result.request.success || !result.response.entries) {
                return [];
            }

            this.logger.info('Weblog entries retrieved successfully', {
                count: result.response.entries.length
            });

            return result.response.entries;

        } catch (error) {
            await this.errorHandler.handleError(error as Error, {
                operation: 'getWeblogEntries',
                address
            });
            throw error;
        }
    }

    /**
     * Retrieve a single weblog entry
     */
    async getWeblogEntry(entryId: string, address?: string): Promise<WeblogEntry> {
        try {
            const targetAddress = address || await this.authManager.getAddress();
            if (!targetAddress) {
                throw this.errorHandler.createError(
                    ErrorType.AUTHENTICATION,
                    ErrorSeverity.HIGH,
                    'No address found',
                    'Please authenticate first'
                );
            }

            this.logger.info('Retrieving weblog entry', { address: targetAddress, entryId });

            const result = await this.retryManager.retryApiCall(async () => {
                const response = await fetch(`${API_URL}/address/${targetAddress}/weblog/entry/${entryId}`, {
                    method: 'GET',
                    headers: {
                        'Authorization': `Bearer ${await this.authManager.getAccessToken()}`
                    }
                });

                if (!response.ok) {
                    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
                }

                return response.json() as Promise<GetWeblogEntryResponse>;
            });

            if (!result.request.success || !result.response.entry) {
                throw new Error('Failed to retrieve weblog entry');
            }

            this.logger.info('Weblog entry retrieved successfully', { entryId });

            return result.response.entry;

        } catch (error) {
            await this.errorHandler.handleError(error as Error, {
                operation: 'getWeblogEntry',
                address,
                entryId
            });
            throw error;
        }
    }

    /**
     * Retrieve the latest weblog post (no auth required)
     */
    async getLatestWeblogPost(address: string): Promise<WeblogEntry | null> {
        try {
            this.logger.info('Retrieving latest weblog post', { address });

            const result = await this.retryManager.retryApiCall(async () => {
                const response = await fetch(`${API_URL}/address/${address}/weblog/post/latest`, {
                    method: 'GET'
                    // No auth required
                });

                if (!response.ok) {
                    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
                }

                return response.json() as Promise<GetWeblogEntryResponse>;
            });

            if (!result.request.success || !result.response.entry) {
                return null;
            }

            this.logger.info('Latest weblog post retrieved successfully');

            return result.response.entry;

        } catch (error) {
            await this.errorHandler.handleError(error as Error, {
                operation: 'getLatestWeblogPost',
                address
            });
            throw error;
        }
    }

    /**
     * Create a new weblog entry
     */
    async createWeblogEntry(entryId: string, content: string, address?: string): Promise<WeblogEntry> {
        try {
            const targetAddress = address || await this.authManager.getAddress();
            if (!targetAddress) {
                throw this.errorHandler.createError(
                    ErrorType.AUTHENTICATION,
                    ErrorSeverity.HIGH,
                    'No address found',
                    'Please authenticate first'
                );
            }

            this.logger.info('Creating weblog entry', { address: targetAddress, entryId });

            const result = await this.retryManager.retryApiCall(async () => {
                const response = await fetch(`${API_URL}/address/${targetAddress}/weblog/entry/${entryId}`, {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${await this.authManager.getAccessToken()}`,
                        'Content-Type': 'text/plain'
                    },
                    body: content
                });

                if (!response.ok) {
                    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
                }

                return response.json() as Promise<CreateWeblogEntryResponse>;
            });

            if (!result.request.success || !result.response.entry) {
                throw new Error(result.response.message || 'Failed to create weblog entry');
            }

            this.logger.info('Weblog entry created successfully', { entryId });

            // Invalidate weblog cache
            await this.cacheManager.invalidate('weblog');

            return result.response.entry;

        } catch (error) {
            await this.errorHandler.handleError(error as Error, {
                operation: 'createWeblogEntry',
                address,
                entryId,
                contentLength: content.length
            });
            throw error;
        }
    }

    /**
     * Delete a weblog entry
     */
    async deleteWeblogEntry(entryId: string, address?: string): Promise<void> {
        try {
            const targetAddress = address || await this.authManager.getAddress();
            if (!targetAddress) {
                throw this.errorHandler.createError(
                    ErrorType.AUTHENTICATION,
                    ErrorSeverity.HIGH,
                    'No address found',
                    'Please authenticate first'
                );
            }

            this.logger.info('Deleting weblog entry', { address: targetAddress, entryId });

            const result = await this.retryManager.retryApiCall(async () => {
                const response = await fetch(`${API_URL}/address/${targetAddress}/weblog/delete/${entryId}`, {
                    method: 'DELETE',
                    headers: {
                        'Authorization': `Bearer ${await this.authManager.getAccessToken()}`
                    }
                });

                if (!response.ok) {
                    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
                }

                return response.json() as Promise<DeleteWeblogEntryResponse>;
            });

            if (!result.request.success) {
                throw new Error(result.response.message || 'Failed to delete weblog entry');
            }

            this.logger.info('Weblog entry deleted successfully', { entryId });

            // Invalidate weblog cache
            await this.cacheManager.invalidate('weblog');

        } catch (error) {
            await this.errorHandler.handleError(error as Error, {
                operation: 'deleteWeblogEntry',
                address,
                entryId
            });
            throw error;
        }
    }

    /**
     * Retrieve weblog configuration
     */
    async getWeblogConfiguration(address?: string): Promise<WeblogConfiguration> {
        try {
            const targetAddress = address || await this.authManager.getAddress();
            if (!targetAddress) {
                throw this.errorHandler.createError(
                    ErrorType.AUTHENTICATION,
                    ErrorSeverity.HIGH,
                    'No address found',
                    'Please authenticate first'
                );
            }

            this.logger.info('Retrieving weblog configuration', { address: targetAddress });

            const result = await this.retryManager.retryApiCall(async () => {
                const response = await fetch(`${API_URL}/address/${targetAddress}/weblog/configuration`, {
                    method: 'GET',
                    headers: {
                        'Authorization': `Bearer ${await this.authManager.getAccessToken()}`
                    }
                });

                if (!response.ok) {
                    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
                }

                return response.json() as Promise<GetWeblogConfigurationResponse>;
            });

            if (!result.request.success || !result.response.configuration) {
                throw new Error('Failed to retrieve weblog configuration');
            }

            this.logger.info('Weblog configuration retrieved successfully');

            return result.response.configuration;

        } catch (error) {
            await this.errorHandler.handleError(error as Error, {
                operation: 'getWeblogConfiguration',
                address
            });
            throw error;
        }
    }

    /**
     * Update weblog configuration
     */
    async updateWeblogConfiguration(configuration: string, address?: string): Promise<void> {
        try {
            const targetAddress = address || await this.authManager.getAddress();
            if (!targetAddress) {
                throw this.errorHandler.createError(
                    ErrorType.AUTHENTICATION,
                    ErrorSeverity.HIGH,
                    'No address found',
                    'Please authenticate first'
                );
            }

            this.logger.info('Updating weblog configuration', { address: targetAddress });

            const result = await this.retryManager.retryApiCall(async () => {
                const response = await fetch(`${API_URL}/address/${targetAddress}/weblog/configuration`, {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${await this.authManager.getAccessToken()}`,
                        'Content-Type': 'text/plain'
                    },
                    body: configuration
                });

                if (!response.ok) {
                    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
                }

                return response.json() as Promise<UpdateWeblogConfigurationResponse>;
            });

            if (!result.request.success) {
                throw new Error(result.response.message || 'Failed to update weblog configuration');
            }

            this.logger.info('Weblog configuration updated successfully');

            // Invalidate weblog cache
            await this.cacheManager.invalidate('weblog');

        } catch (error) {
            await this.errorHandler.handleError(error as Error, {
                operation: 'updateWeblogConfiguration',
                address,
                configurationLength: configuration.length
            });
            throw error;
        }
    }

    /**
     * Retrieve weblog template
     */
    async getWeblogTemplate(address?: string): Promise<string> {
        try {
            const targetAddress = address || await this.authManager.getAddress();
            if (!targetAddress) {
                throw this.errorHandler.createError(
                    ErrorType.AUTHENTICATION,
                    ErrorSeverity.HIGH,
                    'No address found',
                    'Please authenticate first'
                );
            }

            this.logger.info('Retrieving weblog template', { address: targetAddress });

            const result = await this.retryManager.retryApiCall(async () => {
                const response = await fetch(`${API_URL}/address/${targetAddress}/weblog/template`, {
                    method: 'GET',
                    headers: {
                        'Authorization': `Bearer ${await this.authManager.getAccessToken()}`
                    }
                });

                if (!response.ok) {
                    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
                }

                return response.json() as Promise<GetWeblogTemplateResponse>;
            });

            if (!result.request.success || !result.response.template) {
                throw new Error('Failed to retrieve weblog template');
            }

            this.logger.info('Weblog template retrieved successfully');

            return result.response.template;

        } catch (error) {
            await this.errorHandler.handleError(error as Error, {
                operation: 'getWeblogTemplate',
                address
            });
            throw error;
        }
    }

    /**
     * Update weblog template
     */
    async updateWeblogTemplate(template: string, address?: string): Promise<void> {
        try {
            const targetAddress = address || await this.authManager.getAddress();
            if (!targetAddress) {
                throw this.errorHandler.createError(
                    ErrorType.AUTHENTICATION,
                    ErrorSeverity.HIGH,
                    'No address found',
                    'Please authenticate first'
                );
            }

            this.logger.info('Updating weblog template', { address: targetAddress });

            const result = await this.retryManager.retryApiCall(async () => {
                const response = await fetch(`${API_URL}/address/${targetAddress}/weblog/template`, {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${await this.authManager.getAccessToken()}`,
                        'Content-Type': 'text/html'
                    },
                    body: template
                });

                if (!response.ok) {
                    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
                }

                return response.json() as Promise<UpdateWeblogTemplateResponse>;
            });

            if (!result.request.success) {
                throw new Error(result.response.message || 'Failed to update weblog template');
            }

            this.logger.info('Weblog template updated successfully');

            // Invalidate weblog cache
            await this.cacheManager.invalidate('weblog');

        } catch (error) {
            await this.errorHandler.handleError(error as Error, {
                operation: 'updateWeblogTemplate',
                address,
                templateLength: template.length
            });
            throw error;
        }
    }
}
