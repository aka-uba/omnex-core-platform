/**
 * Yearly DB Rotation Script
 * 
 * Yeni yıl için tenant database rotation yapar
 * Usage: tsx scripts/new-year.ts --tenant=acme --year=2026
 */

import { corePrisma } from '../src/lib/corePrisma';
import { getTenantConfig, generateTenantDbName, getTenantDatabaseUrl } from '../src/config/tenant.config';
import { execSync } from 'child_process';
import path from 'path';
import fs from 'fs/promises';

async function main() {
  // Parse command line arguments
  const args = process.argv.slice(2);
  let tenantSlug: string | null = null;
  let year: number | null = null;

  for (const arg of args) {
    if (arg.startsWith('--tenant=')) {
      tenantSlug = arg.split('=')[1].replace(/^["']|["']$/g, '');
    } else if (arg.startsWith('--year=')) {
      year = parseInt(arg.split('=')[1], 10);
    }
  }

  // Validate required fields
  if (!tenantSlug) {
    console.error('❌ Error: --tenant is required');
    console.log('\nUsage:');
    console.log('  tsx scripts/new-year.ts --tenant=acme --year=2026');
    console.log('\nOptions:');
    console.log('  --tenant="acme"    Tenant slug (required)');
    console.log('  --year=2026        Year for new database (optional, default: current year + 1)');
    process.exit(1);
  }

  if (!year) {
    year = new Date().getFullYear() + 1;
  }

  const config = getTenantConfig();

  try {
    // 1. Get tenant from core DB
    console.log(`📝 Fetching tenant: ${tenantSlug}`);
    const tenant = await corePrisma.tenant.findUnique({
      where: { slug: tenantSlug },
    });

    if (!tenant) {
      console.error(`❌ Tenant not found: ${tenantSlug}`);
      process.exit(1);
    }

    if (tenant.status !== 'active') {
      console.error(`❌ Tenant is not active: ${tenantSlug}`);
      process.exit(1);
    }

    console.log(`✅ Tenant found: ${tenant.name}`);

    // 2. Generate new DB name
    const newDbName = generateTenantDbName(tenantSlug, year);
    console.log(`🗄️  New database name: ${newDbName}`);

    // Check if new DB already exists
    const existingDbs = tenant.allDatabases || [];
    if (existingDbs.includes(newDbName)) {
      console.error(`❌ Database already exists: ${newDbName}`);
      process.exit(1);
    }

    // 3. Create new database
    console.log(`🔄 Creating new database: ${newDbName}`);
    try {
      const adminUrl = new URL(config.pgAdminUrl);
      const dbUser = adminUrl.username;
      const dbPassword = adminUrl.password;
      const dbHost = adminUrl.hostname;
      const dbPort = adminUrl.port || '5432';

      const createDbCommand = `PGPASSWORD="${dbPassword}" psql -h ${dbHost} -p ${dbPort} -U ${dbUser} -d postgres -c "CREATE DATABASE ${newDbName};"`;
      execSync(createDbCommand, { stdio: 'inherit' });
      console.log(`✅ Database created: ${newDbName}`);
    } catch (error: any) {
      if (error.message?.includes('already exists')) {
        console.log(`⚠️  Database already exists: ${newDbName}`);
      } else {
        throw error;
      }
    }

    // 4. Run migrations on new database
    console.log(`🔄 Running migrations on new database...`);
    const newDbUrl = getTenantDatabaseUrl(newDbName);
    try {
      execSync(
        `TENANT_DATABASE_URL="${newDbUrl}" npx prisma migrate deploy --schema=prisma/tenant.schema.prisma`,
        { stdio: 'inherit', cwd: process.cwd() }
      );
      console.log(`✅ Migrations applied to new database`);
    } catch (error) {
      console.error(`❌ Migration failed for new database: ${newDbName}`);
      // Rollback: drop database
      try {
        const adminUrl = new URL(config.pgAdminUrl);
        const dbUser = adminUrl.username;
        const dbPassword = adminUrl.password;
        const dbHost = adminUrl.hostname;
        const dbPort = adminUrl.port || '5432';
        
        const dropDbCommand = `PGPASSWORD="${dbPassword}" psql -h ${dbHost} -p ${dbPort} -U ${dbUser} -d postgres -c "DROP DATABASE IF EXISTS ${newDbName};"`;
        execSync(dropDbCommand, { stdio: 'inherit' });
        console.log(`🔄 Rollback: Database dropped: ${newDbName}`);
      } catch (rollbackError) {
        console.error(`❌ Rollback failed:`, rollbackError);
      }
      throw error;
    }

    // 5. Update core DB: set currentDb and add to allDatabases
    console.log(`📝 Updating tenant metadata in core DB...`);
    const updatedAllDatabases = [...(tenant.allDatabases || []), newDbName];
    
    await corePrisma.tenant.update({
      where: { id: tenant.id },
      data: {
        currentDb: newDbName,
        allDatabases: updatedAllDatabases,
        dbName: newDbName, // Keep for backward compatibility
      },
    });
    console.log(`✅ Tenant metadata updated`);

    // 6. Optional: Set old DB to read-only (requires superuser)
    // This is optional and can be done manually if needed
    console.log(`ℹ️  Old database (${tenant.currentDb}) is still accessible for read operations`);
    console.log(`   To set it to read-only, run manually:`);
    console.log(`   ALTER DATABASE ${tenant.currentDb} SET default_transaction_read_only = true;`);

    console.log('');
    console.log('✅ Yearly rotation completed successfully!');
    console.log(`   Old DB: ${tenant.currentDb}`);
    console.log(`   New DB: ${newDbName}`);
    console.log(`   All DBs: ${updatedAllDatabases.join(', ')}`);
  } catch (error: any) {
    console.error('');
    console.error('❌ Yearly rotation failed:');
    console.error(error.message || error);
    process.exit(1);
  } finally {
    await corePrisma.$disconnect();
  }
}

main();


