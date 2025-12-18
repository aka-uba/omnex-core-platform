/**
 * Maintenance Module Seeder
 */

import { ModuleSeeder, SeederContext, SeederResult, generateDemoId, randomChoice, randomDecimal, randomDate } from './base-seeder';

export class MaintenanceSeeder implements ModuleSeeder {
  moduleSlug = 'maintenance';
  moduleName = 'Maintenance';
  description = 'Bakım ve ekipman yönetimi demo verileri';
  dependencies = ['locations'];

  async seed(ctx: SeederContext): Promise<SeederResult> {
    const { tenantPrisma, tenantId, companyId, tenantSlug, adminUserId } = ctx;
    let itemsCreated = 0;
    const details: Record<string, number> = {};

    try {
      // Get locations
      const locations = await tenantPrisma.location.findMany({
        where: { id: { contains: `-demo-location-` } },
      });

      // Equipment data
      const equipmentData = [
        { name: 'CNC Torna Makinesi', category: 'makine', type: 'cnc', brand: 'Mazak', model: 'QT-200' },
        { name: 'Kaynak Robotu', category: 'makine', type: 'robot', brand: 'Fanuc', model: 'ARC Mate 100iD' },
        { name: 'Pres Makinesi', category: 'makine', type: 'pres', brand: 'Ermaksan', model: 'Speed-Bend Pro' },
        { name: 'Kompresör', category: 'elektronik', type: 'compressor', brand: 'Atlas Copco', model: 'GA30' },
        { name: 'Forklift', category: 'arac', type: 'forklift', brand: 'Toyota', model: '8FG25' },
        { name: 'Lazer Kesim Makinesi', category: 'makine', type: 'laser', brand: 'Trumpf', model: 'TruLaser 3030' },
        { name: 'Boya Kabini', category: 'makine', type: 'paint', brand: 'Gema', model: 'OptiCenter OC06' },
        { name: 'Vinç', category: 'makine', type: 'crane', brand: 'Kone', model: 'CXT 5t' },
      ];

      const equipment: any[] = [];
      for (let idx = 0; idx < equipmentData.length; idx++) {
        const eq = equipmentData[idx]!;
        const created = await tenantPrisma.equipment.upsert({
          where: { id: generateDemoId(tenantSlug, 'equipment', String(idx + 1)) },
          update: {},
          create: {
            id: generateDemoId(tenantSlug, 'equipment', String(idx + 1)),
            tenantId,
            companyId,
            locationId: locations.length > 0 ? randomChoice(locations).id : null,
            name: eq.name,
            code: `EQ-DEMO-${String(idx + 1).padStart(3, '0')}`,
            category: eq.category,
            type: eq.type,
            brand: eq.brand,
            model: eq.model,
            serialNumber: `SN-DEMO-${Date.now()}-${idx}`,
            status: randomChoice(['active', 'active', 'active', 'maintenance']),
            purchaseDate: randomDate(new Date(2020, 0, 1), new Date(2023, 11, 31)),
            warrantyUntil: randomDate(new Date(2024, 0, 1), new Date(2026, 11, 31)),
            isActive: true,
          },
        });
        equipment.push(created);
        itemsCreated++;
      }
      details['equipment'] = equipment.length;

      // Maintenance Records
      if (equipment.length > 0 && locations.length > 0) {
        const maintenanceTypes = ['preventive', 'corrective', 'emergency'];
        const maintenanceStatuses = ['scheduled', 'in_progress', 'completed'];

        for (let idx = 0; idx < Math.min(5, equipment.length); idx++) {
          const eq = equipment[idx]!;
          await tenantPrisma.maintenanceRecord.upsert({
            where: { id: generateDemoId(tenantSlug, 'maintenance', String(idx + 1)) },
            update: {},
            create: {
              id: generateDemoId(tenantSlug, 'maintenance', String(idx + 1)),
              tenantId,
              companyId,
              locationId: eq.locationId || locations[0]!.id,
              equipmentId: eq.id,
              type: randomChoice(maintenanceTypes),
              title: `${eq.name} - Periyodik Bakım`,
              description: `${eq.name} için planlanmış periyodik bakım çalışması`,
              status: randomChoice(maintenanceStatuses),
              scheduledDate: randomDate(new Date(), new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)),
              startDate: idx < 3 ? new Date() : null,
              estimatedCost: randomDecimal(500, 5000),
              actualCost: idx < 2 ? randomDecimal(400, 4500) : null,
              assignedTo: adminUserId,
              notes: 'Demo bakım kaydı',
              isActive: true,
            },
          });
          itemsCreated++;
        }
        details['maintenanceRecords'] = Math.min(5, equipment.length);
      }

      return { success: true, itemsCreated, details };
    } catch (error: any) {
      return { success: false, itemsCreated, error: error.message, details };
    }
  }

  async unseed(ctx: SeederContext): Promise<SeederResult> {
    const { tenantPrisma } = ctx;
    let itemsDeleted = 0;

    try {
      // Delete maintenance records first
      const maintenanceResult = await tenantPrisma.maintenanceRecord.deleteMany({
        where: { id: { contains: `-demo-maintenance-` } },
      });
      itemsDeleted += maintenanceResult.count;

      // Then delete equipment
      const equipmentResult = await tenantPrisma.equipment.deleteMany({
        where: { id: { contains: `-demo-equipment-` } },
      });
      itemsDeleted += equipmentResult.count;

      return { success: true, itemsCreated: 0, itemsDeleted };
    } catch (error: any) {
      return { success: false, itemsCreated: 0, itemsDeleted, error: error.message };
    }
  }

  async checkStatus(ctx: SeederContext): Promise<{ hasData: boolean; count: number }> {
    const { tenantPrisma } = ctx;

    const equipmentCount = await tenantPrisma.equipment.count({
      where: { id: { contains: `-demo-equipment-` } },
    });

    const maintenanceCount = await tenantPrisma.maintenanceRecord.count({
      where: { id: { contains: `-demo-maintenance-` } },
    });

    const count = equipmentCount + maintenanceCount;
    return { hasData: count > 0, count };
  }
}
