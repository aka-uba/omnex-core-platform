/**
 * Setup Tenant Database Script
 * 
 * Mevcut tenant için database oluşturur ve migration uygular
 * Usage: tsx scripts/setup-tenant-db.ts --slug=test
 */

import { execSync } from 'child_process';
import { corePrisma } from '../src/lib/corePrisma';
import { getTenantConfig, getTenantDatabaseUrl } from '../src/config/tenant.config';
import path from 'path';

// Get tenant slug from command line args
const tenantSlug = process.argv.find(arg => arg.startsWith('--slug='))?.split('=')[1];

if (!tenantSlug) {
  console.error('❌ Tenant slug is required!');
  console.log('Usage: tsx scripts/setup-tenant-db.ts --slug=test');
  process.exit(1);
}

async function main() {
  console.log(`🔧 Setting up database for tenant: ${tenantSlug}\n`);

  try {
    // 1. Core DB'den tenant'ı bul
    const tenant = await corePrisma.tenant.findUnique({
      where: { slug: tenantSlug },
    });

    if (!tenant) {
      console.error(`❌ Tenant "${tenantSlug}" not found in core DB!`);
      process.exit(1);
    }

    console.log(`✅ Found tenant: ${tenant.name}`);
    console.log(`   Database: ${tenant.currentDb}\n`);

    const config = getTenantConfig();
    const dbName = tenant.currentDb;
    const tenantDbUrl = getTenantDatabaseUrl(dbName);

    // 2. PostgreSQL'de database oluştur
    console.log(`🗄️  Creating PostgreSQL database: ${dbName}`);
    try {
      const adminUrl = new URL(config.pgAdminUrl);
      const connectionString = `postgresql://${adminUrl.username}:${adminUrl.password}@${adminUrl.hostname}:${adminUrl.port || 5432}/postgres`;
      
      // Use psql to create database (Windows compatible)
      const dbUser = adminUrl.username;
      const dbPassword = adminUrl.password;
      const dbHost = adminUrl.hostname;
      const dbPort = adminUrl.port || '5432';
      
      // Try to find psql in common locations
      let psqlPath = 'psql';
      if (process.platform === 'win32') {
        // Try common PostgreSQL installation paths
        const possiblePaths = [
          '"C:\\Program Files\\PostgreSQL\\18\\bin\\psql.exe"',
          '"C:\\Program Files\\PostgreSQL\\17\\bin\\psql.exe"',
          '"C:\\Program Files\\PostgreSQL\\16\\bin\\psql.exe"',
          '"C:\\Program Files\\PostgreSQL\\15\\bin\\psql.exe"',
          'psql', // Fallback to PATH
        ];
        
        for (const path of possiblePaths) {
          try {
            execSync(`${path} --version`, { stdio: 'pipe', shell: process.platform === 'win32' ? 'cmd.exe' : '/bin/sh' });
            psqlPath = path;
            break;
          } catch {
            continue;
          }
        }
      }
      
      const createDbCommand = `${psqlPath} -h ${dbHost} -p ${dbPort} -U ${dbUser} -d postgres -c "CREATE DATABASE ${dbName};"`;
      console.log(`   Running: ${createDbCommand.replace(dbPassword, '***')}`);
      
      try {
        execSync(createDbCommand, { 
          stdio: 'inherit', 
          env: { ...process.env, PGPASSWORD: dbPassword },
          shell: process.platform === 'win32' ? 'cmd.exe' : '/bin/sh'
        });
        console.log(`✅ Database created: ${dbName}`);
      } catch (error: unknown) {
        // Database might already exist
        const errorMessage = error instanceof Error ? error.message : String(error);
        if (errorMessage?.includes('already exists') || errorMessage?.includes('duplicate')) {
          console.log(`⚠️  Database already exists: ${dbName}, continuing...`);
        } else {
          console.error(`❌ Failed to create database:`, errorMessage);
          throw error;
        }
      }
    } catch (error: unknown) {
      // If database creation fails but database exists, continue
      const errorMessage = error instanceof Error ? error.message : String(error);
      if (errorMessage?.includes('already exists') || errorMessage?.includes('duplicate')) {
        console.log(`⚠️  Database already exists: ${dbName}, continuing...`);
      } else {
        console.error(`❌ Failed to create database:`, errorMessage);
        throw error;
      }
    }

    // 3. Migration uygula
    console.log(`\n📦 Applying migrations to tenant DB...`);
    try {
      execSync(
        `npx prisma migrate deploy --schema=prisma/tenant.schema.prisma`,
        {
          stdio: 'inherit',
          cwd: process.cwd(),
          env: { ...process.env, TENANT_DATABASE_URL: tenantDbUrl },
          shell: process.platform === 'win32' ? 'cmd.exe' : '/bin/sh',
        }
      );
      console.log(`✅ Migrations applied`);
    } catch (error) {
      console.error(`❌ Migration failed:`, error);
      throw error;
    }

    // 4. Seed çalıştır
    console.log(`\n🌱 Running seed for tenant DB...`);
    try {
      execSync(
        `tsx prisma/seed/tenant-seed.ts --tenant-slug=${tenantSlug}`,
        {
          stdio: 'inherit',
          cwd: process.cwd(),
          env: { ...process.env, TENANT_DATABASE_URL: tenantDbUrl },
          shell: process.platform === 'win32' ? 'cmd.exe' : '/bin/sh',
        }
      );
      console.log(`✅ Seed completed`);
    } catch (error) {
      console.error(`⚠️  Seed failed (continuing anyway):`, error);
    }

    console.log(`\n✅ Tenant database setup completed!`);
    console.log(`\n📝 Login credentials:`);
    console.log(`   Email: admin@${tenantSlug}.com`);
    console.log(`   Username: admin`);
    console.log(`   Password: Omnex123!`);
  } catch (error) {
    console.error('❌ Setup failed:', error);
    process.exit(1);
  } finally {
    await corePrisma.$disconnect();
  }
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });

