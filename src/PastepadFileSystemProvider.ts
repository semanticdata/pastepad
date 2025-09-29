import * as vscode from 'vscode';
import { OmgLolApi } from './api';
import { PasteItem } from './types';

export class PastepadFileSystemProvider implements vscode.FileSystemProvider {
    private _emitter = new vscode.EventEmitter<vscode.FileChangeEvent[]>();
    readonly onDidChangeFile: vscode.Event<vscode.FileChangeEvent[]> = this._emitter.event;

    constructor(private api: OmgLolApi) {}

    watch(uri: vscode.Uri, options: { recursive: boolean; excludes: string[]; }): vscode.Disposable {
        return new vscode.Disposable(() => {});
    }

    stat(uri: vscode.Uri): vscode.FileStat {
        // For now, all pastes are files
        return { type: vscode.FileType.File, ctime: 0, mtime: 0, size: 0 };
    }

    async readDirectory(uri: vscode.Uri): Promise<[string, vscode.FileType][]> {
        const pastes = await this.api.getPastes();
        return pastes.map(paste => [paste.title, vscode.FileType.File]);
    }

    createDirectory(uri: vscode.Uri): void {
        throw vscode.FileSystemError.NoPermissions('Cannot create directories');
    }

    async readFile(uri: vscode.Uri): Promise<Uint8Array> {
        const paste = await this.api.getPaste(uri.path.substring(1));
        if (paste) {
            return Buffer.from(paste.content);
        }
        throw vscode.FileSystemError.FileNotFound(uri);
    }

    async writeFile(uri: vscode.Uri, content: Uint8Array, options: { create: boolean; overwrite: boolean; }): Promise<void> {
        const title = uri.path.substring(1);
        const newContent = content.toString();

        try {
            if (options.create) {
                await this.api.createPaste(title, newContent);
                this._emitter.fire([{ type: vscode.FileChangeType.Created, uri }]);
            } else {
                await this.api.updatePaste(title, newContent);
                this._emitter.fire([{ type: vscode.FileChangeType.Changed, uri }]);
            }
        } catch (error) {
            throw new vscode.FileSystemError(error as any);
        }
    }

    async rename(oldUri: vscode.Uri, newUri: vscode.Uri, options: { overwrite: boolean; }): Promise<void> {
        const oldTitle = oldUri.path.substring(1);
        const newTitle = newUri.path.substring(1);

        const paste = await this.api.getPaste(oldTitle);
        if (paste) {
            await this.api.createPaste(newTitle, paste.content);
            await this.api.deletePaste(oldTitle);
            this._emitter.fire([
                { type: vscode.FileChangeType.Deleted, uri: oldUri },
                { type: vscode.FileChangeType.Created, uri: newUri }
            ]);
        }
    }

    async delete(uri: vscode.Uri, options: { recursive: boolean; }): Promise<void> {
        const title = uri.path.substring(1);
        await this.api.deletePaste(title);
        this._emitter.fire([{ type: vscode.FileChangeType.Deleted, uri }]);
    }
}
