/**
 * Enhanced Error Handling System for Ultron
 * Phase 2 Implementation - Comprehensive error classification and user-friendly messaging
 */

export enum ErrorType {
  NETWORK = 'network',
  AUTHENTICATION = 'authentication',
  AUTHORIZATION = 'authorization',
  VALIDATION = 'validation',
  CONSTRAINT = 'constraint',
  NOT_FOUND = 'not_found',
  RATE_LIMIT = 'rate_limit',
  SERVER = 'server',
  TIMEOUT = 'timeout',
  CONNECTION = 'connection',
  UNKNOWN = 'unknown'
}

export interface EnhancedError {
  type: ErrorType;
  code: string;
  message: string;
  userMessage: string;
  details?: any;
  retryable: boolean;
  timestamp: Date;
  context?: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
}

export class ErrorClassifier {
  /**
   * Classify Supabase errors into enhanced error objects
   */
  static classifySupabaseError(error: any, context?: string): EnhancedError {
    const timestamp = new Date();
    
    // Authentication errors
    if (this.isAuthenticationError(error)) {
      return {
        type: ErrorType.AUTHENTICATION,
        code: error.code || 'AUTH_ERROR',
        message: error.message,
        userMessage: 'Please sign in again to continue.',
        retryable: false,
        timestamp,
        context,
        severity: 'high'
      };
    }
    
    // Authorization errors (RLS violations)
    if (this.isAuthorizationError(error)) {
      return {
        type: ErrorType.AUTHORIZATION,
        code: error.code || 'AUTHORIZATION_ERROR',
        message: error.message,
        userMessage: 'You do not have permission to perform this action.',
        retryable: false,
        timestamp,
        context,
        severity: 'high'
      };
    }
    
    // Foreign key constraint errors
    if (this.isForeignKeyError(error)) {
      return {
        type: ErrorType.CONSTRAINT,
        code: 'FOREIGN_KEY_VIOLATION',
        message: error.message,
        userMessage: 'This item cannot be modified because it is linked to other data.',
        details: error.details,
        retryable: false,
        timestamp,
        context,
        severity: 'medium'
      };
    }
    
    // Unique constraint errors
    if (this.isUniqueConstraintError(error)) {
      return {
        type: ErrorType.CONSTRAINT,
        code: 'UNIQUE_VIOLATION',
        message: error.message,
        userMessage: 'This item already exists. Please choose a different name or value.',
        details: error.details,
        retryable: false,
        timestamp,
        context,
        severity: 'medium'
      };
    }
    
    // Network/connection errors
    if (this.isNetworkError(error)) {
      return {
        type: ErrorType.NETWORK,
        code: 'NETWORK_ERROR',
        message: error.message,
        userMessage: 'Connection issue. Please check your internet connection and try again.',
        retryable: true,
        timestamp,
        context,
        severity: 'medium'
      };
    }
    
    // Timeout errors
    if (this.isTimeoutError(error)) {
      return {
        type: ErrorType.TIMEOUT,
        code: 'OPERATION_TIMEOUT',
        message: error.message,
        userMessage: 'The operation took too long. Please try again.',
        retryable: true,
        timestamp,
        context,
        severity: 'low'
      };
    }
    
    // Rate limiting
    if (this.isRateLimitError(error)) {
      return {
        type: ErrorType.RATE_LIMIT,
        code: 'RATE_LIMITED',
        message: error.message,
        userMessage: 'Too many requests. Please wait a moment and try again.',
        retryable: true,
        timestamp,
        context,
        severity: 'low'
      };
    }
    
    // Validation errors
    if (this.isValidationError(error)) {
      return {
        type: ErrorType.VALIDATION,
        code: 'VALIDATION_ERROR',
        message: error.message,
        userMessage: this.extractValidationMessage(error),
        retryable: false,
        timestamp,
        context,
        severity: 'medium'
      };
    }
    
    // Not found errors
    if (this.isNotFoundError(error)) {
      return {
        type: ErrorType.NOT_FOUND,
        code: 'NOT_FOUND',
        message: error.message,
        userMessage: 'The requested item was not found.',
        retryable: false,
        timestamp,
        context,
        severity: 'low'
      };
    }
    
    // Server errors
    if (this.isServerError(error)) {
      return {
        type: ErrorType.SERVER,
        code: error.code || 'SERVER_ERROR',
        message: error.message,
        userMessage: 'Server error. Please try again in a moment.',
        retryable: true,
        timestamp,
        context,
        severity: 'high'
      };
    }
    
    // Default classification
    return {
      type: ErrorType.UNKNOWN,
      code: error.code || 'UNKNOWN_ERROR',
      message: error.message || 'An unknown error occurred',
      userMessage: 'Something went wrong. Please try again.',
      retryable: true,
      timestamp,
      context,
      severity: 'medium'
    };
  }
  
  // Error detection methods
  private static isAuthenticationError(error: any): boolean {
    return error.message?.includes('JWT') ||
           error.message?.includes('invalid_grant') ||
           error.message?.includes('unauthorized') ||
           error.code === 'PGRST301' ||
           error.code === '401';
  }
  
  private static isAuthorizationError(error: any): boolean {
    return error.message?.includes('permission denied') ||
           error.message?.includes('access denied') ||
           error.message?.includes('RLS') ||
           error.code === 'PGRST013' ||
           error.code === '403';
  }
  
  private static isForeignKeyError(error: any): boolean {
    return error.message?.includes('foreign key constraint') ||
           error.message?.includes('violates foreign key constraint') ||
           error.code === '23503';
  }
  
  private static isUniqueConstraintError(error: any): boolean {
    return error.message?.includes('unique constraint') ||
           error.message?.includes('duplicate key') ||
           error.code === '23505';
  }
  
  private static isNetworkError(error: any): boolean {
    return error.message?.includes('Failed to fetch') ||
           error.message?.includes('NetworkError') ||
           error.message?.includes('fetch') ||
           error.name === 'NetworkError' ||
           error.code === 'NETWORK_ERROR';
  }
  
  private static isTimeoutError(error: any): boolean {
    return error.message?.includes('timeout') ||
           error.message?.includes('timed out') ||
           error.name === 'TimeoutError' ||
           error.code === 'ETIMEDOUT';
  }
  
  private static isRateLimitError(error: any): boolean {
    return error.code === '429' ||
           error.message?.includes('rate limit') ||
           error.message?.includes('too many requests');
  }
  
  private static isValidationError(error: any): boolean {
    return error.message?.includes('invalid input syntax') ||
           error.message?.includes('check constraint') ||
           error.message?.includes('not-null constraint') ||
           error.code?.startsWith('22') || // Data type errors
           error.code === '23514'; // Check constraint violation
  }
  
  private static isNotFoundError(error: any): boolean {
    return error.code === 'PGRST116' || // No rows returned
           error.message?.includes('not found') ||
           error.code === '404';
  }
  
  private static isServerError(error: any): boolean {
    return error.code?.startsWith('5') ||
           error.message?.includes('server error') ||
           error.message?.includes('internal server error');
  }
  
  private static extractValidationMessage(error: any): string {
    if (error.message?.includes('invalid input syntax for type uuid')) {
      return 'Invalid ID format. Please try again.';
    }
    
    if (error.message?.includes('not-null constraint')) {
      const field = error.message.match(/column "([^"]+)"/)?.[1];
      return field ? `${field} is required.` : 'Required field is missing.';
    }
    
    if (error.message?.includes('check constraint')) {
      return 'The provided value does not meet the required format.';
    }
    
    return 'Invalid data format. Please check your input and try again.';
  }
}

export class ErrorReporter {
  /**
   * Log error for debugging/monitoring
   */
  static logError(error: EnhancedError): void {
    const logLevel = this.getLogLevel(error.severity);
    const logMessage = `[${error.type}] ${error.context || 'Unknown'}: ${error.message}`;
    
    console[logLevel](logMessage, {
      code: error.code,
      userMessage: error.userMessage,
      retryable: error.retryable,
      timestamp: error.timestamp,
      details: error.details
    });
    
    // In production, you might send to monitoring service:
    // this.sendToMonitoring(error);
  }
  
  private static getLogLevel(severity: string): 'log' | 'warn' | 'error' {
    switch (severity) {
      case 'critical':
      case 'high':
        return 'error';
      case 'medium':
        return 'warn';
      default:
        return 'log';
    }
  }
  
  /**
   * Get user-friendly error message for UI display
   */
  static getUserMessage(error: EnhancedError): string {
    return error.userMessage;
  }
  
  /**
   * Determine if error should be retried
   */
  static isRetryable(error: EnhancedError): boolean {
    return error.retryable;
  }
}

/**
 * Custom error class for enhanced errors
 */
export class UltronError extends Error {
  public enhancedError: EnhancedError;
  
  constructor(enhancedError: EnhancedError) {
    super(enhancedError.message);
    this.name = 'UltronError';
    this.enhancedError = enhancedError;
  }
}

/**
 * Helper function to wrap standard errors
 */
export function enhanceError(error: any, context?: string): UltronError {
  const enhancedError = ErrorClassifier.classifySupabaseError(error, context);
  ErrorReporter.logError(enhancedError);
  return new UltronError(enhancedError);
}