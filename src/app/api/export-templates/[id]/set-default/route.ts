import { NextRequest, NextResponse } from 'next/server';
import { ExportTemplateService } from '@/lib/export/ExportTemplateService';
import { getTenantPrismaFromRequest } from '@/lib/api/tenantContext';
import { logger } from '@/lib/utils/logger';
/**
 * POST /api/export-templates/[id]/set-default
 * Set export template as default
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const tenantPrisma = await getTenantPrismaFromRequest(request);
    if (!tenantPrisma) {
      return NextResponse.json(
        { success: false, error: 'Tenant context not found' },
        { status: 400 }
      );
    }
    const service = new ExportTemplateService(tenantPrisma);

    // Get template first to get its properties
    const template = await service.getTemplate(id);
    if (!template) {
      return NextResponse.json(
        { success: false, error: 'Template not found' },
        { status: 404 }
      );
    }

    // Update template to be default
    await service.updateTemplate(id, {
      isDefault: true,
    });

    logger.info('Export template set as default', { templateId: id }, 'api-export-templates');

    return NextResponse.json({
      success: true,
      data: { id },
    });
  } catch (error: any) {
    logger.error('Failed to set default export template', error, 'api-export-templates');
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to set default template',
      },
      { status: 500 }
    );
  }
}





