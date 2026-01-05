/**
 * Production Module Seeder
 */

import { ModuleSeeder, SeederContext, SeederResult, randomChoice, randomDecimal, randomDate } from './base-seeder';

export class ProductionSeeder implements ModuleSeeder {
  moduleSlug = 'production';
  moduleName = 'Production';
  description = 'Üretim yönetimi demo verileri';
  dependencies = ['locations'];

  async seed(ctx: SeederContext): Promise<SeederResult> {
    const { tenantPrisma, tenantId, companyId, adminUserId, currency } = ctx;
    let itemsCreated = 0;
    const details: Record<string, number> = {};

    try {
      // Get locations
      const locations = await tenantPrisma.location.findMany({
        where: { tenantId },
        take: 3,
      });

      // Products
      const productData = [
        { name: 'Alüminyum Profil', code: 'PRD-DEMO-001', category: 'Hammadde', type: 'hammadde' },
        { name: 'Çelik Levha', code: 'PRD-DEMO-002', category: 'Hammadde', type: 'hammadde' },
        { name: 'Plastik Granül', code: 'PRD-DEMO-003', category: 'Hammadde', type: 'hammadde' },
        { name: 'Vida Seti M8', code: 'PRD-DEMO-004', category: 'Malzeme', type: 'hammadde' },
        { name: 'Motor Gövdesi', code: 'PRD-DEMO-005', category: 'Yarı Mamul', type: 'yarı_mamul' },
        { name: 'Şanzıman Kutusu', code: 'PRD-DEMO-006', category: 'Yarı Mamul', type: 'yarı_mamul' },
        { name: 'Elektrik Motoru 5kW', code: 'PRD-DEMO-007', category: 'Mamul', type: 'mamul' },
        { name: 'Hidrolik Pompa', code: 'PRD-DEMO-008', category: 'Mamul', type: 'mamul' },
        { name: 'Konveyör Sistemi', code: 'PRD-DEMO-009', category: 'Mamul', type: 'mamul' },
        { name: 'Otomasyon Paneli', code: 'PRD-DEMO-010', category: 'Mamul', type: 'mamul' },
      ];

      const products: any[] = [];
      for (let idx = 0; idx < productData.length; idx++) {
        const p = productData[idx]!;
        const product = await tenantPrisma.product.upsert({
          where: {
            tenantId_code: {
              tenantId,
              code: p.code,
            },
          },
          update: {},
          create: {
            tenantId,
            companyId,
            locationId: locations.length > 0 ? locations[idx % locations.length]!.id : null,
            name: p.name,
            code: p.code,
            sku: `SKU-DEMO-${p.code}`,
            barcode: `DEMO-${Date.now()}${idx}`,
            category: p.category,
            type: p.type,
            stockQuantity: randomDecimal(10, 500),
            minStockLevel: randomDecimal(5, 20),
            maxStockLevel: randomDecimal(500, 1000),
            unit: randomChoice(['adet', 'kg', 'metre', 'lt']),
            costPrice: randomDecimal(100, 5000),
            sellingPrice: randomDecimal(150, 7500),
            currency,
            isProducible: p.type !== 'hammadde',
            productionTime: p.type !== 'hammadde' ? randomChoice([30, 60, 120, 240]) : null,
            description: `${p.name} - Demo ürün`,
            isActive: true,
          },
        });
        products.push(product);
        itemsCreated++;
      }
      details['products'] = products.length;

      // Production Orders
      const productionStatuses = ['pending', 'in_progress', 'completed'];
      const producibleProducts = products.filter((p) => p.isProducible);
      const productionOrders: any[] = [];

      for (let idx = 0; idx < Math.min(6, producibleProducts.length); idx++) {
        const product = producibleProducts[idx];
        const plannedStart = randomDate(new Date(), new Date(Date.now() + 30 * 24 * 60 * 60 * 1000));
        const plannedEnd = new Date(plannedStart);
        plannedEnd.setDate(plannedEnd.getDate() + randomChoice([3, 5, 7, 14]));

        const order = await tenantPrisma.productionOrder.upsert({
          where: {
            tenantId_orderNumber: {
              tenantId,
              orderNumber: `PO-DEMO-2024-${String(idx + 1).padStart(4, '0')}`,
            },
          },
          update: {},
          create: {
            tenantId,
            companyId,
            locationId: product.locationId || (locations.length > 0 ? locations[0]!.id : null),
            orderNumber: `PO-DEMO-2024-${String(idx + 1).padStart(4, '0')}`,
            productId: product.id,
            quantity: randomDecimal(10, 100),
            unit: product.unit,
            status: randomChoice(productionStatuses),
            plannedStartDate: plannedStart,
            plannedEndDate: plannedEnd,
            actualStartDate: idx < 3 ? plannedStart : null,
            estimatedCost: randomDecimal(5000, 50000),
            actualCost: idx < 2 ? randomDecimal(4500, 48000) : null,
            priority: randomChoice(['low', 'normal', 'high', 'urgent']),
            notes: 'Demo üretim emri',
            isActive: true,
          },
        });
        productionOrders.push(order);
        itemsCreated++;
      }
      details['productionOrders'] = productionOrders.length;

      // Production Steps
      const stepNames = ['Malzeme Hazırlık', 'Kesim', 'İşleme', 'Montaj', 'Kalite Kontrol', 'Paketleme'];
      let stepsCreated = 0;

      for (const order of productionOrders.slice(0, 4)) {
        for (let i = 0; i < 4; i++) {
          await tenantPrisma.productionStep.create({
            data: {
              tenantId,
              companyId: order.companyId,
              orderId: order.id,
              stepNumber: i + 1,
              name: stepNames[i]!,
              description: `${stepNames[i]} adımı - Demo`,
              status: i < 2 ? 'completed' : randomChoice(['pending', 'in_progress']),
              plannedStart: order.plannedStartDate,
              plannedEnd: order.plannedEndDate,
              actualStart: i < 2 ? order.actualStartDate : null,
              actualEnd: i < 1 ? new Date() : null,
              assignedTo: adminUserId,
              laborHours: i < 2 ? randomDecimal(2, 8) : null,
              notes: 'Demo adım',
            },
          });
          stepsCreated++;
          itemsCreated++;
        }
      }
      details['productionSteps'] = stepsCreated;

      // Stock Movements
      const movementTypes = ['in', 'out', 'adjustment'];
      let movementsCreated = 0;

      for (const product of products.slice(0, 8)) {
        for (let moveIdx = 0; moveIdx < 3; moveIdx++) {
          await tenantPrisma.stockMovement.create({
            data: {
              tenantId,
              companyId,
              locationId: product.locationId,
              productId: product.id,
              type: randomChoice(movementTypes),
              quantity: randomDecimal(5, 50),
              unit: product.unit,
              referenceType: randomChoice(['production', 'sale', 'purchase']),
              referenceId: `REF-DEMO-${Date.now()}-${moveIdx}`,
              movementDate: randomDate(new Date(2024, 0, 1), new Date()),
              notes: 'Demo stok hareketi',
            },
          });
          movementsCreated++;
          itemsCreated++;
        }
      }
      details['stockMovements'] = movementsCreated;

      return { success: true, itemsCreated, details };
    } catch (error: any) {
      return { success: false, itemsCreated, error: error.message, details };
    }
  }

  async unseed(ctx: SeederContext): Promise<SeederResult> {
    const { tenantPrisma } = ctx;
    let itemsDeleted = 0;

    try {
      // Delete stock movements
      const movementResult = await tenantPrisma.stockMovement.deleteMany({
        where: { notes: 'Demo stok hareketi' },
      });
      itemsDeleted += movementResult.count;

      // Delete production steps
      const stepResult = await tenantPrisma.productionStep.deleteMany({
        where: { notes: 'Demo adım' },
      });
      itemsDeleted += stepResult.count;

      // Delete production orders
      const orderResult = await tenantPrisma.productionOrder.deleteMany({
        where: { orderNumber: { startsWith: 'PO-DEMO-' } },
      });
      itemsDeleted += orderResult.count;

      // Delete products
      const productResult = await tenantPrisma.product.deleteMany({
        where: { code: { startsWith: 'PRD-DEMO-' } },
      });
      itemsDeleted += productResult.count;

      return { success: true, itemsCreated: 0, itemsDeleted };
    } catch (error: any) {
      return { success: false, itemsCreated: 0, itemsDeleted, error: error.message };
    }
  }

  async checkStatus(ctx: SeederContext): Promise<{ hasData: boolean; count: number }> {
    const { tenantPrisma } = ctx;

    const productCount = await tenantPrisma.product.count({
      where: { code: { startsWith: 'PRD-DEMO-' } },
    });

    const orderCount = await tenantPrisma.productionOrder.count({
      where: { orderNumber: { startsWith: 'PO-DEMO-' } },
    });

    const count = productCount + orderCount;
    return { hasData: count > 0, count };
  }
}
