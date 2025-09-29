import * as vscode from 'vscode';
import { URLSearchParams } from 'url';

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

type AuthMethod = 'oauth' | 'apikey';

interface TokenResponse {
    response: {
        access_token: string;
        refresh_token: string;
        address: string;
    };
}

export class AuthenticationManager {
    private onAuthenticationChangedEmitter = new vscode.EventEmitter<void>();

    constructor(private context: vscode.ExtensionContext) {}

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
        const state = Date.now().toString();
        this.context.globalState.update('oauthState', state);

        const searchParams = new URLSearchParams({
            client_id: OAUTH_CLIENT_ID,
            redirect_uri: REDIRECT_URI,
            response_type: 'code',
            state: state,
        });

        const uri = vscode.Uri.parse(`${OAUTH_AUTHORIZATION_URL}?${searchParams.toString()}`);
        vscode.env.openExternal(uri);
    }

    private async authenticateWithApiKey(): Promise<void> {
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

        const apiKey = await vscode.window.showInputBox({ prompt: 'Enter your omg.lol API Key', password: true });
        if (!apiKey) {
            return;
        }

        // A simple test to see if the credentials are valid
        try {
            const response = await fetch(`https://api.omg.lol/address/${address}/info`, {
                headers: { 'Authorization': `Bearer ${apiKey}` }
            });
            if (!response.ok) {
                vscode.window.showErrorMessage('Invalid address or API Key.');
                return;
            }
        } catch (e) {
            vscode.window.showErrorMessage('Failed to validate API Key.');
            return;
        }

        await this.context.secrets.store(AUTH_METHOD_KEY, 'apikey');
        await this.context.secrets.store(ADDRESS_KEY, address);
        await this.context.secrets.store(API_KEY, apiKey);
        this.onAuthenticationChangedEmitter.fire();
        vscode.window.showInformationMessage('Successfully authenticated with API Key!');
    }

    async handleAuthorizationCode(code: string, state: string): Promise<void> {
        const savedState = this.context.globalState.get<string>('oauthState');
        if (state !== savedState) {
            vscode.window.showErrorMessage('Invalid OAuth state. Please try again.');
            return;
        }

        try {
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
                throw new Error(`Failed to get access token: ${await response.text()}`);
            }

            const data = await response.json() as TokenResponse;
            const { access_token, refresh_token, address } = data.response;

            await this.context.secrets.store(AUTH_METHOD_KEY, 'oauth');
            await this.context.secrets.store(ACCESS_TOKEN_KEY, access_token);
            await this.context.secrets.store(REFRESH_TOKEN_KEY, refresh_token);
            await this.context.secrets.store(ADDRESS_KEY, address);

            this.onAuthenticationChangedEmitter.fire();
            vscode.window.showInformationMessage('Successfully authenticated with omg.lol!');
        } catch (error) {
            vscode.window.showErrorMessage(`Authentication failed: ${error}`);
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
