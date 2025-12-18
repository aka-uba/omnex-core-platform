/**
 * Locations Module Seeder
 */

import { ModuleSeeder, SeederContext, SeederResult, generateDemoId } from './base-seeder';

export class LocationsSeeder implements ModuleSeeder {
  moduleSlug = 'locations';
  moduleName = 'Locations';
  description = 'Lokasyon ve konum yönetimi demo verileri';

  async seed(ctx: SeederContext): Promise<SeederResult> {
    const { tenantPrisma, tenantId, companyId, tenantSlug } = ctx;
    let itemsCreated = 0;

    try {
      const locationsData = [
        {
          id: generateDemoId(tenantSlug, 'location', 'hq'),
          name: 'Merkez Ofis',
          type: 'firma',
          code: 'HQ-001',
          description: 'Ana merkez binası',
          address: 'Atatürk Caddesi No: 123',
          city: 'İstanbul',
          country: 'Türkiye',
          postalCode: '34000',
        },
        {
          id: generateDemoId(tenantSlug, 'location', 'factory'),
          name: 'Üretim Tesisi',
          type: 'isletme',
          code: 'FAC-001',
          description: 'Ana üretim tesisi',
          address: 'Organize Sanayi Bölgesi 5. Cadde No: 45',
          city: 'Kocaeli',
          country: 'Türkiye',
          postalCode: '41000',
        },
        {
          id: generateDemoId(tenantSlug, 'location', 'warehouse'),
          name: 'Depo',
          type: 'lokasyon',
          code: 'WH-001',
          description: 'Malzeme deposu',
          address: 'Lojistik Merkezi A Blok',
          city: 'İstanbul',
          country: 'Türkiye',
          postalCode: '34500',
        },
      ];

      for (const loc of locationsData) {
        await tenantPrisma.location.upsert({
          where: { id: loc.id },
          update: {},
          create: {
            ...loc,
            tenantId,
            companyId,
            isActive: true,
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
      const result = await tenantPrisma.location.deleteMany({
        where: {
          id: { contains: `-demo-location-` },
        },
      });

      return { success: true, itemsCreated: 0, itemsDeleted: result.count };
    } catch (error: any) {
      return { success: false, itemsCreated: 0, itemsDeleted: 0, error: error.message };
    }
  }

  async checkStatus(ctx: SeederContext): Promise<{ hasData: boolean; count: number }> {
    const { tenantPrisma } = ctx;

    const count = await tenantPrisma.location.count({
      where: {
        id: { contains: `-demo-location-` },
      },
    });

    return { hasData: count > 0, count };
  }
}
