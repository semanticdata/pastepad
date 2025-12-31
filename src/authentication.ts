import * as vscode from 'vscode';
import { URLSearchParams } from 'url';
import { StateManager, ErrorHandler, RetryManager, ErrorType, ErrorSeverity } from './services';

// IMPORTANT: Replace with your actual client ID and secret
const OAUTH_CLIENT_ID = 'YOUR_CLIENT_ID';
const OAUTH_CLIENT_SECRET = 'YOUR_CLIENT_SECRET';

const OAUTH_AUTHORIZATION_URL = 'https://api.omg.lol/oauth/authorize';
const OAUTH_TOKEN_URL = 'https://api.omg.lol/oauth/token';
const REDIRECT_URI = 'vscode://semanticdata.pastepad/authenticate';

const AUTH_METHOD_KEY = 'omglol.authMethod';
const API_KEY = 'omglol.apiKey';
const ACCESS_TOKEN_KEY = 'omglol.accessToken';
const REFRESH_TOKEN_KEY = 'omglol.refreshToken';
const ADDRESS_KEY = 'omglol.address';

interface TokenResponse {
    response: {
        access_token: string;
        refresh_token: string;
        address: string;
    };
}

export class AuthenticationManager {
    private onAuthenticationChangedEmitter = new vscode.EventEmitter<void>();
    private stateManager: StateManager;
    private errorHandler: ErrorHandler;
    private retryManager: RetryManager;

    constructor(private context: vscode.ExtensionContext) {
        this.stateManager = StateManager.getInstance();
        this.errorHandler = ErrorHandler.getInstance();
        this.retryManager = RetryManager.getInstance();
    }

    get onAuthenticationChanged(): vscode.Event<void> {
        return this.onAuthenticationChangedEmitter.event;
    }

    async authenticate(): Promise<void> {
        const selection = await vscode.window.showQuickPick([
            { label: 'Sign in with OAuth', description: 'Recommended, most secure' },
            { label: 'Sign in with API Key', description: 'Less secure' }
        ]);

        if (!selection) {
            return;
        }

        if (selection.label === 'Sign in with OAuth') {
            await this.authenticateWithOAuth();
        } else {
            await this.authenticateWithApiKey();
        }
    }

    private async authenticateWithOAuth(): Promise<void> {
        try {
            const state = Date.now().toString();
            await this.stateManager.setOAuthState(state);

            const searchParams = new URLSearchParams({
                client_id: OAUTH_CLIENT_ID,
                redirect_uri: REDIRECT_URI,
                response_type: 'code',
                state: state,
            });

            const uri = vscode.Uri.parse(`${OAUTH_AUTHORIZATION_URL}?${searchParams.toString()}`);
            await vscode.env.openExternal(uri);
        } catch (error) {
            await this.errorHandler.handleError(error as Error, {
                operation: 'authenticateWithOAuth'
            });
        }
    }

    private async authenticateWithApiKey(): Promise<void> {
        try {
            const address = await vscode.window.showInputBox({
                prompt: 'Enter your omg.lol address',
                validateInput: (value) => {
                    if (!value || value.trim().length === 0) {
                        return 'Address is required';
                    }
                    if (value.includes('@') || value.includes('.')) {
                        return "Enter only the address part (e.g., 'yourname')";
                    }
                    return null;
                }
            });
            if (!address) {
                return;
            }

            const apiKey = await vscode.window.showInputBox({
                prompt: 'Enter your omg.lol API Key',
                password: true
            });
            if (!apiKey) {
                return;
            }

            // Validate credentials with retry logic
            const validationResult = await this.retryManager.retryNetworkRequest(async () => {
                const response = await fetch(`https://api.omg.lol/address/${address}/info`, {
                    headers: { 'Authorization': `Bearer ${apiKey}` }
                });

                if (!response.ok) {
                    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
                }

                return response.json();
            }, {
                maxAttempts: 2,
                baseDelay: 1000
            });

            if (!validationResult.success) {
                await this.errorHandler.handleError(
                    this.errorHandler.createError(
                        ErrorType.AUTHENTICATION,
                        ErrorSeverity.MEDIUM,
                        'API key validation failed',
                        'Invalid address or API Key. Please check your credentials.',
                        {
                            suggestedActions: ['Verify your address', 'Check your API key', 'Try again'],
                            context: { address, operation: 'validateApiKey' }
                        }
                    )
                );
                return;
            }

            await this.context.secrets.store(AUTH_METHOD_KEY, 'apikey');
            await this.context.secrets.store(ADDRESS_KEY, address);
            await this.context.secrets.store(API_KEY, apiKey);

            this.onAuthenticationChangedEmitter.fire();
            vscode.window.showInformationMessage('Successfully authenticated with API Key!');

        } catch (error) {
            await this.errorHandler.handleError(error as Error, {
                operation: 'authenticateWithApiKey'
            });
        }
    }

    async handleAuthorizationCode(code: string, state: string): Promise<void> {
        try {
            const savedState = await this.stateManager.getOAuthState();
            if (state !== savedState) {
                await this.errorHandler.handleError(
                    this.errorHandler.createError(
                        ErrorType.AUTHENTICATION,
                        ErrorSeverity.HIGH,
                        'OAuth state mismatch',
                        'Invalid OAuth state. Please try authenticating again.',
                        {
                            suggestedActions: ['Try authenticating again'],
                            recoveryAction: async () => {
                                await this.stateManager.clearOAuthState();
                            }
                        }
                    )
                );
                return;
            }

            // Exchange authorization code for tokens with retry logic
            const tokenResult = await this.retryManager.retryApiCall(async () => {
                const response = await fetch(OAUTH_TOKEN_URL, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        grant_type: 'authorization_code',
                        client_id: OAUTH_CLIENT_ID,
                        client_secret: OAUTH_CLIENT_SECRET,
                        code: code,
                        redirect_uri: REDIRECT_URI,
                    }),
                });

                if (!response.ok) {
                    const errorText = await response.text();
                    throw new Error(`HTTP ${response.status}: ${errorText}`);
                }

                return response.json() as Promise<TokenResponse>;
            });

            if (!tokenResult.success) {
                await this.errorHandler.handleError(
                    tokenResult.error || new Error('Failed to exchange authorization code'),
                    { operation: 'exchangeAuthorizationCode', code }
                );
                return;
            }

            const { access_token, refresh_token, address } = tokenResult.result!.response;

            await Promise.all([
                this.context.secrets.store(AUTH_METHOD_KEY, 'oauth'),
                this.context.secrets.store(ACCESS_TOKEN_KEY, access_token),
                this.context.secrets.store(REFRESH_TOKEN_KEY, refresh_token),
                this.context.secrets.store(ADDRESS_KEY, address),
                this.stateManager.clearOAuthState()
            ]);

            this.onAuthenticationChangedEmitter.fire();
            vscode.window.showInformationMessage('Successfully authenticated with omg.lol!');

        } catch (error) {
            await this.errorHandler.handleError(error as Error, {
                operation: 'handleAuthorizationCode'
            });
        }
    }

    async isAuthenticated(): Promise<boolean> {
        const authMethod = await this.context.secrets.get(AUTH_METHOD_KEY);
        if (authMethod === 'oauth') {
            return !!(await this.context.secrets.get(ACCESS_TOKEN_KEY));
        } else if (authMethod === 'apikey') {
            return !!(await this.context.secrets.get(API_KEY));
        }
        return false;
    }

    async getAccessToken(): Promise<string | undefined> {
        const authMethod = await this.context.secrets.get(AUTH_METHOD_KEY);
        if (authMethod === 'oauth') {
            return await this.context.secrets.get(ACCESS_TOKEN_KEY);
        } else if (authMethod === 'apikey') {
            return await this.context.secrets.get(API_KEY);
        }
        return undefined;
    }

    async getAddress(): Promise<string | undefined> {
        return await this.context.secrets.get(ADDRESS_KEY);
    }

    async logout(): Promise<void> {
        await this.context.secrets.delete(AUTH_METHOD_KEY);
        await this.context.secrets.delete(API_KEY);
        await this.context.secrets.delete(ACCESS_TOKEN_KEY);
        await this.context.secrets.delete(REFRESH_TOKEN_KEY);
        await this.context.secrets.delete(ADDRESS_KEY);
        this.onAuthenticationChangedEmitter.fire();
        vscode.window.showInformationMessage('Logged out successfully');
    }
}
