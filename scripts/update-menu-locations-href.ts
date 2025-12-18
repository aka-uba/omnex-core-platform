/**
 * Update Menu Items Href Migration
 * 
 * Updates old location hrefs to new path:
 * - /settings/locations -> /settings/company/locations
 * - /management/locations -> /settings/company/locations
 */

import { corePrisma } from '../src/lib/corePrisma';
import { PrismaClient } from '@prisma/tenant-client';

// Helper to get tenant database URL
function getTenantDbUrl(tenant: { dbName?: string | null; currentDb?: string | null; slug: string }): string {
  const dbName = tenant.currentDb || tenant.dbName || `tenant_${tenant.slug}_2025`;
  const dbUser = process.env.DB_USER || 'postgres';
  const dbPassword = process.env.DB_PASSWORD || '';
  const dbHost = process.env.DB_HOST || 'localhost';
  const dbPort = process.env.DB_PORT || '5432';
  
  return `postgresql://${dbUser}:${dbPassword}@${dbHost}:${dbPort}/${dbName}`;
}

async function updateMenuItemsForTenant(tenantDbUrl: string, tenantName: string) {
  console.log(`\n📦 Updating menu items for ${tenantName}...`);
  
  const tenantPrisma = new PrismaClient({
    datasources: {
      db: {
        url: tenantDbUrl,
      },
    },
  });

  try {
    // Find all menu items with old hrefs
    const oldItems = await tenantPrisma.menuItem.findMany({
      where: {
        OR: [
          { href: '/settings/locations' },
          { href: '/management/locations' },
        ],
      },
      select: {
        id: true,
        href: true,
        label: true,
      },
    });

    if (oldItems.length === 0) {
      console.log(`  ℹ️  No menu items to update for ${tenantName}`);
      return;
    }

    console.log(`  📝 Found ${oldItems.length} menu item(s) to update`);

    // Update each item
    for (const item of oldItems) {
      await tenantPrisma.menuItem.update({
        where: { id: item.id },
        data: {
          href: '/settings/company/locations',
        },
      });
      console.log(`  ✅ Updated: ${item.href} -> /settings/company/locations`);
    }

    console.log(`  ✅ Migration completed for ${tenantName}`);
  } catch (error: any) {
    console.error(`  ❌ Error updating menu items for ${tenantName}:`, error.message);
    throw error;
  } finally {
    await tenantPrisma.$disconnect();
  }
}

async function main() {
  console.log('🚀 Starting menu items href update migration...\n');

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
      console.log('⚠️  No active tenants found');
      return;
    }

    console.log(`📋 Found ${tenants.length} active tenant(s)\n`);

    // Update menu items for each tenant
    for (const tenant of tenants) {
      try {
        const tenantDbUrl = getTenantDbUrl(tenant);
        await updateMenuItemsForTenant(tenantDbUrl, tenant.name);
      } catch (error: any) {
        console.error(`  ❌ Error processing tenant ${tenant.name}:`, error.message);
        // Continue with next tenant
      }
    }

    console.log('\n✅ Migration completed for all tenants');
  } catch (error: any) {
    console.error('❌ Error running migration:', error);
    process.exit(1);
  } finally {
    await corePrisma.$disconnect();
  }
}

// Run the migration
main()
  .catch((error) => {
    console.error('Fatal error:', error);
    process.exit(1);
  });

