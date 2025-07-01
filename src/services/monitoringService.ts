/**
 * Monitoring Service for Error Tracking and Performance Monitoring
 * Phase 6 - Production Readiness implementation
 */

import { SecurityLogger } from '../utils/securityUtils';

// Error Tracking Interface
interface ErrorContext {
  userId?: string;
  userAgent: string;
  url: string;
  timestamp: string;
  sessionId?: string;
  additionalData?: Record<string, any>;
}

interface PerformanceMetric {
  name: string;
  value: number;
  timestamp: string;
  url: string;
  additionalData?: Record<string, any>;
}

// Error Categories
export enum ErrorCategory {
  AUTHENTICATION = 'authentication',
  DATABASE = 'database',
  API = 'api',
  UI = 'ui',
  PERFORMANCE = 'performance',
  SECURITY = 'security',
  VALIDATION = 'validation'
}

// Error Severity Levels
export enum ErrorSeverity {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical'
}

class MonitoringService {
  private sessionId: string;
  private userId?: string;
  private errorQueue: any[] = [];
  private performanceQueue: PerformanceMetric[] = [];
  private isOnline: boolean = navigator.onLine;

  constructor() {
    this.sessionId = this.generateSessionId();
    this.initializeMonitoring();
  }

  /**
   * Generate unique session ID
   */
  private generateSessionId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Initialize monitoring setup
   */
  private initializeMonitoring(): void {
    // Monitor online/offline status
    window.addEventListener('online', () => {
      this.isOnline = true;
      this.flushQueues();
    });

    window.addEventListener('offline', () => {
      this.isOnline = false;
    });

    // Global error handler
    window.addEventListener('error', (event) => {
      this.captureException(new Error(event.message), {
        category: ErrorCategory.UI,
        severity: ErrorSeverity.MEDIUM,
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno
      });
    });

    // Unhandled promise rejection handler
    window.addEventListener('unhandledrejection', (event) => {
      this.captureException(
        new Error(`Unhandled Promise Rejection: ${event.reason}`),
        {
          category: ErrorCategory.API,
          severity: ErrorSeverity.HIGH
        }
      );
    });

    // Performance monitoring
    this.initializePerformanceMonitoring();

    console.log('[MONITORING] Service initialized with session:', this.sessionId);
  }

  /**
   * Set current user ID for error tracking
   */
  setUserId(userId: string): void {
    this.userId = userId;
  }

  /**
   * Capture and track errors
   */
  captureException(
    error: Error,
    context: {
      category?: ErrorCategory;
      severity?: ErrorSeverity;
      additionalData?: Record<string, any>;
      filename?: string;
      lineno?: number;
      colno?: number;
    } = {}
  ): void {
    const errorData = {
      id: `error_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      message: error.message,
      stack: error.stack,
      name: error.name,
      category: context.category || ErrorCategory.UI,
      severity: context.severity || ErrorSeverity.MEDIUM,
      context: this.createErrorContext(context.additionalData),
      fingerprint: this.createErrorFingerprint(error)
    };

    // Log to console for development
    console.error('[MONITORING] Error captured:', errorData);

    // Add to queue
    this.errorQueue.push(errorData);

    // Log security event for high/critical errors
    if (context.severity === ErrorSeverity.HIGH || context.severity === ErrorSeverity.CRITICAL) {
      SecurityLogger.logSecurityEvent('suspicious_activity', {
        type: 'critical_error',
        error: error.message,
        category: context.category
      });
    }

    // Attempt to send immediately if online
    if (this.isOnline) {
      this.flushErrorQueue();
    }
  }

  /**
   * Capture custom messages/events
   */
  captureMessage(
    message: string,
    level: 'debug' | 'info' | 'warning' | 'error' = 'info',
    additionalData?: Record<string, any>
  ): void {
    const messageData = {
      id: `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      message,
      level,
      context: this.createErrorContext(additionalData),
      timestamp: new Date().toISOString()
    };

    console.log(`[MONITORING] Message captured [${level.toUpperCase()}]:`, messageData);

    // Add to queue for non-debug messages
    if (level !== 'debug') {
      this.errorQueue.push(messageData);
    }

    if (this.isOnline && level === 'error') {
      this.flushErrorQueue();
    }
  }

  /**
   * Track performance metrics
   */
  trackPerformance(metricName: string, value: number, additionalData?: Record<string, any>): void {
    const metric: PerformanceMetric = {
      name: metricName,
      value,
      timestamp: new Date().toISOString(),
      url: window.location.href,
      additionalData
    };

    this.performanceQueue.push(metric);

    // Log performance issues
    if (this.isPerformanceIssue(metricName, value)) {
      this.captureMessage(
        `Performance issue detected: ${metricName} = ${value}ms`,
        'warning',
        { metric: metricName, value, threshold: this.getPerformanceThreshold(metricName) }
      );
    }

    if (this.isOnline) {
      this.flushPerformanceQueue();
    }
  }

  /**
   * Track user interactions for analytics
   */
  trackUserInteraction(
    action: string,
    element?: string,
    additionalData?: Record<string, any>
  ): void {
    const interactionData = {
      action,
      element,
      timestamp: new Date().toISOString(),
      url: window.location.href,
      sessionId: this.sessionId,
      userId: this.userId,
      ...additionalData
    };

    console.log('[MONITORING] User interaction:', interactionData);

    // Store locally for privacy-compliant analytics
    this.storeLocalAnalytics('user_interaction', interactionData);
  }

  /**
   * Initialize Core Web Vitals monitoring
   */
  private initializePerformanceMonitoring(): void {
    // Largest Contentful Paint (LCP)
    this.observePerformanceMetric('largest-contentful-paint', (entry: any) => {
      this.trackPerformance('lcp', entry.value);
    });

    // First Input Delay (FID)
    this.observePerformanceMetric('first-input', (entry: any) => {
      this.trackPerformance('fid', entry.processingStart - entry.startTime);
    });

    // Cumulative Layout Shift (CLS)
    this.observePerformanceMetric('layout-shift', (entry: any) => {
      if (!entry.hadRecentInput) {
        this.trackPerformance('cls', entry.value);
      }
    });

    // Navigation timing
    window.addEventListener('load', () => {
      setTimeout(() => {
        const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
        if (navigation) {
          this.trackPerformance('dom_content_loaded', navigation.domContentLoadedEventEnd - navigation.domContentLoadedEventStart);
          this.trackPerformance('page_load', navigation.loadEventEnd - navigation.loadEventStart);
          this.trackPerformance('dns_lookup', navigation.domainLookupEnd - navigation.domainLookupStart);
        }
      }, 0);
    });
  }

  /**
   * Observe performance metrics using PerformanceObserver
   */
  private observePerformanceMetric(type: string, callback: (entry: any) => void): void {
    if ('PerformanceObserver' in window) {
      try {
        const observer = new PerformanceObserver((list) => {
          for (const entry of list.getEntries()) {
            callback(entry);
          }
        });
        observer.observe({ entryTypes: [type] });
      } catch (error) {
        console.warn(`Could not observe ${type}:`, error);
      }
    }
  }

  /**
   * Create error context with current application state
   */
  private createErrorContext(additionalData?: Record<string, any>): ErrorContext {
    return {
      userId: this.userId,
      userAgent: navigator.userAgent,
      url: window.location.href,
      timestamp: new Date().toISOString(),
      sessionId: this.sessionId,
      additionalData
    };
  }

  /**
   * Create error fingerprint for deduplication
   */
  private createErrorFingerprint(error: Error): string {
    const stackLines = error.stack?.split('\n').slice(0, 3).join('') || '';
    return `${error.name}:${error.message}:${stackLines}`.replace(/\s+/g, '');
  }

  /**
   * Check if metric indicates performance issue
   */
  private isPerformanceIssue(metricName: string, value: number): boolean {
    const thresholds: Record<string, number> = {
      'lcp': 2500, // ms
      'fid': 100,  // ms
      'cls': 0.1,  // score
      'page_load': 3000, // ms
      'api_response': 1000 // ms
    };

    return value > (thresholds[metricName] || Infinity);
  }

  /**
   * Get performance threshold for metric
   */
  private getPerformanceThreshold(metricName: string): number {
    const thresholds: Record<string, number> = {
      'lcp': 2500,
      'fid': 100,
      'cls': 0.1,
      'page_load': 3000,
      'api_response': 1000
    };

    return thresholds[metricName] || 0;
  }

  /**
   * Store analytics data locally for privacy compliance
   */
  private storeLocalAnalytics(type: string, data: any): void {
    try {
      const key = `analytics_${type}`;
      const existing = JSON.parse(localStorage.getItem(key) || '[]');
      existing.push(data);

      // Keep only last 1000 entries
      if (existing.length > 1000) {
        existing.splice(0, existing.length - 1000);
      }

      localStorage.setItem(key, JSON.stringify(existing));
    } catch (error) {
      console.warn('Failed to store analytics data:', error);
    }
  }

  /**
   * Flush error queue to monitoring service
   */
  private flushErrorQueue(): void {
    if (this.errorQueue.length === 0) return;

    // In production, send to monitoring service (e.g., Sentry)
    console.log('[MONITORING] Flushing errors:', this.errorQueue.length);
    
    // Clear queue after successful send
    this.errorQueue = [];
  }

  /**
   * Flush performance queue to monitoring service
   */
  private flushPerformanceQueue(): void {
    if (this.performanceQueue.length === 0) return;

    console.log('[MONITORING] Flushing performance metrics:', this.performanceQueue.length);
    
    // Clear queue after successful send
    this.performanceQueue = [];
  }

  /**
   * Flush all queues
   */
  private flushQueues(): void {
    this.flushErrorQueue();
    this.flushPerformanceQueue();
  }

  /**
   * Get monitoring statistics
   */
  getMonitoringStats(): {
    sessionId: string;
    userId?: string;
    queuedErrors: number;
    queuedMetrics: number;
    isOnline: boolean;
  } {
    return {
      sessionId: this.sessionId,
      userId: this.userId,
      queuedErrors: this.errorQueue.length,
      queuedMetrics: this.performanceQueue.length,
      isOnline: this.isOnline
    };
  }

  /**
   * Get local analytics data
   */
  getLocalAnalytics(type?: string): any[] {
    try {
      if (type) {
        return JSON.parse(localStorage.getItem(`analytics_${type}`) || '[]');
      }

      // Get all analytics data
      const allData: any[] = [];
      Object.keys(localStorage).forEach(key => {
        if (key.startsWith('analytics_')) {
          const data = JSON.parse(localStorage.getItem(key) || '[]');
          allData.push(...data.map((item: any) => ({ ...item, type: key.replace('analytics_', '') })));
        }
      });

      return allData.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    } catch (error) {
      console.error('Failed to get analytics data:', error);
      return [];
    }
  }
}

// Create singleton instance
const monitoringService = new MonitoringService();

// Export utilities for easy use
export const captureException = (error: Error, context?: any) => 
  monitoringService.captureException(error, context);

export const captureMessage = (message: string, level?: any, data?: any) => 
  monitoringService.captureMessage(message, level, data);

export const trackPerformance = (name: string, value: number, data?: any) => 
  monitoringService.trackPerformance(name, value, data);

export const trackUserInteraction = (action: string, element?: string, data?: any) => 
  monitoringService.trackUserInteraction(action, element, data);

export const setUserId = (userId: string) => 
  monitoringService.setUserId(userId);

export const getMonitoringStats = () => 
  monitoringService.getMonitoringStats();

export const getLocalAnalytics = (type?: string) => 
  monitoringService.getLocalAnalytics(type);

export default monitoringService; 