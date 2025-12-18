/**
 * Cache Module Export
 *
 * Merkezi cache sistemi export dosyası
 */

// Core exports
export { CacheManager, cacheManager, createCacheKey, createTenantCacheKey } from './CacheManager';
export type { CacheStats } from './CacheManager';

// Tenant-specific cache
export { TenantCache, createTenantCache, ModuleCaches } from './TenantCache';
export type { TenantCacheOptions } from './TenantCache';

// Configuration
export {
  TTL_VALUES,
  DEFAULT_CACHE_CONFIG,
  CACHE_KEY_PATTERNS,
  CACHE_TAGS,
} from './CacheConfig';
export type {
  CacheTTL,
  CacheStrategy,
  CacheEntry,
  CacheOptions,
} from './CacheConfig';

// Query helpers
export { QueryCache, createQueryCache } from './QueryCache';
export type { QueryCacheOptions, PaginatedResult, PaginationParams } from './QueryCache';
