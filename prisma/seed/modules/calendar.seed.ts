/**
 * Calendar Module Seeder
 */

import { ModuleSeeder, SeederContext, SeederResult, randomChoice, randomDate } from './base-seeder';

export class CalendarSeeder implements ModuleSeeder {
  moduleSlug = 'calendar';
  moduleName = 'Calendar';
  description = 'Takvim ve etkinlik demo verileri';

  async seed(ctx: SeederContext): Promise<SeederResult> {
    const { tenantPrisma, tenantId, companyId, adminUserId } = ctx;
    let itemsCreated = 0;

    try {
      const eventTitles = [
        'Ekip Toplantısı',
        'Müşteri Görüşmesi',
        'Proje Değerlendirme',
        'Haftalık Planlama',
        'Eğitim Semineri',
        'Bakım Kontrolü',
        'Bütçe Toplantısı',
        'Yönetim Kurulu',
        'Performans Değerlendirme',
        'Ürün Tanıtımı',
      ];

      const statuses = ['draft', 'scheduled', 'published', 'needs-revision'];
      const colors = ['yellow', 'green', 'red', 'blue', 'purple', 'slate'];
      const modules = ['real-estate', 'accounting', 'hr', 'production', 'maintenance', null];

      for (let idx = 0; idx < eventTitles.length; idx++) {
        const title = eventTitles[idx]!;
        const eventDate = randomDate(new Date(), new Date(Date.now() + 60 * 24 * 60 * 60 * 1000)); // Next 60 days

        await tenantPrisma.calendarEvent.create({
          data: {
            tenantId,
            companyId,
            title: `[DEMO] ${title}`,
            description: `${title} - Bu bir demo etkinliktir. Detaylar için etkinliği açın.`,
            date: eventDate,
            status: randomChoice(statuses),
            color: randomChoice(colors),
            userId: adminUserId,
            module: randomChoice(modules),
            client: idx % 3 === 0 ? `Demo Müşteri ${idx + 1}` : null,
            metadata: { demoData: true, createdBy: 'seeder' },
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
      const result = await tenantPrisma.calendarEvent.deleteMany({
        where: { title: { startsWith: '[DEMO]' } },
      });

      return { success: true, itemsCreated: 0, itemsDeleted: result.count };
    } catch (error: any) {
      return { success: false, itemsCreated: 0, itemsDeleted: 0, error: error.message };
    }
  }

  async checkStatus(ctx: SeederContext): Promise<{ hasData: boolean; count: number }> {
    const { tenantPrisma } = ctx;

    const count = await tenantPrisma.calendarEvent.count({
      where: { title: { startsWith: '[DEMO]' } },
    });

    return { hasData: count > 0, count };
  }
}
