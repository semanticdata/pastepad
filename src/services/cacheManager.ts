import { StateManager } from './stateManager';
import { PasteItem } from '../types';

export interface CacheEntry<T> {
    data: T;
    timestamp: number;
    ttl: number;
    key: string;
}

export interface CacheOptions {
    ttl?: number; // Time to live in milliseconds
    forceRefresh?: boolean;
    offline?: boolean;
}

export class CacheManager {
    private static instance: CacheManager | undefined;
    private stateManager: StateManager;

    // Default TTL values (in milliseconds)
    private static readonly DEFAULT_TTL = {
        PASTE_LIST: 5 * 60 * 1000,      // 5 minutes
        PASTE_CONTENT: 10 * 60 * 1000,  // 10 minutes
        USER_PROFILE: 30 * 60 * 1000,   // 30 minutes
        SETTINGS: 60 * 60 * 1000        // 1 hour
    };

    private constructor() {
        this.stateManager = StateManager.getInstance();
    }

    public static getInstance(): CacheManager {
        if (!CacheManager.instance) {
            CacheManager.instance = new CacheManager();
        }
        return CacheManager.instance;
    }

    async get<T>(key: string, options: CacheOptions = {}): Promise<T | undefined> {
        if (options.forceRefresh) {
            return undefined;
        }

        try {
            const cached = await this.stateManager.getCachedData<T>(key);
            if (cached) {
                // Record cache hit
                await this.stateManager.recordPerformanceMetric(`cache_hit_${key}`, 0);
                return cached;
            }

            // Record cache miss
            await this.stateManager.recordPerformanceMetric(`cache_miss_${key}`, 0);
            return undefined;
        } catch (error) {
            console.error(`Cache get error for key ${key}:`, error);
            return undefined;
        }
    }

    async set<T>(key: string, data: T, options: CacheOptions = {}): Promise<void> {
        const ttl = options.ttl || this.getDefaultTtl(key);

        try {
            await this.stateManager.setCachedData(key, data, ttl);
            await this.stateManager.recordPerformanceMetric(`cache_set_${key}`, 0);
        } catch (error) {
            console.error(`Cache set error for key ${key}:`, error);
        }
    }

    async invalidate(key: string): Promise<void> {
        try {
            await this.stateManager.clearCache(key);
        } catch (error) {
            console.error(`Cache invalidate error for key ${key}:`, error);
        }
    }

    async invalidatePattern(pattern: string): Promise<void> {
        try {
            // This is a simplified pattern matching - in a real implementation,
            // you might want more sophisticated pattern matching
            const metadata = await this.stateManager.getPerformanceMetrics();
            const keysToInvalidate = Object.keys(metadata)
                .filter(key => key.includes(pattern))
                .map(key => key.replace(/^cache_(hit|miss|set)_/, ''));

            await Promise.all(keysToInvalidate.map(key => this.invalidate(key)));
        } catch (error) {
            console.error(`Cache invalidate pattern error for pattern ${pattern}:`, error);
        }
    }

    async clear(): Promise<void> {
        try {
            await this.stateManager.clearCache();
        } catch (error) {
            console.error('Cache clear error:', error);
        }
    }

    // Specialized methods for common cache operations
    async getPasteList(options: CacheOptions = {}): Promise<PasteItem[] | undefined> {
        return this.get<PasteItem[]>('paste_list', {
            ttl: CacheManager.DEFAULT_TTL.PASTE_LIST,
            ...options
        });
    }

    async setPasteList(pastes: PasteItem[], options: CacheOptions = {}): Promise<void> {
        await this.set('paste_list', pastes, {
            ttl: CacheManager.DEFAULT_TTL.PASTE_LIST,
            ...options
        });
    }

    async getPasteContent(title: string, options: CacheOptions = {}): Promise<PasteItem | undefined> {
        return this.get<PasteItem>(`paste_content_${title}`, {
            ttl: CacheManager.DEFAULT_TTL.PASTE_CONTENT,
            ...options
        });
    }

    async setPasteContent(title: string, paste: PasteItem, options: CacheOptions = {}): Promise<void> {
        await this.set(`paste_content_${title}`, paste, {
            ttl: CacheManager.DEFAULT_TTL.PASTE_CONTENT,
            ...options
        });
    }

    async invalidatePaste(title: string): Promise<void> {
        await Promise.all([
            this.invalidate('paste_list'),
            this.invalidate(`paste_content_${title}`)
        ]);
    }

    async invalidateAllPastes(): Promise<void> {
        await Promise.all([
            this.invalidate('paste_list'),
            this.invalidatePattern('paste_content_')
        ]);
    }

    // Offline support methods
    async getOfflineData<T>(key: string): Promise<T | undefined> {
        try {
            // Get cached data regardless of TTL for offline scenarios
            const metadata = await this.stateManager.getCacheMetadata(key);
            if (metadata) {
                return await this.stateManager.getCachedData<T>(key);
            }
            return undefined;
        } catch (error) {
            console.error(`Offline cache get error for key ${key}:`, error);
            return undefined;
        }
    }

    async hasOfflineData(key: string): Promise<boolean> {
        try {
            const metadata = await this.stateManager.getCacheMetadata(key);
            return !!metadata;
        } catch (error) {
            return false;
        }
    }

    async getOfflinePasteList(): Promise<PasteItem[] | undefined> {
        return this.getOfflineData<PasteItem[]>('paste_list');
    }

    async getOfflinePasteContent(title: string): Promise<PasteItem | undefined> {
        return this.getOfflineData<PasteItem>(`paste_content_${title}`);
    }

    // Cache statistics and maintenance
    async getCacheStats(): Promise<{
        totalEntries: number;
        totalSize: number;
        hitRate: number;
        expiredEntries: number;
    }> {
        try {
            const metrics = await this.stateManager.getPerformanceMetrics();

            let totalHits = 0;
            let totalMisses = 0;
            let totalEntries = 0;

            Object.entries(metrics).forEach(([key, metric]) => {
                if (key.startsWith('cache_hit_')) {
                    totalHits += metric.count;
                } else if (key.startsWith('cache_miss_')) {
                    totalMisses += metric.count;
                } else if (key.startsWith('cache_set_')) {
                    totalEntries += metric.count;
                }
            });

            const totalRequests = totalHits + totalMisses;
            const hitRate = totalRequests > 0 ? totalHits / totalRequests : 0;

            return {
                totalEntries,
                totalSize: 0, // VS Code doesn't provide size information
                hitRate,
                expiredEntries: 0 // Would require more complex tracking
            };
        } catch (error) {
            console.error('Error getting cache stats:', error);
            return {
                totalEntries: 0,
                totalSize: 0,
                hitRate: 0,
                expiredEntries: 0
            };
        }
    }

    async cleanupExpiredEntries(): Promise<void> {
        try {
            await this.stateManager.clearExpiredCacheMetadata();
        } catch (error) {
            console.error('Error cleaning up expired cache entries:', error);
        }
    }

    // Warmup cache with commonly accessed data
    async warmupCache(): Promise<void> {
        try {
            // This would be called during extension activation
            // to pre-load commonly accessed data
            await this.stateManager.recordPerformanceMetric('cache_warmup', Date.now());
        } catch (error) {
            console.error('Error warming up cache:', error);
        }
    }

    private getDefaultTtl(key: string): number {
        if (key.includes('paste_list')) {
            return CacheManager.DEFAULT_TTL.PASTE_LIST;
        } else if (key.includes('paste_content')) {
            return CacheManager.DEFAULT_TTL.PASTE_CONTENT;
        } else if (key.includes('user') || key.includes('profile')) {
            return CacheManager.DEFAULT_TTL.USER_PROFILE;
        } else if (key.includes('settings') || key.includes('preferences')) {
            return CacheManager.DEFAULT_TTL.SETTINGS;
        }

        return CacheManager.DEFAULT_TTL.PASTE_LIST; // Default fallback
    }

    // Batch operations
    async setMultiple<T>(entries: Array<{key: string, data: T, options?: CacheOptions}>): Promise<void> {
        const setPromises = entries.map(entry =>
            this.set(entry.key, entry.data, entry.options)
        );
        await Promise.all(setPromises);
    }

    async getMultiple<T>(keys: string[], options: CacheOptions = {}): Promise<Map<string, T | undefined>> {
        const results = new Map<string, T | undefined>();
        const getPromises = keys.map(async key => {
            const value = await this.get<T>(key, options);
            results.set(key, value);
        });
        await Promise.all(getPromises);
        return results;
    }
}