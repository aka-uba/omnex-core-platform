import { NextRequest, NextResponse } from 'next/server';
import { ExportTemplateService } from '@/lib/export/ExportTemplateService';
import { getTenantPrismaFromRequest, getTenantFromRequest } from '@/lib/api/tenantContext';
import { logger } from '@/lib/utils/logger';
/**
 * GET /api/export-templates
 * List all export templates
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
    const service = new ExportTemplateService(tenantPrisma);

    const searchParams = request.nextUrl.searchParams;
    const companyId = searchParams.get('companyId') || undefined;
    const locationId = searchParams.get('locationId') || undefined;
    const type = searchParams.get('type') as 'header' | 'footer' | 'full' | undefined;

    const templates = await service.getTemplates(tenantContext.id, companyId, locationId, type);

    return NextResponse.json({
      success: true,
      data: templates,
    });
  } catch (error: any) {
    logger.error('Failed to list export templates', error, 'api-export-templates');
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to list export templates',
      },
      { status: 500 }
    );
  }
}

/**
 * POST /api/export-templates
 * Create new export template
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
    const { name, type, companyId, locationId, templateData, isDefault } = body;

    if (!name || !type) {
      return NextResponse.json(
        {
          success: false,
          error: 'Name and type are required',
        },
        { status: 400 }
      );
    }

    const template = await service.createTemplate(tenantContext.id, {
      name,
      type,
      companyId,
      locationId,
      templateData,
      isDefault,
    });

    logger.info('Export template created', { templateId: template.id }, 'api-export-templates');

    return NextResponse.json({
      success: true,
      data: template,
    });
  } catch (error: any) {
    logger.error('Failed to create export template', error, 'api-export-templates');
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to create export template',
      },
      { status: 500 }
    );
  }
}

