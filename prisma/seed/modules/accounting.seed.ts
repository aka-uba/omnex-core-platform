/**
 * Accounting Module Seeder
 */

import { Prisma } from '@prisma/tenant-client';
import { ModuleSeeder, SeederContext, SeederResult, generateDemoId, randomChoice, randomDecimal, randomDate } from './base-seeder';

export class AccountingSeeder implements ModuleSeeder {
  moduleSlug = 'accounting';
  moduleName = 'Accounting';
  description = 'Muhasebe ve finans demo verileri';
  dependencies = ['locations'];

  async seed(ctx: SeederContext): Promise<SeederResult> {
    const { tenantPrisma, tenantId, companyId, tenantSlug, adminUserId } = ctx;
    let itemsCreated = 0;
    const details: Record<string, number> = {};

    try {
      // Get locations
      const locations = await tenantPrisma.location.findMany({
        where: { tenantId },
        take: 3,
      });

      // Subscriptions
      const subscriptionsData = [
        { name: 'Yazılım Lisansı - Enterprise', type: 'subscription', basePrice: 15000, description: 'Enterprise yazılım paketi' },
        { name: 'Cloud Hosting', type: 'subscription', basePrice: 5000, description: 'Cloud sunucu hizmeti' },
        { name: 'Ofis Kirası', type: 'rental', basePrice: 35000, description: 'Merkez ofis kirası' },
      ];

      const subscriptions: any[] = [];
      for (let idx = 0; idx < subscriptionsData.length; idx++) {
        const s = subscriptionsData[idx]!;
        const created = await tenantPrisma.subscription.upsert({
          where: { id: generateDemoId(tenantSlug, 'subscription', String(idx + 1)) },
          update: {},
          create: {
            id: generateDemoId(tenantSlug, 'subscription', String(idx + 1)),
            tenantId,
            companyId,
            name: s.name,
            type: s.type,
            status: 'active',
            startDate: new Date(2024, 0, 1),
            renewalDate: new Date(2025, 0, 1),
            basePrice: new Prisma.Decimal(s.basePrice),
            currency: 'TRY',
            billingCycle: 'monthly',
            description: s.description,
            isActive: true,
          },
        });
        subscriptions.push(created);
        itemsCreated++;
      }
      details['subscriptions'] = subscriptions.length;

      // Invoices
      const invoices: any[] = [];
      for (let i = 0; i < 10; i++) {
        const invoiceDate = new Date();
        invoiceDate.setMonth(invoiceDate.getMonth() - i);
        const dueDate = new Date(invoiceDate);
        dueDate.setDate(dueDate.getDate() + 30);

        const subtotal = randomDecimal(5000, 50000);
        const taxAmount = new Prisma.Decimal(Number(subtotal) * 0.2);
        const totalAmount = new Prisma.Decimal(Number(subtotal) + Number(taxAmount));

        const invoice = await tenantPrisma.invoice.upsert({
          where: {
            tenantId_invoiceNumber: {
              tenantId,
              invoiceNumber: `INV-DEMO-2024-${String(i + 1).padStart(4, '0')}`,
            },
          },
          update: {},
          create: {
            tenantId,
            companyId,
            subscriptionId: subscriptions.length > 0 ? subscriptions[i % subscriptions.length].id : null,
            invoiceNumber: `INV-DEMO-2024-${String(i + 1).padStart(4, '0')}`,
            invoiceDate,
            dueDate,
            subtotal,
            taxRate: new Prisma.Decimal(20),
            taxAmount,
            totalAmount,
            currency: 'TRY',
            status: i < 3 ? randomChoice(['draft', 'sent']) : randomChoice(['paid', 'paid', 'overdue']),
            paidDate: i >= 3 && Math.random() > 0.3 ? dueDate : null,
            description: subscriptions.length > 0 ? `Fatura - ${subscriptions[i % subscriptions.length].name}` : 'Demo fatura',
            items: JSON.stringify([{ description: 'Hizmet bedeli', quantity: 1, unitPrice: Number(subtotal), total: Number(subtotal) }]),
            isActive: true,
          },
        });
        invoices.push(invoice);
        itemsCreated++;
      }
      details['invoices'] = invoices.length;

      // Accounting Payments
      const paidInvoices = invoices.filter((inv) => inv.status === 'paid');
      let paymentsCreated = 0;

      for (let idx = 0; idx < paidInvoices.length; idx++) {
        const inv = paidInvoices[idx];
        await tenantPrisma.accountingPayment.create({
          data: {
            tenantId,
            companyId,
            subscriptionId: inv.subscriptionId,
            invoiceId: inv.id,
            amount: inv.totalAmount,
            currency: 'TRY',
            paymentDate: inv.paidDate || new Date(),
            paymentMethod: randomChoice(['bank_transfer', 'card', 'cash']),
            paymentReference: `PAY-DEMO-${Date.now()}-${idx}`,
            status: 'completed',
            notes: 'Demo ödeme',
          },
        });
        paymentsCreated++;
        itemsCreated++;
      }
      details['accountingPayments'] = paymentsCreated;

      // Expenses
      const expenseCategories = ['Operasyonel', 'Personel', 'Pazarlama', 'IT', 'Genel'];
      const expenseTypes = ['operational', 'rent', 'utility', 'maintenance', 'other'];

      for (let idx = 0; idx < 15; idx++) {
        await tenantPrisma.expense.create({
          data: {
            tenantId,
            companyId,
            locationId: locations.length > 0 ? locations[idx % locations.length]!.id : null,
            name: `Demo Gider Kalemi ${idx + 1}`,
            category: randomChoice(expenseCategories),
            type: randomChoice(expenseTypes),
            amount: randomDecimal(500, 15000),
            currency: 'TRY',
            expenseDate: randomDate(new Date(2024, 0, 1), new Date()),
            assignedUserId: adminUserId,
            status: randomChoice(['pending', 'approved', 'approved']),
            approvedBy: idx % 3 === 0 ? null : adminUserId,
            approvedAt: idx % 3 === 0 ? null : new Date(),
            description: 'Demo gider kaydı',
            isActive: true,
          },
        });
        itemsCreated++;
      }
      details['expenses'] = 15;

      return { success: true, itemsCreated, details };
    } catch (error: any) {
      return { success: false, itemsCreated, error: error.message, details };
    }
  }

  async unseed(ctx: SeederContext): Promise<SeederResult> {
    const { tenantPrisma } = ctx;
    let itemsDeleted = 0;

    try {
      // Delete accounting payments first
      const paymentResult = await tenantPrisma.accountingPayment.deleteMany({
        where: { notes: 'Demo ödeme' },
      });
      itemsDeleted += paymentResult.count;

      // Delete expenses
      const expenseResult = await tenantPrisma.expense.deleteMany({
        where: { description: 'Demo gider kaydı' },
      });
      itemsDeleted += expenseResult.count;

      // Delete invoices
      const invoiceResult = await tenantPrisma.invoice.deleteMany({
        where: { invoiceNumber: { startsWith: 'INV-DEMO-' } },
      });
      itemsDeleted += invoiceResult.count;

      // Delete subscriptions
      const subscriptionResult = await tenantPrisma.subscription.deleteMany({
        where: { id: { contains: '-demo-subscription-' } },
      });
      itemsDeleted += subscriptionResult.count;

      return { success: true, itemsCreated: 0, itemsDeleted };
    } catch (error: any) {
      return { success: false, itemsCreated: 0, itemsDeleted, error: error.message };
    }
  }

  async checkStatus(ctx: SeederContext): Promise<{ hasData: boolean; count: number }> {
    const { tenantPrisma } = ctx;

    const subscriptionCount = await tenantPrisma.subscription.count({
      where: { id: { contains: '-demo-subscription-' } },
    });

    const invoiceCount = await tenantPrisma.invoice.count({
      where: { invoiceNumber: { startsWith: 'INV-DEMO-' } },
    });

    const count = subscriptionCount + invoiceCount;
    return { hasData: count > 0, count };
  }
}
