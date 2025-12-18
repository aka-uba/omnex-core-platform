import { NextRequest, NextResponse } from 'next/server';
import { ExportTemplateService } from '@/lib/export/ExportTemplateService';
import { getTenantPrismaFromRequest, getTenantFromRequest } from '@/lib/api/tenantContext';
import { logger } from '@/lib/utils/logger';
/**
 * POST /api/export-templates/import
 * Import template from JSON
 */
export async function POST(request: NextRequest) {
  try {
    const tenantPrisma = await getTenantPrismaFromRequest(request);
    const tenantContext = await getTenantFromRequest(request);
    
    if (!tenantPrisma || !tenantContext) {
      return NextResponse.json(
        { success: false, error: 'Tenant context not found' },
        { status: 400 }
      );
    }

    const service = new ExportTemplateService(tenantPrisma);
    const body = await request.json();
    const { templateData, companyId, locationId, isDefault } = body;

    if (!templateData) {
      return NextResponse.json(
        {
          success: false,
          error: 'Template data is required',
        },
        { status: 400 }
      );
    }

    const template = await service.importTemplate(
      tenantContext.id,
      templateData,
      companyId,
      locationId,
      isDefault
    );

    logger.info('Export template imported', { templateId: template.id }, 'api-export-templates');

    return NextResponse.json({
      success: true,
      data: template,
    });
  } catch (error: any) {
    logger.error('Failed to import template', error, 'api-export-templates');
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to import template',
      },
      { status: 500 }
    );
  }
}
















