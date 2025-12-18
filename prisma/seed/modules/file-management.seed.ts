/**
 * File Management Module Seeder
 */

import { ModuleSeeder, SeederContext, SeederResult, randomChoice } from './base-seeder';

export class FileManagementSeeder implements ModuleSeeder {
  moduleSlug = 'file-management';
  moduleName = 'File Management';
  description = 'Dosya yönetimi demo verileri';

  async seed(ctx: SeederContext): Promise<SeederResult> {
    const { tenantPrisma, tenantId, companyId, adminUserId } = ctx;
    let itemsCreated = 0;

    try {
      const fileTypes = ['invoice', 'contract', 'report', 'document'];
      const modules = ['accounting', 'hr', 'real-estate', 'production'];

      for (let idx = 0; idx < 10; idx++) {
        const module = randomChoice(modules);
        const entityType = randomChoice(fileTypes);

        await tenantPrisma.coreFile.create({
          data: {
            tenantId,
            companyId,
            module,
            entityType,
            entityId: `demo-entity-${idx + 1}`,
            filename: `demo-file-${idx + 1}.pdf`,
            originalName: `[DEMO] Dosya ${idx + 1}.pdf`,
            path: `${module}/${entityType}s/2024/`,
            fullPath: `tenants/${tenantId}/module-files/${module}/`,
            size: Math.floor(Math.random() * 1000000) + 10000,
            mimeType: 'application/pdf',
            extension: 'pdf',
            title: `[DEMO] Demo Dosya ${idx + 1}`,
            description: '[DEMO] Demo dosya açıklaması',
            tags: ['demo', 'test'],
            category: randomChoice(['important', 'archive', 'active']),
            version: 1,
            isLatest: true,
            permissions: JSON.stringify({
              read: ['SuperAdmin', 'AgencyUser'],
              write: ['SuperAdmin'],
              delete: ['SuperAdmin'],
              share: ['SuperAdmin', 'AgencyUser'],
              isPublic: false,
            }),
            createdBy: adminUserId,
            updatedBy: adminUserId,
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
      const result = await tenantPrisma.coreFile.deleteMany({
        where: { title: { startsWith: '[DEMO]' } },
      });

      return { success: true, itemsCreated: 0, itemsDeleted: result.count };
    } catch (error: any) {
      return { success: false, itemsCreated: 0, itemsDeleted: 0, error: error.message };
    }
  }

  async checkStatus(ctx: SeederContext): Promise<{ hasData: boolean; count: number }> {
    const { tenantPrisma } = ctx;

    const count = await tenantPrisma.coreFile.count({
      where: { title: { startsWith: '[DEMO]' } },
    });

    return { hasData: count > 0, count };
  }
}
