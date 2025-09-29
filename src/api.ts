import * as vscode from 'vscode';
import { AuthenticationManager } from './authentication';
import { PasteItem } from './types';

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
    constructor(private authManager: AuthenticationManager) {}

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

    async getPastes(): Promise<PasteItem[]> {
        const address = await this.authManager.getAddress();
        const response = await fetch(`${API_URL}/address/${address}/pastebin`, {
            headers: await this.getHeaders()
        });

        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        const data = await response.json() as GetPastesResponse;
        return data.response.pastebin || [];
    }

    async getPaste(title: string): Promise<PasteItem | undefined> {
        const address = await this.authManager.getAddress();
        const response = await fetch(`${API_URL}/address/${address}/pastebin/${title}`, {
            headers: await this.getHeaders()
        });

        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        const data = await response.json() as GetPasteResponse;
        return data.response.paste;
    }

    async createPaste(title: string, content: string): Promise<void> {
        const address = await this.authManager.getAddress();
        const response = await fetch(`${API_URL}/address/${address}/pastebin`, {
            method: 'POST',
            headers: await this.getHeaders(),
            body: JSON.stringify({ title, content, listed: 1 })
        });

        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
    }

    async updatePaste(title: string, content: string): Promise<void> {
        const address = await this.authManager.getAddress();
        const response = await fetch(`${API_URL}/address/${address}/pastebin/${title}`, {
            method: 'PUT',
            headers: await this.getHeaders(),
            body: JSON.stringify({ content })
        });

        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
    }

    async deletePaste(title: string): Promise<void> {
        const address = await this.authManager.getAddress();
        const response = await fetch(`${API_URL}/address/${address}/pastebin/${title}`, {
            method: 'DELETE',
            headers: await this.getHeaders()
        });

        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
    }
}