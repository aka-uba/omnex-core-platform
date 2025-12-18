/**
 * Notifications Module Seeder
 */

import { ModuleSeeder, SeederContext, SeederResult, randomChoice } from './base-seeder';

export class NotificationsSeeder implements ModuleSeeder {
  moduleSlug = 'notifications';
  moduleName = 'Notifications';
  description = 'Bildirim sistemi demo verileri';

  async seed(ctx: SeederContext): Promise<SeederResult> {
    const { tenantPrisma, tenantId, companyId, adminUserId } = ctx;
    let itemsCreated = 0;

    try {
      const notificationTypes = ['info', 'warning', 'success', 'alert', 'task'];
      const notificationTitles = [
        'Sistem Güncellemesi',
        'Yeni Özellik Eklendi',
        'Bakım Bildirimi',
        'Görev Hatırlatması',
        'Ödeme Bildirimi',
        'Toplantı Daveti',
        'Rapor Hazır',
        'Onay Bekliyor',
      ];

      for (let idx = 0; idx < notificationTitles.length; idx++) {
        const title = notificationTitles[idx];
        await tenantPrisma.notification.create({
          data: {
            tenantId,
            companyId,
            title: `[DEMO] ${title}`,
            message: `${title} - Bu bir demo bildirimdir. Detaylı bilgi için tıklayın.`,
            type: randomChoice(notificationTypes),
            priority: randomChoice(['low', 'medium', 'high']),
            senderId: adminUserId,
            recipientId: adminUserId,
            isRead: idx > 4,
            readAt: idx > 4 ? new Date() : null,
            isGlobal: idx % 3 === 0,
            module: randomChoice(['real-estate', 'accounting', 'hr', 'production', 'maintenance']),
            actionUrl: idx % 2 === 0 ? '/dashboard' : null,
            actionText: idx % 2 === 0 ? 'Detayları Gör' : null,
          },
        });
        itemsCreated++;
      }

      return { success: true, itemsCreated };
    } catch (error: any) {
      return { success: false, itemsCreated, error: error.message };
    }
  }

  async unseed(ctx: SeederContext): Promise<SeederResult> {
    const { tenantPrisma } = ctx;

    try {
      const result = await tenantPrisma.notification.deleteMany({
        where: { title: { startsWith: '[DEMO]' } },
      });

      return { success: true, itemsCreated: 0, itemsDeleted: result.count };
    } catch (error: any) {
      return { success: false, itemsCreated: 0, itemsDeleted: 0, error: error.message };
    }
  }

  async checkStatus(ctx: SeederContext): Promise<{ hasData: boolean; count: number }> {
    const { tenantPrisma } = ctx;

    const count = await tenantPrisma.notification.count({
      where: { title: { startsWith: '[DEMO]' } },
    });

    return { hasData: count > 0, count };
  }
}
