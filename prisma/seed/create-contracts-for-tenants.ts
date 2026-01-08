/**
 * Create Contracts for Existing Tenants Script
 *
 * Creates rental contracts for tenants who are assigned to apartments but don't have contracts.
 * Start date is set to today - user should manually update it later.
 *
 * Usage: TENANT_DATABASE_URL="postgresql://..." npx tsx prisma/seed/create-contracts-for-tenants.ts --tenant-id=xxx --company-id=yyy
 *
 * Options:
 *   --dry-run     Show what would be created without actually creating
 *   --payment-day Payment day of month (default: 1)
 */

import { PrismaClient, Prisma } from '@prisma/tenant-client';

// Tenant Prisma Client
const getTenantPrisma = () => {
  const url = process.env.TENANT_DATABASE_URL;
  if (!url) {
    throw new Error('TENANT_DATABASE_URL environment variable is required');
  }
  return new PrismaClient({
    datasources: { db: { url } },
  });
};

interface TenantWithApartment {
  id: string;
  firstName: string | null;
  lastName: string | null;
  apartmentId: string | null;
  moveInDate: Date | null;
  apartment: {
    id: string;
    unitNumber: string;
    coldRent: Prisma.Decimal | null;
    additionalCosts: Prisma.Decimal | null;
    heatingCosts: Prisma.Decimal | null;
    deposit: Prisma.Decimal | null;
    property: {
      name: string;
      address: string;
    } | null;
  } | null;
  contracts: { id: string }[];
}

async function main() {
  const args = process.argv.slice(2);
  const tenantIdArg = args.find(arg => arg.startsWith('--tenant-id='));
  const companyIdArg = args.find(arg => arg.startsWith('--company-id='));
  const paymentDayArg = args.find(arg => arg.startsWith('--payment-day='));
  const dryRun = args.includes('--dry-run');

  if (!tenantIdArg || !companyIdArg) {
    console.error('Error: --tenant-id and --company-id parameters are required');
    console.log('\nUsage: TENANT_DATABASE_URL="postgresql://..." npx tsx prisma/seed/create-contracts-for-tenants.ts --tenant-id=xxx --company-id=yyy');
    console.log('\nOptions:');
    console.log('  --dry-run       Show what would be created without actually creating');
    console.log('  --payment-day=N Payment day of month (default: 1)');
    console.log('\nTo find IDs, run:');
    console.log('  SELECT id FROM "Tenant" LIMIT 1;  -- For tenant ID (core platform tenant)');
    console.log('  SELECT id, name FROM "Company" LIMIT 1;  -- For company ID');
    process.exit(1);
  }

  const tenantId = tenantIdArg.split('=')[1];
  const companyId = companyIdArg.split('=')[1];
  const paymentDay = paymentDayArg ? parseInt(paymentDayArg.split('=')[1], 10) : 1;

  console.log(`\n📝 Creating contracts for existing tenants\n`);
  console.log(`✓ Using tenant ID: ${tenantId}`);
  console.log(`✓ Using company ID: ${companyId}`);
  console.log(`✓ Payment day: ${paymentDay}`);
  if (dryRun) {
    console.log(`⚠️ DRY RUN MODE - No changes will be made`);
  }
  console.log('');

  const tenantPrisma = getTenantPrisma();

  try {
    // Find all tenants with apartments but without contracts
    const tenantsWithApartments = await tenantPrisma.tenant.findMany({
      where: {
        tenantId: tenantId,
        companyId: companyId,
        apartmentId: { not: null },
        isActive: true,
      },
      include: {
        apartment: {
          include: {
            property: {
              select: {
                name: true,
                address: true,
              },
            },
          },
        },
        contracts: {
          where: {
            isActive: true,
            status: { in: ['active', 'draft'] },
          },
          select: { id: true },
        },
      },
    }) as TenantWithApartment[];

    console.log(`📊 Found ${tenantsWithApartments.length} tenants with apartments\n`);

    // Filter to only those without active contracts
    const tenantsWithoutContracts = tenantsWithApartments.filter(
      t => t.contracts.length === 0 && t.apartment
    );

    if (tenantsWithoutContracts.length === 0) {
      console.log('✅ All tenants already have active contracts!');
      return;
    }

    console.log(`📝 ${tenantsWithoutContracts.length} tenants need contracts:\n`);

    let createdCount = 0;
    let skippedCount = 0;
    const today = new Date();
    // Contract end date: 1 year from today
    const oneYearLater = new Date(today);
    oneYearLater.setFullYear(oneYearLater.getFullYear() + 1);

    for (const tenantRecord of tenantsWithoutContracts) {
      const apartment = tenantRecord.apartment!;
      const tenantName = `${tenantRecord.firstName || ''} ${tenantRecord.lastName || ''}`.trim() || 'Unknown';
      const propertyName = apartment.property?.name || 'Unknown Property';
      const unitNumber = apartment.unitNumber;

      // Calculate rent amount from apartment
      const coldRent = apartment.coldRent ? Number(apartment.coldRent) : 0;
      const additionalCosts = apartment.additionalCosts ? Number(apartment.additionalCosts) : 0;
      const heatingCosts = apartment.heatingCosts ? Number(apartment.heatingCosts) : 0;
      const totalRent = coldRent + additionalCosts + heatingCosts;
      const deposit = apartment.deposit ? Number(apartment.deposit) : coldRent * 3;

      if (coldRent === 0) {
        console.log(`  ⚠️ Skipped: ${tenantName} → ${propertyName} ${unitNumber} (no rent amount)`);
        skippedCount++;
        continue;
      }

      // Generate unique contract number based on apartment ID to ensure idempotency
      const contractNumber = `CONT-${apartment.unitNumber.replace(/\s+/g, '-').toUpperCase()}-${apartment.id.slice(-6).toUpperCase()}`;

      // Use tenant's moveInDate if available, otherwise use today
      const startDate = tenantRecord.moveInDate || today;

      console.log(`  📄 ${tenantName} → ${propertyName} ${unitNumber}`);
      console.log(`     Rent: €${coldRent.toFixed(2)} + €${additionalCosts.toFixed(2)} + €${heatingCosts.toFixed(2)} = €${totalRent.toFixed(2)}/month`);
      console.log(`     Start: ${startDate.toLocaleDateString('de-DE')} | Contract#: ${contractNumber}`);

      if (!dryRun) {
        try {
          // Check if contract already exists with this number (idempotency)
          const existingContract = await tenantPrisma.contract.findFirst({
            where: {
              tenantId: tenantId,
              contractNumber: contractNumber,
            },
          });

          if (existingContract) {
            console.log(`     ⏭️ Contract already exists (${contractNumber})`);
            skippedCount++;
            continue;
          }

          await tenantPrisma.contract.create({
            data: {
              tenantId: tenantId,
              companyId: companyId,
              apartmentId: apartment.id,
              tenantRecordId: tenantRecord.id,
              contractNumber: contractNumber,
              type: 'rental',
              startDate: startDate,
              endDate: oneYearLater,
              rentAmount: new Prisma.Decimal(totalRent),
              deposit: new Prisma.Decimal(deposit),
              // currency field NOT specified - uses Prisma @default("TRY")
              // Display currency from GeneralSettings.currency via useCurrency hook
              paymentType: 'bank_transfer',
              paymentDay: paymentDay,
              autoRenewal: true,
              renewalNoticeDays: 30,
              status: 'active',
              isActive: true,
              terms: `Kira sözleşmesi - ${propertyName} ${unitNumber}`,
              notes: `Kiracı: ${tenantName}\nNet Kira: €${coldRent.toFixed(2)}\nYan Giderler: €${additionalCosts.toFixed(2)}\nIsıtma: €${heatingCosts.toFixed(2)}`,
            },
          });
          console.log(`     ✅ Contract created`);
          createdCount++;
        } catch (error: any) {
          console.log(`     ❌ Error: ${error.message}`);
          skippedCount++;
        }
      } else {
        console.log(`     [DRY RUN] Would create contract`);
        createdCount++;
      }
      console.log('');
    }

    console.log('\n' + '='.repeat(50));
    console.log('📊 Summary:');
    console.log(`   ✅ Created: ${createdCount} contracts`);
    console.log(`   ⚠️ Skipped: ${skippedCount} (no rent or error)`);
    console.log(`   📝 Already had contracts: ${tenantsWithApartments.length - tenantsWithoutContracts.length}`);

    if (dryRun) {
      console.log('\n⚠️ This was a dry run. Run without --dry-run to actually create contracts.');
    } else {
      console.log('\n✅ Contracts created successfully!');
      console.log('\n💡 Next steps:');
      console.log('   1. Go to Real Estate → Contracts in the app');
      console.log('   2. Update start dates for each contract as needed');
      console.log('   3. Payments will be auto-generated based on payment day');
    }

  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  } finally {
    await tenantPrisma.$disconnect();
  }
}

main();
