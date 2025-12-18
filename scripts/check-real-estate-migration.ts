/**
 * Real Estate Module Migration Safety Check
 * 
 * Bu script, migration öncesi duplicate verileri kontrol eder
 * ve unique constraint ihlallerini tespit eder.
 */

import { PrismaClient as TenantPrismaClient } from '@prisma/tenant-client';

const tenantDbUrl = process.env.TENANT_DATABASE_URL;

if (!tenantDbUrl) {
  console.error('❌ TENANT_DATABASE_URL environment variable is not set');
  console.log('\nUsage:');
  console.log('TENANT_DATABASE_URL="postgresql://user:password@localhost:5432/tenant_db_name" tsx scripts/check-real-estate-migration.ts');
  process.exit(1);
}

const prisma = new TenantPrismaClient({
  datasources: {
    db: {
      url: tenantDbUrl,
    },
  },
});

async function checkDuplicates() {
  console.log('🔍 Checking for duplicate data before migration...\n');

  const issues: string[] = [];

  try {
    // Check Apartment duplicates (propertyId + unitNumber)
    const apartments = await prisma.$queryRaw<Array<{ propertyId: string; unitNumber: string; count: bigint }>>`
      SELECT "propertyId", "unitNumber", COUNT(*) as count
      FROM "Apartment"
      GROUP BY "propertyId", "unitNumber"
      HAVING COUNT(*) > 1
    `;

    if (apartments.length > 0) {
      issues.push(`❌ Found ${apartments.length} duplicate apartment unit numbers:`);
      apartments.forEach((apt: { propertyId: string; unitNumber: string; count: bigint }) => {
        issues.push(`   - Property ${apt.propertyId}: Unit ${apt.unitNumber} (${apt.count} duplicates)`);
      });
    } else {
      console.log('✅ No duplicate apartment unit numbers found');
    }

    // Check Contract duplicates (tenantId + contractNumber)
    const contracts = await prisma.$queryRaw<Array<{ tenantId: string; contractNumber: string; count: bigint }>>`
      SELECT "tenantId", "contractNumber", COUNT(*) as count
      FROM "Contract"
      GROUP BY "tenantId", "contractNumber"
      HAVING COUNT(*) > 1
    `;

    if (contracts.length > 0) {
      issues.push(`❌ Found ${contracts.length} duplicate contract numbers:`);
      contracts.forEach((contract: { tenantId: string; contractNumber: string; count: bigint }) => {
        issues.push(`   - Tenant ${contract.tenantId}: Contract ${contract.contractNumber} (${contract.count} duplicates)`);
      });
    } else {
      console.log('✅ No duplicate contract numbers found');
    }

    // Check PropertyStaff duplicates (propertyId + staffId)
    const propertyStaff = await prisma.$queryRaw<Array<{ propertyId: string; staffId: string; count: bigint }>>`
      SELECT "propertyId", "staffId", COUNT(*) as count
      FROM "PropertyStaff"
      GROUP BY "propertyId", "staffId"
      HAVING COUNT(*) > 1
    `;

    if (propertyStaff.length > 0) {
      issues.push(`❌ Found ${propertyStaff.length} duplicate property staff assignments:`);
      propertyStaff.forEach((ps: { propertyId: string; staffId: string; count: bigint }) => {
        issues.push(`   - Property ${ps.propertyId}: Staff ${ps.staffId} (${ps.count} duplicates)`);
      });
    } else {
      console.log('✅ No duplicate property staff assignments found');
    }

    // Check EmailTemplate duplicates (tenantId + name)
    const templates = await prisma.$queryRaw<Array<{ tenantId: string; name: string; count: bigint }>>`
      SELECT "tenantId", "name", COUNT(*) as count
      FROM "EmailTemplate"
      GROUP BY "tenantId", "name"
      HAVING COUNT(*) > 1
    `;

    if (templates.length > 0) {
      issues.push(`❌ Found ${templates.length} duplicate email template names:`);
      templates.forEach((template: { tenantId: string; name: string; count: bigint }) => {
        issues.push(`   - Tenant ${template.tenantId}: Template ${template.name} (${template.count} duplicates)`);
      });
    } else {
      console.log('✅ No duplicate email template names found');
    }

    // Check RealEstateStaff duplicates (tenantId + userId) - only for non-null userId
    const staff = await prisma.$queryRaw<Array<{ tenantId: string; userId: string; count: bigint }>>`
      SELECT "tenantId", "userId", COUNT(*) as count
      FROM "RealEstateStaff"
      WHERE "userId" IS NOT NULL
      GROUP BY "tenantId", "userId"
      HAVING COUNT(*) > 1
    `;

    if (staff.length > 0) {
      issues.push(`❌ Found ${staff.length} duplicate staff user IDs:`);
      staff.forEach((s: { tenantId: string; userId: string; count: bigint }) => {
        issues.push(`   - Tenant ${s.tenantId}: User ${s.userId} (${s.count} duplicates)`);
      });
    } else {
      console.log('✅ No duplicate staff user IDs found');
    }

    console.log('\n' + '='.repeat(60));
    
    if (issues.length > 0) {
      console.log('\n❌ MIGRATION BLOCKED: Duplicate data found!\n');
      issues.forEach(issue => console.log(issue));
      console.log('\n⚠️  Please resolve these duplicates before running the migration.');
      console.log('   You can use the cleanup script: tsx scripts/cleanup-real-estate-duplicates.ts');
      process.exit(1);
    } else {
      console.log('\n✅ All checks passed! Safe to run migration.\n');
      console.log('Next step:');
      console.log(`TENANT_DATABASE_URL="${tenantDbUrl}" npx prisma migrate dev --schema=prisma/tenant.schema.prisma --name add_real_estate_module`);
    }
  } catch (error: unknown) {
    // If tables don't exist yet, that's okay - it means this is a fresh migration
    const errorMessage = error instanceof Error ? error.message : String(error);
    if (errorMessage.includes('does not exist') || errorMessage.includes('relation')) {
      console.log('✅ Tables do not exist yet - this is a fresh migration, safe to proceed');
      console.log('\nNext step:');
      console.log(`TENANT_DATABASE_URL="${tenantDbUrl}" npx prisma migrate dev --schema=prisma/tenant.schema.prisma --name add_real_estate_module`);
    } else {
      console.error('❌ Error checking duplicates:', error);
      process.exit(1);
    }
  } finally {
    await prisma.$disconnect();
  }
}

checkDuplicates().catch(console.error);

