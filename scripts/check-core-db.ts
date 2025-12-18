/**
 * Check Core Database Script
 * 
 * Core DB'deki tenant kayıtlarını kontrol eder
 */

import { corePrisma } from '../src/lib/corePrisma';

async function main() {
  console.log('🔍 Checking Core Database...\n');

  try {
    // Check agencies
    const agencies = await corePrisma.agency.findMany();
    console.log(`📊 Agencies: ${agencies.length}`);
    agencies.forEach(agency => {
      console.log(`   - ${agency.name} (${agency.id})`);
    });

    // Check tenants
    const tenants = await corePrisma.tenant.findMany({
      include: {
        agency: true,
      },
      orderBy: { createdAt: 'asc' },
    });

    console.log(`\n📊 Tenants: ${tenants.length}`);
    tenants.forEach(tenant => {
      console.log(`\n   Tenant: ${tenant.name} (${tenant.slug})`);
      console.log(`   - ID: ${tenant.id}`);
      console.log(`   - Status: ${tenant.status}`);
      console.log(`   - Database: ${tenant.currentDb}`);
      console.log(`   - DB Name: ${tenant.dbName}`);
      console.log(`   - Subdomain: ${tenant.subdomain || 'N/A'}`);
      console.log(`   - Custom Domain: ${tenant.customDomain || 'N/A'}`);
      console.log(`   - Agency: ${tenant.agency?.name || 'N/A'}`);
      console.log(`   - All Databases: ${tenant.allDatabases.join(', ')}`);
      console.log(`   - Setup Failed: ${tenant.setupFailed}`);
    });

    console.log('\n✅ Core DB check completed!');
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

