/**
 * List Tenants Script
 * 
 * Core DB'deki tüm tenant'ları listeler
 */

import { corePrisma } from '../src/lib/corePrisma';

async function main() {
  console.log('📋 Listing all tenants...\n');

  try {
    const tenants = await corePrisma.tenant.findMany({
      include: {
        agency: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    if (tenants.length === 0) {
      console.log('No tenants found.');
    } else {
      console.log(`Found ${tenants.length} tenant(s):\n`);
      tenants.forEach((tenant, index) => {
        console.log(`${index + 1}. ${tenant.name} (${tenant.slug})`);
        console.log(`   ID: ${tenant.id}`);
        console.log(`   Subdomain: ${tenant.subdomain || 'N/A'}`);
        console.log(`   Database: ${tenant.dbName}`);
        console.log(`   Status: ${tenant.status}`);
        console.log(`   Agency: ${tenant.agency?.name || 'N/A'}`);
        console.log('');
      });
    }
  } catch (error: any) {
    console.error('Error listing tenants:', error.message);
    process.exit(1);
  } finally {
    await corePrisma.$disconnect();
  }
}

main();

