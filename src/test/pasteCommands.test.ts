import assert from 'assert';
import * as vscode from 'vscode';
import { registerPasteCommands } from '../commands/pasteCommands';
import { AuthenticationManager } from '../authentication';
import { OmgLolApi } from '../api';
import { PastebinProvider } from '../pastebinProvider';
import { initializeServices } from '../services';

suite('Paste Commands Tests', () => {
    let authManager: AuthenticationManager;
    let pastebinProvider: PastebinProvider;
    let mockContext: any;
    let commands: vscode.Disposable[];
    let externalUris: vscode.Uri[] = [];

    suiteSetup(async () => {
        // Reset mock state
        externalUris = [];

        // Create mock secrets storage that actually stores values
        const secretsData: Record<string, string> = {};
        const mockSecrets = {
            _data: secretsData,
            get: async (key: string) => secretsData[key] || null,
            store: async (key: string, value: string) => { secretsData[key] = value; },
            delete: async (key: string) => { delete secretsData[key]; }
        };

        const mockWorkspaceState = {
            _data: {} as Record<string, any>,
            get: function(this: any, key: string, defaultValue?: any) {
                return this._data[key] !== undefined ? this._data[key] : defaultValue;
            },
            update: function(this: any, key: string, value: any) {
                this._data[key] = value;
                return Promise.resolve();
            }
        };

        mockContext = {
            secrets: mockSecrets,
            workspaceState: mockWorkspaceState,
            globalState: mockWorkspaceState,
            subscriptions: []
        };

        // Initialize services
        initializeServices(mockContext as any);

        // Create instances
        authManager = new AuthenticationManager(mockContext);
        const api = new OmgLolApi(authManager);
        pastebinProvider = new PastebinProvider(api, authManager);

        // Mock vscode.env.openExternal to capture URIs
        (vscode.env.openExternal as any) = async (uri: vscode.Uri) => {
            externalUris.push(uri);
            return true;
        };

        // Register commands
        commands = registerPasteCommands(mockContext, authManager, pastebinProvider);
    });

    suiteTeardown(() => {
        // Dispose commands
        commands.forEach(c => c.dispose());
    });

    setup(() => {
        // Reset external URIs and clear secrets before each test
        externalUris = [];
        if (mockContext && mockContext.secrets && mockContext.secrets._data) {
            Object.keys(mockContext.secrets._data).forEach(key => {
                delete mockContext.secrets._data[key];
            });
        }
    });

    suite('openPasteInBrowser', () => {
        test('should open paste in browser with correct URL', async () => {
            // Setup authentication
            await mockContext.secrets.store('omglol.authMethod', 'apikey');
            await mockContext.secrets.store('omglol.address', 'testuser');
            await mockContext.secrets.store('omglol.apiKey', 'test-key');

            const mockItem = {
                pasteData: { title: 'test-paste' },
                title: 'test-paste'
            };

            // Execute command
            await vscode.commands.executeCommand('pastepad.openPasteInBrowser', mockItem);

            // Verify URL was opened
            assert.strictEqual(externalUris.length, 1, 'Should open one URI');
            assert.strictEqual(externalUris[0].toString(), 'https://testuser.paste.lol/test-paste');
        });

        test('should handle item with direct title property', async () => {
            await mockContext.secrets.store('omglol.authMethod', 'apikey');
            await mockContext.secrets.store('omglol.address', 'testuser');
            await mockContext.secrets.store('omglol.apiKey', 'test-key');

            const mockItem = { title: 'direct-title' };

            await vscode.commands.executeCommand('pastepad.openPasteInBrowser', mockItem);

            assert.strictEqual(externalUris.length, 1);
            assert.strictEqual(externalUris[0].toString(), 'https://testuser.paste.lol/direct-title');
        });

        test('should handle paste titles with special characters', async () => {
            await mockContext.secrets.store('omglol.authMethod', 'apikey');
            await mockContext.secrets.store('omglol.address', 'testuser');
            await mockContext.secrets.store('omglol.apiKey', 'test-key');

            const mockItem = {
                pasteData: { title: 'my-test-file-2024' },
                title: 'my-test-file-2024'
            };

            await vscode.commands.executeCommand('pastepad.openPasteInBrowser', mockItem);

            assert.strictEqual(externalUris.length, 1);
            assert.strictEqual(externalUris[0].toString(), 'https://testuser.paste.lol/my-test-file-2024');
        });
    });
});
