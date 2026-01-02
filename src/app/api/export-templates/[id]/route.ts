import { NextRequest, NextResponse } from 'next/server';
import { ExportTemplateService } from '@/lib/export/ExportTemplateService';
import { getTenantPrismaFromRequest, getTenantFromRequest } from '@/lib/api/tenantContext';
import { logger } from '@/lib/utils/logger';
import { getAuditContext, logUpdate, logDelete } from '@/lib/api/auditHelper';
/**
 * GET /api/export-templates/[id]
 * Get single export template
 */
export async function GET(
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

    const template = await service.getTemplate(id);

    if (!template) {
      return NextResponse.json(
        {
          success: false,
          error: 'Template not found',
        },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: template,
    });
  } catch (error: any) {
    logger.error('Failed to get export template', error, 'api-export-templates');
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to get export template',
      },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/export-templates/[id]
 * Update export template
 */
export async function PUT(
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

    // Get audit context
    const auditContext = await getAuditContext(request);

    const service = new ExportTemplateService(tenantPrisma);

    // Get existing template for audit
    const existing = await service.getTemplate(id);

    const body = await request.json();
    const { name, templateData, isDefault, isActive } = body;

    const template = await service.updateTemplate(id, {
      name,
      templateData,
      isDefault,
      isActive,
    });

    // Log audit
    if (existing) {
      logUpdate(tenantContext, auditContext, 'ExportTemplate', id, existing, template, existing.companyId || '');
    }

    logger.info('Export template updated', { templateId: id }, 'api-export-templates');

    return NextResponse.json({
      success: true,
      data: template,
    });
  } catch (error: any) {
    logger.error('Failed to update export template', error, 'api-export-templates');
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to update export template',
      },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/export-templates/[id]
 * Delete export template
 */
export async function DELETE(
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

    // Get audit context
    const auditContext = await getAuditContext(request);

    const service = new ExportTemplateService(tenantPrisma);

    // Get existing template for audit
    const existing = await service.getTemplate(id);

    await service.deleteTemplate(id);

    // Log audit
    if (existing) {
      logDelete(tenantContext, auditContext, 'ExportTemplate', id, existing.companyId || '', {
        name: existing.name,
        type: existing.type,
      });
    }

    logger.info('Export template deleted', { templateId: id }, 'api-export-templates');

    return NextResponse.json({
      success: true,
      message: 'Template deleted successfully',
    });
  } catch (error: any) {
    logger.error('Failed to delete export template', error, 'api-export-templates');
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to delete export template',
      },
      { status: 500 }
    );
  }
}
