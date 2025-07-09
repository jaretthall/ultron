/**
 * Data Cache Utility for Ultron Performance Optimization
 * Implements intelligent caching for frequently accessed data
 */

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number; // Time to live in milliseconds
}

class DataCache {
  private cache = new Map<string, CacheEntry<any>>();
  private defaultTTL = 5 * 60 * 1000; // 5 minutes default TTL

  /**
   * Set cache entry with optional TTL
   */
  set<T>(key: string, data: T, ttl?: number): void {
    const entry: CacheEntry<T> = {
      data,
      timestamp: Date.now(),
      ttl: ttl || this.defaultTTL
    };
    this.cache.set(key, entry);
  }

  /**
   * Get cache entry if valid (not expired)
   */
  get<T>(key: string): T | null {
    const entry = this.cache.get(key);
    if (!entry) return null;

    // Check if entry has expired
    if (Date.now() - entry.timestamp > entry.ttl) {
      this.cache.delete(key);
      return null;
    }

    return entry.data as T;
  }

  /**
   * Check if cache has valid entry
   */
  has(key: string): boolean {
    return this.get(key) !== null;
  }

  /**
   * Invalidate specific cache entry
   */
  invalidate(key: string): void {
    this.cache.delete(key);
  }

  /**
   * Invalidate cache entries by pattern
   */
  invalidatePattern(pattern: string): void {
    const regex = new RegExp(pattern);
    for (const key of this.cache.keys()) {
      if (regex.test(key)) {
        this.cache.delete(key);
      }
    }
  }

  /**
   * Clear all cache entries
   */
  clear(): void {
    this.cache.clear();
  }

  /**
   * Clean expired entries
   */
  cleanup(): void {
    const now = Date.now();
    for (const [key, entry] of this.cache.entries()) {
      if (now - entry.timestamp > entry.ttl) {
        this.cache.delete(key);
      }
    }
  }

  /**
   * Get cache statistics
   */
  getStats() {
    return {
      size: this.cache.size,
      keys: Array.from(this.cache.keys())
    };
  }
}

// Global cache instance
export const dataCache = new DataCache();

// Cache key constants for consistent naming
export const CACHE_KEYS = {
  // Project-related caches
  ALL_PROJECTS: 'projects:all',
  PROJECT_BY_ID: (id: string) => `projects:${id}`,
  PROJECT_COMPLETION_METRICS: 'projects:completion_metrics',
  PROJECT_ANALYTICS: 'projects:analytics',

  // Task-related caches
  ALL_TASKS: 'tasks:all',
  TASK_BY_ID: (id: string) => `tasks:${id}`,
  TASKS_BY_PROJECT: (projectId: string) => `tasks:project:${projectId}`,
  TASKS_BY_STATUS: (status: string) => `tasks:status:${status}`,
  BLOCKED_TASKS: 'tasks:blocked',
  AVAILABLE_TASKS: 'tasks:available',
  TASKS_BY_PRIORITY: 'tasks:priority',
  TASK_DEPENDENCIES: (taskId: string) => `tasks:${taskId}:dependencies`,

  // Schedule-related caches
  ALL_SCHEDULES: 'schedules:all',
  SCHEDULES_BY_TASK: (taskId: string) => `schedules:task:${taskId}`,
  SCHEDULES_BY_DATE: (date: string) => `schedules:date:${date}`,

  // Analytics caches
  HOME_STATS: 'analytics:home_stats',
  TAG_ANALYTICS: 'analytics:tags',
  WORKLOAD_ANALYSIS: 'analytics:workload',
  PROGRESS_METRICS: 'analytics:progress',

  // User preferences
  USER_PREFERENCES: 'user:preferences'
} as const;

// Cache TTL configurations (in milliseconds)
export const CACHE_TTL = {
  SHORT: 1 * 60 * 1000,    // 1 minute - for rapidly changing data
  MEDIUM: 5 * 60 * 1000,   // 5 minutes - for moderately changing data
  LONG: 30 * 60 * 1000,    // 30 minutes - for stable data
  VERY_LONG: 2 * 60 * 60 * 1000  // 2 hours - for rarely changing data
} as const;

/**
 * Cache invalidation helper functions
 */
export const cacheInvalidation = {
  /**
   * Invalidate all project-related caches
   */
  projects(): void {
    dataCache.invalidatePattern('^projects:');
    dataCache.invalidate(CACHE_KEYS.HOME_STATS);
    dataCache.invalidate(CACHE_KEYS.PROGRESS_METRICS);
  },

  /**
   * Invalidate all task-related caches
   */
  tasks(): void {
    dataCache.invalidatePattern('^tasks:');
    dataCache.invalidate(CACHE_KEYS.HOME_STATS);
    dataCache.invalidate(CACHE_KEYS.PROGRESS_METRICS);
    dataCache.invalidate(CACHE_KEYS.WORKLOAD_ANALYSIS);
  },

  /**
   * Invalidate specific task and related caches
   */
  task(taskId: string): void {
    dataCache.invalidate(CACHE_KEYS.TASK_BY_ID(taskId));
    dataCache.invalidate(CACHE_KEYS.TASK_DEPENDENCIES(taskId));
    dataCache.invalidatePattern(`^tasks:(blocked|available|priority)`);
    dataCache.invalidate(CACHE_KEYS.HOME_STATS);
  },

  /**
   * Invalidate specific project and related caches
   */
  project(projectId: string): void {
    dataCache.invalidate(CACHE_KEYS.PROJECT_BY_ID(projectId));
    dataCache.invalidate(CACHE_KEYS.TASKS_BY_PROJECT(projectId));
    dataCache.invalidate(CACHE_KEYS.PROJECT_COMPLETION_METRICS);
    dataCache.invalidate(CACHE_KEYS.HOME_STATS);
  },

  /**
   * Invalidate all analytics caches
   */
  analytics(): void {
    dataCache.invalidatePattern('^analytics:');
  },

  /**
   * Invalidate schedules caches
   */
  schedules(): void {
    dataCache.invalidatePattern('^schedules:');
  }
};

/**
 * Cache-aware wrapper for async functions
 */
export function withCache<T>(
  key: string,
  fetcher: () => Promise<T>,
  ttl?: number
): Promise<T> {
  return new Promise(async (resolve, reject) => {
    try {
      // Try to get from cache first
      const cached = dataCache.get<T>(key);
      if (cached !== null) {
        resolve(cached);
        return;
      }

      // Fetch data and cache it
      const data = await fetcher();
      dataCache.set(key, data, ttl);
      resolve(data);
    } catch (error) {
      reject(error);
    }
  });
}

// Initialize cache cleanup interval (every 10 minutes)
if (typeof window !== 'undefined') {
  setInterval(() => {
    dataCache.cleanup();
  }, 10 * 60 * 1000);
}