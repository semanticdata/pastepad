import assert from 'assert';
import * as vscode from 'vscode';
import { OmgLolApi } from '../api';
import { AuthenticationManager } from '../authentication';
import { initializeServices } from '../services';

// Simple mock implementation for testing
interface MockResponse {
    ok: boolean;
    status?: number;
    statusText?: string;
    json: () => Promise<any>;
    text?: () => Promise<string>;
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

        // Reset workspace state data for each test
        mockContext.workspaceState._data = {
            userPreferences: { defaultListNewPastes: false }
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

    test('deletePaste should call correct API endpoint', async () => {
        mockFetchResponses = [
            {
                ok: true,
                json: async () => ({ request: { success: true } })
            }
        ];

        await api.deletePaste('paste-to-delete');

        assert.strictEqual(fetchCalls.length, 1, 'Should have made 1 API call');
        assert.strictEqual(fetchCalls[0].url, 'https://api.omg.lol/address/testuser/pastebin/paste-to-delete', 'Should call delete endpoint');
        assert.strictEqual(fetchCalls[0].options.method, 'DELETE', 'Should use DELETE method');
    });
});

suite('some.pics API Tests', () => {
    let api: OmgLolApi;
    let authManager: AuthenticationManager;
    let mockContext: any;

    setup(async () => {
        // Reset mock state
        mockFetchResponses = [];
        fetchCalls = [];
        responseIndex = 0;

        // Create mock context (same as existing setup)
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
            subscriptions: [],
            workspaceState: mockWorkspaceState,
            secrets: {
                get: () => Promise.resolve(undefined),
                store: () => Promise.resolve(),
                delete: () => Promise.resolve()
            }
        };

        initializeServices(mockContext);
        authManager = new AuthenticationManager(mockContext);
        api = new OmgLolApi(authManager);

        authManager.getAddress = async () => 'testuser';
        authManager.getAccessToken = async () => 'test-token';
    });

    test('should upload image successfully', async () => {
        // Mock file system
        const fs = require('fs');
        const mockImageBuffer = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAAAAAA6fptVAAAACklEQVR4nGP6DwABPQDQEBIY4AAAAABJRU5ErkJggg==', 'base64');

        // Stub fs.readFile and fs.stat
        const originalReadFile = fs.promises.readFile;
        const originalStat = fs.promises.stat;

        fs.promises.readFile = async () => mockImageBuffer;
        fs.promises.stat = async () => ({ size: 1024 });

        try {
            mockFetchResponses = [{
                ok: true,
                json: async () => ({
                    request: { success: true, status_code: 200 },
                    response: {
                        message: "Upload successful.",
                        id: "123456789",
                        url: "https://some.pics/image/123456789"
                    }
                })
            }];

            const result = await api.uploadToSomePics('/path/to/image.png', 'test-tag');

            assert.strictEqual(result.id, '123456789');
            assert.strictEqual(result.url, 'https://some.pics/image/123456789');

            // Verify fetch was called with correct parameters
            assert.strictEqual(fetchCalls.length, 1);
            assert.strictEqual(fetchCalls[0].url, 'https://api.omg.lol/address/testuser/pics/upload');
            assert.strictEqual(fetchCalls[0].options.method, 'POST');
            assert.strictEqual(fetchCalls[0].options.headers['Content-Type'], 'application/json');

            // Verify payload has Base64 data (not multipart)
            const body = JSON.parse(fetchCalls[0].options.body);
            assert.strictEqual(typeof body.pic, 'string');
            assert.ok(body.pic.length > 0);
            assert.strictEqual(body.tags, 'test-tag');

        } finally {
            fs.promises.readFile = originalReadFile;
            fs.promises.stat = originalStat;
        }
    });

    test('should reject file larger than 5MB', async () => {
        const fs = require('fs');
        const originalStat = fs.promises.stat;

        fs.promises.stat = async () => ({ size: 6 * 1024 * 1024 }); // 6MB

        try {
            // Mock handleError to prevent timeout from vscode.showErrorMessage
            const originalHandleError = api['errorHandler'].handleError;
            api['errorHandler'].handleError = async () => {};

            try {
                await api.uploadToSomePics('/path/to/large.png');
                assert.fail('Should have thrown an error');
            } finally {
                api['errorHandler'].handleError = originalHandleError;
            }
        } catch (error: any) {
            assert.ok(error.message.includes('File too large'));
        } finally {
            fs.promises.stat = originalStat;
        }
    });

    test('should reject invalid file type', async () => {
        const fs = require('fs');
        const originalStat = fs.promises.stat;

        fs.promises.stat = async () => ({ size: 1024 });

        try {
            // Mock handleError to prevent timeout from vscode.showErrorMessage
            const originalHandleError = api['errorHandler'].handleError;
            api['errorHandler'].handleError = async () => {};

            try {
                await api.uploadToSomePics('/path/to/document.pdf');
                assert.fail('Should have thrown an error');
            } finally {
                api['errorHandler'].handleError = originalHandleError;
            }
        } catch (error: any) {
            assert.ok(error.message.includes('Invalid file type'));
        } finally {
            fs.promises.stat = originalStat;
        }
    });

    test('should update image metadata', async () => {
        mockFetchResponses = [{
            ok: true,
            json: async () => ({
                request: { success: true, status_code: 200 },
                response: { message: "Metadata updated." }
            })
        }];

        await api.updateSomePicsMetadata('123456789', {
            alt_text: 'Test image',
            description: 'Uploaded via VS Code',
            tags: 'vscode,test',
            hide_from_public: false
        });

        assert.strictEqual(fetchCalls.length, 1);
        assert.strictEqual(fetchCalls[0].url, 'https://api.omg.lol/address/testuser/pics/123456789');
        assert.strictEqual(fetchCalls[0].options.method, 'PUT');

        const body = JSON.parse(fetchCalls[0].options.body);
        assert.strictEqual(body.alt_text, 'Test image');
        assert.strictEqual(body.description, 'Uploaded via VS Code');
        assert.strictEqual(body.tags, 'vscode,test');
        assert.strictEqual(body.hide_from_public, false);
    });

    test('should retrieve image details', async () => {
        mockFetchResponses = [{
            ok: true,
            json: async () => ({
                request: { success: true, status_code: 200 },
                response: {
                    message: "Image retrieved.",
                    pic: {
                        id: "123456789",
                        address: "testuser",
                        url: "https://some.pics/image/123456789",
                        created: "1704499200",
                        mime: "image/png",
                        alt_text: "Test image",
                        width: 800,
                        height: 600
                    }
                }
            })
        }];

        const result = await api.getSomePicsImage('123456789');

        assert.strictEqual(result.id, '123456789');
        assert.strictEqual(result.mime, 'image/png');
        assert.strictEqual(result.alt_text, 'Test image');
        assert.strictEqual(fetchCalls[0].options.method, 'GET');
    });

    test('should handle upload error response', async () => {
        const fs = require('fs');
        const mockImageBuffer = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAAAAAA6fptVAAAACklEQVR4nGP6DwABPQDQEBIY4AAAAABJRU5ErkJggg==', 'base64');

        const originalReadFile = fs.promises.readFile;
        const originalStat = fs.promises.stat;

        fs.promises.readFile = async () => mockImageBuffer;
        fs.promises.stat = async () => ({ size: 1024 });

        try {
            // Mock handleError to prevent timeout from vscode.showErrorMessage
            const originalHandleError = api['errorHandler'].handleError;
            api['errorHandler'].handleError = async () => {};

            try {
                mockFetchResponses = [{
                    ok: false,
                    status: 413,
                    statusText: 'Payload Too Large',
                    json: async () => ({}),
                    text: async () => 'Payload Too Large'
                }];

                await api.uploadToSomePics('/path/to/image.png');
                assert.fail('Should have thrown an error');
            } finally {
                api['errorHandler'].handleError = originalHandleError;
            }
        } catch (error: any) {
            assert.ok(error.message.includes('HTTP 413'));
        } finally {
            fs.promises.readFile = originalReadFile;
            fs.promises.stat = originalStat;
        }
    });
});

