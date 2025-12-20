import { NextRequest, NextResponse } from 'next/server';
import { NotificationTemplateService } from '@/lib/notifications/NotificationTemplateService';
import { getTenantPrismaFromRequest } from '@/lib/api/tenantContext';
import { logger } from '@/lib/utils/logger';

/**
 * POST /api/notification-templates/[id]/unset-default
 * Remove default status from notification template
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

    const service = new NotificationTemplateService(tenantPrisma);
    const template = await service.updateTemplate(id, { isDefault: false });

    logger.info('Notification template default status removed', { templateId: id }, 'api-notification-templates');

    return NextResponse.json({
      success: true,
      data: template,
      message: 'Default status removed successfully',
    });
  } catch (error: any) {
    logger.error('Failed to unset default notification template', error, 'api-notification-templates');
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to unset default notification template',
      },
      { status: 500 }
    );
  }
}
