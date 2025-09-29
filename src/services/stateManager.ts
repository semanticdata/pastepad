import * as vscode from 'vscode';

export interface UserPreferences {
    theme?: 'light' | 'dark' | 'auto';
    sortBy?: 'modified' | 'name' | 'created';
    viewMode?: 'list' | 'grid';
    autoSave?: boolean;
    syncOnSave?: boolean;
    defaultListNewPastes?: boolean;
    groupPastesByVisibility?: boolean;
}

export interface UIState {
    expandedItems?: string[];
    lastOpenedPaste?: string;
    sidebarWidth?: number;
    treeViewCollapsed?: boolean;
}

export interface CacheMetadata {
    lastFetchTime: number;
    ttl: number;
    version: string;
}

export class StateManager {
    private static instance: StateManager | undefined;

    private constructor(private context: vscode.ExtensionContext) {}

    public static getInstance(context?: vscode.ExtensionContext): StateManager {
        if (!StateManager.instance && context) {
            StateManager.instance = new StateManager(context);
        }
        if (!StateManager.instance) {
            throw new Error('StateManager not initialized. Call getInstance with context first.');
        }
        return StateManager.instance;
    }

    // Global State Management (persists across all workspaces)
    async getUserPreferences(): Promise<UserPreferences> {
        return this.context.globalState.get<UserPreferences>('userPreferences', {
            theme: 'auto',
            sortBy: 'modified',
            viewMode: 'list',
            autoSave: true,
            syncOnSave: false,
            defaultListNewPastes: false,
            groupPastesByVisibility: false
        });
    }

    async setUserPreferences(preferences: Partial<UserPreferences>): Promise<void> {
        const current = await this.getUserPreferences();
        const updated = { ...current, ...preferences };
        await this.context.globalState.update('userPreferences', updated);
    }

    async getCacheMetadata(key: string): Promise<CacheMetadata | undefined> {
        const metadata = this.context.globalState.get<Record<string, CacheMetadata>>('cacheMetadata', {});
        return metadata[key];
    }

    async setCacheMetadata(key: string, metadata: CacheMetadata): Promise<void> {
        const current = this.context.globalState.get<Record<string, CacheMetadata>>('cacheMetadata', {});
        current[key] = metadata;
        await this.context.globalState.update('cacheMetadata', current);
    }

    async clearExpiredCacheMetadata(): Promise<void> {
        const current = this.context.globalState.get<Record<string, CacheMetadata>>('cacheMetadata', {});
        const now = Date.now();
        const filtered = Object.entries(current).reduce((acc, [key, meta]) => {
            if (now - meta.lastFetchTime < meta.ttl) {
                acc[key] = meta;
            }
            return acc;
        }, {} as Record<string, CacheMetadata>);
        await this.context.globalState.update('cacheMetadata', filtered);
    }

    // Workspace State Management (specific to current workspace)
    async getUIState(): Promise<UIState> {
        return this.context.workspaceState.get<UIState>('uiState', {
            expandedItems: [],
            treeViewCollapsed: false
        });
    }

    async setUIState(state: Partial<UIState>): Promise<void> {
        const current = await this.getUIState();
        const updated = { ...current, ...state };
        await this.context.workspaceState.update('uiState', updated);
    }

    async getRecentlyOpenedPastes(): Promise<string[]> {
        return this.context.workspaceState.get<string[]>('recentPastes', []);
    }

    async addRecentlyOpenedPaste(pasteTitle: string, maxRecent: number = 10): Promise<void> {
        const recent = await this.getRecentlyOpenedPastes();
        const filtered = recent.filter(title => title !== pasteTitle);
        filtered.unshift(pasteTitle);

        if (filtered.length > maxRecent) {
            filtered.splice(maxRecent);
        }

        await this.context.workspaceState.update('recentPastes', filtered);
    }

    // Generic cache storage
    async getCachedData<T>(key: string): Promise<T | undefined> {
        const metadata = await this.getCacheMetadata(key);
        if (!metadata || Date.now() - metadata.lastFetchTime > metadata.ttl) {
            return undefined;
        }

        return this.context.globalState.get<T>(`cache:${key}`);
    }

    async setCachedData<T>(key: string, data: T, ttl: number = 300000): Promise<void> { // 5 minutes default
        const metadata: CacheMetadata = {
            lastFetchTime: Date.now(),
            ttl,
            version: '1.0.0'
        };

        await Promise.all([
            this.context.globalState.update(`cache:${key}`, data),
            this.setCacheMetadata(key, metadata)
        ]);
    }

    async clearCache(key?: string): Promise<void> {
        if (key) {
            await Promise.all([
                this.context.globalState.update(`cache:${key}`, undefined),
                this.setCacheMetadata(key, {} as CacheMetadata)
            ]);
        } else {
            // Clear all cache
            const metadata = this.context.globalState.get<Record<string, CacheMetadata>>('cacheMetadata', {});
            const clearPromises = Object.keys(metadata).map(k =>
                this.context.globalState.update(`cache:${k}`, undefined)
            );
            await Promise.all([
                ...clearPromises,
                this.context.globalState.update('cacheMetadata', {})
            ]);
        }
    }

    // OAuth state management (improvement over current implementation)
    async setOAuthState(state: string): Promise<void> {
        await this.context.globalState.update('oauthState', {
            state,
            timestamp: Date.now(),
            ttl: 600000 // 10 minutes
        });
    }

    async getOAuthState(): Promise<string | undefined> {
        const oauthData = this.context.globalState.get<{state: string, timestamp: number, ttl: number}>('oauthState');
        if (!oauthData || Date.now() - oauthData.timestamp > oauthData.ttl) {
            await this.context.globalState.update('oauthState', undefined);
            return undefined;
        }
        return oauthData.state;
    }

    async clearOAuthState(): Promise<void> {
        await this.context.globalState.update('oauthState', undefined);
    }

    // Error tracking and metrics
    async incrementErrorCount(errorType: string): Promise<void> {
        const errors = this.context.globalState.get<Record<string, number>>('errorCounts', {});
        errors[errorType] = (errors[errorType] || 0) + 1;
        await this.context.globalState.update('errorCounts', errors);
    }

    async getErrorCounts(): Promise<Record<string, number>> {
        return this.context.globalState.get<Record<string, number>>('errorCounts', {});
    }

    async clearErrorCounts(): Promise<void> {
        await this.context.globalState.update('errorCounts', {});
    }

    // Performance metrics
    async recordPerformanceMetric(operation: string, duration: number): Promise<void> {
        const metrics = this.context.globalState.get<Record<string, {count: number, totalDuration: number, avgDuration: number}>>('performanceMetrics', {});

        if (!metrics[operation]) {
            metrics[operation] = { count: 0, totalDuration: 0, avgDuration: 0 };
        }

        metrics[operation].count++;
        metrics[operation].totalDuration += duration;
        metrics[operation].avgDuration = metrics[operation].totalDuration / metrics[operation].count;

        await this.context.globalState.update('performanceMetrics', metrics);
    }

    async getPerformanceMetrics(): Promise<Record<string, {count: number, totalDuration: number, avgDuration: number}>> {
        return this.context.globalState.get('performanceMetrics', {});
    }
}