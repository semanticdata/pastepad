import * as vscode from 'vscode';
import { OmgLolApi } from './api';
import { LoggerService } from './services';

export class NowFileSystemProvider implements vscode.FileSystemProvider {
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
        // For now, treat /now page as a single file
        return { type: vscode.FileType.File, ctime: 0, mtime: 0, size: 0 };
    }

    async readDirectory(uri: vscode.Uri): Promise<[string, vscode.FileType][]> {
        // /now page is a single file, no directory listing
        return [];
    }

    createDirectory(uri: vscode.Uri): void {
        throw vscode.FileSystemError.NoPermissions('Cannot create directories');
    }

    async readFile(uri: vscode.Uri): Promise<Uint8Array> {
        this.logger.debug('Now page file read operation started', { uri: uri.toString() });

        try {
            const nowPage = await this.api.getNowPage();
            if (nowPage && nowPage.content) {
                this.logger.debug('Now page content retrieved successfully', { contentLength: nowPage.content.length });
                return Buffer.from(nowPage.content);
            }

            // Return empty content if /now page doesn't exist yet
            this.logger.debug('No existing /now page found, returning empty content');
            return Buffer.from('');
        } catch (error) {
            this.logger.error('Failed to read /now page file', { uri: uri.toString(), error });
            throw vscode.FileSystemError.FileNotFound(uri);
        }
    }

    async writeFile(uri: vscode.Uri, content: Uint8Array, options: { create: boolean; overwrite: boolean; }): Promise<void> {
        const newContent = content.toString();

        this.logger.debug('Now page file write operation started', {
            uri: uri.toString(),
            contentLength: content.length,
            create: options.create,
            overwrite: options.overwrite
        });

        try {
            this.logger.info('Updating /now page');
            vscode.window.showInformationMessage('Updating /now page...');

            // Default to listed=true for /now page
            await this.api.updateNowPage(newContent, true);

            this._emitter.fire([{ type: vscode.FileChangeType.Changed, uri }]);
            this.logger.info('/now page updated successfully');
        } catch (error) {
            this.logger.error('Failed to update /now page', { uri: uri.toString(), error });
            vscode.window.showErrorMessage(`Failed to update /now page: ${error}`);
            throw new vscode.FileSystemError(error as any);
        }
    }

    async rename(oldUri: vscode.Uri, newUri: vscode.Uri, options: { overwrite: boolean; }): Promise<void> {
        throw vscode.FileSystemError.NoPermissions('Cannot rename /now page file');
    }

    async delete(uri: vscode.Uri, options: { recursive: boolean; }): Promise<void> {
        throw vscode.FileSystemError.NoPermissions('Cannot delete /now page file');
    }
}
