import { NextRequest, NextResponse } from 'next/server';
import { ExportTemplateService } from '@/lib/export/ExportTemplateService';
import { getTenantPrismaFromRequest } from '@/lib/api/tenantContext';
import { logger } from '@/lib/utils/logger';

/**
 * POST /api/export-templates/[id]/unset-default
 * Remove default status from export template
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

    // Get template first
    const template = await service.getTemplate(id);
    if (!template) {
      return NextResponse.json(
        { success: false, error: 'Template not found' },
        { status: 404 }
      );
    }

    // Update template to remove default status
    await service.updateTemplate(id, {
      isDefault: false,
    });

    logger.info('Export template default status removed', { templateId: id }, 'api-export-templates');

    return NextResponse.json({
      success: true,
      data: { id },
    });
  } catch (error: any) {
    logger.error('Failed to unset default export template', error, 'api-export-templates');
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to unset default template',
      },
      { status: 500 }
    );
  }
}
