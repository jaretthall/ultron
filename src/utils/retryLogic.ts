/**
 * Retry Logic with Exponential Backoff
 * Phase 2 Implementation - Intelligent retry mechanism for enhanced error recovery
 */

import { EnhancedError, ErrorType } from './errorHandling';

export interface RetryOptions {
  maxRetries: number;
  baseDelay: number;
  maxDelay: number;
  backoffMultiplier: number;
  jitter: boolean;
  retryCondition?: (error: EnhancedError) => boolean;
  onRetry?: (attempt: number, error: EnhancedError) => void;
}

export const DEFAULT_RETRY_OPTIONS: RetryOptions = {
  maxRetries: 3,
  baseDelay: 1000, // 1 second
  maxDelay: 30000, // 30 seconds
  backoffMultiplier: 2,
  jitter: true,
  retryCondition: (error: EnhancedError) => error.retryable
};

export class RetryHandler {
  /**
   * Execute operation with intelligent retry logic
   */
  static async executeWithRetry<T>(
    operation: () => Promise<T>,
    options: Partial<RetryOptions> = {},
    context?: string
  ): Promise<T> {
    const config = { ...DEFAULT_RETRY_OPTIONS, ...options };
    let lastError: EnhancedError;
    
    for (let attempt = 0; attempt <= config.maxRetries; attempt++) {
      try {
        // Add artificial delay for non-first attempts
        if (attempt > 0) {
          const delay = this.calculateDelay(attempt - 1, config);
          await this.sleep(delay);
        }
        
        return await operation();
        
      } catch (error) {
        lastError = this.processError(error, context);
        
        // Check if we should retry
        if (!this.shouldRetry(lastError, attempt, config)) {
          throw lastError;
        }
        
        // Log retry attempt
        this.logRetryAttempt(attempt + 1, lastError, config);
        
        // Call retry callback if provided
        if (config.onRetry) {
          config.onRetry(attempt + 1, lastError);
        }
      }
    }
    
    // All retries exhausted
    throw lastError!;
  }
  
  /**
   * Calculate delay with exponential backoff and optional jitter
   */
  private static calculateDelay(attempt: number, options: RetryOptions): number {
    let delay = Math.min(
      options.baseDelay * Math.pow(options.backoffMultiplier, attempt),
      options.maxDelay
    );
    
    // Add jitter to prevent thundering herd
    if (options.jitter) {
      delay = delay * (0.5 + Math.random() * 0.5);
    }
    
    return Math.floor(delay);
  }
  
  /**
   * Determine if operation should be retried
   */
  private static shouldRetry(
    error: EnhancedError, 
    attempt: number, 
    options: RetryOptions
  ): boolean {
    // Don't retry if we've reached max attempts
    if (attempt >= options.maxRetries) {
      return false;
    }
    
    // Use custom retry condition if provided
    if (options.retryCondition) {
      return options.retryCondition(error);
    }
    
    // Default retry logic based on error type
    return this.getDefaultRetryBehavior(error);
  }
  
  /**
   * Default retry behavior based on error classification
   */
  private static getDefaultRetryBehavior(error: EnhancedError): boolean {
    switch (error.type) {
      case ErrorType.NETWORK:
      case ErrorType.TIMEOUT:
      case ErrorType.CONNECTION:
      case ErrorType.RATE_LIMIT:
      case ErrorType.SERVER:
        return true;
        
      case ErrorType.AUTHENTICATION:
      case ErrorType.AUTHORIZATION:
      case ErrorType.VALIDATION:
      case ErrorType.CONSTRAINT:
      case ErrorType.NOT_FOUND:
        return false;
        
      case ErrorType.UNKNOWN:
        // Be conservative with unknown errors
        return error.retryable;
        
      default:
        return false;
    }
  }
  
  /**
   * Process error and ensure it's enhanced
   */
  private static processError(error: any, context?: string): EnhancedError {
    if (error.enhancedError) {
      return error.enhancedError;
    }
    
    // Import here to avoid circular dependency
    const { ErrorClassifier } = require('./errorHandling');
    return ErrorClassifier.classifySupabaseError(error, context);
  }
  
  /**
   * Log retry attempt for debugging
   */
  private static logRetryAttempt(
    attempt: number, 
    error: EnhancedError, 
    options: RetryOptions
  ): void {
    const nextDelay = this.calculateDelay(attempt - 1, options);
    
    console.warn(`Retry attempt ${attempt}/${options.maxRetries} in ${nextDelay}ms`, {
      errorType: error.type,
      errorCode: error.code,
      context: error.context,
      message: error.message
    });
  }
  
  /**
   * Sleep utility
   */
  private static sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

/**
 * Specialized retry configurations for different operation types
 */
export class RetryConfigurations {
  /**
   * Configuration for database read operations
   */
  static get DATABASE_READ(): Partial<RetryOptions> {
    return {
      maxRetries: 3,
      baseDelay: 500,
      maxDelay: 5000,
      backoffMultiplier: 2,
      jitter: true
    };
  }
  
  /**
   * Configuration for database write operations (more conservative)
   */
  static get DATABASE_WRITE(): Partial<RetryOptions> {
    return {
      maxRetries: 2,
      baseDelay: 1000,
      maxDelay: 10000,
      backoffMultiplier: 3,
      jitter: true,
      retryCondition: (error: EnhancedError) => {
        // Only retry writes for network/connection issues
        return [
          ErrorType.NETWORK,
          ErrorType.TIMEOUT,
          ErrorType.CONNECTION
        ].includes(error.type);
      }
    };
  }
  
  /**
   * Configuration for authentication operations
   */
  static get AUTHENTICATION(): Partial<RetryOptions> {
    return {
      maxRetries: 1,
      baseDelay: 2000,
      maxDelay: 5000,
      backoffMultiplier: 2,
      jitter: false,
      retryCondition: (error: EnhancedError) => {
        // Only retry auth for network issues, not invalid credentials
        return error.type === ErrorType.NETWORK;
      }
    };
  }
  
  /**
   * Configuration for rate-limited operations
   */
  static get RATE_LIMITED(): Partial<RetryOptions> {
    return {
      maxRetries: 5,
      baseDelay: 2000,
      maxDelay: 60000, // 1 minute
      backoffMultiplier: 2,
      jitter: true,
      retryCondition: (error: EnhancedError) => {
        return error.type === ErrorType.RATE_LIMIT;
      }
    };
  }
  
  /**
   * Configuration for critical operations that must succeed
   */
  static get CRITICAL(): Partial<RetryOptions> {
    return {
      maxRetries: 5,
      baseDelay: 1000,
      maxDelay: 30000,
      backoffMultiplier: 1.5,
      jitter: true
    };
  }
}

/**
 * Convenience wrapper for common retry patterns
 */
export class RetryableOperations {
  /**
   * Execute database read with appropriate retry logic
   */
  static async databaseRead<T>(
    operation: () => Promise<T>,
    context?: string
  ): Promise<T> {
    return RetryHandler.executeWithRetry(
      operation,
      RetryConfigurations.DATABASE_READ,
      context
    );
  }
  
  /**
   * Execute database write with conservative retry logic
   */
  static async databaseWrite<T>(
    operation: () => Promise<T>,
    context?: string
  ): Promise<T> {
    return RetryHandler.executeWithRetry(
      operation,
      RetryConfigurations.DATABASE_WRITE,
      context
    );
  }
  
  /**
   * Execute authentication operation with minimal retries
   */
  static async authentication<T>(
    operation: () => Promise<T>,
    context?: string
  ): Promise<T> {
    return RetryHandler.executeWithRetry(
      operation,
      RetryConfigurations.AUTHENTICATION,
      context
    );
  }
  
  /**
   * Execute operation that may be rate limited
   */
  static async rateLimited<T>(
    operation: () => Promise<T>,
    context?: string
  ): Promise<T> {
    return RetryHandler.executeWithRetry(
      operation,
      RetryConfigurations.RATE_LIMITED,
      context
    );
  }
  
  /**
   * Execute critical operation with maximum retry attempts
   */
  static async critical<T>(
    operation: () => Promise<T>,
    context?: string
  ): Promise<T> {
    return RetryHandler.executeWithRetry(
      operation,
      RetryConfigurations.CRITICAL,
      context
    );
  }
}

/**
 * Circuit breaker pattern for failing services
 */
export class CircuitBreaker {
  private failures: number = 0;
  private lastFailureTime: Date | null = null;
  private state: 'closed' | 'open' | 'half-open' = 'closed';
  
  constructor(
    private maxFailures: number = 5,
    private resetTimeout: number = 60000 // 1 minute
  ) {}
  
  async execute<T>(operation: () => Promise<T>): Promise<T> {
    if (this.state === 'open') {
      if (this.shouldAttemptReset()) {
        this.state = 'half-open';
      } else {
        throw new Error('Circuit breaker is open');
      }
    }
    
    try {
      const result = await operation();
      this.onSuccess();
      return result;
    } catch (error) {
      this.onFailure();
      throw error;
    }
  }
  
  private onSuccess(): void {
    this.failures = 0;
    this.state = 'closed';
    this.lastFailureTime = null;
  }
  
  private onFailure(): void {
    this.failures++;
    this.lastFailureTime = new Date();
    
    if (this.failures >= this.maxFailures) {
      this.state = 'open';
    }
  }
  
  private shouldAttemptReset(): boolean {
    return this.lastFailureTime !== null &&
           Date.now() - this.lastFailureTime.getTime() >= this.resetTimeout;
  }
  
  getState(): string {
    return this.state;
  }
}