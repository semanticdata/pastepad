import { ErrorHandler, ErrorType, ErrorSeverity } from './errorHandler';
import { StateManager } from './stateManager';

export interface RetryOptions {
    maxAttempts?: number;
    baseDelay?: number;
    maxDelay?: number;
    backoffFactor?: number;
    jitter?: boolean;
    retryCondition?: (error: Error) => boolean;
    onRetry?: (error: Error, attempt: number) => void;
    timeout?: number;
}

export interface RetryResult<T> {
    success: boolean;
    result?: T;
    error?: Error;
    attempts: number;
    totalDuration: number;
}

export class RetryManager {
    private static instance: RetryManager | undefined;
    private errorHandler: ErrorHandler;
    private stateManager: StateManager;

    // Default retry configuration
    private static readonly DEFAULT_OPTIONS: Required<Omit<RetryOptions, 'retryCondition' | 'onRetry' | 'timeout'>> = {
        maxAttempts: 3,
        baseDelay: 1000,        // 1 second
        maxDelay: 30000,        // 30 seconds
        backoffFactor: 2,       // Double each time
        jitter: true            // Add randomness to prevent thundering herd
    };

    private constructor() {
        this.errorHandler = ErrorHandler.getInstance();
        this.stateManager = StateManager.getInstance();
    }

    public static getInstance(): RetryManager {
        if (!RetryManager.instance) {
            RetryManager.instance = new RetryManager();
        }
        return RetryManager.instance;
    }

    async executeWithRetry<T>(
        operation: () => Promise<T>,
        options: RetryOptions = {}
    ): Promise<RetryResult<T>> {
        const config = { ...RetryManager.DEFAULT_OPTIONS, ...options };
        const startTime = Date.now();
        let lastError: Error | undefined;

        for (let attempt = 1; attempt <= config.maxAttempts; attempt++) {
            try {
                // Execute with timeout if specified
                const result = config.timeout
                    ? await this.withTimeout(operation(), config.timeout)
                    : await operation();

                const totalDuration = Date.now() - startTime;

                // Record successful operation
                await this.stateManager.recordPerformanceMetric('retry_success', totalDuration);

                return {
                    success: true,
                    result,
                    attempts: attempt,
                    totalDuration
                };

            } catch (error) {
                lastError = error as Error;

                // Check if we should retry this error
                if (!this.shouldRetry(lastError, attempt, config, options.retryCondition)) {
                    break;
                }

                // Calculate delay for next attempt
                if (attempt < config.maxAttempts) {
                    const delay = this.calculateDelay(attempt, config);

                    // Call retry callback if provided
                    if (options.onRetry) {
                        options.onRetry(lastError, attempt);
                    }

                    // Log retry attempt
                    console.log(`Retry attempt ${attempt}/${config.maxAttempts} after ${delay}ms delay:`, lastError.message);

                    await this.delay(delay);
                }
            }
        }

        const totalDuration = Date.now() - startTime;

        // Record failed operation
        await this.stateManager.recordPerformanceMetric('retry_failure', totalDuration);

        // Handle the final error
        if (lastError) {
            await this.errorHandler.handleError(lastError, {
                operation: operation.name,
                attempts: config.maxAttempts,
                totalDuration
            });
        }

        return {
            success: false,
            error: lastError,
            attempts: config.maxAttempts,
            totalDuration
        };
    }

    // Specialized retry methods for common operations
    async retryNetworkRequest<T>(
        request: () => Promise<T>,
        options: RetryOptions = {}
    ): Promise<RetryResult<T>> {
        return this.executeWithRetry(request, {
            maxAttempts: 5,
            baseDelay: 1000,
            maxDelay: 60000,
            retryCondition: (error) => this.isRetryableNetworkError(error),
            ...options
        });
    }

    async retryApiCall<T>(
        apiCall: () => Promise<T>,
        options: RetryOptions = {}
    ): Promise<RetryResult<T>> {
        return this.executeWithRetry(apiCall, {
            maxAttempts: 3,
            baseDelay: 2000,
            maxDelay: 30000,
            retryCondition: (error) => this.isRetryableApiError(error),
            onRetry: (error, attempt) => {
                console.log(`API call failed, retrying (${attempt}/3):`, error.message);
            },
            ...options
        });
    }

    async retryWithCircuitBreaker<T>(
        operation: () => Promise<T>,
        circuitKey: string,
        options: RetryOptions = {}
    ): Promise<RetryResult<T>> {
        // Simple circuit breaker implementation
        const failureCount = await this.getCircuitBreakerFailures(circuitKey);
        const threshold = 5; // Open circuit after 5 failures
        const resetTimeout = 60000; // 1 minute

        if (failureCount >= threshold) {
            const lastFailure = await this.getLastCircuitBreakerFailure(circuitKey);
            if (lastFailure && Date.now() - lastFailure < resetTimeout) {
                throw this.errorHandler.createError(
                    ErrorType.NETWORK,
                    ErrorSeverity.HIGH,
                    'Circuit breaker is open',
                    'Service temporarily unavailable. Please try again later.',
                    {
                        context: { circuitKey, failureCount }
                    }
                );
            } else {
                // Reset circuit breaker
                await this.resetCircuitBreaker(circuitKey);
            }
        }

        const result = await this.executeWithRetry(operation, options);

        if (!result.success) {
            await this.recordCircuitBreakerFailure(circuitKey);
        } else {
            await this.resetCircuitBreaker(circuitKey);
        }

        return result;
    }

    private shouldRetry(error: Error, attempt: number, config: Required<Omit<RetryOptions, 'retryCondition' | 'onRetry' | 'timeout'>>, retryCondition?: (error: Error) => boolean): boolean {
        // Don't retry if we've reached max attempts
        if (attempt >= config.maxAttempts) {
            return false;
        }

        // Use custom retry condition if provided
        if (retryCondition) {
            return retryCondition(error);
        }

        // Default retry logic
        return this.isRetryableError(error);
    }

    private isRetryableError(error: Error): boolean {
        const message = error.message.toLowerCase();

        // Network errors that are worth retrying
        if (message.includes('network') ||
            message.includes('timeout') ||
            message.includes('connection') ||
            message.includes('fetch')) {
            return true;
        }

        // HTTP status codes worth retrying
        if (message.includes('502') || // Bad Gateway
            message.includes('503') || // Service Unavailable
            message.includes('504') || // Gateway Timeout
            message.includes('429')) { // Too Many Requests
            return true;
        }

        // Don't retry client errors (4xx except 429)
        if (message.includes('400') ||
            message.includes('401') ||
            message.includes('403') ||
            message.includes('404')) {
            return false;
        }

        // Retry server errors (5xx)
        if (message.includes('500') ||
            message.includes('502') ||
            message.includes('503') ||
            message.includes('504')) {
            return true;
        }

        return false;
    }

    private isRetryableNetworkError(error: Error): boolean {
        const message = error.message.toLowerCase();
        return message.includes('network') ||
               message.includes('timeout') ||
               message.includes('connection') ||
               message.includes('dns') ||
               message.includes('unreachable');
    }

    private isRetryableApiError(error: Error): boolean {
        const message = error.message.toLowerCase();

        // Retry server errors and rate limits
        if (message.includes('500') ||
            message.includes('502') ||
            message.includes('503') ||
            message.includes('504') ||
            message.includes('429')) {
            return true;
        }

        // Don't retry authentication or authorization errors
        if (message.includes('401') || message.includes('403')) {
            return false;
        }

        // Don't retry not found or bad request
        if (message.includes('404') || message.includes('400')) {
            return false;
        }

        return this.isRetryableNetworkError(error);
    }

    private calculateDelay(attempt: number, config: Required<Omit<RetryOptions, 'retryCondition' | 'onRetry' | 'timeout'>>): number {
        let delay = config.baseDelay * Math.pow(config.backoffFactor, attempt - 1);

        // Apply max delay cap
        delay = Math.min(delay, config.maxDelay);

        // Add jitter to prevent thundering herd
        if (config.jitter) {
            const jitterAmount = delay * 0.1; // 10% jitter
            delay += Math.random() * jitterAmount - jitterAmount / 2;
        }

        return Math.floor(delay);
    }

    private delay(ms: number): Promise<void> {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    private async withTimeout<T>(promise: Promise<T>, timeoutMs: number): Promise<T> {
        return Promise.race([
            promise,
            new Promise<never>((_, reject) =>
                setTimeout(() => reject(new Error(`Operation timed out after ${timeoutMs}ms`)), timeoutMs)
            )
        ]);
    }

    // Circuit breaker helpers
    private async getCircuitBreakerFailures(key: string): Promise<number> {
        const data = await this.stateManager.getCachedData<{count: number, lastFailure: number}>(`circuit_${key}`);
        return data?.count || 0;
    }

    private async getLastCircuitBreakerFailure(key: string): Promise<number | undefined> {
        const data = await this.stateManager.getCachedData<{count: number, lastFailure: number}>(`circuit_${key}`);
        return data?.lastFailure;
    }

    private async recordCircuitBreakerFailure(key: string): Promise<void> {
        const current = await this.stateManager.getCachedData<{count: number, lastFailure: number}>(`circuit_${key}`) || { count: 0, lastFailure: 0 };
        await this.stateManager.setCachedData(`circuit_${key}`, {
            count: current.count + 1,
            lastFailure: Date.now()
        }, 300000); // 5 minutes TTL
    }

    private async resetCircuitBreaker(key: string): Promise<void> {
        await this.stateManager.clearCache(`circuit_${key}`);
    }

    // Utility method for batch operations with concurrency control
    async executeBatchWithRetry<T, R>(
        items: T[],
        operation: (item: T) => Promise<R>,
        options: RetryOptions & { concurrency?: number } = {}
    ): Promise<Array<{ item: T, result?: R, error?: Error }>> {
        const { concurrency = 3, ...retryOptions } = options;
        const results: Array<{ item: T, result?: R, error?: Error }> = [];

        for (let i = 0; i < items.length; i += concurrency) {
            const batch = items.slice(i, i + concurrency);
            const batchPromises = batch.map(async item => {
                const result = await this.executeWithRetry(() => operation(item), retryOptions);
                return {
                    item,
                    result: result.result,
                    error: result.error
                };
            });

            const batchResults = await Promise.all(batchPromises);
            results.push(...batchResults);
        }

        return results;
    }
}