/**
 * Cleanup demo data from tenant database
 * This removes the incorrectly seeded data with wrong tenantId
 */
import { PrismaClient as TenantPrismaClient } from '@prisma/tenant-client';

const prisma = new TenantPrismaClient();

async function main() {
  console.log('\n🧹 Cleaning up demo data with wrong tenantId...\n');

  // Delete in reverse dependency order
  const deletions = [
    { name: 'AuditLogs', fn: () => prisma.auditLog.deleteMany({ where: { tenantId: { startsWith: 'tenant-' } } }) },
    { name: 'Reports', fn: () => prisma.report.deleteMany({ where: { tenantId: { startsWith: 'tenant-' } } }) },
    { name: 'AIGenerations', fn: () => prisma.aIGeneration.deleteMany({ where: { tenantId: { startsWith: 'tenant-' } } }) },
    { name: 'CoreFiles', fn: () => prisma.coreFile.deleteMany({ where: { tenantId: { startsWith: 'tenant-' } } }) },
    { name: 'PageForms', fn: () => prisma.pageForm.deleteMany({}) },
    { name: 'Pages', fn: () => prisma.page.deleteMany({ where: { websiteId: { startsWith: 'tenant-' } } }) },
    { name: 'Websites', fn: () => prisma.website.deleteMany({ where: { id: { startsWith: 'tenant-' } } }) },
    { name: 'WebBuilderThemes', fn: () => prisma.webBuilderTheme.deleteMany({ where: { id: { startsWith: 'tenant-' } } }) },
    { name: 'ChatMessages', fn: () => prisma.chatMessage.deleteMany({}) },
    { name: 'ChatRoomMembers', fn: () => prisma.chatRoomMember.deleteMany({}) },
    { name: 'ChatRooms', fn: () => prisma.chatRoom.deleteMany({ where: { id: { startsWith: 'tenant-' } } }) },
    { name: 'Notifications', fn: () => prisma.notification.deleteMany({ where: { tenantId: { startsWith: 'tenant-' } } }) },
    { name: 'StockMovements', fn: () => prisma.stockMovement.deleteMany({}) },
    { name: 'ProductionSteps', fn: () => prisma.productionStep.deleteMany({}) },
    { name: 'ProductionOrders', fn: () => prisma.productionOrder.deleteMany({}) },
    { name: 'Products', fn: () => prisma.product.deleteMany({ where: { tenantId: { startsWith: 'tenant-' } } }) },
    { name: 'Payrolls', fn: () => prisma.payroll.deleteMany({}) },
    { name: 'Leaves', fn: () => prisma.leave.deleteMany({}) },
    { name: 'Employees', fn: () => prisma.employee.deleteMany({}) },
    { name: 'ExpenseCategories', fn: () => prisma.expenseCategory.deleteMany({}) },
    { name: 'Expenses', fn: () => prisma.expense.deleteMany({ where: { tenantId: { startsWith: 'tenant-' } } }) },
    { name: 'AccountingPayments', fn: () => prisma.accountingPayment.deleteMany({ where: { tenantId: { startsWith: 'tenant-' } } }) },
    { name: 'Invoices', fn: () => prisma.invoice.deleteMany({ where: { tenantId: { startsWith: 'tenant-' } } }) },
    { name: 'Subscriptions', fn: () => prisma.subscription.deleteMany({ where: { id: { startsWith: 'tenant-' } } }) },
    { name: 'RE Payments', fn: () => prisma.payment.deleteMany({}) },
    { name: 'Appointments', fn: () => prisma.appointment.deleteMany({}) },
    { name: 'Contracts', fn: () => prisma.contract.deleteMany({}) },
    { name: 'Tenants', fn: () => prisma.tenant.deleteMany({}) },
    { name: 'PropertyStaff', fn: () => prisma.propertyStaff.deleteMany({}) },
    { name: 'RE Staff', fn: () => prisma.realEstateStaff.deleteMany({}) },
    { name: 'Apartments', fn: () => prisma.apartment.deleteMany({}) },
    { name: 'Properties', fn: () => prisma.property.deleteMany({ where: { tenantId: { startsWith: 'tenant-' } } }) },
    { name: 'MaintenanceRecords', fn: () => prisma.maintenanceRecord.deleteMany({}) },
    { name: 'Equipment', fn: () => prisma.equipment.deleteMany({ where: { tenantId: { startsWith: 'tenant-' } } }) },
    { name: 'Locations', fn: () => prisma.location.deleteMany({ where: { tenantId: { startsWith: 'tenant-' } } }) },
  ];

  let total = 0;
  for (const { name, fn } of deletions) {
    try {
      const result = await fn();
      if (result.count > 0) {
        console.log(`  ✅ ${name}: ${result.count} records deleted`);
        total += result.count;
      }
    } catch (error: any) {
      console.log(`  ⚠️ ${name}: ${error.code || error.message}`);
    }
  }

  console.log(`\n🧹 Total deleted: ${total} records\n`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());





