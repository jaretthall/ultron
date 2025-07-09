/**
 * Performance Monitoring Utility for Ultron
 * Tracks and reports application performance metrics
 */

import * as React from 'react';

interface PerformanceMetric {
  name: string;
  value: number;
  timestamp: number;
  category: 'database' | 'component' | 'network' | 'cache' | 'bundle';
  metadata?: Record<string, any>;
}

interface ComponentRenderMetric {
  componentName: string;
  renderTime: number;
  propsChanged: boolean;
  stateChanged: boolean;
  timestamp: number;
}

interface DatabaseQueryMetric {
  query: string;
  duration: number;
  cached: boolean;
  resultCount?: number;
  timestamp: number;
}

class PerformanceMonitor {
  private metrics: PerformanceMetric[] = [];
  private componentMetrics: ComponentRenderMetric[] = [];
  private databaseMetrics: DatabaseQueryMetric[] = [];
  private bundleMetrics: any[] = [];
  private maxMetrics = 1000; // Limit stored metrics to prevent memory bloat

  /**
   * Track database query performance
   */
  trackDatabaseQuery(query: string, duration: number, cached: boolean = false, resultCount?: number) {
    const metric: DatabaseQueryMetric = {
      query: this.sanitizeQuery(query),
      duration,
      cached,
      resultCount,
      timestamp: Date.now()
    };

    this.databaseMetrics.push(metric);
    this.addMetric({
      name: 'database_query',
      value: duration,
      timestamp: Date.now(),
      category: 'database',
      metadata: { query: metric.query, cached, resultCount }
    });

    // Log slow queries
    if (duration > 1000 && !cached) {
      console.warn(`Slow database query detected (${duration}ms):`, query);
    }

    this.pruneMetrics();
  }

  /**
   * Track component render performance
   */
  trackComponentRender(
    componentName: string, 
    renderTime: number, 
    propsChanged: boolean = false, 
    stateChanged: boolean = false
  ) {
    const metric: ComponentRenderMetric = {
      componentName,
      renderTime,
      propsChanged,
      stateChanged,
      timestamp: Date.now()
    };

    this.componentMetrics.push(metric);
    this.addMetric({
      name: 'component_render',
      value: renderTime,
      timestamp: Date.now(),
      category: 'component',
      metadata: { componentName, propsChanged, stateChanged }
    });

    // Log slow renders
    if (renderTime > 16) { // > 16ms suggests dropped frame
      console.warn(`Slow component render detected (${renderTime}ms):`, componentName);
    }

    this.pruneMetrics();
  }

  /**
   * Track cache performance
   */
  trackCacheOperation(operation: 'hit' | 'miss' | 'set', key: string, duration?: number) {
    this.addMetric({
      name: `cache_${operation}`,
      value: duration || 0,
      timestamp: Date.now(),
      category: 'cache',
      metadata: { key, operation }
    });
  }

  /**
   * Track network request performance
   */
  trackNetworkRequest(url: string, duration: number, success: boolean, size?: number) {
    this.addMetric({
      name: 'network_request',
      value: duration,
      timestamp: Date.now(),
      category: 'network',
      metadata: { url: this.sanitizeUrl(url), success, size }
    });
  }

  /**
   * Track bundle load performance
   */
  trackBundleLoad(bundleName: string, duration: number, size: number) {
    const metric = {
      bundleName,
      duration,
      size,
      timestamp: Date.now()
    };

    this.bundleMetrics.push(metric);
    this.addMetric({
      name: 'bundle_load',
      value: duration,
      timestamp: Date.now(),
      category: 'bundle',
      metadata: { bundleName, size }
    });
  }

  /**
   * Track Web Vitals performance metrics
   */
  trackWebVital(name: string, value: number, metadata?: Record<string, any>) {
    this.addMetric({
      name,
      value,
      timestamp: Date.now(),
      category: 'component',
      metadata
    });

    // Log poor Web Vitals scores
    if (name === 'largest_contentful_paint' && value > 2500) {
      console.warn(`Poor LCP detected (${value}ms)`);
    } else if (name === 'first_input_delay' && value > 100) {
      console.warn(`Poor FID detected (${value}ms)`);
    } else if (name === 'cumulative_layout_shift' && value > 0.1) {
      console.warn(`Poor CLS detected (${value})`);
    }
  }

  /**
   * Get performance summary
   */
  getPerformanceSummary(timeWindowMs: number = 60000) {
    const cutoff = Date.now() - timeWindowMs;
    const recentMetrics = this.metrics.filter(m => m.timestamp > cutoff);

    return {
      database: this.getDatabaseSummary(cutoff),
      components: this.getComponentSummary(cutoff),
      cache: this.getCacheSummary(cutoff),
      network: this.getNetworkSummary(cutoff),
      bundle: this.getBundleSummary(cutoff),
      totalMetrics: recentMetrics.length
    };
  }

  /**
   * Get database performance summary
   */
  private getDatabaseSummary(cutoff: number) {
    const recent = this.databaseMetrics.filter(m => m.timestamp > cutoff);
    if (recent.length === 0) return null;

    const durations = recent.map(m => m.duration);
    const cached = recent.filter(m => m.cached).length;

    return {
      totalQueries: recent.length,
      cachedQueries: cached,
      cacheHitRate: (cached / recent.length) * 100,
      avgDuration: this.average(durations),
      maxDuration: Math.max(...durations),
      slowQueries: recent.filter(m => m.duration > 1000).length
    };
  }

  /**
   * Get component performance summary
   */
  private getComponentSummary(cutoff: number) {
    const recent = this.componentMetrics.filter(m => m.timestamp > cutoff);
    if (recent.length === 0) return null;

    const renderTimes = recent.map(m => m.renderTime);
    const slowRenders = recent.filter(m => m.renderTime > 16);

    return {
      totalRenders: recent.length,
      avgRenderTime: this.average(renderTimes),
      maxRenderTime: Math.max(...renderTimes),
      slowRenders: slowRenders.length,
      slowRenderRate: (slowRenders.length / recent.length) * 100
    };
  }

  /**
   * Get cache performance summary
   */
  private getCacheSummary(cutoff: number) {
    const recent = this.metrics.filter(m => 
      m.timestamp > cutoff && m.category === 'cache'
    );
    if (recent.length === 0) return null;

    const hits = recent.filter(m => m.name === 'cache_hit').length;
    const misses = recent.filter(m => m.name === 'cache_miss').length;
    const total = hits + misses;

    return {
      totalOperations: recent.length,
      hits,
      misses,
      hitRate: total > 0 ? (hits / total) * 100 : 0
    };
  }

  /**
   * Get network performance summary
   */
  private getNetworkSummary(cutoff: number) {
    const recent = this.metrics.filter(m => 
      m.timestamp > cutoff && m.category === 'network'
    );
    if (recent.length === 0) return null;

    const durations = recent.map(m => m.value);
    const successful = recent.filter(m => m.metadata?.success).length;

    return {
      totalRequests: recent.length,
      successRate: (successful / recent.length) * 100,
      avgDuration: this.average(durations),
      maxDuration: Math.max(...durations)
    };
  }

  /**
   * Get bundle performance summary
   */
  private getBundleSummary(cutoff: number) {
    const recent = this.bundleMetrics.filter(m => m.timestamp > cutoff);
    if (recent.length === 0) return null;

    const durations = recent.map(m => m.duration);
    const sizes = recent.map(m => m.size);

    return {
      bundlesLoaded: recent.length,
      avgLoadTime: this.average(durations),
      totalSize: sizes.reduce((sum, size) => sum + size, 0),
      avgSize: this.average(sizes)
    };
  }

  /**
   * Add generic metric
   */
  private addMetric(metric: PerformanceMetric) {
    this.metrics.push(metric);
    this.pruneMetrics();
  }

  /**
   * Remove old metrics to prevent memory bloat
   */
  private pruneMetrics() {
    if (this.metrics.length > this.maxMetrics) {
      this.metrics = this.metrics.slice(-this.maxMetrics);
    }
    if (this.componentMetrics.length > this.maxMetrics) {
      this.componentMetrics = this.componentMetrics.slice(-this.maxMetrics);
    }
    if (this.databaseMetrics.length > this.maxMetrics) {
      this.databaseMetrics = this.databaseMetrics.slice(-this.maxMetrics);
    }
    if (this.bundleMetrics.length > this.maxMetrics) {
      this.bundleMetrics = this.bundleMetrics.slice(-this.maxMetrics);
    }
  }

  /**
   * Sanitize query for logging
   */
  private sanitizeQuery(query: string): string {
    return query.replace(/(['"]).+?\1/g, '$1***$1').substring(0, 100);
  }

  /**
   * Sanitize URL for logging
   */
  private sanitizeUrl(url: string): string {
    try {
      const urlObj = new URL(url);
      return `${urlObj.protocol}//${urlObj.host}${urlObj.pathname}`;
    } catch {
      return url.substring(0, 50);
    }
  }

  /**
   * Calculate average of numbers
   */
  private average(numbers: number[]): number {
    return numbers.length > 0 ? numbers.reduce((sum, n) => sum + n, 0) / numbers.length : 0;
  }

  /**
   * Export performance data for analysis
   */
  exportData() {
    return {
      metrics: this.metrics,
      componentMetrics: this.componentMetrics,
      databaseMetrics: this.databaseMetrics,
      bundleMetrics: this.bundleMetrics,
      summary: this.getPerformanceSummary(),
      timestamp: Date.now()
    };
  }

  /**
   * Clear all performance data
   */
  clear() {
    this.metrics = [];
    this.componentMetrics = [];
    this.databaseMetrics = [];
    this.bundleMetrics = [];
  }
}

// Export singleton instance
export const performanceMonitor = new PerformanceMonitor();

// React Hook for component performance tracking
export function usePerformanceTracker(componentName: string) {
  const startTime = performance.now();

  React.useEffect(() => {
    const endTime = performance.now();
    performanceMonitor.trackComponentRender(componentName, endTime - startTime);
  });

  return {
    trackRender: (propsChanged?: boolean, stateChanged?: boolean) => {
      const endTime = performance.now();
      performanceMonitor.trackComponentRender(
        componentName, 
        endTime - startTime, 
        propsChanged, 
        stateChanged
      );
    }
  };
}

// Higher-order component for automatic performance tracking
export function withPerformanceTracking<P extends object>(
  WrappedComponent: React.ComponentType<P>,
  componentName?: string
) {
  return React.memo((props: P) => {
    const name = componentName || WrappedComponent.displayName || WrappedComponent.name;
    const startTime = performance.now();

    React.useEffect(() => {
      const endTime = performance.now();
      performanceMonitor.trackComponentRender(name, endTime - startTime);
    });

    return React.createElement(WrappedComponent, props);
  });
}

// Database query performance wrapper
export async function withDatabaseTracking<T>(
  queryName: string,
  queryFn: () => Promise<T>,
  cached: boolean = false
): Promise<T> {
  const startTime = performance.now();
  
  try {
    const result = await queryFn();
    const duration = performance.now() - startTime;
    
    const resultCount = Array.isArray(result) ? result.length : undefined;
    performanceMonitor.trackDatabaseQuery(queryName, duration, cached, resultCount);
    
    return result;
  } catch (error) {
    const duration = performance.now() - startTime;
    performanceMonitor.trackDatabaseQuery(`${queryName} (ERROR)`, duration, cached);
    throw error;
  }
}

// Web Vitals Performance Entry Interfaces
interface LargestContentfulPaintEntry extends PerformanceEntry {
  readonly element?: Element;
  readonly id?: string;
  readonly loadTime: DOMHighResTimeStamp;
  readonly renderTime: DOMHighResTimeStamp;
  readonly size: number;
  readonly url?: string;
}

interface FirstInputDelayEntry extends PerformanceEntry {
  readonly cancelable: boolean;
  readonly processingStart: DOMHighResTimeStamp;
  readonly target?: EventTarget;
}

// interface LayoutShiftEntry extends PerformanceEntry {
//   readonly hadRecentInput: boolean;
//   readonly lastInputTime: DOMHighResTimeStamp;
//   readonly sources: LayoutShiftAttribution[];
//   readonly value: number;
// }

interface LayoutShiftAttribution {
  readonly currentRect: DOMRectReadOnly;
  readonly node?: Node;
  readonly previousRect: DOMRectReadOnly;
}

interface CumulativeLayoutShiftEntry extends PerformanceEntry {
  readonly hadRecentInput: boolean;
  readonly lastInputTime: DOMHighResTimeStamp;
  readonly sources: LayoutShiftAttribution[];
  readonly value: number;
}

// Initialize performance observer for Web Vitals
if (typeof window !== 'undefined' && 'PerformanceObserver' in window) {
  // Track Largest Contentful Paint (LCP)
  new PerformanceObserver((list) => {
    for (const entry of list.getEntries()) {
      const lcpEntry = entry as LargestContentfulPaintEntry;
      performanceMonitor.trackWebVital('largest_contentful_paint', entry.startTime, {
        size: lcpEntry.size,
        element: lcpEntry.element?.tagName || 'unknown',
        url: lcpEntry.url
      });
    }
  }).observe({ type: 'largest-contentful-paint', buffered: true });

  // Track First Input Delay (FID)
  new PerformanceObserver((list) => {
    for (const entry of list.getEntries()) {
      const fidEntry = entry as FirstInputDelayEntry;
      const delay = fidEntry.processingStart - entry.startTime;
      performanceMonitor.trackWebVital('first_input_delay', delay, {
        processingStart: fidEntry.processingStart,
        startTime: entry.startTime,
        target: fidEntry.target?.constructor.name || 'unknown'
      });
    }
  }).observe({ type: 'first-input', buffered: true });

  // Track Cumulative Layout Shift (CLS)
  new PerformanceObserver((list) => {
    for (const entry of list.getEntries()) {
      const clsEntry = entry as CumulativeLayoutShiftEntry;
      // Only track layout shifts that weren't caused by user input
      if (!clsEntry.hadRecentInput) {
        performanceMonitor.trackWebVital('cumulative_layout_shift', clsEntry.value, {
          hadRecentInput: clsEntry.hadRecentInput,
          lastInputTime: clsEntry.lastInputTime,
          sources: clsEntry.sources.map(source => ({
            node: source.node?.nodeName || 'unknown',
            currentRect: {
              width: source.currentRect.width,
              height: source.currentRect.height,
              x: source.currentRect.x,
              y: source.currentRect.y
            },
            previousRect: {
              width: source.previousRect.width,
              height: source.previousRect.height,
              x: source.previousRect.x,
              y: source.previousRect.y
            }
          }))
        });
      }
    }
  }).observe({ type: 'layout-shift', buffered: true });
}