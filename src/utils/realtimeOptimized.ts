/**
 * Optimized Real-time Subscription System for Ultron
 * Performance-focused implementation with intelligent connection management
 */

import { supabase } from '../../lib/supabaseClient';
import { dataCache, cacheInvalidation, CACHE_KEYS } from './dataCache';

interface SubscriptionOptions {
  table: string;
  event?: 'INSERT' | 'UPDATE' | 'DELETE' | '*';
  filter?: string;
  throttleMs?: number;
  batchUpdates?: boolean;
}

interface OptimizedSubscription {
  id: string;
  channel: any;
  cleanup: () => void;
  isActive: boolean;
}

class OptimizedRealtimeManager {
  private subscriptions = new Map<string, OptimizedSubscription>();
  private connectionState: 'connected' | 'connecting' | 'disconnected' = 'disconnected';
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private baseDelay = 1000; // Start with 1 second
  private updateBatches = new Map<string, any[]>();
  private batchTimers = new Map<string, NodeJS.Timeout>();

  /**
   * Create optimized subscription with intelligent batching
   */
  async subscribe(
    subscriptionId: string,
    options: SubscriptionOptions,
    callback: (payload: any) => void
  ): Promise<OptimizedSubscription> {
    
    if (!supabase) {
      console.warn('Supabase not initialized - skipping real-time subscription');
      return this.createMockSubscription(subscriptionId);
    }

    // Check if subscription already exists
    if (this.subscriptions.has(subscriptionId)) {
      console.log(`Subscription ${subscriptionId} already exists, reusing...`);
      return this.subscriptions.get(subscriptionId)!;
    }

    try {
      const channel = supabase.channel(`optimized_${subscriptionId}`, {
        config: {
          presence: { key: subscriptionId },
          broadcast: { self: false },
          private: false
        }
      });

      // Create optimized callback with caching and batching
      const optimizedCallback = this.createOptimizedCallback(
        subscriptionId,
        options,
        callback
      );

      // Configure subscription
      const filter = options.filter 
        ? { event: options.event || '*', schema: 'public', table: options.table, filter: options.filter }
        : { event: options.event || '*', schema: 'public', table: options.table };

      channel.on('postgres_changes', filter, optimizedCallback);

      // Subscribe with error handling
      channel.subscribe((status) => {
        console.log(`Subscription ${subscriptionId} status:`, status);
        
        if (status === 'SUBSCRIBED') {
          this.connectionState = 'connected';
          this.reconnectAttempts = 0;
        } else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
          this.handleConnectionError(subscriptionId);
        }
      });

      const subscription: OptimizedSubscription = {
        id: subscriptionId,
        channel,
        cleanup: () => this.cleanup(subscriptionId),
        isActive: true
      };

      this.subscriptions.set(subscriptionId, subscription);
      return subscription;

    } catch (error) {
      console.error(`Failed to create subscription ${subscriptionId}:`, error);
      return this.createMockSubscription(subscriptionId);
    }
  }

  /**
   * Create optimized callback with caching, throttling, and batching
   */
  private createOptimizedCallback(
    subscriptionId: string,
    options: SubscriptionOptions,
    originalCallback: (payload: any) => void
  ) {
    return (payload: any) => {
      try {
        // Handle cache invalidation intelligently
        this.handleCacheInvalidation(options.table, payload);

        // Apply throttling if specified
        if (options.throttleMs) {
          return this.throttleCallback(subscriptionId, payload, originalCallback, options.throttleMs);
        }

        // Apply batching if specified
        if (options.batchUpdates) {
          return this.batchCallback(subscriptionId, payload, originalCallback);
        }

        // Direct callback execution
        originalCallback(payload);

      } catch (error) {
        console.error(`Error in subscription callback ${subscriptionId}:`, error);
      }
    };
  }

  /**
   * Intelligent cache invalidation based on real-time events
   */
  private handleCacheInvalidation(table: string, payload: any) {
    const { eventType, new: newRecord, old: oldRecord } = payload;

    switch (table) {
      case 'projects':
        if (eventType === 'DELETE' || eventType === 'INSERT') {
          cacheInvalidation.projects();
        } else if (eventType === 'UPDATE' && newRecord?.id) {
          cacheInvalidation.project(newRecord.id);
        }
        break;

      case 'tasks':
        if (eventType === 'DELETE' || eventType === 'INSERT') {
          cacheInvalidation.tasks();
        } else if (eventType === 'UPDATE' && newRecord?.id) {
          cacheInvalidation.task(newRecord.id);
        }
        break;

      case 'schedules':
        cacheInvalidation.schedules();
        break;

      default:
        // Invalidate related analytics cache for any data change
        cacheInvalidation.analytics();
    }
  }

  /**
   * Throttle callback execution to prevent excessive updates
   */
  private throttleCallback(
    subscriptionId: string,
    payload: any,
    callback: (payload: any) => void,
    throttleMs: number
  ) {
    const throttleKey = `${subscriptionId}_throttle`;
    
    if (this.batchTimers.has(throttleKey)) {
      return; // Still within throttle period
    }

    callback(payload);

    // Set throttle timer
    const timer = setTimeout(() => {
      this.batchTimers.delete(throttleKey);
    }, throttleMs);

    this.batchTimers.set(throttleKey, timer);
  }

  /**
   * Batch multiple updates and process them together
   */
  private batchCallback(
    subscriptionId: string,
    payload: any,
    callback: (payload: any) => void
  ) {
    const batchKey = `${subscriptionId}_batch`;
    
    // Add to batch
    if (!this.updateBatches.has(batchKey)) {
      this.updateBatches.set(batchKey, []);
    }
    this.updateBatches.get(batchKey)!.push(payload);

    // Clear existing timer
    if (this.batchTimers.has(batchKey)) {
      clearTimeout(this.batchTimers.get(batchKey)!);
    }

    // Set new batch timer
    const timer = setTimeout(() => {
      const batch = this.updateBatches.get(batchKey) || [];
      if (batch.length > 0) {
        // Process batch as single update
        callback({ type: 'batch', updates: batch });
        this.updateBatches.delete(batchKey);
      }
      this.batchTimers.delete(batchKey);
    }, 500); // 500ms batch window

    this.batchTimers.set(batchKey, timer);
  }

  /**
   * Handle connection errors with exponential backoff
   */
  private async handleConnectionError(subscriptionId: string) {
    this.connectionState = 'disconnected';
    this.reconnectAttempts++;

    if (this.reconnectAttempts > this.maxReconnectAttempts) {
      console.error(`Max reconnection attempts reached for ${subscriptionId}`);
      return;
    }

    const delay = this.baseDelay * Math.pow(2, this.reconnectAttempts - 1);
    console.log(`Reconnecting ${subscriptionId} in ${delay}ms (attempt ${this.reconnectAttempts})`);

    setTimeout(() => {
      this.reconnectSubscription(subscriptionId);
    }, delay);
  }

  /**
   * Reconnect subscription after failure
   */
  private async reconnectSubscription(subscriptionId: string) {
    const subscription = this.subscriptions.get(subscriptionId);
    if (!subscription) return;

    try {
      this.connectionState = 'connecting';
      
      // Unsubscribe old channel
      if (subscription.channel) {
        supabase?.removeChannel(subscription.channel);
      }

      // Remove from map temporarily
      this.subscriptions.delete(subscriptionId);

      console.log(`Attempting to reconnect subscription: ${subscriptionId}`);
      
      // Note: This would require storing original options and callback
      // For now, mark as needing manual recreation
      console.warn(`Subscription ${subscriptionId} needs manual recreation`);

    } catch (error) {
      console.error(`Failed to reconnect subscription ${subscriptionId}:`, error);
      this.handleConnectionError(subscriptionId);
    }
  }

  /**
   * Create mock subscription for fallback
   */
  private createMockSubscription(subscriptionId: string): OptimizedSubscription {
    return {
      id: subscriptionId,
      channel: null,
      cleanup: () => {},
      isActive: false
    };
  }

  /**
   * Unsubscribe from specific subscription
   */
  unsubscribe(subscriptionId: string): void {
    const subscription = this.subscriptions.get(subscriptionId);
    if (!subscription) return;

    try {
      if (subscription.channel) {
        supabase?.removeChannel(subscription.channel);
      }
      
      subscription.cleanup();
      this.subscriptions.delete(subscriptionId);
      
      // Clear any pending timers
      const batchKey = `${subscriptionId}_batch`;
      const throttleKey = `${subscriptionId}_throttle`;
      
      if (this.batchTimers.has(batchKey)) {
        clearTimeout(this.batchTimers.get(batchKey)!);
        this.batchTimers.delete(batchKey);
      }
      
      if (this.batchTimers.has(throttleKey)) {
        clearTimeout(this.batchTimers.get(throttleKey)!);
        this.batchTimers.delete(throttleKey);
      }

      this.updateBatches.delete(batchKey);

      console.log(`Unsubscribed from: ${subscriptionId}`);
    } catch (error) {
      console.error(`Error unsubscribing from ${subscriptionId}:`, error);
    }
  }

  /**
   * Cleanup specific subscription
   */
  private cleanup(subscriptionId: string): void {
    this.unsubscribe(subscriptionId);
  }

  /**
   * Cleanup all subscriptions
   */
  unsubscribeAll(): void {
    for (const subscriptionId of this.subscriptions.keys()) {
      this.unsubscribe(subscriptionId);
    }
  }

  /**
   * Get connection statistics
   */
  getStats() {
    return {
      connectionState: this.connectionState,
      activeSubscriptions: this.subscriptions.size,
      reconnectAttempts: this.reconnectAttempts,
      subscriptionIds: Array.from(this.subscriptions.keys())
    };
  }
}

// Export singleton instance
export const realtimeManager = new OptimizedRealtimeManager();

// Cleanup on page unload
if (typeof window !== 'undefined') {
  window.addEventListener('beforeunload', () => {
    realtimeManager.unsubscribeAll();
  });
}