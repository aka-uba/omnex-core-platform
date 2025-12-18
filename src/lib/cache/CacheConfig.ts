/**
 * Cache Configuration
 *
 * Merkezi cache yapılandırması
 * TTL değerleri, cache stratejileri ve invalidation kuralları
 */

export type CacheTTL = '1m' | '5m' | '15m' | '30m' | '1h' | '6h' | '12h' | '24h';

export const TTL_VALUES: Record<CacheTTL, number> = {
  '1m': 60 * 1000,
  '5m': 5 * 60 * 1000,
  '15m': 15 * 60 * 1000,
  '30m': 30 * 60 * 1000,
  '1h': 60 * 60 * 1000,
  '6h': 6 * 60 * 60 * 1000,
  '12h': 12 * 60 * 60 * 1000,
  '24h': 24 * 60 * 60 * 1000,
};

/**
 * Cache Strategy Types
 */
export type CacheStrategy =
  | 'write-through'    // Write to cache and DB simultaneously
  | 'write-behind'     // Write to cache, async write to DB
  | 'cache-aside'      // Application manages cache (default)
  | 'read-through';    // Cache loads from DB on miss

/**
 * Cache Entry Interface
 */
export interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number;
  key: string;
  tags?: string[] | undefined;
}

/**
 * Cache Options
 */
export interface CacheOptions {
  ttl: CacheTTL;
  strategy?: CacheStrategy | undefined;
  tags?: string[] | undefined;
  tenantId?: string | undefined;
  companyId?: string | undefined;
}

/**
 * Default Cache Configuration
 */
export const DEFAULT_CACHE_CONFIG = {
  // Default TTL for different data types
  ttl: {
    tenant: '5m' as CacheTTL,           // Tenant context
    user: '5m' as CacheTTL,             // User data
    list: '1m' as CacheTTL,             // List queries
    detail: '5m' as CacheTTL,           // Detail queries
    count: '1m' as CacheTTL,            // Count queries
    static: '1h' as CacheTTL,           // Static data (templates, config)
    report: '15m' as CacheTTL,          // Reports
  },

  // Max entries per cache type
  maxEntries: {
    tenant: 100,
    user: 500,
    list: 200,
    detail: 500,
    count: 100,
    static: 50,
    report: 50,
  },

  // Default strategy
  defaultStrategy: 'cache-aside' as CacheStrategy,

  // Enable/disable cache by environment
  enabled: process.env.NODE_ENV !== 'test',

  // Debug mode
  debug: process.env.NODE_ENV === 'development',
};

/**
 * Cache Key Patterns
 *
 * Pattern format: {module}:{entity}:{tenantId}:{identifier}
 */
export const CACHE_KEY_PATTERNS = {
  // Tenant & Auth
  tenant: (slug: string) => `tenant:context:${slug}`,
  tenantList: (tenantId: string) => `tenant:list:${tenantId}`,

  // Real Estate Module
  property: (tenantId: string, id: string) => `real-estate:property:${tenantId}:${id}`,
  propertyList: (tenantId: string, companyId: string) => `real-estate:property:list:${tenantId}:${companyId}`,
  apartment: (tenantId: string, id: string) => `real-estate:apartment:${tenantId}:${id}`,
  apartmentList: (tenantId: string, propertyId: string) => `real-estate:apartment:list:${tenantId}:${propertyId}`,
  contract: (tenantId: string, id: string) => `real-estate:contract:${tenantId}:${id}`,
  payment: (tenantId: string, id: string) => `real-estate:payment:${tenantId}:${id}`,
  paymentList: (tenantId: string, status?: string) =>
    status ? `real-estate:payment:list:${tenantId}:${status}` : `real-estate:payment:list:${tenantId}`,

  // Accounting Module
  invoice: (tenantId: string, id: string) => `accounting:invoice:${tenantId}:${id}`,
  invoiceList: (tenantId: string, status?: string) =>
    status ? `accounting:invoice:list:${tenantId}:${status}` : `accounting:invoice:list:${tenantId}`,
  expense: (tenantId: string, id: string) => `accounting:expense:${tenantId}:${id}`,
  expenseList: (tenantId: string, category?: string) =>
    category ? `accounting:expense:list:${tenantId}:${category}` : `accounting:expense:list:${tenantId}`,

  // Production Module
  product: (tenantId: string, id: string) => `production:product:${tenantId}:${id}`,
  productList: (tenantId: string, category?: string) =>
    category ? `production:product:list:${tenantId}:${category}` : `production:product:list:${tenantId}`,
  productionOrder: (tenantId: string, id: string) => `production:order:${tenantId}:${id}`,
  productionOrderList: (tenantId: string, status?: string) =>
    status ? `production:order:list:${tenantId}:${status}` : `production:order:list:${tenantId}`,
  stockMovement: (tenantId: string, productId: string) => `production:stock:${tenantId}:${productId}`,

  // Maintenance Module
  equipment: (tenantId: string, id: string) => `maintenance:equipment:${tenantId}:${id}`,
  equipmentList: (tenantId: string, locationId?: string) =>
    locationId ? `maintenance:equipment:list:${tenantId}:${locationId}` : `maintenance:equipment:list:${tenantId}`,
  maintenanceRecord: (tenantId: string, id: string) => `maintenance:record:${tenantId}:${id}`,

  // Notification Module
  notification: (tenantId: string, userId: string) => `notification:${tenantId}:${userId}`,
  notificationCount: (tenantId: string, userId: string) => `notification:count:${tenantId}:${userId}`,

  // Calendar Module
  calendarEvent: (tenantId: string, id: string) => `calendar:event:${tenantId}:${id}`,
  calendarEventList: (tenantId: string, date: string) => `calendar:event:list:${tenantId}:${date}`,

  // Generic patterns
  entity: (module: string, entity: string, tenantId: string, id: string) =>
    `${module}:${entity}:${tenantId}:${id}`,
  entityList: (module: string, entity: string, tenantId: string, ...params: string[]) =>
    `${module}:${entity}:list:${tenantId}:${params.join(':')}`,
};

/**
 * Cache Invalidation Tags
 *
 * When an entity is updated, invalidate all caches with matching tags
 */
export const CACHE_TAGS = {
  // Module-level tags
  'real-estate': ['property', 'apartment', 'contract', 'payment', 'tenant-record'],
  'accounting': ['invoice', 'expense', 'subscription', 'payment'],
  'production': ['product', 'production-order', 'stock-movement', 'bom'],
  'maintenance': ['equipment', 'maintenance-record'],
  'calendar': ['calendar-event'],
  'notification': ['notification'],

  // Cross-cutting tags
  'tenant': ['tenant-context'],
  'user': ['user-data', 'user-permissions'],
};
