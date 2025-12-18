/**
 * Check Tenants and Users Script
 * 
 * Core DB'deki tenant'ları ve her tenant DB'deki kullanıcıları kontrol eder
 */

import { corePrisma } from '../src/lib/corePrisma';
import { getTenantPrisma } from '../src/lib/dbSwitcher';
import { getTenantDbUrl } from '../src/lib/services/tenantService';

async function main() {
  console.log('🔍 Checking tenants and users...\n');

  try {
    // Core DB'den tüm tenant'ları al
    const tenants = await corePrisma.tenant.findMany({
      where: { status: 'active' },
      orderBy: { createdAt: 'asc' },
    });

    console.log(`📊 Found ${tenants.length} active tenant(s)\n`);

    if (tenants.length === 0) {
      console.log('❌ No active tenants found!');
      console.log('\n💡 To create a tenant, run:');
      console.log('   POST /api/tenants');
      console.log('   { "name": "Test Tenant", "slug": "test", "subdomain": "test" }');
      return;
    }

    // Her tenant için kullanıcıları kontrol et
    for (const tenant of tenants) {
      console.log(`\n🏢 Tenant: ${tenant.name} (${tenant.slug})`);
      console.log(`   Database: ${tenant.currentDb}`);
      
      try {
        const dbUrl = getTenantDbUrl(tenant);
        const tenantPrisma = getTenantPrisma(dbUrl);
        
        const users = await tenantPrisma.user.findMany({
          select: {
            id: true,
            name: true,
            email: true,
            username: true,
            role: true,
            status: true,
          },
        });

        console.log(`   Users: ${users.length}`);
        
        if (users.length === 0) {
          console.log('   ⚠️  No users found in this tenant!');
          console.log(`   💡 To seed this tenant, run:`);
          console.log(`      TENANT_DATABASE_URL="${dbUrl}" tsx prisma/seed/tenant-seed.ts --tenant-slug=${tenant.slug}`);
        } else {
          console.log('   Users:');
          users.forEach(user => {
            console.log(`      - ${user.name} (${user.email}) - ${user.role} - ${user.status}`);
          });
        }
      } catch (error) {
        console.error(`   ❌ Failed to access tenant DB:`, error);
      }
    }

    console.log('\n✅ Check completed!');
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

