/**
 * Query Cache
 *
 * Prisma sorguları için optimize edilmiş cache wrapper
 * Service layer'da kullanılmak üzere tasarlandı
 */

import { TenantCache, createTenantCache } from './TenantCache';
import { CacheTTL, DEFAULT_CACHE_CONFIG } from './CacheConfig';

/**
 * Query Cache Options
 */
export interface QueryCacheOptions {
  ttl?: CacheTTL;
  tags?: string[];
  skipCache?: boolean;
}

/**
 * Pagination Parameters
 */
export interface PaginationParams {
  page?: number;
  pageSize?: number;
  skip?: number;
  take?: number;
}

/**
 * Paginated Result
 */
export interface PaginatedResult<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

/**
 * Query Cache Class
 *
 * Provides convenient methods for caching common query patterns
 */
export class QueryCache {
  private cache: TenantCache;
  private entity: string;

  constructor(
    tenantId: string,
    companyId: string,
    module: string,
    entity: string
  ) {
    this.cache = createTenantCache(tenantId, companyId, module);
    this.entity = entity;
  }

  /**
   * Cache findMany query
   */
  async findMany<T>(
    filters: Record<string, unknown>,
    fetcher: () => Promise<T[]>,
    options?: QueryCacheOptions
  ): Promise<T[]> {
    if (options?.skipCache) {
      return fetcher();
    }

    return this.cache.cacheList(
      this.entity,
      filters,
      fetcher,
      {
        ttl: options?.ttl || DEFAULT_CACHE_CONFIG.ttl.list,
        tags: options?.tags,
      }
    );
  }

  /**
   * Cache findUnique/findFirst query
   */
  async findOne<T>(
    id: string,
    fetcher: () => Promise<T | null>,
    options?: QueryCacheOptions
  ): Promise<T | null> {
    if (options?.skipCache) {
      return fetcher();
    }

    return this.cache.cacheDetail(
      this.entity,
      id,
      fetcher,
      {
        ttl: options?.ttl || DEFAULT_CACHE_CONFIG.ttl.detail,
        tags: options?.tags,
      }
    );
  }

  /**
   * Cache count query
   */
  async count(
    filters: Record<string, unknown>,
    fetcher: () => Promise<number>,
    options?: QueryCacheOptions
  ): Promise<number> {
    if (options?.skipCache) {
      return fetcher();
    }

    return this.cache.cacheCount(
      this.entity,
      filters,
      fetcher,
      {
        ttl: options?.ttl || DEFAULT_CACHE_CONFIG.ttl.count,
        tags: options?.tags,
      }
    );
  }

  /**
   * Cache paginated query
   */
  async findPaginated<T>(
    filters: Record<string, unknown>,
    pagination: PaginationParams,
    fetcher: () => Promise<T[]>,
    countFetcher: () => Promise<number>,
    options?: QueryCacheOptions
  ): Promise<PaginatedResult<T>> {
    const page = pagination.page || 1;
    const pageSize = pagination.pageSize || pagination.take || 20;

    // Create combined filter key with pagination
    const paginatedFilters = {
      ...filters,
      _page: page,
      _pageSize: pageSize,
    };

    const [data, total] = await Promise.all([
      this.findMany(paginatedFilters, fetcher, options),
      this.count(filters, countFetcher, options),
    ]);

    const totalPages = Math.ceil(total / pageSize);

    return {
      data,
      total,
      page,
      pageSize,
      totalPages,
      hasNext: page < totalPages,
      hasPrev: page > 1,
    };
  }

  /**
   * Invalidate entity cache on mutation
   */
  invalidate(id?: string): void {
    if (id) {
      this.cache.delete(this.entity, id);
    }
    // Always invalidate lists and counts
    this.cache.invalidateEntity(`${this.entity}:list`);
    this.cache.invalidateEntity(`${this.entity}:count`);
  }

  /**
   * Invalidate all cache for this entity
   */
  invalidateAll(): void {
    this.cache.invalidateEntity(this.entity);
  }

  /**
   * Create mutation wrapper that auto-invalidates cache
   */
  wrapMutation<TArgs, TResult>(
    mutation: (args: TArgs) => Promise<TResult>,
    getId?: (result: TResult) => string
  ): (args: TArgs) => Promise<TResult> {
    return async (args: TArgs) => {
      const result = await mutation(args);
      const id = getId ? getId(result) : undefined;
      this.invalidate(id);
      return result;
    };
  }
}

/**
 * Create Query Cache instance
 */
export function createQueryCache(
  tenantId: string,
  companyId: string,
  module: string,
  entity: string
): QueryCache {
  return new QueryCache(tenantId, companyId, module, entity);
}

/**
 * Query Cache Factory
 *
 * Pre-configured query caches for common entities
 */
export const QueryCacheFactory = {
  // Real Estate
  property: (tenantId: string, companyId: string) =>
    createQueryCache(tenantId, companyId, 'real-estate', 'property'),
  apartment: (tenantId: string, companyId: string) =>
    createQueryCache(tenantId, companyId, 'real-estate', 'apartment'),
  contract: (tenantId: string, companyId: string) =>
    createQueryCache(tenantId, companyId, 'real-estate', 'contract'),
  payment: (tenantId: string, companyId: string) =>
    createQueryCache(tenantId, companyId, 'real-estate', 'payment'),

  // Accounting
  invoice: (tenantId: string, companyId: string) =>
    createQueryCache(tenantId, companyId, 'accounting', 'invoice'),
  expense: (tenantId: string, companyId: string) =>
    createQueryCache(tenantId, companyId, 'accounting', 'expense'),
  subscription: (tenantId: string, companyId: string) =>
    createQueryCache(tenantId, companyId, 'accounting', 'subscription'),

  // Production
  product: (tenantId: string, companyId: string) =>
    createQueryCache(tenantId, companyId, 'production', 'product'),
  productionOrder: (tenantId: string, companyId: string) =>
    createQueryCache(tenantId, companyId, 'production', 'production-order'),
  stockMovement: (tenantId: string, companyId: string) =>
    createQueryCache(tenantId, companyId, 'production', 'stock-movement'),

  // Maintenance
  equipment: (tenantId: string, companyId: string) =>
    createQueryCache(tenantId, companyId, 'maintenance', 'equipment'),
  maintenanceRecord: (tenantId: string, companyId: string) =>
    createQueryCache(tenantId, companyId, 'maintenance', 'maintenance-record'),

  // Calendar
  calendarEvent: (tenantId: string, companyId: string) =>
    createQueryCache(tenantId, companyId, 'calendar', 'calendar-event'),

  // Notification
  notification: (tenantId: string, companyId: string) =>
    createQueryCache(tenantId, companyId, 'notification', 'notification'),
};
