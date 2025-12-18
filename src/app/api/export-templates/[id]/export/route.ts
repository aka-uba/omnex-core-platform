import { NextRequest, NextResponse } from 'next/server';
import { ExportTemplateService } from '@/lib/export/ExportTemplateService';
import { getTenantPrismaFromRequest, getTenantFromRequest } from '@/lib/api/tenantContext';
import { logger } from '@/lib/utils/logger';
/**
 * GET /api/export-templates/[id]/export
 * Export template to JSON
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const tenantPrisma = await getTenantPrismaFromRequest(request);
    const tenantContext = await getTenantFromRequest(request);
    
    if (!tenantPrisma || !tenantContext) {
      return NextResponse.json(
        { success: false, error: 'Tenant context not found' },
        { status: 400 }
      );
    }

    const service = new ExportTemplateService(tenantPrisma);
    const templateData = await service.exportTemplate(id);
    await service.markExported(id);

    return NextResponse.json({
      success: true,
      data: templateData,
    });
  } catch (error: any) {
    logger.error('Failed to export template', error, 'api-export-templates');
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to export template',
      },
      { status: 500 }
    );
  }
}
















