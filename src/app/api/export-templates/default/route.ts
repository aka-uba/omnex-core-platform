import { NextRequest, NextResponse } from 'next/server';
import { ExportTemplateService } from '@/lib/export/ExportTemplateService';
import { getTenantPrismaFromRequest, getTenantFromRequest } from '@/lib/api/tenantContext';
import { getCompanyIdFromRequest } from '@/lib/api/companyContext';
import { logger } from '@/lib/utils/logger';
/**
 * GET /api/export-templates/default
 * Get default export template for current tenant/company
 */
export async function GET(request: NextRequest) {
  try {
    const tenantPrisma = await getTenantPrismaFromRequest(request);
    const tenantContext = await getTenantFromRequest(request);

    if (!tenantPrisma || !tenantContext) {
      return NextResponse.json(
        { success: false, error: 'Tenant context not found' },
        { status: 400 }
      );
    }

    const searchParams = request.nextUrl.searchParams;
    const category = searchParams.get('category');
    const type = searchParams.get('type') as 'header' | 'footer' | 'full' | undefined;

    const companyId = await getCompanyIdFromRequest(request, tenantPrisma);
    const service = new ExportTemplateService(tenantPrisma);
    const template = await service.getDefaultTemplate(
      tenantContext.id,
      companyId ?? undefined,
      undefined, // locationId - not available in TenantContext
      category || undefined,
      type
    );

    if (!template) {
      return NextResponse.json({
        success: true,
        data: null,
      });
    }

    return NextResponse.json({
      success: true,
      data: template,
    });
  } catch (error: any) {
    logger.error('Failed to get default export template', error, 'api-export-templates-default');
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to get default export template',
      },
      { status: 500 }
    );
  }
}









