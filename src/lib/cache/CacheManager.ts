/**
 * Cache Manager
 *
 * Merkezi cache yönetim sistemi
 * Prisma'dan bağımsız, Service layer üzerinde çalışır
 *
 * Mimari:
 * Controller → Service → CacheManager → Prisma
 *
 * NOT: Bu sistem Prisma schema'yı ETKİLEMEZ
 */

import {
  CacheEntry,
  CacheOptions,
  TTL_VALUES,
  DEFAULT_CACHE_CONFIG,
} from './CacheConfig';

/**
 * Cache Store Interface
 */
interface CacheStore<T> {
  get(key: string): CacheEntry<T> | undefined;
  set(key: string, entry: CacheEntry<T>): void;
  delete(key: string): boolean;
  clear(): void;
  keys(): string[];
  size(): number;
}

/**
 * In-Memory Cache Store Implementation
 */
class MemoryCacheStore<T> implements CacheStore<T> {
  private cache = new Map<string, CacheEntry<T>>();
  private maxSize: number;

  constructor(maxSize: number = 1000) {
    this.maxSize = maxSize;
  }

  get(key: string): CacheEntry<T> | undefined {
    return this.cache.get(key);
  }

  set(key: string, entry: CacheEntry<T>): void {
    // LRU eviction if max size reached
    if (this.cache.size >= this.maxSize && !this.cache.has(key)) {
      const oldestKey = this.cache.keys().next().value;
      if (oldestKey) {
        this.cache.delete(oldestKey);
      }
    }
    this.cache.set(key, entry);
  }

  delete(key: string): boolean {
    return this.cache.delete(key);
  }

  clear(): void {
    this.cache.clear();
  }

  keys(): string[] {
    return Array.from(this.cache.keys());
  }

  size(): number {
    return this.cache.size;
  }
}

/**
 * Cache Manager Class
 */
export class CacheManager {
  private static instance: CacheManager;
  private store: CacheStore<unknown>;
  private tagIndex = new Map<string, Set<string>>(); // tag -> keys
  private enabled: boolean;
  private debug: boolean;
  private cleanupIntervalId: NodeJS.Timeout | null = null;

  private constructor() {
    this.store = new MemoryCacheStore(2000);
    this.enabled = DEFAULT_CACHE_CONFIG.enabled;
    this.debug = DEFAULT_CACHE_CONFIG.debug;

    // Start cleanup interval
    this.startCleanupInterval();
  }

  /**
   * Singleton instance
   */
  static getInstance(): CacheManager {
    if (!CacheManager.instance) {
      CacheManager.instance = new CacheManager();
    }
    return CacheManager.instance;
  }

  /**
   * Get cached value
   */
  get<T>(key: string): T | null {
    if (!this.enabled) return null;

    const entry = this.store.get(key) as CacheEntry<T> | undefined;

    if (!entry) {
      this.log('MISS', key);
      return null;
    }

    // Check if expired
    if (Date.now() - entry.timestamp > entry.ttl) {
      this.log('EXPIRED', key);
      this.delete(key);
      return null;
    }

    this.log('HIT', key);
    return entry.data;
  }

  /**
   * Set cached value
   */
  set<T>(key: string, data: T, options: CacheOptions): void {
    if (!this.enabled) return;

    const ttl = TTL_VALUES[options.ttl];
    const entry: CacheEntry<T> = {
      data,
      timestamp: Date.now(),
      ttl,
      key,
      tags: options.tags,
    };

    this.store.set(key, entry);

    // Index by tags for invalidation
    if (options.tags) {
      for (const tag of options.tags) {
        if (!this.tagIndex.has(tag)) {
          this.tagIndex.set(tag, new Set());
        }
        this.tagIndex.get(tag)!.add(key);
      }
    }

    this.log('SET', key, `TTL: ${options.ttl}`);
  }

  /**
   * Delete cached value
   */
  delete(key: string): boolean {
    const entry = this.store.get(key);
    if (entry?.tags) {
      for (const tag of entry.tags) {
        this.tagIndex.get(tag)?.delete(key);
      }
    }
    this.log('DELETE', key);
    return this.store.delete(key);
  }

  /**
   * Invalidate by pattern (wildcard support)
   *
   * Example: invalidatePattern('real-estate:property:tenant123:*')
   */
  invalidatePattern(pattern: string): number {
    const keys = this.store.keys();
    const regex = new RegExp('^' + pattern.replace(/\*/g, '.*') + '$');
    let count = 0;

    for (const key of keys) {
      if (regex.test(key)) {
        this.delete(key);
        count++;
      }
    }

    this.log('INVALIDATE_PATTERN', pattern, `Deleted: ${count}`);
    return count;
  }

  /**
   * Invalidate by tag
   *
   * Example: invalidateTag('property')
   */
  invalidateTag(tag: string): number {
    const keys = this.tagIndex.get(tag);
    if (!keys) return 0;

    let count = 0;
    for (const key of keys) {
      this.store.delete(key);
      count++;
    }

    this.tagIndex.delete(tag);
    this.log('INVALIDATE_TAG', tag, `Deleted: ${count}`);
    return count;
  }

  /**
   * Invalidate all caches for a tenant
   */
  invalidateTenant(tenantId: string): number {
    return this.invalidatePattern(`*:${tenantId}:*`);
  }

  /**
   * Clear all cache
   */
  clear(): void {
    this.store.clear();
    this.tagIndex.clear();
    this.log('CLEAR', 'all');
  }

  /**
   * Get cache statistics
   */
  getStats(): CacheStats {
    return {
      size: this.store.size(),
      enabled: this.enabled,
      tags: this.tagIndex.size,
    };
  }

  /**
   * Get or set with callback (cache-aside pattern)
   */
  async getOrSet<T>(
    key: string,
    fetcher: () => Promise<T>,
    options: CacheOptions
  ): Promise<T> {
    // Try to get from cache
    const cached = this.get<T>(key);
    if (cached !== null) {
      return cached;
    }

    // Fetch from source
    const data = await fetcher();

    // Cache the result
    this.set(key, data, options);

    return data;
  }

  /**
   * Batch get
   */
  getMany<T>(keys: string[]): Map<string, T | null> {
    const results = new Map<string, T | null>();
    for (const key of keys) {
      results.set(key, this.get<T>(key));
    }
    return results;
  }

  /**
   * Batch set
   */
  setMany<T>(entries: Array<{ key: string; data: T; options: CacheOptions }>): void {
    for (const { key, data, options } of entries) {
      this.set(key, data, options);
    }
  }

  /**
   * Enable/disable cache
   */
  setEnabled(enabled: boolean): void {
    this.enabled = enabled;
    this.log('CONFIG', 'enabled', String(enabled));
  }

  /**
   * Set debug mode
   */
  setDebug(debug: boolean): void {
    this.debug = debug;
  }

  /**
   * Cleanup expired entries
   */
  private cleanup(): void {
    const keys = this.store.keys();
    let cleaned = 0;

    for (const key of keys) {
      const entry = this.store.get(key);
      if (entry && Date.now() - entry.timestamp > entry.ttl) {
        this.delete(key);
        cleaned++;
      }
    }

    if (cleaned > 0) {
      this.log('CLEANUP', 'expired', `Cleaned: ${cleaned}`);
    }
  }

  /**
   * Start periodic cleanup
   */
  private startCleanupInterval(): void {
    // Run cleanup every 5 minutes - prevent multiple intervals
    if (!this.cleanupIntervalId) {
      this.cleanupIntervalId = setInterval(() => this.cleanup(), 5 * 60 * 1000);
    }
  }

  /**
   * Stop cleanup interval for graceful shutdown
   */
  destroy(): void {
    if (this.cleanupIntervalId) {
      clearInterval(this.cleanupIntervalId);
      this.cleanupIntervalId = null;
    }
    this.clear();
  }

  /**
   * Debug logging
   */
  private log(action: string, key: string, extra?: string): void {
    if (this.debug) {
      const timestamp = new Date().toISOString();
      console.log(`[Cache ${timestamp}] ${action}: ${key}${extra ? ` (${extra})` : ''}`);
    }
  }
}

/**
 * Cache Statistics Interface
 */
export interface CacheStats {
  size: number;
  enabled: boolean;
  tags: number;
}

/**
 * Export singleton instance
 */
export const cacheManager = CacheManager.getInstance();

/**
 * Helper function for creating cache key
 */
export function createCacheKey(parts: string[]): string {
  return parts.filter(Boolean).join(':');
}

/**
 * Helper function for tenant-scoped cache key
 */
export function createTenantCacheKey(
  module: string,
  entity: string,
  tenantId: string,
  ...identifiers: string[]
): string {
  return createCacheKey([module, entity, tenantId, ...identifiers]);
}
