import { NextRequest, NextResponse } from 'next/server';
import { NotificationTemplateService } from '@/lib/notifications/NotificationTemplateService';
import { getTenantPrismaFromRequest, getTenantFromRequest } from '@/lib/api/tenantContext';
import { logger } from '@/lib/utils/logger';

/**
 * POST /api/notification-templates/seed
 * Create default notification templates
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
    const tenantId = tenantContext.id;
    
    // Get companyId from query params or body, or use first company
    const searchParams = request.nextUrl.searchParams;
    let companyId: string | undefined = searchParams.get('companyId') || undefined;
    
    if (!companyId) {
      try {
        const body = await request.json().catch(() => ({}));
        companyId = body.companyId || undefined;
      } catch {
        // Body already read or empty
      }
    }
    
    // If still no companyId, get first company
    if (!companyId) {
      const firstCompany = await tenantPrisma.company.findFirst({
        select: { id: true },
        orderBy: { createdAt: 'asc' },
      });
      companyId = firstCompany?.id || undefined;
    }

    // Check if templates already exist
    const existingTemplates = await service.getTemplates(tenantId, 'email');
    if (existingTemplates.length > 0) {
      return NextResponse.json({
        success: false,
        message: 'Templates already exist. Delete existing templates first.',
        data: { count: existingTemplates.length },
      });
    }

    const templates = [];

    // ============================================
    // EMAIL TEMPLATES
    // ============================================

    // 1. Corporate Email Template (Default)
    templates.push(await service.createTemplate(tenantId, {
      name: 'Kurumsal Email Şablonu',
      channel: 'email',
      category: 'system',
      // notificationType is optional, omit it
      description: 'Kurumsal ve profesyonel email şablonu',
      emailSubject: '{{notificationTitle}} - {{companyName}}',
      emailPlainText: 'Sayın {{userName}},\n\n{{notificationMessage}}\n\nSaygılarımızla,\n{{companyName}}',
      emailTemplateStyle: 'corporate',
      emailSignatureEnabled: true,
      emailSignatureUserInfo: true,
      emailSignatureUserAvatar: true,
      emailSignatureCompanyLogo: true,
      emailSignatureCompanyInfo: true,
      defaultMessagePrefix: 'Sayın {{userName}},',
      defaultMessageSuffix: 'Saygılarımızla,\n{{companyName}}',
      isDefault: true,
      isActive: true,
    }, companyId));

    // 2. Task Assignment Email
    templates.push(await service.createTemplate(tenantId, {
      name: 'Görev Atama Email Şablonu',
      channel: 'email',
      category: 'task',
      notificationType: 'task_assignment',
      description: 'Görev atama bildirimleri için özel şablon',
      emailSubject: 'Yeni Görev: {{taskTitle}} - {{companyName}}',
      emailPlainText: 'Sayın {{userName}},\n\nSize yeni bir görev atandı:\n\nGörev: {{taskTitle}}\nAçıklama: {{taskDescription}}\nSon Tarih: {{taskDueDate}}\n\nDetaylar için lütfen sisteme giriş yapın.\n\nSaygılarımızla,\n{{companyName}}',
      emailTemplateStyle: 'corporate',
      emailSignatureEnabled: true,
      emailSignatureUserInfo: true,
      emailSignatureUserAvatar: true,
      emailSignatureCompanyLogo: true,
      emailSignatureCompanyInfo: true,
      defaultMessagePrefix: 'Sayın {{userName}},',
      defaultMessageSuffix: 'Saygılarımızla,\n{{companyName}}',
      isDefault: false,
      isActive: true,
    }, companyId));

    // 3. Urgent Alert Email
    templates.push(await service.createTemplate(tenantId, {
      name: 'Acil Bildirim Email Şablonu',
      channel: 'email',
      category: 'urgent',
      notificationType: 'urgent_alert',
      description: 'Acil bildirimler için dikkat çekici şablon',
      emailSubject: '⚠️ ACİL: {{notificationTitle}}',
      emailPlainText: 'ACİL BİLDİRİM\n\nSayın {{userName}},\n\n{{notificationMessage}}\n\nLütfen derhal işlem yapın.\n\n{{companyName}}',
      emailTemplateStyle: 'modern',
      emailSignatureEnabled: true,
      emailSignatureUserInfo: true,
      emailSignatureUserAvatar: true,
      emailSignatureCompanyLogo: true,
      emailSignatureCompanyInfo: true,
      defaultMessagePrefix: 'ACİL BİLDİRİM\n\nSayın {{userName}},',
      defaultMessageSuffix: 'Lütfen derhal işlem yapın.\n\n{{companyName}}',
      isDefault: false,
      isActive: true,
    }, companyId));

    // 4. Visionary Email Template
    templates.push(await service.createTemplate(tenantId, {
      name: 'Vizyoner Email Şablonu',
      channel: 'email',
      category: 'system',
      // notificationType is optional, omit it
      description: 'Vizyoner ve yenilikçi tasarım',
      emailSubject: '{{notificationTitle}}',
      emailPlainText: 'Merhaba {{userName}},\n\n{{notificationMessage}}\n\nGeleceği birlikte şekillendiriyoruz.\n\n{{companyName}}',
      emailTemplateStyle: 'visionary',
      emailSignatureEnabled: true,
      emailSignatureUserInfo: true,
      emailSignatureUserAvatar: true,
      emailSignatureCompanyLogo: true,
      emailSignatureCompanyInfo: true,
      defaultMessagePrefix: 'Merhaba {{userName}},',
      defaultMessageSuffix: 'Geleceği birlikte şekillendiriyoruz.\n\n{{companyName}}',
      isDefault: false,
      isActive: true,
    }, companyId));

    // 5. Elegant Email Template
    templates.push(await service.createTemplate(tenantId, {
      name: 'Şık Email Şablonu',
      channel: 'email',
      category: 'system',
      // notificationType is optional, omit it
      description: 'Zarif ve şık tasarım',
      emailSubject: '{{notificationTitle}}',
      emailPlainText: 'Sayın {{userName}},\n\n{{notificationMessage}}\n\nEn iyi dileklerimizle,\n{{companyName}}',
      emailTemplateStyle: 'elegant',
      emailSignatureEnabled: true,
      emailSignatureUserInfo: true,
      emailSignatureUserAvatar: true,
      emailSignatureCompanyLogo: true,
      emailSignatureCompanyInfo: true,
      defaultMessagePrefix: 'Sayın {{userName}},',
      defaultMessageSuffix: 'En iyi dileklerimizle,\n{{companyName}}',
      isDefault: false,
      isActive: true,
    }, companyId));

    // 6. System Update Email
    templates.push(await service.createTemplate(tenantId, {
      name: 'Sistem Güncellemesi Email Şablonu',
      channel: 'email',
      category: 'system',
      notificationType: 'system_update',
      description: 'Sistem güncellemeleri için bilgilendirme şablonu',
      emailSubject: 'Sistem Güncellemesi: {{notificationTitle}}',
      emailPlainText: 'Sayın {{userName}},\n\nSistemimizde bir güncelleme yapıldı:\n\n{{notificationMessage}}\n\nSorularınız için bizimle iletişime geçebilirsiniz.\n\nSaygılarımızla,\n{{companyName}}',
      emailTemplateStyle: 'corporate',
      emailSignatureEnabled: true,
      emailSignatureUserInfo: true,
      emailSignatureUserAvatar: true,
      emailSignatureCompanyLogo: true,
      emailSignatureCompanyInfo: true,
      defaultMessagePrefix: 'Sayın {{userName}},',
      defaultMessageSuffix: 'Sorularınız için bizimle iletişime geçebilirsiniz.\n\nSaygılarımızla,\n{{companyName}}',
      isDefault: false,
      isActive: true,
    }, companyId));

    // ============================================
    // SMS TEMPLATES
    // ============================================

    // 7. SMS - Task Assignment
    templates.push(await service.createTemplate(tenantId, {
      name: 'SMS - Görev Atama',
      channel: 'sms',
      category: 'task',
      notificationType: 'task_assignment',
      description: 'Görev atama SMS şablonu',
      smsSubject: 'Görev',
      smsContent: '{{userName}}, size yeni görev atandı: {{taskTitle}}. Son tarih: {{taskDueDate}}. Detay: {{companyName}}',
      isDefault: true,
      isActive: true,
    }, companyId));

    // 8. SMS - Urgent Alert
    templates.push(await service.createTemplate(tenantId, {
      name: 'SMS - Acil Bildirim',
      channel: 'sms',
      category: 'urgent',
      notificationType: 'urgent_alert',
      description: 'Acil bildirim SMS şablonu',
      smsSubject: 'ACİL',
      smsContent: 'ACİL: {{notificationMessage}} - {{companyName}}',
      isDefault: false,
      isActive: true,
    }, companyId));

    // 9. SMS - System Notification
    templates.push(await service.createTemplate(tenantId, {
      name: 'SMS - Sistem Bildirimi',
      channel: 'sms',
      category: 'system',
      notificationType: 'system_update',
      description: 'Sistem bildirimi SMS şablonu',
      smsSubject: 'Bildirim',
      smsContent: '{{companyName}}: {{notificationMessage}}',
      isDefault: false,
      isActive: true,
    }, companyId));

    // ============================================
    // PUSH NOTIFICATION TEMPLATES
    // ============================================

    // 10. Push - Task Assignment
    templates.push(await service.createTemplate(tenantId, {
      name: 'Push - Görev Atama',
      channel: 'push',
      category: 'task',
      notificationType: 'task_assignment',
      description: 'Görev atama push bildirimi şablonu',
      pushTitle: 'Yeni Görev',
      pushBody: '{{taskTitle}} görevi size atandı',
      isDefault: true,
      isActive: true,
    }, companyId));

    // 11. Push - Urgent Alert
    templates.push(await service.createTemplate(tenantId, {
      name: 'Push - Acil Bildirim',
      channel: 'push',
      category: 'urgent',
      notificationType: 'urgent_alert',
      description: 'Acil bildirim push şablonu',
      pushTitle: '⚠️ ACİL',
      pushBody: '{{notificationMessage}}',
      isDefault: false,
      isActive: true,
    }, companyId));

    // 12. Push - System Update
    templates.push(await service.createTemplate(tenantId, {
      name: 'Push - Sistem Güncellemesi',
      channel: 'push',
      category: 'system',
      notificationType: 'system_update',
      description: 'Sistem güncellemesi push şablonu',
      pushTitle: 'Sistem Güncellemesi',
      pushBody: '{{notificationMessage}}',
      isDefault: false,
      isActive: true,
    }, companyId));

    // ============================================
    // WHATSAPP TEMPLATES
    // ============================================

    // 13. WhatsApp - Task Assignment
    templates.push(await service.createTemplate(tenantId, {
      name: 'WhatsApp - Görev Atama',
      channel: 'whatsapp',
      category: 'task',
      notificationType: 'task_assignment',
      description: 'Görev atama WhatsApp şablonu',
      socialContent: '👋 Merhaba {{userName}},\n\n📋 Size yeni bir görev atandı:\n\n*{{taskTitle}}*\n\n{{taskDescription}}\n\n📅 Son Tarih: {{taskDueDate}}\n\nDetaylar için sisteme giriş yapabilirsiniz.\n\n{{companyName}}',
      isDefault: true,
      isActive: true,
    }, companyId));

    // 14. WhatsApp - Urgent Alert
    templates.push(await service.createTemplate(tenantId, {
      name: 'WhatsApp - Acil Bildirim',
      channel: 'whatsapp',
      category: 'urgent',
      notificationType: 'urgent_alert',
      description: 'Acil bildirim WhatsApp şablonu',
      socialContent: '🚨 *ACİL BİLDİRİM*\n\n{{notificationMessage}}\n\nLütfen derhal işlem yapın.\n\n{{companyName}}',
      isDefault: false,
      isActive: true,
    }, companyId));

    // ============================================
    // TELEGRAM TEMPLATES
    // ============================================

    // 15. Telegram - Task Assignment
    templates.push(await service.createTemplate(tenantId, {
      name: 'Telegram - Görev Atama',
      channel: 'telegram',
      category: 'task',
      notificationType: 'task_assignment',
      description: 'Görev atama Telegram şablonu',
      socialContent: '👋 Merhaba {{userName}},\n\n📋 Size yeni bir görev atandı:\n\n*{{taskTitle}}*\n\n{{taskDescription}}\n\n📅 Son Tarih: {{taskDueDate}}\n\nDetaylar için sisteme giriş yapabilirsiniz.\n\n{{companyName}}',
      isDefault: true,
      isActive: true,
    }, companyId));

    // 16. Telegram - Urgent Alert
    templates.push(await service.createTemplate(tenantId, {
      name: 'Telegram - Acil Bildirim',
      channel: 'telegram',
      category: 'urgent',
      notificationType: 'urgent_alert',
      description: 'Acil bildirim Telegram şablonu',
      socialContent: '🚨 *ACİL BİLDİRİM*\n\n{{notificationMessage}}\n\nLütfen derhal işlem yapın.\n\n{{companyName}}',
      isDefault: false,
      isActive: true,
    }, companyId));

    logger.info('Default notification templates created', { count: templates.length }, 'api-notification-templates-seed');

    return NextResponse.json({
      success: true,
      message: `${templates.length} templates created successfully`,
      data: { templates: templates.map(t => ({ id: t.id, name: t.name, channel: t.channel })) },
    });
  } catch (error: any) {
    logger.error('Failed to seed notification templates', error, 'api-notification-templates-seed');
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to seed notification templates',
      },
      { status: 500 }
    );
  }
}









