/**
 * Tenant Resolver (Edge-Compatible)
 * 
 * Request'ten tenant slug'ını çıkarır (subdomain veya path-based)
 * 
 * NOTE: This runs in Edge Runtime, so we can't use Prisma here.
 * We only extract the slug and let API routes validate it.
 */

import { NextRequest } from 'next/server';
import { 
  extractTenantFromSubdomain, 
  extractTenantFromPath,
} from '@/config/tenant.config';

export interface TenantSlug {
  slug: string;
  source: 'subdomain' | 'path' | 'custom-domain' | 'cookie';
}

/**
 * Extract tenant slug from request (Edge-compatible)
 * 
 * 1. Try subdomain (production/staging)
 * 2. Try path-based routing (staging/dev)
 * 3. Try custom domain (we'll validate in API routes)
 * 
 * Returns only the slug, not full tenant data (to avoid Prisma in Edge Runtime)
 */
export function extractTenantSlug(request: NextRequest): TenantSlug | null {
  const host = request.headers.get('host') || '';
  const pathname = request.nextUrl.pathname;

  // 1. Try subdomain routing (production/staging)
  if (host) {
    const subdomain = extractTenantFromSubdomain(host);
    if (subdomain) {
      return {
        slug: subdomain,
        source: 'subdomain',
      };
    }
  }

  // 2. Try path-based routing (staging/dev fallback)
  const pathSlug = extractTenantFromPath(pathname);
  if (pathSlug) {
    return {
      slug: pathSlug,
      source: 'path',
    };
  }

  // 3. Custom domain - we'll validate in API routes
  // For custom domains, we pass the hostname as slug
  // API routes will check if it's a custom domain
  if (host) {
    const hostname = host.split(':')[0];
    // Only return if it's not localhost and not a known subdomain pattern
    if (hostname && hostname !== 'localhost' && !hostname.includes('.')) {
      return {
        slug: hostname,
        source: 'custom-domain',
      };
    }
  }

  return null;
}

/**
 * Check if request is for super admin (no tenant)
 */
export function isSuperAdminRequest(request: NextRequest): boolean {
  const host = request.headers.get('host') || '';
  const pathname = request.nextUrl.pathname;

  // Check for admin subdomain
  if (host) {
    const hostname = host.split(':')[0];
    if (hostname?.startsWith('admin.') || hostname === 'admin') {
      return true;
    }
  }

  // Check for admin path
  if (pathname.startsWith('/admin') && !pathname.startsWith('/tenant/')) {
    return true;
  }

  return false;
}



