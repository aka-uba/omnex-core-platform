/**
 * Tenant Context Helper
 * 
 * API route'larında tenant context'i almak için helper fonksiyonlar
 * 
 * NOTE: Middleware only provides slug (Edge Runtime compatible)
 * Full tenant context is resolved here using Prisma (Node.js runtime)
 */

import { NextRequest } from 'next/server';
import { getTenantPrisma } from '@/lib/dbSwitcher';

// Cache for tenant context (in-memory, cleared on server restart)
// Key: slug, Value: TenantContext
const tenantContextCache = new Map<string, { context: TenantContext; timestamp: number }>();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

/**
 * Tenant Context Type
 */
export interface TenantContext {
  id: string;
  slug: string;
  name: string;
  dbName: string;
  currentDb: string;
  dbUrl: string;
  subdomain?: string | null;
  customDomain?: string | null;
}

/**
 * Resolve full tenant context (for use in API routes, not middleware)
 * 
 * This function uses Prisma and should only be called from API routes
 * that run in Node.js runtime, not Edge Runtime.
 * 
 * Uses in-memory caching to avoid repeated database queries.
 */
async function resolveTenantContext(slug: string, source?: string, hostname?: string): Promise<TenantContext | null> {
  // Check cache first
  const cacheKey = `${slug}:${source || 'default'}:${hostname || ''}`;
  const cached = tenantContextCache.get(cacheKey);
  
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return cached.context;
  }

  const { 
    getTenantBySlug, 
    getTenantBySubdomain,
    getTenantByCustomDomain,
    getTenantDbUrl 
  } = await import('@/lib/services/tenantService');

  let tenant = null;

  // Try based on source
  if (source === 'subdomain') {
    tenant = await getTenantBySubdomain(slug);
  } else if (source === 'custom-domain' && hostname) {
    // For custom domains, use hostname instead of slug
    tenant = await getTenantByCustomDomain(hostname);
  } else {
    // Try by slug first (path-based routing)
    tenant = await getTenantBySlug(slug);
    
    // If not found, try by subdomain
    if (!tenant) {
      tenant = await getTenantBySubdomain(slug);
    }
    
    // If still not found and we have hostname, try custom domain
    if (!tenant && hostname) {
      tenant = await getTenantByCustomDomain(hostname);
    }
  }

  if (!tenant || tenant.status !== 'active') {
    return null;
  }

  const dbUrl = getTenantDbUrl(tenant);

  const context: TenantContext = {
    id: tenant.id,
    slug: tenant.slug,
    name: tenant.name,
    dbName: tenant.dbName,
    currentDb: tenant.currentDb,
    dbUrl,
    subdomain: tenant.subdomain,
    customDomain: tenant.customDomain,
  };

  // Cache the context
  tenantContextCache.set(cacheKey, {
    context,
    timestamp: Date.now(),
  });

  return context;
}

/**
 * Get tenant slug from request headers (set by middleware) or cookies (for development)
 */
function getTenantSlugFromRequest(request: NextRequest): string | null {
  // First try header (set by middleware)
  const headerSlug = request.headers.get('x-tenant-slug');
  if (headerSlug) {
    return headerSlug;
  }
  
  // Fallback to cookie (for development/localhost when middleware can't detect tenant)
  const cookieSlug = request.cookies.get('tenant-slug')?.value;
  if (cookieSlug) {
    return cookieSlug;
  }
  
  // Also try parsing Cookie header manually (for testing with curl/Invoke-WebRequest)
  const cookieHeader = request.headers.get('cookie');
  if (cookieHeader) {
    const cookies = cookieHeader.split(';').map(c => c.trim());
    for (const cookie of cookies) {
      const [name, value] = cookie.split('=');
      if (name === 'tenant-slug' && value) {
        return value;
      }
    }
  }
  
  return null;
}

/**
 * Get full tenant context from request
 * Resolves tenant from database using slug from middleware or cookie
 */
export async function getTenantFromRequest(request: NextRequest): Promise<TenantContext | null> {
  const slug = getTenantSlugFromRequest(request);
  let source = request.headers.get('x-tenant-source');
  const hostname = request.headers.get('host')?.split(':')[0];
  
  if (!slug) {
    return null;
  }

  // If source is 'cookie', treat it as 'path' for resolution (cookie is just a fallback mechanism)
  // This ensures backward compatibility with existing resolution logic
  if (source === 'cookie') {
    source = 'path'; // Cookie-based slug should be resolved like path-based routing
  }

  // Resolve full tenant context from database
  return await resolveTenantContext(slug, source || undefined, hostname);
}

/**
 * Get tenant Prisma client from request
 * Returns null if tenant context is not available
 */
export async function getTenantPrismaFromRequest(request: NextRequest) {
  const tenant = await getTenantFromRequest(request);
  if (!tenant) {
    return null;
  }
  return getTenantPrisma(tenant.dbUrl);
}

/**
 * Require tenant context (throws error if not found)
 */
export async function requireTenant(request: NextRequest) {
  const tenant = await getTenantFromRequest(request);
  if (!tenant) {
    const slug = getTenantSlugFromRequest(request);
    const errorMessage = slug 
      ? `Tenant "${slug}" not found in core database. Please run core seed to create tenant record.`
      : 'Tenant context is required. Make sure you are accessing via tenant subdomain or /tenant/{slug} path, or run core seed to create tenant record.';
    throw new Error(errorMessage);
  }
  return tenant;
}

/**
 * Require tenant Prisma client (throws error if not found)
 */
export async function requireTenantPrisma(request: NextRequest) {
  try {
    const tenant = await requireTenant(request);
    return getTenantPrisma(tenant.dbUrl);
  } catch (error) {
    // Re-throw with more context
    if (error instanceof Error) {
      throw new Error(`Failed to get tenant Prisma client: ${error.message}`);
    }
    throw error;
  }
}

/**
 * Check if request has tenant slug (from middleware)
 */
export function hasTenantSlug(request: NextRequest): boolean {
  return !!request.headers.get('x-tenant-slug');
}


