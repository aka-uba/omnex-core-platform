/**
 * Database Switcher
 * 
 * Runtime'da tenant database connection oluşturur
 */

import { PrismaClient as TenantPrismaClient } from '@prisma/tenant-client';

// Cache for tenant Prisma clients
const tenantClientsCache = new Map<string, TenantPrismaClient>();

/**
 * Get tenant Prisma client for a specific database URL
 * 
 * Uses caching to avoid creating multiple clients for the same database
 */
export function getTenantPrisma(dbUrl: string): TenantPrismaClient {
  // Check cache first
  if (tenantClientsCache.has(dbUrl)) {
    return tenantClientsCache.get(dbUrl)!;
  }

  // Create new client
  const client = new TenantPrismaClient({
    datasources: {
      db: {
        url: dbUrl,
      },
    },
    log: process.env.NODE_ENV === 'development' ? ['error'] : ['error'], // Reduced logging for performance
  });

  // Cache the client
  tenantClientsCache.set(dbUrl, client);

  return client;
}

/**
 * Clear tenant Prisma client cache
 * Useful for testing or when database connection needs to be refreshed
 */
export function clearTenantPrismaCache(dbUrl?: string) {
  if (dbUrl) {
    const client = tenantClientsCache.get(dbUrl);
    if (client) {
      client.$disconnect();
      tenantClientsCache.delete(dbUrl);
    }
  } else {
    // Clear all cached clients
    for (const [url, client] of tenantClientsCache.entries()) {
      client.$disconnect();
      tenantClientsCache.delete(url);
    }
  }
}

/**
 * Get tenant Prisma client from tenant context
 */
export function getTenantPrismaFromContext(tenantContext: { dbUrl: string }): TenantPrismaClient {
  return getTenantPrisma(tenantContext.dbUrl);
}


