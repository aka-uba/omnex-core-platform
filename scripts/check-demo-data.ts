/**
 * Check demo data in tenant database
 */
import { PrismaClient } from '@prisma/tenant-client';

const prisma = new PrismaClient();

async function main() {
  console.log('\n📊 Checking demo data in tenant database...\n');
  
  const counts = {
    'Companies': await prisma.company.count(),
    'Users': await prisma.user.count(),
    'Locations': await prisma.location.count(),
    'Equipment': await prisma.equipment.count(),
    'Properties': await prisma.property.count(),
    'Apartments': await prisma.apartment.count(),
    'RE Tenants': await prisma.tenant.count(),
    'Contracts': await prisma.contract.count(),
    'RE Payments': await prisma.payment.count(),
    'Appointments': await prisma.appointment.count(),
    'RE Staff': await prisma.realEstateStaff.count(),
    'Subscriptions': await prisma.subscription.count(),
    'Invoices': await prisma.invoice.count(),
    'Acc Payments': await prisma.accountingPayment.count(),
    'Expenses': await prisma.expense.count(),
    'Products': await prisma.product.count(),
    'Production Orders': await prisma.productionOrder.count(),
    'Stock Movements': await prisma.stockMovement.count(),
    'Notifications': await prisma.notification.count(),
    'Chat Rooms': await prisma.chatRoom.count(),
    'Chat Messages': await prisma.chatMessage.count(),
    'Websites': await prisma.website.count(),
    'Pages': await prisma.page.count(),
    'AI Generations': await prisma.aIGeneration.count(),
    'Core Files': await prisma.coreFile.count(),
    'Reports': await prisma.report.count(),
    'Audit Logs': await prisma.auditLog.count(),
  };

  console.log('Table'.padEnd(20) + 'Count');
  console.log('-'.repeat(30));
  
  let totalRecords = 0;
  for (const [table, count] of Object.entries(counts)) {
    console.log(table.padEnd(20) + count);
    totalRecords += count;
  }
  
  console.log('-'.repeat(30));
  console.log('TOTAL'.padEnd(20) + totalRecords);
  console.log('\n');

  // Show sample data with tenantId
  const properties = await prisma.property.findMany({ 
    take: 3, 
    select: { id: true, name: true, tenantId: true, companyId: true } 
  });
  if (properties.length > 0) {
    console.log('\nSample Properties (with tenantId):');
    properties.forEach(p => console.log(`  - ${p.name}: tenantId=${p.tenantId}, companyId=${p.companyId}`));
  }

  // Check what tenantId values exist
  const distinctTenantIds = await prisma.property.groupBy({
    by: ['tenantId'],
    _count: true
  });
  console.log('\nDistinct tenantId values in Property table:');
  distinctTenantIds.forEach(t => console.log(`  - ${t.tenantId}: ${t._count} records`));

  // Check companies
  const companies = await prisma.company.findMany({ select: { id: true, name: true } });
  console.log('\nCompanies in database:');
  companies.forEach(c => console.log(`  - ${c.id}: ${c.name}`));
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());

