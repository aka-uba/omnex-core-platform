import { NextRequest, NextResponse } from 'next/server';
import { NotificationTemplateService } from '@/lib/notifications/NotificationTemplateService';
import { getTenantPrismaFromRequest, getTenantFromRequest } from '@/lib/api/tenantContext';
import { logger } from '@/lib/utils/logger';

/**
 * GET /api/notification-templates
 * List notification templates
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

    const service = new NotificationTemplateService(tenantPrisma);
    const { searchParams } = new URL(request.url);

    const channel = searchParams.get('channel') as 'email' | 'sms' | 'push' | 'whatsapp' | 'telegram' | null;
    const notificationType = searchParams.get('notificationType') || undefined;
    const companyId = searchParams.get('companyId') === 'any' ? undefined : searchParams.get('companyId') || undefined;
    const locationId = searchParams.get('locationId') === 'any' ? undefined : (searchParams.get('locationId') || undefined);

    const templates = await service.getTemplates(
      tenantContext.id,
      channel || undefined,
      notificationType,
      companyId,
      locationId
    );

    return NextResponse.json({
      success: true,
      data: templates,
    });
  } catch (error: any) {
    logger.error('Failed to fetch notification templates', error, 'api-notification-templates');
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to fetch notification templates',
      },
      { status: 500 }
    );
  }
}

/**
 * POST /api/notification-templates
 * Create a new notification template
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

    const service = new NotificationTemplateService(tenantPrisma);
    const body = await request.json();

    // Validate required fields
    if (!body.name || !body.channel) {
      return NextResponse.json(
        { success: false, error: 'Name and channel are required' },
        { status: 400 }
      );
    }

    const template = await service.createTemplate(
      tenantContext.id,
      body,
      body.companyId || undefined,
      body.locationId
    );

    logger.info('Notification template created', { templateId: template.id }, 'api-notification-templates');

    return NextResponse.json({
      success: true,
      data: template,
    });
  } catch (error: any) {
    logger.error('Failed to create notification template', error, 'api-notification-templates');
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to create notification template',
      },
      { status: 500 }
    );
  }
}









