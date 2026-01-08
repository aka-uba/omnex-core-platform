/**
 * Helper script to get tenant and company IDs from the database
 * Usage: TENANT_DATABASE_URL="postgresql://..." npx tsx prisma/seed/get-ids.ts
 */

import { PrismaClient } from '@prisma/tenant-client';

const getTenantPrisma = () => {
  const url = process.env.TENANT_DATABASE_URL;
  if (!url) {
    throw new Error('TENANT_DATABASE_URL environment variable is required');
  }
  return new PrismaClient({
    datasources: { db: { url } },
  });
};

async function main() {
  const prisma = getTenantPrisma();

  try {
    const company = await prisma.company.findFirst({
      select: { id: true, name: true },
    });

    if (!company) {
      console.log('No company found in database');
      return;
    }

    // Get tenantId from Tenant model (first tenant record)
    const tenantRecord = await prisma.tenant.findFirst({
      select: { tenantId: true },
    });

    const tenantId = tenantRecord?.tenantId || 'UNKNOWN';

    console.log('\n📋 Database IDs:\n');
    console.log(`TenantId:    ${tenantId}`);
    console.log(`CompanyId:   ${company.id}`);
    console.log(`CompanyName: ${company.name}`);
    console.log('');

    // Count tenants with apartments
    const tenantsWithApartments = await prisma.tenant.count({
      where: {
        tenantId: tenantId,
        companyId: company.id,
        apartmentId: { not: null },
      },
    });

    const contracts = await prisma.contract.count({
      where: {
        tenantId: tenantId,
        companyId: company.id,
      },
    });

    console.log(`📊 Stats:`);
    console.log(`   Tenants with apartments: ${tenantsWithApartments}`);
    console.log(`   Existing contracts: ${contracts}`);
    console.log('');

    console.log('💡 To create contracts, run:');
    console.log(`TENANT_DATABASE_URL="..." npx tsx prisma/seed/create-contracts-for-tenants.ts --tenant-id=${tenantId} --company-id=${company.id} --dry-run`);

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
