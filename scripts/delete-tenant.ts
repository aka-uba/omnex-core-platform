/**
 * Delete Tenant Script
 * 
 * Tenant'ı core DB'den ve PostgreSQL'den siler
 * Usage: tsx scripts/delete-tenant.ts --slug=demo
 */

import { corePrisma } from '../src/lib/corePrisma';
import { getTenantConfig } from '../src/config/tenant.config';
import { execSync } from 'child_process';

async function main() {
  const args = process.argv.slice(2);
  const slug = args.find(arg => arg.startsWith('--slug='))?.split('=')[1];

  if (!slug) {
    console.error('Error: --slug is required');
    console.log('Usage: tsx scripts/delete-tenant.ts --slug=demo');
    process.exit(1);
  }

  try {
    console.log(`🗑️  Deleting tenant: ${slug}\n`);

    // Get tenant from core DB
    const tenant = await corePrisma.tenant.findUnique({
      where: { slug },
    });

    if (!tenant) {
      console.error(`Tenant not found: ${slug}`);
      process.exit(1);
    }

    console.log(`Found tenant: ${tenant.name}`);
    console.log(`Database: ${tenant.dbName}\n`);

    // Delete database
    console.log('🗄️  Deleting database...');
    try {
      const config = getTenantConfig();
      const adminUrl = new URL(config.pgAdminUrl);
      const dbUser = adminUrl.username;
      const dbPassword = adminUrl.password;
      const dbHost = adminUrl.hostname;
      const dbPort = adminUrl.port || '5432';

      const psqlPath = `"C:\\Program Files\\PostgreSQL\\18\\bin\\psql.exe"`;
      const dropCommand = `${psqlPath} -h ${dbHost} -p ${dbPort} -U ${dbUser} -d postgres -c "DROP DATABASE IF EXISTS ${tenant.dbName};"`;
      
      execSync(dropCommand, {
        stdio: 'inherit',
        env: { ...process.env, PGPASSWORD: dbPassword },
        shell: process.platform === 'win32' ? 'powershell.exe' : '/bin/bash'
      });
      console.log('✅ Database deleted');
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.log('⚠️  Database deletion failed (may not exist):', errorMessage);
    }

    // Delete tenant record
    console.log('📝 Deleting tenant record...');
    await corePrisma.tenant.delete({
      where: { id: tenant.id },
    });
    console.log('✅ Tenant record deleted');

    console.log('\n✅ Tenant deleted successfully!');
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error('❌ Error deleting tenant:', errorMessage);
    process.exit(1);
  } finally {
    await corePrisma.$disconnect();
  }
}

main();

