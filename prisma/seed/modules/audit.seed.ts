/**
 * Audit Module Seeder
 */

import { ModuleSeeder, SeederContext, SeederResult, randomChoice } from './base-seeder';

export class AuditSeeder implements ModuleSeeder {
  moduleSlug = 'audit';
  moduleName = 'Audit';
  description = 'Denetim ve log demo verileri';

  async seed(ctx: SeederContext): Promise<SeederResult> {
    const { tenantPrisma, tenantId, companyId, adminUserId } = ctx;
    let itemsCreated = 0;

    try {
      const auditActions = ['create', 'update', 'delete', 'login', 'export'];
      const auditEntities = ['User', 'Property', 'Invoice', 'Employee', 'Product'];

      for (let idx = 0; idx < 20; idx++) {
        await tenantPrisma.auditLog.create({
          data: {
            tenantId,
            companyId,
            userId: adminUserId,
            action: randomChoice(auditActions),
            entity: randomChoice(auditEntities),
            entityId: `demo-entity-${idx + 1}`,
            metadata: JSON.stringify({
              demo: true,
              changes: { field: 'value' },
              browser: 'Chrome',
              os: 'Windows',
            }),
            ipAddress: '192.168.1.' + (idx + 1),
            userAgent: '[DEMO] Mozilla/5.0 Demo Browser',
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
      const result = await tenantPrisma.auditLog.deleteMany({
        where: { userAgent: { startsWith: '[DEMO]' } },
      });

      return { success: true, itemsCreated: 0, itemsDeleted: result.count };
    } catch (error: any) {
      return { success: false, itemsCreated: 0, itemsDeleted: 0, error: error.message };
    }
  }

  async checkStatus(ctx: SeederContext): Promise<{ hasData: boolean; count: number }> {
    const { tenantPrisma } = ctx;

    const count = await tenantPrisma.auditLog.count({
      where: { userAgent: { startsWith: '[DEMO]' } },
    });

    return { hasData: count > 0, count };
  }
}
