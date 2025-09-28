import * as vscode from 'vscode';

export class AuthenticationManager {
	private readonly STORAGE_KEY = 'omglol.apiKey';
	private readonly ADDRESS_KEY = 'omglol.address';
	private apiKey: string | undefined;
	private address: string | undefined;
	private onAuthenticationChangedEmitter = new vscode.EventEmitter<void>();

	constructor(private context: vscode.ExtensionContext) {
		this.loadCredentials();
	}

	get onAuthenticationChanged(): vscode.Event<void> {
		return this.onAuthenticationChangedEmitter.event;
	}

	private async loadCredentials(): Promise<void> {
		this.apiKey = await this.context.secrets.get(this.STORAGE_KEY);
		this.address = await this.context.secrets.get(this.ADDRESS_KEY);
	}

	async authenticate(): Promise<void> {
		try {
			// Get omg.lol address
			const address = await vscode.window.showInputBox({
				prompt: 'Enter your omg.lol address (without @omg.lol)',
				placeHolder: 'e.g., yourname',
				validateInput: (value) => {
					if (!value || value.trim().length === 0) {
						return 'Address is required';
					}
					if (value.includes('@') || value.includes('.')) {
						return 'Enter only the address part (without @omg.lol)';
					}
					return null;
				}
			});

			if (!address) {
				return;
			}

			// Get API key
			const apiKey = await vscode.window.showInputBox({
				prompt: 'Enter your omg.lol API key',
				placeHolder: 'Your API key from omg.lol settings',
				password: true,
				validateInput: (value) => {
					if (!value || value.trim().length === 0) {
						return 'API key is required';
					}
					return null;
				}
			});

			if (!apiKey) {
				return;
			}

			// Test the credentials
			const isValid = await this.testCredentials(address.trim(), apiKey.trim());

			if (!isValid) {
				vscode.window.showErrorMessage('Invalid credentials. Please check your address and API key.');
				return;
			}

			// Store credentials securely
			await this.context.secrets.store(this.STORAGE_KEY, apiKey.trim());
			await this.context.secrets.store(this.ADDRESS_KEY, address.trim());

			this.apiKey = apiKey.trim();
			this.address = address.trim();

			vscode.window.showInformationMessage('Successfully authenticated with omg.lol!');
			this.onAuthenticationChangedEmitter.fire();

		} catch (error) {
			vscode.window.showErrorMessage(`Authentication failed: ${error}`);
		}
	}

	private async testCredentials(address: string, apiKey: string): Promise<boolean> {
		try {
			const response = await fetch(`https://api.omg.lol/address/${address}/pastebin`, {
				headers: {
					'Authorization': `Bearer ${apiKey}`,
					'Content-Type': 'application/json'
				}
			});

			return response.ok;
		} catch (error) {
			console.error('Error testing credentials:', error);
			return false;
		}
	}

	isAuthenticated(): boolean {
		return !!(this.apiKey && this.address);
	}

	getApiKey(): string | undefined {
		return this.apiKey;
	}

	getAddress(): string | undefined {
		return this.address;
	}

	async logout(): Promise<void> {
		await this.context.secrets.delete(this.STORAGE_KEY);
		await this.context.secrets.delete(this.ADDRESS_KEY);
		this.apiKey = undefined;
		this.address = undefined;
		this.onAuthenticationChangedEmitter.fire();
		vscode.window.showInformationMessage('Logged out successfully');
	}

	async fetchPasteContent(pasteTitle: string): Promise<string | null> {
		if (!this.isAuthenticated()) {
			return null;
		}

		try {
			const response = await fetch(`https://api.omg.lol/address/${this.address}/pastebin/${pasteTitle}`, {
				headers: {
					'Authorization': `Bearer ${this.apiKey}`,
					'Content-Type': 'application/json'
				}
			});

			if (!response.ok) {
				throw new Error(`HTTP ${response.status}: ${response.statusText}`);
			}

			const data = await response.json() as {
				request: { success: boolean };
				response: { paste?: { content: string } };
			};

			if (data.request.success && data.response.paste) {
				return data.response.paste.content;
			}

			return null;
		} catch (error) {
			console.error('Error fetching paste content:', error);
			vscode.window.showErrorMessage(`Failed to fetch paste: ${error}`);
			return null;
		}
	}
}