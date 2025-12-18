import { NextRequest, NextResponse } from 'next/server';
import { NotificationTemplateService } from '@/lib/notifications/NotificationTemplateService';
import { getTenantPrismaFromRequest } from '@/lib/api/tenantContext';
import { logger } from '@/lib/utils/logger';

/**
 * GET /api/notification-templates/[id]
 * Get a single notification template
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

    const service = new NotificationTemplateService(tenantPrisma);
    const template = await service.getTemplate(id);

    if (!template) {
      return NextResponse.json(
        { success: false, error: 'Template not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: template,
    });
  } catch (error: any) {
    logger.error('Failed to fetch notification template', error, 'api-notification-templates');
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to fetch notification template',
      },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/notification-templates/[id]
 * Update a notification template
 */
export async function PUT(
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

    const service = new NotificationTemplateService(tenantPrisma);
    const body = await request.json();

    const template = await service.updateTemplate(id, body);

    logger.info('Notification template updated', { templateId: id }, 'api-notification-templates');

    return NextResponse.json({
      success: true,
      data: template,
    });
  } catch (error: any) {
    logger.error('Failed to update notification template', error, 'api-notification-templates');
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to update notification template',
      },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/notification-templates/[id]
 * Delete a notification template
 */
export async function DELETE(
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

    const service = new NotificationTemplateService(tenantPrisma);
    await service.deleteTemplate(id);

    logger.info('Notification template deleted', { templateId: id }, 'api-notification-templates');

    return NextResponse.json({
      success: true,
      message: 'Template deleted successfully',
    });
  } catch (error: any) {
    logger.error('Failed to delete notification template', error, 'api-notification-templates');
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to delete notification template',
      },
      { status: 500 }
    );
  }
}
















