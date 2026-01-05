import * as vscode from 'vscode';
import { OmgLolApi } from './api';
import { LoggerService } from './services';

export class ProfileFileSystemProvider implements vscode.FileSystemProvider {
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
        // For now, treat profile as a single file
        return { type: vscode.FileType.File, ctime: 0, mtime: 0, size: 0 };
    }

    async readDirectory(uri: vscode.Uri): Promise<[string, vscode.FileType][]> {
        // Profile is a single file, no directory listing
        return [];
    }

    createDirectory(uri: vscode.Uri): void {
        throw vscode.FileSystemError.NoPermissions('Cannot create directories');
    }

    async readFile(uri: vscode.Uri): Promise<Uint8Array> {
        this.logger.debug('Profile file read operation started', { uri: uri.toString() });

        try {
            const profile = await this.api.getProfile();
            if (profile && profile.content) {
                this.logger.debug('Profile content retrieved successfully', { contentLength: profile.content.length });
                return Buffer.from(profile.content);
            }

            // Return empty content if profile doesn't exist yet
            this.logger.debug('No existing profile found, returning empty content');
            return Buffer.from('');
        } catch (error) {
            this.logger.error('Failed to read profile file', { uri: uri.toString(), error });
            throw vscode.FileSystemError.FileNotFound(uri);
        }
    }

    async writeFile(uri: vscode.Uri, content: Uint8Array, options: { create: boolean; overwrite: boolean; }): Promise<void> {
        const newContent = content.toString();

        this.logger.debug('Profile file write operation started', {
            uri: uri.toString(),
            contentLength: content.length,
            create: options.create,
            overwrite: options.overwrite
        });

        try {
            this.logger.info('Updating profile');
            vscode.window.showInformationMessage('Updating profile...');

            await this.api.updateProfile(newContent);

            this._emitter.fire([{ type: vscode.FileChangeType.Changed, uri }]);
            this.logger.info('Profile updated successfully');
        } catch (error) {
            this.logger.error('Failed to update profile', { uri: uri.toString(), error });
            vscode.window.showErrorMessage(`Failed to update profile: ${error}`);
            throw new vscode.FileSystemError(error as any);
        }
    }

    async rename(oldUri: vscode.Uri, newUri: vscode.Uri, options: { overwrite: boolean; }): Promise<void> {
        throw vscode.FileSystemError.NoPermissions('Cannot rename profile file');
    }

    async delete(uri: vscode.Uri, options: { recursive: boolean; }): Promise<void> {
        throw vscode.FileSystemError.NoPermissions('Cannot delete profile file');
    }
}
