/**
 * Tenant Context Wrapper
 * Modül bağımsızlığı için optional tenant context
 */

import { NextRequest, NextResponse } from 'next/server';
import { getTenantPrismaFromRequest } from '@/lib/api/tenantContext';
import { handleApiError } from './errorHandler';
import type { PrismaClient as TenantPrismaClient } from '@prisma/tenant-client';

export type TenantPrisma = TenantPrismaClient;

/**
 * Wrapper for API routes that require tenant context
 * Modül bağımsızlığı: Tenant yoksa graceful degradation
 */
export async function withTenant<T>(
  request: NextRequest,
  handler: (tenantPrisma: TenantPrisma) => Promise<NextResponse<T>>,
  options: {
    required?: boolean; // If false, handler receives null when tenant not available
    module?: string;
  } = { required: true }
): Promise<NextResponse<T>> {
  try {
    let tenantPrisma: TenantPrisma | null = null;
    
    try {
      tenantPrisma = await getTenantPrismaFromRequest(request);
    } catch (tenantError) {
      // If tenant is required, return error
      if (options.required) {
        return handleApiError(
          tenantError,
          'Tenant context is required',
          options.module
        ) as NextResponse<T>;
      }
      // If optional, continue with null (don't log error for optional tenants)
      tenantPrisma = null;
    }

    // If required but not found, return error
    if (options.required && !tenantPrisma) {
      return NextResponse.json(
        {
          success: false,
          error: 'Tenant context is required',
          message: 'Tenant context could not be determined. Please ensure you are accessing via tenant subdomain, /tenant/{slug} path, or have tenant-slug cookie set.',
          details: process.env.NODE_ENV === 'development' 
            ? 'Check middleware.ts and ensure x-tenant-slug header or tenant-slug cookie is set.' 
            : undefined,
        },
        { status: 400 }
      ) as NextResponse<T>;
    }

    // Call handler with tenant (or null if optional)
    return await handler(tenantPrisma as TenantPrisma);
  } catch (error) {
    // withTenant dışında bir hata olursa
    if (!options.required) {
      // Optional tenant ise null döndür
      // Layout config API'si successResponse({ config: null }) formatında döndürüyor
      // Bu yüzden aynı formatı kullanmalıyız
      return NextResponse.json(
        {
          success: true,
          data: { config: null },
        },
        { status: 200 }
      ) as NextResponse<T>;
    }
    return handleApiError(error, 'Request failed', options.module) as NextResponse<T>;
  }
}

/**
 * Wrapper for API routes that don't require tenant context
 * Useful for core/system endpoints
 */
export async function withoutTenant<T>(
  handler: () => Promise<NextResponse<T>>,
  module?: string
): Promise<NextResponse<T>> {
  try {
    return await handler();
  } catch (error) {
    return handleApiError(error, 'Request failed', module) as NextResponse<T>;
  }
}

