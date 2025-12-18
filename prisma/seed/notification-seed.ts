/**
 * Notification Seed Script
 * 
 * Tenant DB için örnek bildirimler oluşturur
 * Usage: TENANT_DATABASE_URL="..." tsx prisma/seed/notification-seed.ts --tenant-slug=acme
 */

import { PrismaClient as TenantPrismaClient } from '@prisma/tenant-client';

const tenantPrisma = new TenantPrismaClient();

// Get tenant slug from command line args
const tenantSlug = process.argv.find(arg => arg.startsWith('--tenant-slug='))?.split('=')[1] || 'default';

async function main() {
  console.log(`🔔 Starting notification seed for: ${tenantSlug}`);

  try {
    // Get first company
    const company = await tenantPrisma.company.findFirst({
      orderBy: { createdAt: 'asc' },
    });

    if (!company) {
      console.log('⚠️  No company found. Please run tenant-seed.ts first.');
      return;
    }

    // Get super admin user
    const superAdmin = await tenantPrisma.user.findFirst({
      where: {
        OR: [
          { email: 'admin@omnexcore.com' },
          { username: 'superadmin' },
        ],
      },
    });

    const senderId = superAdmin?.id || null;

    // Sample notifications
    const notifications = [
      {
        title: 'Hoş Geldiniz!',
        message: 'Omnex Core Platform\'a hoş geldiniz. Sistem kullanıma hazır.',
        type: 'info',
        priority: 'medium',
        isGlobal: true,
        module: 'notifications',
        senderId,
        recipientId: null,
        isRead: false,
        data: {},
      },
      {
        title: 'İlk Adımlar',
        message: 'Sistemi kullanmaya başlamak için lokasyon ve ekipman yapılandırmasını tamamlayın.',
        type: 'task',
        priority: 'high',
        isGlobal: true,
        module: 'locations',
        senderId,
        recipientId: null,
        isRead: false,
        actionUrl: '/locations',
        actionText: 'Lokasyonları Yönet',
        data: {},
      },
      {
        title: 'Sistem Güncellemesi',
        message: 'Yeni özellikler eklendi. Detaylar için tıklayın.',
        type: 'info',
        priority: 'low',
        isGlobal: true,
        module: 'notifications',
        senderId,
        recipientId: null,
        isRead: false,
        data: {},
      },
      {
        title: 'Güvenlik Uyarısı',
        message: 'Lütfen şifrenizi düzenli olarak güncelleyin.',
        type: 'warning',
        priority: 'medium',
        isGlobal: true,
        module: 'notifications',
        senderId,
        recipientId: null,
        isRead: false,
        data: {},
      },
      {
        title: 'Yedekleme Tamamlandı',
        message: 'Veritabanı yedekleme işlemi başarıyla tamamlandı.',
        type: 'success',
        priority: 'low',
        isGlobal: false,
        module: 'notifications',
        senderId,
        recipientId: superAdmin?.id || null,
        isRead: false,
        data: {},
      },
    ];

    console.log(`📝 Creating ${notifications.length} sample notifications...`);

    let createdCount = 0;
    let skippedCount = 0;

    for (const notification of notifications) {
      try {
        // Check if notification already exists (by title and message)
        const existing = await tenantPrisma.notification.findFirst({
          where: {
            title: notification.title,
            message: notification.message,
          },
        });

        if (existing) {
          console.log(`⏭️  Skipping existing notification: ${notification.title}`);
          skippedCount++;
          continue;
        }

        await tenantPrisma.notification.create({
          data: notification,
        });

        createdCount++;
        console.log(`✅ Created notification: ${notification.title}`);
      } catch (error) {
        console.error(`❌ Error creating notification "${notification.title}":`, error);
      }
    }

    console.log(`\n✅ Notification seed completed!`);
    console.log(`   Created: ${createdCount}`);
    console.log(`   Skipped: ${skippedCount}`);
    console.log(`   Total: ${notifications.length}`);
  } catch (error) {
    console.error('❌ Error in notification seed:', error);
    throw error;
  } finally {
    await tenantPrisma.$disconnect();
  }
}

main()
  .catch((error) => {
    console.error('Fatal error:', error);
    process.exit(1);
  });









