/**
 * Reports Module Seeder
 */

import { ModuleSeeder, SeederContext, SeederResult, randomChoice } from './base-seeder';

export class ReportsSeeder implements ModuleSeeder {
  moduleSlug = 'reports';
  moduleName = 'Reports';
  description = 'Raporlama modülü demo verileri';

  async seed(ctx: SeederContext): Promise<SeederResult> {
    const { tenantPrisma, tenantId, companyId, adminUserId } = ctx;
    let itemsCreated = 0;

    try {
      const reportTypes = ['financial', 'sales', 'inventory', 'hr', 'performance'];

      for (const type of reportTypes) {
        await tenantPrisma.report.create({
          data: {
            tenantId,
            companyId,
            userId: adminUserId,
            name: `[DEMO] ${type.charAt(0).toUpperCase() + type.slice(1)} Raporu - ${new Date().toLocaleDateString('tr-TR')}`,
            reportType: type,
            description: `[DEMO] Demo ${type} raporu`,
            dateRange: {
              start: new Date(2024, 0, 1).toISOString(),
              end: new Date().toISOString(),
            },
            visualization: randomChoice(['table', 'bar', 'line', 'pie']),
            status: randomChoice(['completed', 'completed', 'generating']),
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
      const result = await tenantPrisma.report.deleteMany({
        where: { name: { startsWith: '[DEMO]' } },
      });

      return { success: true, itemsCreated: 0, itemsDeleted: result.count };
    } catch (error: any) {
      return { success: false, itemsCreated: 0, itemsDeleted: 0, error: error.message };
    }
  }

  async checkStatus(ctx: SeederContext): Promise<{ hasData: boolean; count: number }> {
    const { tenantPrisma } = ctx;

    const count = await tenantPrisma.report.count({
      where: { name: { startsWith: '[DEMO]' } },
    });

    return { hasData: count > 0, count };
  }
}
