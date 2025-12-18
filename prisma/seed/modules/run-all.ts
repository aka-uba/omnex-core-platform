/**
 * CLI Runner for Modular Seeders
 *
 * Usage:
 * TENANT_DATABASE_URL="..." npx tsx prisma/seed/modules/run-all.ts --tenant-slug=omnexcore
 * TENANT_DATABASE_URL="..." npx tsx prisma/seed/modules/run-all.ts --tenant-slug=omnexcore --module=real-estate
 * TENANT_DATABASE_URL="..." npx tsx prisma/seed/modules/run-all.ts --tenant-slug=omnexcore --unseed
 */

import { PrismaClient as TenantPrismaClient } from '@prisma/tenant-client';
import { PrismaClient as CorePrismaClient } from '@prisma/core-client';
import { seedAllModules, unseedAllModules, seedModule, unseedModule, getSeeder, getAllSeeders } from './seeder-registry';
import type { SeederContext } from './base-seeder';

const tenantPrisma = new TenantPrismaClient();
const corePrisma = new CorePrismaClient();

// Parse command line arguments
const args = process.argv.slice(2);
const tenantSlug = args.find((arg) => arg.startsWith('--tenant-slug='))?.split('=')[1] || 'omnexcore';
const moduleSlug = args.find((arg) => arg.startsWith('--module='))?.split('=')[1];
const unseed = args.includes('--unseed');
const listModules = args.includes('--list');

async function main() {
  console.log(`\n🌱 Modular Seeder System`);
  console.log('=' .repeat(60));

  // List modules if requested
  if (listModules) {
    console.log('\n📦 Available Module Seeders:');
    const seeders = getAllSeeders();
    for (const seeder of seeders) {
      console.log(`  - ${seeder.moduleSlug}: ${seeder.moduleName}`);
      if (seeder.dependencies && seeder.dependencies.length > 0) {
        console.log(`    Dependencies: ${seeder.dependencies.join(', ')}`);
      }
    }
    process.exit(0);
  }

  try {
    // Get tenant info
    const coreTenant = await corePrisma.tenant.findUnique({
      where: { slug: tenantSlug },
      select: { id: true, slug: true, name: true },
    });

    if (!coreTenant) {
      console.error(`❌ Tenant "${tenantSlug}" not found in core database!`);
      process.exit(1);
    }

    console.log(`📍 Tenant: ${coreTenant.name} (${coreTenant.slug})`);
    console.log(`📍 Tenant ID: ${coreTenant.id}`);

    // Get or create company
    let company = await tenantPrisma.company.findFirst({
      orderBy: { createdAt: 'asc' },
    });

    if (!company) {
      console.log('⚠️ No company found, creating default...');
      company = await tenantPrisma.company.create({
        data: {
          name: `${tenantSlug} Demo Company`,
          industry: 'Technology',
          status: 'Active',
        },
      });
    }

    // Get admin user
    const adminUser = await tenantPrisma.user.findFirst({
      where: { role: { in: ['SuperAdmin', 'AgencyUser'] } },
      orderBy: { createdAt: 'asc' },
    });

    if (!adminUser) {
      console.error('❌ No admin user found. Run tenant-seed.ts first.');
      process.exit(1);
    }

    const ctx: SeederContext = {
      tenantPrisma,
      corePrisma,
      tenantId: coreTenant.id,
      companyId: company.id,
      adminUserId: adminUser.id,
      tenantSlug,
    };

    if (moduleSlug) {
      // Single module operation
      const seeder = getSeeder(moduleSlug);
      if (!seeder) {
        console.error(`❌ Seeder not found for module: ${moduleSlug}`);
        console.log('Use --list to see available modules');
        process.exit(1);
      }

      console.log(`\n${unseed ? '🗑️ Removing' : '🌱 Seeding'} ${seeder.moduleName}...`);

      if (unseed) {
        const result = await unseedModule(moduleSlug, ctx);
        if (result.success) {
          console.log(`✅ Removed ${result.itemsDeleted} items from ${seeder.moduleName}`);
        } else {
          console.error(`❌ Failed: ${result.error}`);
        }
      } else {
        const result = await seedModule(moduleSlug, ctx);
        if (result.success) {
          console.log(`✅ Created ${result.itemsCreated} items for ${seeder.moduleName}`);
          if (result.details) {
            Object.entries(result.details).forEach(([key, count]) => {
              console.log(`   - ${key}: ${count}`);
            });
          }
        } else {
          console.error(`❌ Failed: ${result.error}`);
        }
      }
    } else {
      // All modules operation
      console.log(`\n${unseed ? '🗑️ Removing all demo data...' : '🌱 Seeding all modules...'}`);

      if (unseed) {
        const results = await unseedAllModules(ctx);
        let totalDeleted = 0;
        let errors: string[] = [];

        Object.entries(results).forEach(([slug, result]) => {
          if (result.success) {
            console.log(`✅ ${slug}: ${result.itemsDeleted} items removed`);
            totalDeleted += result.itemsDeleted || 0;
          } else {
            console.log(`⚠️ ${slug}: ${result.error}`);
            errors.push(`${slug}: ${result.error}`);
          }
        });

        console.log(`\n📊 Total removed: ${totalDeleted} items`);
        if (errors.length > 0) {
          console.log(`⚠️ Errors: ${errors.length} modules had issues`);
        }
      } else {
        const results = await seedAllModules(ctx);
        let totalCreated = 0;
        let errors: string[] = [];

        Object.entries(results).forEach(([slug, result]) => {
          if (result.success) {
            console.log(`✅ ${slug}: ${result.itemsCreated} items created`);
            totalCreated += result.itemsCreated;
          } else {
            console.log(`⚠️ ${slug}: ${result.error}`);
            errors.push(`${slug}: ${result.error}`);
          }
        });

        console.log(`\n📊 Total created: ${totalCreated} items`);
        if (errors.length > 0) {
          console.log(`⚠️ Errors: ${errors.length} modules had issues`);
        }
      }
    }

    console.log('\n🎉 MODULAR SEEDER COMPLETED!\n');
  } catch (error) {
    console.error('\n❌ Seeder failed:', error);
    throw error;
  } finally {
    await tenantPrisma.$disconnect();
    await corePrisma.$disconnect();
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
