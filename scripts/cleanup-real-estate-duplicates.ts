/**
 * Real Estate Module Duplicate Cleanup Script
 * 
 * Bu script, duplicate verileri temizler (migration öncesi)
 * DİKKAT: Bu script veri kaybına neden olabilir!
 */

import { PrismaClient as TenantPrismaClient } from '@prisma/tenant-client';

const tenantDbUrl = process.env.TENANT_DATABASE_URL;

if (!tenantDbUrl) {
  console.error('❌ TENANT_DATABASE_URL environment variable is not set');
  process.exit(1);
}

const prisma = new TenantPrismaClient({
  datasources: {
    db: {
      url: tenantDbUrl,
    },
  },
});

async function cleanupDuplicates() {
  console.log('🧹 Cleaning up duplicate data...\n');

  try {
    // Cleanup Apartment duplicates - keep the oldest one
    const apartmentDuplicates = await prisma.$queryRaw<Array<{ id: string; propertyId: string; unitNumber: string; createdAt: Date }>>`
      SELECT a1.id, a1."propertyId", a1."unitNumber", a1."createdAt"
      FROM "Apartment" a1
      INNER JOIN (
        SELECT "propertyId", "unitNumber", MIN("createdAt") as min_created
        FROM "Apartment"
        GROUP BY "propertyId", "unitNumber"
        HAVING COUNT(*) > 1
      ) a2 ON a1."propertyId" = a2."propertyId" 
         AND a1."unitNumber" = a2."unitNumber"
         AND a1."createdAt" > a2.min_created
    `;

    if (apartmentDuplicates.length > 0) {
      console.log(`⚠️  Found ${apartmentDuplicates.length} duplicate apartments to remove`);
      for (const dup of apartmentDuplicates) {
        await prisma.apartment.delete({ where: { id: dup.id } });
        console.log(`   - Removed apartment ${dup.id} (Property: ${dup.propertyId}, Unit: ${dup.unitNumber})`);
      }
    }

    // Cleanup Contract duplicates - keep the oldest one
    const contractDuplicates = await prisma.$queryRaw<Array<{ id: string; tenantId: string; contractNumber: string }>>`
      SELECT c1.id, c1."tenantId", c1."contractNumber"
      FROM "Contract" c1
      INNER JOIN (
        SELECT "tenantId", "contractNumber", MIN("createdAt") as min_created
        FROM "Contract"
        GROUP BY "tenantId", "contractNumber"
        HAVING COUNT(*) > 1
      ) c2 ON c1."tenantId" = c2."tenantId" 
         AND c1."contractNumber" = c2."contractNumber"
         AND c1."createdAt" > c2.min_created
    `;

    if (contractDuplicates.length > 0) {
      console.log(`⚠️  Found ${contractDuplicates.length} duplicate contracts to remove`);
      for (const dup of contractDuplicates) {
        await prisma.contract.delete({ where: { id: dup.id } });
        console.log(`   - Removed contract ${dup.id} (Tenant: ${dup.tenantId}, Number: ${dup.contractNumber})`);
      }
    }

    // Cleanup PropertyStaff duplicates - keep the oldest one
    const propertyStaffDuplicates = await prisma.$queryRaw<Array<{ id: string; propertyId: string; staffId: string }>>`
      SELECT ps1.id, ps1."propertyId", ps1."staffId"
      FROM "PropertyStaff" ps1
      INNER JOIN (
        SELECT "propertyId", "staffId", MIN("createdAt") as min_created
        FROM "PropertyStaff"
        GROUP BY "propertyId", "staffId"
        HAVING COUNT(*) > 1
      ) ps2 ON ps1."propertyId" = ps2."propertyId" 
         AND ps1."staffId" = ps2."staffId"
         AND ps1."createdAt" > ps2.min_created
    `;

    if (propertyStaffDuplicates.length > 0) {
      console.log(`⚠️  Found ${propertyStaffDuplicates.length} duplicate property staff assignments to remove`);
      for (const dup of propertyStaffDuplicates) {
        await prisma.propertyStaff.delete({ where: { id: dup.id } });
        console.log(`   - Removed property staff ${dup.id} (Property: ${dup.propertyId}, Staff: ${dup.staffId})`);
      }
    }

    // Cleanup EmailTemplate duplicates - keep the oldest one
    const templateDuplicates = await prisma.$queryRaw<Array<{ id: string; tenantId: string; name: string }>>`
      SELECT t1.id, t1."tenantId", t1."name"
      FROM "EmailTemplate" t1
      INNER JOIN (
        SELECT "tenantId", "name", MIN("createdAt") as min_created
        FROM "EmailTemplate"
        GROUP BY "tenantId", "name"
        HAVING COUNT(*) > 1
      ) t2 ON t1."tenantId" = t2."tenantId" 
         AND t1."name" = t2."name"
         AND t1."createdAt" > t2.min_created
    `;

    if (templateDuplicates.length > 0) {
      console.log(`⚠️  Found ${templateDuplicates.length} duplicate email templates to remove`);
      for (const dup of templateDuplicates) {
        await prisma.emailTemplate.delete({ where: { id: dup.id } });
        console.log(`   - Removed template ${dup.id} (Tenant: ${dup.tenantId}, Name: ${dup.name})`);
      }
    }

    // Cleanup RealEstateStaff duplicates - keep the oldest one (only for non-null userId)
    const staffDuplicates = await prisma.$queryRaw<Array<{ id: string; tenantId: string; userId: string }>>`
      SELECT s1.id, s1."tenantId", s1."userId"
      FROM "RealEstateStaff" s1
      INNER JOIN (
        SELECT "tenantId", "userId", MIN("createdAt") as min_created
        FROM "RealEstateStaff"
        WHERE "userId" IS NOT NULL
        GROUP BY "tenantId", "userId"
        HAVING COUNT(*) > 1
      ) s2 ON s1."tenantId" = s2."tenantId" 
         AND s1."userId" = s2."userId"
         AND s1."createdAt" > s2.min_created
    `;

    if (staffDuplicates.length > 0) {
      console.log(`⚠️  Found ${staffDuplicates.length} duplicate staff user IDs to remove`);
      for (const dup of staffDuplicates) {
        await prisma.realEstateStaff.delete({ where: { id: dup.id } });
        console.log(`   - Removed staff ${dup.id} (Tenant: ${dup.tenantId}, User: ${dup.userId})`);
      }
    }

    console.log('\n✅ Cleanup completed!');
    console.log('\nNext step: Run the migration check again:');
    console.log(`TENANT_DATABASE_URL="${tenantDbUrl}" tsx scripts/check-real-estate-migration.ts`);
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    if (errorMessage.includes('does not exist') || errorMessage.includes('relation')) {
      console.log('✅ Tables do not exist yet - nothing to clean up');
    } else {
      console.error('❌ Error cleaning up duplicates:', error);
      process.exit(1);
    }
  } finally {
    await prisma.$disconnect();
  }
}

cleanupDuplicates().catch(console.error);

