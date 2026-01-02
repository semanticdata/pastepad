import * as vscode from 'vscode';
import { OmgLolApi } from './api';
import { PasteItem } from './types';
import { LoggerService } from './services';

export class PastepadFileSystemProvider implements vscode.FileSystemProvider {
    private _emitter = new vscode.EventEmitter<vscode.FileChangeEvent[]>();
    readonly onDidChangeFile: vscode.Event<vscode.FileChangeEvent[]> = this._emitter.event;
    private logger: LoggerService;

    constructor(private api: OmgLolApi) {
        this.logger = LoggerService.getInstance();
    }

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

        this.logger.debug('File write operation started', { title, contentLength: content.length, create: options.create, overwrite: options.overwrite });

        try {
            // CRITICAL FIX: Always check if paste already exists, regardless of options.create
            // VS Code sometimes calls with create: true even for existing files
            let pasteExists = false;
            try {
                this.logger.debug('Checking paste existence', { title });
                const existingPaste = await this.api.getPaste(title);
                pasteExists = !!existingPaste;
                this.logger.debug('Paste existence check result', { title, exists: pasteExists });
            } catch (error) {
                // If we can't determine, assume it doesn't exist
                this.logger.debug('Error checking paste existence, assuming it does not exist', { title, error });
                pasteExists = false;
            }

            if (pasteExists) {
                this.logger.info('Updating existing paste', { title });
                vscode.window.showInformationMessage(`Updating existing paste "${title}" (preserving visibility)`);
                // Get the existing paste to preserve its visibility status
                const existingPaste = await this.api.getPaste(title);
                const currentListedStatus = existingPaste?.listed;
                this.logger.debug('Current visibility status', { title, listed: currentListedStatus });
                await this.api.updatePaste(title, newContent, currentListedStatus);
                this._emitter.fire([{ type: vscode.FileChangeType.Changed, uri }]);
            } else {
                this.logger.info('Creating new paste', { title });
                vscode.window.showInformationMessage(`Creating new paste "${title}"`);
                await this.api.createPaste(title, newContent);
                this._emitter.fire([{ type: vscode.FileChangeType.Created, uri }]);
            }
        } catch (error) {
            this.logger.error('File write operation failed', { title, error });
            throw new vscode.FileSystemError(error as any);
        }
    }

    async rename(oldUri: vscode.Uri, newUri: vscode.Uri, options: { overwrite: boolean; }): Promise<void> {
        const oldTitle = oldUri.path.substring(1);
        const newTitle = newUri.path.substring(1);

        const paste = await this.api.getPaste(oldTitle);
        if (paste) {
            // Preserve the visibility status when renaming
            await this.api.createPaste(newTitle, paste.content, paste.listed);
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
