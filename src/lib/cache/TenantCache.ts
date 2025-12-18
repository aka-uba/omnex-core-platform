/**
 * Tenant-Specific Cache
 *
 * Tenant izolasyonlu cache sistemi
 * Her tenant için ayrı cache namespace sağlar
 */

import { cacheManager, createTenantCacheKey } from './CacheManager';
import { CacheOptions, DEFAULT_CACHE_CONFIG } from './CacheConfig';

/**
 * Tenant Cache Options
 */
export interface TenantCacheOptions extends Omit<CacheOptions, 'tenantId'> {
  companyId?: string | undefined;
}

/**
 * Tenant Cache Class
 *
 * Usage:
 * ```typescript
 * const cache = new TenantCache('tenant-123', 'company-456');
 *
 * // Set
 * cache.set('property', 'prop-1', propertyData, { ttl: '5m' });
 *
 * // Get
 * const property = cache.get<Property>('property', 'prop-1');
 *
 * // Get or Set
 * const data = await cache.getOrSet('property', 'prop-1', async () => {
 *   return prisma.property.findUnique({ where: { id: 'prop-1' } });
 * }, { ttl: '5m' });
 * ```
 */
export class TenantCache {
  private tenantId: string;
  private companyId: string | undefined;
  private module: string | undefined;

  constructor(tenantId: string, companyId?: string, module?: string) {
    this.tenantId = tenantId;
    this.companyId = companyId;
    this.module = module;
  }

  /**
   * Create cache key for this tenant
   */
  private createKey(entity: string, ...identifiers: string[]): string {
    const module = this.module || 'app';
    return createTenantCacheKey(module, entity, this.tenantId, ...identifiers);
  }

  /**
   * Get cached value
   */
  get<T>(entity: string, ...identifiers: string[]): T | null {
    const key = this.createKey(entity, ...identifiers);
    return cacheManager.get<T>(key);
  }

  /**
   * Set cached value
   */
  set<T>(entity: string, identifiers: string[], data: T, options: TenantCacheOptions): void {
    const key = this.createKey(entity, ...identifiers);
    cacheManager.set(key, data, {
      ...options,
      tenantId: this.tenantId,
      companyId: this.companyId,
      tags: [
        ...(options.tags || []),
        `tenant:${this.tenantId}`,
        entity,
        this.module ? `module:${this.module}` : '',
      ].filter(Boolean),
    });
  }

  /**
   * Delete cached value
   */
  delete(entity: string, ...identifiers: string[]): boolean {
    const key = this.createKey(entity, ...identifiers);
    return cacheManager.delete(key);
  }

  /**
   * Get or set with callback
   */
  async getOrSet<T>(
    entity: string,
    identifiers: string[],
    fetcher: () => Promise<T>,
    options: TenantCacheOptions
  ): Promise<T> {
    const key = this.createKey(entity, ...identifiers);
    return cacheManager.getOrSet(key, fetcher, {
      ...options,
      tenantId: this.tenantId,
      companyId: this.companyId,
      tags: [
        ...(options.tags || []),
        `tenant:${this.tenantId}`,
        entity,
        this.module ? `module:${this.module}` : '',
      ].filter(Boolean),
    });
  }

  /**
   * Invalidate all cache for this entity
   */
  invalidateEntity(entity: string): number {
    const pattern = this.createKey(entity, '*');
    return cacheManager.invalidatePattern(pattern);
  }

  /**
   * Invalidate all cache for this tenant
   */
  invalidateAll(): number {
    return cacheManager.invalidateTenant(this.tenantId);
  }

  /**
   * Invalidate by tag
   */
  invalidateTag(tag: string): number {
    return cacheManager.invalidateTag(tag);
  }

  /**
   * Cache list query result
   */
  async cacheList<T>(
    entity: string,
    filters: Record<string, unknown>,
    fetcher: () => Promise<T[]>,
    options?: Partial<TenantCacheOptions>
  ): Promise<T[]> {
    const filterKey = Object.entries(filters)
      .filter(([, v]) => v !== undefined && v !== null)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([k, v]) => `${k}:${v}`)
      .join('|');

    return this.getOrSet(
      `${entity}:list`,
      [filterKey || 'all'],
      fetcher,
      {
        ttl: options?.ttl || DEFAULT_CACHE_CONFIG.ttl.list,
        tags: [...(options?.tags || []), `${entity}:list`],
      }
    );
  }

  /**
   * Cache count query result
   */
  async cacheCount(
    entity: string,
    filters: Record<string, unknown>,
    fetcher: () => Promise<number>,
    options?: Partial<TenantCacheOptions>
  ): Promise<number> {
    const filterKey = Object.entries(filters)
      .filter(([, v]) => v !== undefined && v !== null)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([k, v]) => `${k}:${v}`)
      .join('|');

    return this.getOrSet(
      `${entity}:count`,
      [filterKey || 'all'],
      fetcher,
      {
        ttl: options?.ttl || DEFAULT_CACHE_CONFIG.ttl.count,
        tags: [...(options?.tags || []), `${entity}:count`],
      }
    );
  }

  /**
   * Cache detail query result
   */
  async cacheDetail<T>(
    entity: string,
    id: string,
    fetcher: () => Promise<T | null>,
    options?: Partial<TenantCacheOptions>
  ): Promise<T | null> {
    return this.getOrSet(
      entity,
      [id],
      fetcher,
      {
        ttl: options?.ttl || DEFAULT_CACHE_CONFIG.ttl.detail,
        tags: [...(options?.tags || []), entity],
      }
    );
  }
}

/**
 * Create Tenant Cache instance
 */
export function createTenantCache(
  tenantId: string,
  companyId?: string,
  module?: string
): TenantCache {
  return new TenantCache(tenantId, companyId, module);
}

/**
 * Module-specific cache factories
 */
export const ModuleCaches = {
  realEstate: (tenantId: string, companyId?: string) =>
    createTenantCache(tenantId, companyId, 'real-estate'),

  accounting: (tenantId: string, companyId?: string) =>
    createTenantCache(tenantId, companyId, 'accounting'),

  production: (tenantId: string, companyId?: string) =>
    createTenantCache(tenantId, companyId, 'production'),

  maintenance: (tenantId: string, companyId?: string) =>
    createTenantCache(tenantId, companyId, 'maintenance'),

  calendar: (tenantId: string, companyId?: string) =>
    createTenantCache(tenantId, companyId, 'calendar'),

  notification: (tenantId: string, companyId?: string) =>
    createTenantCache(tenantId, companyId, 'notification'),

  hr: (tenantId: string, companyId?: string) =>
    createTenantCache(tenantId, companyId, 'hr'),

  chat: (tenantId: string, companyId?: string) =>
    createTenantCache(tenantId, companyId, 'chat'),

  webBuilder: (tenantId: string, companyId?: string) =>
    createTenantCache(tenantId, companyId, 'web-builder'),
};
