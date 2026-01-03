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
    // USER AUTHENTICATION EMAIL TEMPLATES
    // ============================================

    // 7. User Activation Email
    await createIfMissing('Kullanıcı Aktivasyon Email Şablonu', {
      name: 'Kullanıcı Aktivasyon Email Şablonu',
      channel: 'email',
      category: 'user',
      notificationType: 'user_activation',
      description: 'Yeni kullanıcı hesap aktivasyonu için email şablonu',
      emailSubject: 'Hesabınızı Aktive Edin - {{companyName}}',
      emailPlainText: 'Merhaba {{userName}},\n\n{{companyName}} platformuna hoş geldiniz!\n\nHesabınızı aktive etmek için aşağıdaki bağlantıya tıklayın:\n\n{{activationUrl}}\n\nBu bağlantı {{expirationTime}} süreyle geçerlidir.\n\nEğer bu hesabı siz oluşturmadıysanız, lütfen bu emaili dikkate almayın.\n\nSaygılarımızla,\n{{companyName}}',
      emailTemplateStyle: 'modern',
      emailSignatureEnabled: true,
      emailSignatureUserInfo: false,
      emailSignatureUserAvatar: false,
      emailSignatureCompanyLogo: true,
      emailSignatureCompanyInfo: true,
      defaultMessagePrefix: 'Merhaba {{userName}},',
      defaultMessageSuffix: 'Saygılarımızla,\n{{companyName}}',
      isDefault: false,
      defaultForType: 'user_activation',
      isActive: true,
    });

    // 8. Welcome Email
    await createIfMissing('Hoşgeldiniz Email Şablonu', {
      name: 'Hoşgeldiniz Email Şablonu',
      channel: 'email',
      category: 'user',
      notificationType: 'welcome',
      description: 'Hesap aktivasyonu sonrası hoşgeldiniz emaili',
      emailSubject: '🎉 Hoş Geldiniz! - {{companyName}}',
      emailPlainText: 'Merhaba {{userName}},\n\n{{companyName}} ailesine hoş geldiniz!\n\nHesabınız başarıyla oluşturuldu ve aktive edildi. Artık platformumuzu kullanmaya başlayabilirsiniz.\n\n📧 Kullanıcı Adı: {{userEmail}}\n📅 Kayıt Tarihi: {{registrationDate}}\n\nSisteme giriş yapmak için:\n{{loginUrl}}\n\nSorularınız için bize ulaşabilirsiniz.\n\nSaygılarımızla,\n{{companyName}}',
      emailTemplateStyle: 'modern',
      emailSignatureEnabled: true,
      emailSignatureUserInfo: false,
      emailSignatureUserAvatar: false,
      emailSignatureCompanyLogo: true,
      emailSignatureCompanyInfo: true,
      defaultMessagePrefix: 'Merhaba {{userName}},',
      defaultMessageSuffix: 'Saygılarımızla,\n{{companyName}}',
      isDefault: false,
      defaultForType: 'welcome',
      isActive: true,
    });

    // 9. Password Reset Email
    await createIfMissing('Şifre Sıfırlama Email Şablonu', {
      name: 'Şifre Sıfırlama Email Şablonu',
      channel: 'email',
      category: 'user',
      notificationType: 'password_reset',
      description: 'Şifre sıfırlama talebi için email şablonu',
      emailSubject: 'Şifre Sıfırlama Talebi - {{companyName}}',
      emailPlainText: 'Merhaba {{userName}},\n\nŞifre sıfırlama talebinde bulundunuz.\n\nŞifrenizi sıfırlamak için aşağıdaki bağlantıya tıklayın:\n\n{{resetUrl}}\n\n⚠️ Bu bağlantı {{expirationTime}} süreyle geçerlidir.\n\nEğer bu talebi siz yapmadıysanız, lütfen bu emaili dikkate almayın. Şifreniz değişmeyecektir.\n\nGüvenlik nedeniyle:\n• Şifrenizi kimseyle paylaşmayın\n• Güçlü bir şifre seçin\n• Şifrenizi düzenli olarak değiştirin\n\nSaygılarımızla,\n{{companyName}}',
      emailTemplateStyle: 'corporate',
      emailSignatureEnabled: true,
      emailSignatureUserInfo: false,
      emailSignatureUserAvatar: false,
      emailSignatureCompanyLogo: true,
      emailSignatureCompanyInfo: true,
      defaultMessagePrefix: 'Merhaba {{userName}},',
      defaultMessageSuffix: 'Saygılarımızla,\n{{companyName}}',
      isDefault: false,
      defaultForType: 'password_reset',
      isActive: true,
    });

    // 10. Password Changed Confirmation Email
    await createIfMissing('Şifre Değişikliği Onay Email Şablonu', {
      name: 'Şifre Değişikliği Onay Email Şablonu',
      channel: 'email',
      category: 'user',
      notificationType: 'password_changed',
      description: 'Şifre başarıyla değiştirildiğinde gönderilen email',
      emailSubject: 'Şifreniz Değiştirildi - {{companyName}}',
      emailPlainText: 'Merhaba {{userName}},\n\nŞifreniz başarıyla değiştirildi.\n\n📅 Değişiklik Tarihi: {{changeDate}}\n🌐 IP Adresi: {{ipAddress}}\n💻 Cihaz: {{deviceInfo}}\n\nEğer bu değişikliği siz yapmadıysanız, lütfen derhal bizimle iletişime geçin:\n{{supportEmail}}\n\nHesap güvenliğiniz bizim için önemlidir.\n\nSaygılarımızla,\n{{companyName}}',
      emailTemplateStyle: 'corporate',
      emailSignatureEnabled: true,
      emailSignatureUserInfo: false,
      emailSignatureUserAvatar: false,
      emailSignatureCompanyLogo: true,
      emailSignatureCompanyInfo: true,
      defaultMessagePrefix: 'Merhaba {{userName}},',
      defaultMessageSuffix: 'Saygılarımızla,\n{{companyName}}',
      isDefault: false,
      defaultForType: 'password_changed',
      isActive: true,
    });

    // ============================================
    // REAL ESTATE EMAIL TEMPLATES
    // ============================================

    // 11. Real Estate - Lease Expiry Reminder
    await createIfMissing('Emlak - Kira Sözleşmesi Hatırlatma', {
      name: 'Emlak - Kira Sözleşmesi Hatırlatma',
      channel: 'email',
      category: 'real_estate',
      notificationType: 'real_estate_lease_expiry',
      description: 'Kira sözleşmesi bitiş hatırlatması',
      emailSubject: '📋 Kira Sözleşmesi Hatırlatması - {{propertyName}}',
      emailPlainText: 'Sayın {{userName}},\n\n{{propertyName}} mülkü için kira sözleşmesi hatırlatması:\n\n📍 Mülk: {{propertyName}}\n🏠 Birim: {{unitNumber}}\n👤 Kiracı: {{tenantName}}\n📅 Sözleşme Bitiş: {{leaseEndDate}}\n⏰ Kalan Süre: {{daysRemaining}} gün\n\nSözleşme yenileme işlemleri için hazırlık yapmanızı öneririz.\n\nSaygılarımızla,\n{{companyName}}',
      emailTemplateStyle: 'corporate',
      emailSignatureEnabled: true,
      emailSignatureUserInfo: true,
      emailSignatureUserAvatar: false,
      emailSignatureCompanyLogo: true,
      emailSignatureCompanyInfo: true,
      defaultMessagePrefix: 'Sayın {{userName}},',
      defaultMessageSuffix: 'Saygılarımızla,\n{{companyName}}',
      isDefault: false,
      defaultForType: 'real_estate_lease_expiry',
      isActive: true,
    });

    // 12. Real Estate - Rent Payment Reminder
    await createIfMissing('Emlak - Kira Ödeme Hatırlatma', {
      name: 'Emlak - Kira Ödeme Hatırlatma',
      channel: 'email',
      category: 'real_estate',
      notificationType: 'real_estate_rent_reminder',
      description: 'Kira ödeme hatırlatması',
      emailSubject: '💰 Kira Ödeme Hatırlatması - {{propertyName}}',
      emailPlainText: 'Sayın {{tenantName}},\n\nKira ödemeniz hakkında hatırlatma:\n\n📍 Mülk: {{propertyName}}\n🏠 Birim: {{unitNumber}}\n💵 Tutar: {{rentAmount}} {{currency}}\n📅 Son Ödeme Tarihi: {{dueDate}}\n\nÖdemenizi zamanında yapmanızı rica ederiz.\n\nÖdeme yöntemleri:\n{{paymentMethods}}\n\nSaygılarımızla,\n{{companyName}}',
      emailTemplateStyle: 'corporate',
      emailSignatureEnabled: true,
      emailSignatureUserInfo: true,
      emailSignatureUserAvatar: false,
      emailSignatureCompanyLogo: true,
      emailSignatureCompanyInfo: true,
      defaultMessagePrefix: 'Sayın {{tenantName}},',
      defaultMessageSuffix: 'Saygılarımızla,\n{{companyName}}',
      isDefault: false,
      defaultForType: 'real_estate_rent_reminder',
      isActive: true,
    });

    // 13. Real Estate - Payment Received
    await createIfMissing('Emlak - Ödeme Alındı', {
      name: 'Emlak - Ödeme Alındı',
      channel: 'email',
      category: 'real_estate',
      notificationType: 'real_estate_payment_received',
      description: 'Ödeme alındı bildirimi',
      emailSubject: '✅ Ödeme Alındı - {{propertyName}}',
      emailPlainText: 'Sayın {{tenantName}},\n\nÖdemenizi aldık. Teşekkür ederiz!\n\n📍 Mülk: {{propertyName}}\n🏠 Birim: {{unitNumber}}\n💵 Tutar: {{paymentAmount}} {{currency}}\n📅 Ödeme Tarihi: {{paymentDate}}\n🧾 Makbuz No: {{receiptNumber}}\n\nÖdeme detaylarınız sistemimize kaydedilmiştir.\n\nSaygılarımızla,\n{{companyName}}',
      emailTemplateStyle: 'modern',
      emailSignatureEnabled: true,
      emailSignatureUserInfo: true,
      emailSignatureUserAvatar: false,
      emailSignatureCompanyLogo: true,
      emailSignatureCompanyInfo: true,
      defaultMessagePrefix: 'Sayın {{tenantName}},',
      defaultMessageSuffix: 'Saygılarımızla,\n{{companyName}}',
      isDefault: false,
      defaultForType: 'real_estate_payment_received',
      isActive: true,
    });

    // 14. Real Estate - New Tenant Welcome
    await createIfMissing('Emlak - Yeni Kiracı Hoşgeldiniz', {
      name: 'Emlak - Yeni Kiracı Hoşgeldiniz',
      channel: 'email',
      category: 'real_estate',
      notificationType: 'real_estate_tenant_welcome',
      description: 'Yeni kiracı hoşgeldiniz emaili',
      emailSubject: '🏠 Yeni Evinize Hoş Geldiniz! - {{propertyName}}',
      emailPlainText: 'Sayın {{tenantName}},\n\nYeni evinize hoş geldiniz!\n\n📍 Adres: {{propertyAddress}}\n🏠 Birim: {{unitNumber}}\n📅 Giriş Tarihi: {{moveInDate}}\n📞 Acil Durum: {{emergencyContact}}\n\nÖnemli Bilgiler:\n{{moveInInstructions}}\n\nSorularınız için bize ulaşabilirsiniz.\n\nSaygılarımızla,\n{{companyName}}',
      emailTemplateStyle: 'modern',
      emailSignatureEnabled: true,
      emailSignatureUserInfo: true,
      emailSignatureUserAvatar: false,
      emailSignatureCompanyLogo: true,
      emailSignatureCompanyInfo: true,
      defaultMessagePrefix: 'Sayın {{tenantName}},',
      defaultMessageSuffix: 'Saygılarımızla,\n{{companyName}}',
      isDefault: false,
      defaultForType: 'real_estate_tenant_welcome',
      isActive: true,
    });

    // 15. Real Estate - Maintenance Request Update
    await createIfMissing('Emlak - Bakım Talebi Güncelleme', {
      name: 'Emlak - Bakım Talebi Güncelleme',
      channel: 'email',
      category: 'real_estate',
      notificationType: 'real_estate_maintenance_update',
      description: 'Bakım/onarım talebi durum güncellemesi',
      emailSubject: '🔧 Bakım Talebi Güncellendi - #{{ticketNumber}}',
      emailPlainText: 'Sayın {{tenantName}},\n\nBakım talebiniz güncellendi:\n\n📋 Talep No: #{{ticketNumber}}\n📍 Mülk: {{propertyName}}\n🏠 Birim: {{unitNumber}}\n📝 Konu: {{issueTitle}}\n📊 Durum: {{status}}\n\nGüncelleme:\n{{updateMessage}}\n\n{{assignedTechnician}}\n\nSorularınız için bize ulaşabilirsiniz.\n\nSaygılarımızla,\n{{companyName}}',
      emailTemplateStyle: 'corporate',
      emailSignatureEnabled: true,
      emailSignatureUserInfo: true,
      emailSignatureUserAvatar: false,
      emailSignatureCompanyLogo: true,
      emailSignatureCompanyInfo: true,
      defaultMessagePrefix: 'Sayın {{tenantName}},',
      defaultMessageSuffix: 'Saygılarımızla,\n{{companyName}}',
      isDefault: false,
      defaultForType: 'real_estate_maintenance_update',
      isActive: true,
    });

    // ============================================
    // SMS TEMPLATES
    // ============================================

    // 16. SMS - User Activation
    await createIfMissing('SMS - Kullanıcı Aktivasyon', {
      name: 'SMS - Kullanıcı Aktivasyon',
      channel: 'sms',
      category: 'user',
      notificationType: 'user_activation',
      description: 'Kullanıcı aktivasyon SMS şablonu',
      smsSubject: 'Aktivasyon',
      smsContent: '{{companyName}}: Aktivasyon kodunuz: {{activationCode}}. {{expirationTime}} içinde geçerlidir.',
      isDefault: false,
      defaultForType: 'user_activation',
      isActive: true,
    });

    // 17. SMS - Password Reset
    await createIfMissing('SMS - Şifre Sıfırlama', {
      name: 'SMS - Şifre Sıfırlama',
      channel: 'sms',
      category: 'user',
      notificationType: 'password_reset',
      description: 'Şifre sıfırlama SMS şablonu',
      smsSubject: 'Şifre',
      smsContent: '{{companyName}}: Şifre sıfırlama kodunuz: {{resetCode}}. {{expirationTime}} içinde geçerlidir.',
      isDefault: false,
      defaultForType: 'password_reset',
      isActive: true,
    });

    // 18. SMS - Rent Reminder
    await createIfMissing('SMS - Kira Hatırlatma', {
      name: 'SMS - Kira Hatırlatma',
      channel: 'sms',
      category: 'real_estate',
      notificationType: 'real_estate_rent_reminder',
      description: 'Kira ödeme hatırlatma SMS',
      smsSubject: 'Kira',
      smsContent: '{{companyName}}: {{propertyName}} kira ödemesi {{dueDate}} tarihinde. Tutar: {{rentAmount}} {{currency}}',
      isDefault: false,
      defaultForType: 'real_estate_rent_reminder',
      isActive: true,
    });

    // 19. SMS - Task Assignment
    await createIfMissing('SMS - Görev Atama', {
      name: 'SMS - Görev Atama',
      channel: 'sms',
      category: 'task',
      notificationType: 'task_assignment',
      description: 'Görev atama SMS şablonu',
      smsSubject: 'Görev',
      smsContent: '{{userName}}, size yeni görev atandı: {{taskTitle}}. Son tarih: {{taskDueDate}}. Detay: {{companyName}}',
      isDefault: false,
      defaultForType: 'task_assignment',
      isActive: true,
    });

    // 20. SMS - Urgent Alert
    await createIfMissing('SMS - Acil Bildirim', {
      name: 'SMS - Acil Bildirim',
      channel: 'sms',
      category: 'urgent',
      notificationType: 'urgent_alert',
      description: 'Acil bildirim SMS şablonu',
      smsSubject: 'ACİL',
      smsContent: 'ACİL: {{notificationMessage}} - {{companyName}}',
      isDefault: false,
      defaultForType: 'urgent_alert',
      isActive: true,
    });

    // 21. SMS - System Notification
    await createIfMissing('SMS - Sistem Bildirimi', {
      name: 'SMS - Sistem Bildirimi',
      channel: 'sms',
      category: 'system',
      notificationType: 'system_update',
      description: 'Sistem bildirimi SMS şablonu',
      smsSubject: 'Bildirim',
      smsContent: '{{companyName}}: {{notificationMessage}}',
      isDefault: false,
      defaultForType: 'system_update',
      isActive: true,
    });

    // ============================================
    // PUSH NOTIFICATION TEMPLATES
    // ============================================

    // 22. Push - Task Assignment
    await createIfMissing('Push - Görev Atama', {
      name: 'Push - Görev Atama',
      channel: 'push',
      category: 'task',
      notificationType: 'task_assignment',
      description: 'Görev atama push bildirimi şablonu',
      pushTitle: 'Yeni Görev',
      pushBody: '{{taskTitle}} görevi size atandı',
      isDefault: false,
      defaultForType: 'task_assignment',
      isActive: true,
    });

    // 23. Push - Urgent Alert
    await createIfMissing('Push - Acil Bildirim', {
      name: 'Push - Acil Bildirim',
      channel: 'push',
      category: 'urgent',
      notificationType: 'urgent_alert',
      description: 'Acil bildirim push şablonu',
      pushTitle: '⚠️ ACİL',
      pushBody: '{{notificationMessage}}',
      isDefault: false,
      defaultForType: 'urgent_alert',
      isActive: true,
    });

    // 24. Push - System Update
    await createIfMissing('Push - Sistem Güncellemesi', {
      name: 'Push - Sistem Güncellemesi',
      channel: 'push',
      category: 'system',
      notificationType: 'system_update',
      description: 'Sistem güncellemesi push şablonu',
      pushTitle: 'Sistem Güncellemesi',
      pushBody: '{{notificationMessage}}',
      isDefault: false,
      defaultForType: 'system_update',
      isActive: true,
    });

    // 25. Push - User Activation
    await createIfMissing('Push - Kullanıcı Aktivasyon', {
      name: 'Push - Kullanıcı Aktivasyon',
      channel: 'push',
      category: 'user',
      notificationType: 'user_activation',
      description: 'Kullanıcı aktivasyon push bildirimi',
      pushTitle: '✅ Hesap Aktive Edildi',
      pushBody: 'Merhaba {{userName}}, hesabınız aktive edildi!',
      isDefault: false,
      defaultForType: 'user_activation',
      isActive: true,
    });

    // 26. Push - Welcome
    await createIfMissing('Push - Hoşgeldiniz', {
      name: 'Push - Hoşgeldiniz',
      channel: 'push',
      category: 'user',
      notificationType: 'welcome',
      description: 'Hoşgeldiniz push bildirimi',
      pushTitle: '🎉 Hoş Geldiniz!',
      pushBody: '{{companyName}} ailesine hoş geldiniz {{userName}}!',
      isDefault: false,
      defaultForType: 'welcome',
      isActive: true,
    });

    // ============================================
    // WHATSAPP TEMPLATES
    // ============================================

    // 27. WhatsApp - Task Assignment
    await createIfMissing('WhatsApp - Görev Atama', {
      name: 'WhatsApp - Görev Atama',
      channel: 'whatsapp',
      category: 'task',
      notificationType: 'task_assignment',
      description: 'Görev atama WhatsApp şablonu',
      socialContent: '👋 Merhaba {{userName}},\n\n📋 Size yeni bir görev atandı:\n\n*{{taskTitle}}*\n\n{{taskDescription}}\n\n📅 Son Tarih: {{taskDueDate}}\n\nDetaylar için sisteme giriş yapabilirsiniz.\n\n{{companyName}}',
      isDefault: false,
      defaultForType: 'task_assignment',
      isActive: true,
    });

    // 28. WhatsApp - Urgent Alert
    await createIfMissing('WhatsApp - Acil Bildirim', {
      name: 'WhatsApp - Acil Bildirim',
      channel: 'whatsapp',
      category: 'urgent',
      notificationType: 'urgent_alert',
      description: 'Acil bildirim WhatsApp şablonu',
      socialContent: '🚨 *ACİL BİLDİRİM*\n\n{{notificationMessage}}\n\nLütfen derhal işlem yapın.\n\n{{companyName}}',
      isDefault: false,
      defaultForType: 'urgent_alert',
      isActive: true,
    });

    // 29. WhatsApp - Rent Reminder
    await createIfMissing('WhatsApp - Kira Hatırlatma', {
      name: 'WhatsApp - Kira Hatırlatma',
      channel: 'whatsapp',
      category: 'real_estate',
      notificationType: 'real_estate_rent_reminder',
      description: 'Kira ödeme hatırlatma WhatsApp şablonu',
      socialContent: '💰 *Kira Ödeme Hatırlatması*\n\nSayın {{tenantName}},\n\n📍 Mülk: {{propertyName}}\n🏠 Birim: {{unitNumber}}\n💵 Tutar: {{rentAmount}} {{currency}}\n📅 Son Ödeme: {{dueDate}}\n\nÖdemenizi zamanında yapmanızı rica ederiz.\n\n{{companyName}}',
      isDefault: false,
      defaultForType: 'real_estate_rent_reminder',
      isActive: true,
    });

    // ============================================
    // TELEGRAM TEMPLATES
    // ============================================

    // 30. Telegram - Task Assignment
    await createIfMissing('Telegram - Görev Atama', {
      name: 'Telegram - Görev Atama',
      channel: 'telegram',
      category: 'task',
      notificationType: 'task_assignment',
      description: 'Görev atama Telegram şablonu',
      socialContent: '👋 Merhaba {{userName}},\n\n📋 Size yeni bir görev atandı:\n\n*{{taskTitle}}*\n\n{{taskDescription}}\n\n📅 Son Tarih: {{taskDueDate}}\n\nDetaylar için sisteme giriş yapabilirsiniz.\n\n{{companyName}}',
      isDefault: false,
      defaultForType: 'task_assignment',
      isActive: true,
    });

    // 31. Telegram - Urgent Alert
    await createIfMissing('Telegram - Acil Bildirim', {
      name: 'Telegram - Acil Bildirim',
      channel: 'telegram',
      category: 'urgent',
      notificationType: 'urgent_alert',
      description: 'Acil bildirim Telegram şablonu',
      socialContent: '🚨 *ACİL BİLDİRİM*\n\n{{notificationMessage}}\n\nLütfen derhal işlem yapın.\n\n{{companyName}}',
      isDefault: false,
      defaultForType: 'urgent_alert',
      isActive: true,
    });

    // 32. Telegram - Rent Reminder
    await createIfMissing('Telegram - Kira Hatırlatma', {
      name: 'Telegram - Kira Hatırlatma',
      channel: 'telegram',
      category: 'real_estate',
      notificationType: 'real_estate_rent_reminder',
      description: 'Kira ödeme hatırlatma Telegram şablonu',
      socialContent: '💰 *Kira Ödeme Hatırlatması*\n\nSayın {{tenantName}},\n\n📍 Mülk: {{propertyName}}\n🏠 Birim: {{unitNumber}}\n💵 Tutar: {{rentAmount}} {{currency}}\n📅 Son Ödeme: {{dueDate}}\n\nÖdemenizi zamanında yapmanızı rica ederiz.\n\n{{companyName}}',
      isDefault: false,
      defaultForType: 'real_estate_rent_reminder',
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









