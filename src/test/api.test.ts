import * as assert from 'assert';
import * as vscode from 'vscode';
import { OmgLolApi } from '../api';
import { AuthenticationManager } from '../authentication';
import { initializeServices } from '../services';

// Simple mock implementation for testing
interface MockResponse {
    ok: boolean;
    status?: number;
    json: () => Promise<any>;
}

interface FetchCall {
    url: string;
    options?: any;
}

let mockFetchResponses: MockResponse[] = [];
let fetchCalls: FetchCall[] = [];
let responseIndex = 0;

// Mock fetch globally
(global as any).fetch = async (url: string, options?: any): Promise<MockResponse> => {
    fetchCalls.push({ url, options });
    const response = mockFetchResponses[responseIndex++] || { ok: true, json: async () => ({ request: { success: true } }) };
    return response;
};

suite('API Visibility Preservation Tests', () => {
    let api: OmgLolApi;
    let authManager: AuthenticationManager;
    let mockContext: any;

    setup(async () => {
        // Reset mock state
        mockFetchResponses = [];
        fetchCalls = [];
        responseIndex = 0;

        // Create a simplified mock extension context with synchronous get
        const mockWorkspaceState = {
            _data: {} as Record<string, any>,
            get: function(this: any, key: string, defaultValue?: any) {
                return this._data[key] !== undefined ? this._data[key] : defaultValue;
            },
            update: function(this: any, key: string, value: any) {
                this._data[key] = value;
                return Promise.resolve();
            },
            keys: function(this: any) {
                return Object.keys(this._data);
            }
        };

        mockWorkspaceState._data = {
            userPreferences: { defaultListNewPastes: false }
        };

        mockContext = {
            subscriptions: [],
            workspaceState: mockWorkspaceState,
            globalState: {
                _data: {} as Record<string, any>,
                get: function(this: any, key: string, defaultValue?: any) {
                    return this._data[key] !== undefined ? this._data[key] : defaultValue;
                },
                update: function(this: any, key: string, value: any) {
                    this._data[key] = value;
                    return Promise.resolve();
                },
                setKeysForSync: () => {},
                keys: function(this: any) {
                    return Object.keys(this._data);
                }
            },
            secrets: {
                get: () => Promise.resolve(undefined),
                store: () => Promise.resolve(),
                delete: () => Promise.resolve(),
                onDidChange: new vscode.EventEmitter().event
            },
            extensionUri: vscode.Uri.file('/test'),
            extensionPath: '/test',
            asAbsolutePath: (path: string) => `/test/${path}`,
            storageUri: vscode.Uri.file('/test/storage'),
            globalStorageUri: vscode.Uri.file('/test/global'),
            logUri: vscode.Uri.file('/test/log')
        };

        // Initialize services with the mock context
        initializeServices(mockContext);

        authManager = new AuthenticationManager(mockContext);
        api = new OmgLolApi(authManager);

        // Mock the authentication methods to return test values
        authManager.getAddress = async () => 'testuser';
        authManager.getAccessToken = async () => 'test-token';
    });

    test('updatePaste should preserve unlisted visibility', async () => {
        // Mock fetch calls:
        // 1. getPaste - fetch the individual paste
        // 2. getPaste - fetch listed pastes to check visibility
        // 3. updatePaste - the actual update call
        mockFetchResponses = [
            {
                ok: true,
                json: async () => ({
                    request: { success: true },
                    response: {
                        paste: {
                            title: 'unlisted-test-paste',
                            content: 'original content'
                        }
                    }
                })
            },
            {
                ok: true,
                json: async () => ({
                    request: { success: true },
                    response: {
                        pastebin: [
                            { title: 'listed-paste-1', content: 'content1' },
                            { title: 'listed-paste-2', content: 'content2' }
                            // Notice: 'unlisted-test-paste' is NOT in this list
                        ]
                    }
                })
            },
            // Mock the update API call
            {
                ok: true,
                json: async () => ({
                    request: { success: true },
                    response: {}
                })
            }
        ];

        // Try to update an unlisted paste
        await api.updatePaste('unlisted-test-paste', 'updated content');

        // Verify that 3 fetch calls were made
        assert.strictEqual(fetchCalls.length, 3, 'Should have made 3 API calls');

        // Verify third call is the update with no listed parameter (unlisted)
        assert.strictEqual(fetchCalls[2].url, 'https://api.omg.lol/address/testuser/pastebin/', 'Third call should update paste');
        assert.strictEqual(fetchCalls[2].options.method, 'POST', 'Should use POST method');

        const requestBody = JSON.parse(fetchCalls[2].options.body);
        assert.strictEqual(requestBody.title, 'unlisted-test-paste', 'Should update correct paste');
        assert.strictEqual(requestBody.content, 'updated content', 'Should update content');
        assert.strictEqual(requestBody.listed, undefined, 'Should omit listed parameter for unlisted pastes');
    });

    test('updatePaste should preserve listed visibility', async () => {
        // Mock fetch calls:
        // 1. getPaste - fetch the individual paste
        // 2. getPaste - fetch listed pastes to check visibility
        // 3. updatePaste - the actual update call
        mockFetchResponses = [
            {
                ok: true,
                json: async () => ({
                    request: { success: true },
                    response: {
                        paste: {
                            title: 'listed-test-paste',
                            content: 'original content'
                        }
                    }
                })
            },
            {
                ok: true,
                json: async () => ({
                    request: { success: true },
                    response: {
                        pastebin: [
                            { title: 'listed-test-paste', content: 'content1' },
                            { title: 'other-listed-paste', content: 'content2' }
                            // Notice: 'listed-test-paste' IS in this list
                        ]
                    }
                })
            },
            // Mock the update API call
            {
                ok: true,
                json: async () => ({
                    request: { success: true },
                    response: {}
                })
            }
        ];

        // Try to update a listed paste
        await api.updatePaste('listed-test-paste', 'updated content');

        // Verify the calls
        assert.strictEqual(fetchCalls.length, 3, 'Should have made 3 API calls');

        // Verify third call has listed: 1 (listed)
        const requestBody = JSON.parse(fetchCalls[2].options.body);
        assert.strictEqual(requestBody.listed, 1, 'Should preserve listed visibility (listed: 1)');
    });

    test('updatePaste should default to unlisted when visibility check fails', async () => {
        // Mock fetch calls:
        // 1. getPaste - fetch the individual paste
        // 2. getPaste - fetch listed pastes (returns empty list)
        // 3. updatePaste - the actual update call
        mockFetchResponses = [
            {
                ok: true,
                json: async () => ({
                    request: { success: true },
                    response: {
                        paste: {
                            title: 'unknown-paste',
                            content: 'original content'
                        }
                    }
                })
            },
            {
                ok: true,
                json: async () => ({
                    request: { success: true },
                    response: {
                        pastebin: []
                    }
                })
            },
            // Mock the update API call
            {
                ok: true,
                json: async () => ({
                    request: { success: true },
                    response: {}
                })
            }
        ];

        // Try to update a paste when it's not in the listed pastes
        await api.updatePaste('unknown-paste', 'updated content');

        // Verify the calls
        assert.strictEqual(fetchCalls.length, 3, 'Should have made 3 API calls');

        // Should default to unlisted for safety (no listed parameter)
        const requestBody = JSON.parse(fetchCalls[2].options.body);
        assert.strictEqual(requestBody.listed, undefined, 'Should omit listed parameter when not in listed pastes');
    });

    test('createPaste should respect explicit visibility setting', async () => {
        // Mock the create API call
        mockFetchResponses = [
            {
                ok: true,
                json: async () => ({
                    request: { success: true },
                    response: {}
                })
            }
        ];

        // Test creating with explicit unlisted visibility (false = unlisted)
        await api.createPaste('new-paste', 'content', false);

        // Verify the call
        assert.strictEqual(fetchCalls.length, 1, 'Should have made 1 API call');
        assert.strictEqual(fetchCalls[0].url, 'https://api.omg.lol/address/testuser/pastebin/', 'Should call create endpoint');

        const requestBody = JSON.parse(fetchCalls[0].options.body);
        assert.strictEqual(requestBody.title, 'new-paste', 'Should create correct paste');
        assert.strictEqual(requestBody.content, 'content', 'Should have correct content');
        assert.strictEqual(requestBody.listed, undefined, 'Should omit listed parameter for unlisted pastes');
    });

    test('createPaste should create listed paste when explicitly set', async () => {
        // Mock the create API call
        mockFetchResponses = [
            {
                ok: true,
                json: async () => ({
                    request: { success: true },
                    response: {}
                })
            }
        ];

        // Test creating with explicit listed visibility (true = listed)
        await api.createPaste('new-listed-paste', 'content', true);

        // Verify the call
        assert.strictEqual(fetchCalls.length, 1, 'Should have made 1 API call');

        const requestBody = JSON.parse(fetchCalls[0].options.body);
        assert.strictEqual(requestBody.listed, 1, 'Should include listed=1 for listed pastes');
    });
});
