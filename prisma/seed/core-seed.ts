/**
 * Core Database Seed Script
 * 
 * Core DB için varsayılan verileri oluşturur (Agency, Tenant, vb.)
 * Usage: CORE_DATABASE_URL="..." tsx prisma/seed/core-seed.ts --tenant-slug=omnexcore
 */

import { PrismaClient as CorePrismaClient } from '@prisma/core-client';

const corePrisma = new CorePrismaClient();

// Get tenant slug from command line args or use default
const tenantSlug = process.argv.find(arg => arg.startsWith('--tenant-slug='))?.split('=')[1] || 'omnexcore';
const tenantName = process.argv.find(arg => arg.startsWith('--tenant-name='))?.split('=')[1] || 'Omnex Core';
const tenantDbName = process.argv.find(arg => arg.startsWith('--tenant-db-name='))?.split('=')[1] || `tenant_${tenantSlug}_2025`;

async function main() {
  console.log('🌱 Starting core database seed...');
  console.log(`   Tenant Slug: ${tenantSlug}`);
  console.log(`   Tenant Name: ${tenantName}`);
  console.log(`   Tenant DB Name: ${tenantDbName}`);

  try {
    // ============================================
    // 1. Create Default Agency
    // ============================================
    console.log('📦 Creating default agency...');
    const agency = await corePrisma.agency.upsert({
      where: { id: 'omnex-agency-001' },
      update: {},
      create: {
        id: 'omnex-agency-001',
        name: 'Omnex Agency',
        email: 'info@omnex.com',
        phone: '+90 212 555 0000',
        address: 'İstanbul, Türkiye',
        website: 'https://omnex.com',
      },
    });
    console.log('✅ Agency created:', agency.name);
    console.log(`   Agency ID: ${agency.id}`);

    // ============================================
    // 2. Create Default Tenant
    // ============================================
    console.log('🏢 Creating default tenant...');
    const tenant = await corePrisma.tenant.upsert({
      where: { slug: tenantSlug },
      update: {
        name: tenantName,
        dbName: tenantDbName,
        currentDb: tenantDbName,
        allDatabases: [tenantDbName],
        status: 'active',
        agencyId: agency.id,
      },
      create: {
        slug: tenantSlug,
        name: tenantName,
        subdomain: tenantSlug,
        dbName: tenantDbName,
        currentDb: tenantDbName,
        allDatabases: [tenantDbName],
        status: 'active',
        agencyId: agency.id,
        setupFailed: false,
      },
    });
    console.log('✅ Tenant created:', tenant.name);
    console.log(`   Tenant ID: ${tenant.id}`);
    console.log(`   Tenant Slug: ${tenant.slug}`);
    console.log(`   Tenant DB: ${tenant.dbName}`);

    console.log('');
    console.log('✅ Core database seed completed successfully!');
    console.log('');
    console.log('📝 Created:');
    console.log(`   - Agency: ${agency.name} (${agency.id})`);
    console.log(`   - Tenant: ${tenant.name} (${tenant.slug})`);
  } catch (error) {
    console.error('❌ Core database seed failed:', error);
    throw error;
  } finally {
    await corePrisma.$disconnect();
  }
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });


