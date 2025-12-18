/**
 * Run Menu Management Migration on All Tenant Databases
 * 
 * This script applies the menu management migration to all active tenant databases
 */

import { corePrisma } from '../src/lib/corePrisma';
import { getTenantDbUrl } from '../src/lib/services/tenantService';
import { PrismaClient } from '@prisma/tenant-client';
import fs from 'fs';
import path from 'path';

async function runMigrationOnTenant(tenantDbUrl: string, tenantName: string) {
  console.log(`\n📦 Running migration on ${tenantName}...`);
  
  const tenantPrisma = new PrismaClient({
    datasources: {
      db: {
        url: tenantDbUrl,
      },
    },
  });

  try {
    // Read migration SQL file
    const migrationPath = path.join(
      __dirname,
      '../prisma/migrations/20250201000007_add_menu_management_system/migration.sql'
    );
    const migrationSql = fs.readFileSync(migrationPath, 'utf-8');

    // Split SQL into individual statements
    const statements = migrationSql
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0 && !s.startsWith('--'));

    // Execute each statement
    for (const statement of statements) {
      if (statement.trim()) {
        try {
          await tenantPrisma.$executeRawUnsafe(statement);
        } catch (error: any) {
          // Ignore "already exists" errors
          if (!error.message?.includes('already exists') && !error.message?.includes('duplicate')) {
            console.error(`  ⚠️  Error executing statement: ${error.message}`);
          }
        }
      }
    }

    console.log(`  ✅ Migration completed for ${tenantName}`);
  } catch (error: any) {
    console.error(`  ❌ Error running migration on ${tenantName}:`, error.message);
    throw error;
  } finally {
    await tenantPrisma.$disconnect();
  }
}

async function main() {
  console.log('🚀 Starting menu management migration on all tenants...\n');

  try {
    // Get all active tenants
    const tenants = await corePrisma.tenant.findMany({
      where: {
        status: 'active',
      },
      select: {
        id: true,
        name: true,
        slug: true,
        dbName: true,
        currentDb: true,
      },
    });

    if (tenants.length === 0) {
      console.log('No active tenants found.');
      return;
    }

    console.log(`Found ${tenants.length} active tenant(s):\n`);
    tenants.forEach((tenant, index) => {
      console.log(`${index + 1}. ${tenant.name} (${tenant.slug}) - DB: ${tenant.dbName}`);
    });

    // Run migration on each tenant
    for (const tenant of tenants) {
      try {
        const tenantDbUrl = getTenantDbUrl(tenant);
        await runMigrationOnTenant(tenantDbUrl, tenant.name);
      } catch (error: any) {
        console.error(`Failed to migrate ${tenant.name}:`, error.message);
        // Continue with next tenant
      }
    }

    console.log('\n✅ Migration completed for all tenants!');
  } catch (error: any) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  } finally {
    await corePrisma.$disconnect();
  }
}

main();

