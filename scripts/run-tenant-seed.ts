/**
 * Run Tenant Seed Script
 * 
 * Belirtilen tenant için seed işlemlerini çalıştırır
 * 
 * Usage:
 *   Basic seed:     tsx scripts/run-tenant-seed.ts --tenant-slug=omnexcore
 *   With demo data: tsx scripts/run-tenant-seed.ts --tenant-slug=omnexcore --demo
 *   Only demo data: tsx scripts/run-tenant-seed.ts --tenant-slug=omnexcore --demo-only
 */

import { corePrisma } from '../src/lib/corePrisma';
import { getTenantDbUrl } from '../src/lib/services/tenantService';
import { execSync } from 'child_process';

const tenantSlug = process.argv.find(arg => arg.startsWith('--tenant-slug='))?.split('=')[1] || 'omnexcore';
const includeDemo = process.argv.includes('--demo');
const demoOnly = process.argv.includes('--demo-only');

async function main() {
  console.log(`\n🌱 Running seed for tenant: ${tenantSlug}`);
  console.log(`   Options: ${includeDemo ? '--demo ' : ''}${demoOnly ? '--demo-only' : ''}`);
  console.log('=' .repeat(50) + '\n');

  try {
    // Get tenant
    const tenant = await corePrisma.tenant.findUnique({
      where: { slug: tenantSlug },
    });

    if (!tenant) {
      console.error(`❌ Tenant not found: ${tenantSlug}`);
      process.exit(1);
    }

    console.log(`✅ Found tenant: ${tenant.name}`);
    console.log(`   Database: ${tenant.dbName}\n`);

    // Get tenant database URL
    const tenantDbUrl = getTenantDbUrl(tenant);
    console.log(`📝 Using database URL: ${tenantDbUrl.replace(/:[^:@]+@/, ':****@')}\n`);

    // Skip basic seeds if --demo-only
    if (!demoOnly) {
      // Run tenant seed
      console.log('1️⃣ Running tenant-seed.ts (Basic users and roles)...');
      try {
        execSync(`tsx prisma/seed/tenant-seed.ts --tenant-slug=${tenantSlug}`, {
          stdio: 'inherit',
          env: {
            ...process.env,
            TENANT_DATABASE_URL: tenantDbUrl,
          },
        });
        console.log('✅ Tenant seed completed\n');
      } catch (error) {
        console.error('❌ Tenant seed failed:', error);
      }

      // Run notification seed
      console.log('2️⃣ Running notification-seed.ts...');
      try {
        execSync(`tsx prisma/seed/notification-seed.ts --tenant-slug=${tenantSlug}`, {
          stdio: 'inherit',
          env: {
            ...process.env,
            TENANT_DATABASE_URL: tenantDbUrl,
          },
        });
        console.log('✅ Notification seed completed\n');
      } catch (error) {
        console.error('❌ Notification seed failed:', error);
      }
    }

    // Run demo seed if --demo or --demo-only flag is present
    if (includeDemo || demoOnly) {
      console.log('3️⃣ Running demo-seed.ts (Comprehensive demo data for all modules)...');
      console.log('   ⚠️  This will create sample data for testing/demo purposes.\n');
      try {
        execSync(`tsx prisma/seed/demo-seed.ts --tenant-slug=${tenantSlug}`, {
          stdio: 'inherit',
          env: {
            ...process.env,
            TENANT_DATABASE_URL: tenantDbUrl,
          },
        });
        console.log('✅ Demo seed completed\n');
      } catch (error) {
        console.error('❌ Demo seed failed:', error);
      }
    }

    console.log('=' .repeat(50));
    console.log('✨ All seed operations completed!');
    console.log('=' .repeat(50) + '\n');

    if (!includeDemo && !demoOnly) {
      console.log('💡 TIP: Run with --demo flag to add comprehensive demo data:');
      console.log(`   tsx scripts/run-tenant-seed.ts --tenant-slug=${tenantSlug} --demo\n`);
    }
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  } finally {
    await corePrisma.$disconnect();
  }
}

main();





