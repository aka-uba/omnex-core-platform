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

    // Get all existing templates to check which ones are missing
    const [existingEmail, existingSMS, existingPush, existingWhatsApp, existingTelegram] = await Promise.all([
      service.getTemplates(tenantId, 'email'),
      service.getTemplates(tenantId, 'sms'),
      service.getTemplates(tenantId, 'push'),
      service.getTemplates(tenantId, 'whatsapp'),
      service.getTemplates(tenantId, 'telegram'),
    ]);

    // Create a set of existing template names for quick lookup
    const existingNames = new Set([
      ...existingEmail.map(t => t.name),
      ...existingSMS.map(t => t.name),
      ...existingPush.map(t => t.name),
      ...existingWhatsApp.map(t => t.name),
      ...existingTelegram.map(t => t.name),
    ]);

    const templates: any[] = [];
    let skippedCount = 0;

    // Helper function to create template only if it doesn't exist
    const createIfMissing = async (name: string, data: any) => {
      if (existingNames.has(name)) {
        skippedCount++;
        return null;
      }
      const template = await service.createTemplate(tenantId, data, companyId);
      templates.push(template);
      return template;
    };

    // ============================================
    // EMAIL TEMPLATES
    // ============================================

    // 1. Corporate Email Template (Default)
    await createIfMissing('Kurumsal Email Şablonu', {
      name: 'Kurumsal Email Şablonu',
      channel: 'email',
      category: 'system',
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
    });

    // 2. Task Assignment Email
    await createIfMissing('Görev Atama Email Şablonu', {
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
    });

    // 3. Urgent Alert Email
    await createIfMissing('Acil Bildirim Email Şablonu', {
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
    });

    // 4. Visionary Email Template
    await createIfMissing('Vizyoner Email Şablonu', {
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
    });

    // 5. Elegant Email Template
    await createIfMissing('Şık Email Şablonu', {
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
    });

    // 6. System Update Email
    await createIfMissing('Sistem Güncellemesi Email Şablonu', {
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
    });

    // ============================================
    // SMS TEMPLATES
    // ============================================

    // 7. SMS - Task Assignment
    await createIfMissing('SMS - Görev Atama', {
      name: 'SMS - Görev Atama',
      channel: 'sms',
      category: 'task',
      notificationType: 'task_assignment',
      description: 'Görev atama SMS şablonu',
      smsSubject: 'Görev',
      smsContent: '{{userName}}, size yeni görev atandı: {{taskTitle}}. Son tarih: {{taskDueDate}}. Detay: {{companyName}}',
      isDefault: true,
      isActive: true,
    });

    // 8. SMS - Urgent Alert
    await createIfMissing('SMS - Acil Bildirim', {
      name: 'SMS - Acil Bildirim',
      channel: 'sms',
      category: 'urgent',
      notificationType: 'urgent_alert',
      description: 'Acil bildirim SMS şablonu',
      smsSubject: 'ACİL',
      smsContent: 'ACİL: {{notificationMessage}} - {{companyName}}',
      isDefault: false,
      isActive: true,
    });

    // 9. SMS - System Notification
    await createIfMissing('SMS - Sistem Bildirimi', {
      name: 'SMS - Sistem Bildirimi',
      channel: 'sms',
      category: 'system',
      notificationType: 'system_update',
      description: 'Sistem bildirimi SMS şablonu',
      smsSubject: 'Bildirim',
      smsContent: '{{companyName}}: {{notificationMessage}}',
      isDefault: false,
      isActive: true,
    });

    // ============================================
    // PUSH NOTIFICATION TEMPLATES
    // ============================================

    // 10. Push - Task Assignment
    await createIfMissing('Push - Görev Atama', {
      name: 'Push - Görev Atama',
      channel: 'push',
      category: 'task',
      notificationType: 'task_assignment',
      description: 'Görev atama push bildirimi şablonu',
      pushTitle: 'Yeni Görev',
      pushBody: '{{taskTitle}} görevi size atandı',
      isDefault: true,
      isActive: true,
    });

    // 11. Push - Urgent Alert
    await createIfMissing('Push - Acil Bildirim', {
      name: 'Push - Acil Bildirim',
      channel: 'push',
      category: 'urgent',
      notificationType: 'urgent_alert',
      description: 'Acil bildirim push şablonu',
      pushTitle: '⚠️ ACİL',
      pushBody: '{{notificationMessage}}',
      isDefault: false,
      isActive: true,
    });

    // 12. Push - System Update
    await createIfMissing('Push - Sistem Güncellemesi', {
      name: 'Push - Sistem Güncellemesi',
      channel: 'push',
      category: 'system',
      notificationType: 'system_update',
      description: 'Sistem güncellemesi push şablonu',
      pushTitle: 'Sistem Güncellemesi',
      pushBody: '{{notificationMessage}}',
      isDefault: false,
      isActive: true,
    });

    // ============================================
    // WHATSAPP TEMPLATES
    // ============================================

    // 13. WhatsApp - Task Assignment
    await createIfMissing('WhatsApp - Görev Atama', {
      name: 'WhatsApp - Görev Atama',
      channel: 'whatsapp',
      category: 'task',
      notificationType: 'task_assignment',
      description: 'Görev atama WhatsApp şablonu',
      socialContent: '👋 Merhaba {{userName}},\n\n📋 Size yeni bir görev atandı:\n\n*{{taskTitle}}*\n\n{{taskDescription}}\n\n📅 Son Tarih: {{taskDueDate}}\n\nDetaylar için sisteme giriş yapabilirsiniz.\n\n{{companyName}}',
      isDefault: true,
      isActive: true,
    });

    // 14. WhatsApp - Urgent Alert
    await createIfMissing('WhatsApp - Acil Bildirim', {
      name: 'WhatsApp - Acil Bildirim',
      channel: 'whatsapp',
      category: 'urgent',
      notificationType: 'urgent_alert',
      description: 'Acil bildirim WhatsApp şablonu',
      socialContent: '🚨 *ACİL BİLDİRİM*\n\n{{notificationMessage}}\n\nLütfen derhal işlem yapın.\n\n{{companyName}}',
      isDefault: false,
      isActive: true,
    });

    // ============================================
    // TELEGRAM TEMPLATES
    // ============================================

    // 15. Telegram - Task Assignment
    await createIfMissing('Telegram - Görev Atama', {
      name: 'Telegram - Görev Atama',
      channel: 'telegram',
      category: 'task',
      notificationType: 'task_assignment',
      description: 'Görev atama Telegram şablonu',
      socialContent: '👋 Merhaba {{userName}},\n\n📋 Size yeni bir görev atandı:\n\n*{{taskTitle}}*\n\n{{taskDescription}}\n\n📅 Son Tarih: {{taskDueDate}}\n\nDetaylar için sisteme giriş yapabilirsiniz.\n\n{{companyName}}',
      isDefault: true,
      isActive: true,
    });

    // 16. Telegram - Urgent Alert
    await createIfMissing('Telegram - Acil Bildirim', {
      name: 'Telegram - Acil Bildirim',
      channel: 'telegram',
      category: 'urgent',
      notificationType: 'urgent_alert',
      description: 'Acil bildirim Telegram şablonu',
      socialContent: '🚨 *ACİL BİLDİRİM*\n\n{{notificationMessage}}\n\nLütfen derhal işlem yapın.\n\n{{companyName}}',
      isDefault: false,
      isActive: true,
    });

    logger.info('Default notification templates created', {
      created: templates.length,
      skipped: skippedCount
    }, 'api-notification-templates-seed');

    return NextResponse.json({
      success: true,
      message: templates.length > 0
        ? `${templates.length} yeni şablon oluşturuldu${skippedCount > 0 ? `, ${skippedCount} şablon zaten mevcut` : ''}`
        : 'Tüm şablonlar zaten mevcut',
      data: {
        templates: templates.map(t => ({ id: t.id, name: t.name, channel: t.channel })),
        created: templates.length,
        skipped: skippedCount
      },
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









