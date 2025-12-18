import { NextRequest, NextResponse } from 'next/server';
import { getTenantFromRequest } from '@/lib/api/tenantContext';

/**
 * GET /api/tenant-context
 * Get current tenant context (for client-side use)
 */
export async function GET(request: NextRequest) {
  try {
    const tenantContext = await getTenantFromRequest(request);
    
    if (!tenantContext) {
      return NextResponse.json(
        { success: false, error: 'Tenant context not found' },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        tenantId: tenantContext.id,
        slug: tenantContext.slug,
        name: tenantContext.name,
        // companyId and locationId are not part of TenantContext
        // They should be retrieved separately if needed
      },
    });
  } catch (error: any) {
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to get tenant context',
      },
      { status: 500 }
    );
  }
}









