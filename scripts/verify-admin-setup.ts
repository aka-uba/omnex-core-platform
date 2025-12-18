/**
 * Verify Admin Setup Script
 * 
 * Her tenant'ta hem super admin hem de tenant admin'in olduğunu kontrol eder
 */

import { corePrisma } from '../src/lib/corePrisma';
import { getTenantPrisma } from '../src/lib/dbSwitcher';
import { getTenantDbUrl } from '../src/lib/services/tenantService';

async function main() {
  console.log('🔍 Verifying admin setup in all tenants...\n');

  try {
    const tenants = await corePrisma.tenant.findMany({
      where: { status: 'active' },
      orderBy: { createdAt: 'asc' },
    });

    console.log(`📊 Checking ${tenants.length} active tenant(s)\n`);

    let allGood = true;

    for (const tenant of tenants) {
      console.log(`🏢 Tenant: ${tenant.name} (${tenant.slug})`);
      
      try {
        const dbUrl = getTenantDbUrl(tenant);
        const tenantPrisma = getTenantPrisma(dbUrl);

        // Super Admin kontrolü
        const superAdmin = await tenantPrisma.user.findFirst({
          where: {
            email: 'superadmin@omnexcore.com',
            role: 'SuperAdmin',
            status: 'active',
          },
        });

        // Tenant Admin kontrolü - AgencyUser role ile
        const tenantAdmin = await tenantPrisma.user.findFirst({
          where: {
            AND: [
              {
                OR: [
                  { email: `admin@${tenant.slug}.com` },
                  { username: 'admin' },
                ],
              },
              { role: 'AgencyUser' },
              { status: 'active' },
            ],
          },
        });

        if (superAdmin) {
          console.log(`   ✅ Super Admin: ${superAdmin.email} (${superAdmin.username})`);
        } else {
          console.log(`   ❌ Super Admin: MISSING`);
          allGood = false;
        }

        if (tenantAdmin) {
          console.log(`   ✅ Tenant Admin: ${tenantAdmin.email} (${tenantAdmin.username})`);
        } else {
          console.log(`   ❌ Tenant Admin: MISSING`);
          allGood = false;
        }
      } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        console.error(`   ❌ Error: ${errorMessage}`);
        allGood = false;
      }
      
      console.log('');
    }

    if (allGood) {
      console.log('✅ All tenants have both super admin and tenant admin!');
    } else {
      console.log('⚠️  Some tenants are missing admins. Run: npm run admin:sync');
    }
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await corePrisma.$disconnect();
  }
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });

