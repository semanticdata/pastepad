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

// Mock fetch globally
(global as any).fetch = async (url: string, options?: any): Promise<MockResponse> => {
    fetchCalls.push({ url, options });
    const response = mockFetchResponses[fetchCalls.length - 1] || { ok: true, json: async () => ({}) };
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

        // Create a simplified mock extension context
        mockContext = {
            subscriptions: [],
            workspaceState: {
                get: () => Promise.resolve(undefined),
                update: () => Promise.resolve(),
                keys: () => []
            },
            globalState: {
                get: () => Promise.resolve(undefined),
                update: () => Promise.resolve(),
                setKeysForSync: () => {},
                keys: () => []
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
        const getAddressOriginal = authManager.getAddress;
        authManager.getAddress = async () => 'testuser';

        const getAccessTokenOriginal = authManager.getAccessToken;
        authManager.getAccessToken = async () => 'test-token';
    });

    test('updatePaste should preserve unlisted visibility', async () => {
        // Mock the listed pastebin API call (should NOT include the unlisted paste)
        mockFetchResponses = [
            {
                ok: true,
                json: async () => ({
                    response: {
                        pastebin: [
                            { title: 'listed-paste-1', content: 'content1' },
                            { title: 'listed-paste-2', content: 'content2' }
                            // Notice: 'unlisted-test-paste' is NOT in this list
                        ]
                    }
                })
            },
            // Mock the DELETE API call
            {
                ok: true,
                json: async () => ({ success: true })
            },
            // Mock the recreate API call
            {
                ok: true,
                json: async () => ({ success: true })
            }
        ];

        // Try to update an unlisted paste
        await api.updatePaste('unlisted-test-paste', 'updated content');

        // Verify that 3 fetch calls were made (1 to check visibility, 1 to delete, 1 to recreate)
        assert.strictEqual(fetchCalls.length, 3, 'Should have made 3 API calls');

        // Verify first call is to get listed pastes
        assert.strictEqual(fetchCalls[0].url, 'https://api.omg.lol/address/testuser/pastebin', 'First call should get listed pastes');

        // Verify second call is the delete
        assert.strictEqual(fetchCalls[1].url, 'https://api.omg.lol/address/testuser/pastebin/unlisted-test-paste', 'Second call should delete paste');
        assert.strictEqual(fetchCalls[1].options.method, 'DELETE', 'Should use DELETE method');

        // Verify third call is the recreate with listed: 0 (unlisted)
        assert.strictEqual(fetchCalls[2].url, 'https://api.omg.lol/address/testuser/pastebin/', 'Third call should recreate paste');
        assert.strictEqual(fetchCalls[2].options.method, 'POST', 'Should use POST method');

        const requestBody = JSON.parse(fetchCalls[2].options.body);
        assert.strictEqual(requestBody.title, 'unlisted-test-paste', 'Should update correct paste');
        assert.strictEqual(requestBody.content, 'updated content', 'Should update content');
        assert.strictEqual(requestBody.listed, 0, 'Should preserve unlisted visibility (listed: 0)');
    });

    test('updatePaste should preserve listed visibility', async () => {
        // Mock the listed pastebin API call (INCLUDES the listed paste)
        mockFetchResponses = [
            {
                ok: true,
                json: async () => ({
                    response: {
                        pastebin: [
                            { title: 'listed-test-paste', content: 'content1' },
                            { title: 'other-listed-paste', content: 'content2' }
                            // Notice: 'listed-test-paste' IS in this list
                        ]
                    }
                })
            },
            // Mock the DELETE API call
            {
                ok: true,
                json: async () => ({ success: true })
            },
            // Mock the recreate API call
            {
                ok: true,
                json: async () => ({ success: true })
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
        // Mock the listed pastebin API call to fail
        mockFetchResponses = [
            {
                ok: false,
                status: 500,
                json: async () => ({ error: 'Server error' })
            },
            // Mock the DELETE API call
            {
                ok: true,
                json: async () => ({ success: true })
            },
            // Mock the recreate API call
            {
                ok: true,
                json: async () => ({ success: true })
            }
        ];

        // Try to update a paste when visibility check fails
        await api.updatePaste('unknown-paste', 'updated content');

        // Verify the calls
        assert.strictEqual(fetchCalls.length, 3, 'Should have made 3 API calls');

        // Should default to unlisted for safety
        const requestBody = JSON.parse(fetchCalls[2].options.body);
        assert.strictEqual(requestBody.listed, 0, 'Should default to unlisted when visibility check fails');
    });

    test('createPaste should respect explicit visibility setting', async () => {
        // Mock the create API call
        mockFetchResponses = [
            {
                ok: true,
                json: async () => ({ success: true })
            }
        ];

        // Test creating with explicit unlisted visibility
        await api.createPaste('new-paste', 'content', false);

        // Verify the call
        assert.strictEqual(fetchCalls.length, 1, 'Should have made 1 API call');
        assert.strictEqual(fetchCalls[0].url, 'https://api.omg.lol/address/testuser/pastebin/', 'Should call create endpoint');

        const requestBody = JSON.parse(fetchCalls[0].options.body);
        assert.strictEqual(requestBody.title, 'new-paste', 'Should create correct paste');
        assert.strictEqual(requestBody.content, 'content', 'Should have correct content');
        assert.strictEqual(requestBody.listed, 0, 'Should be unlisted when explicitly set to false');
    });
});