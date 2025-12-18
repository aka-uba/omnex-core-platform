/**
 * Menu Management System Migration Runner
 * 
 * This script runs the menu management system migration on tenant databases.
 * It reads the SQL migration file and executes it using Prisma's raw query.
 */

const { PrismaClient } = require('.prisma/tenant-client');
const fs = require('fs');
const path = require('path');

// Tenant database configuration
const TENANT_DB_URL = process.env.TENANT_DATABASE_URL || process.env.CORE_DATABASE_URL || 'postgresql://postgres@localhost:5432/omnex_core';

async function runMigration() {
    console.log('🚀 Starting Menu Management System Migration...\n');

    const prisma = new PrismaClient({
        datasources: {
            db: {
                url: TENANT_DB_URL
            }
        }
    });

    try {
        const migrationPath = path.join(__dirname, 'migrations', 'menu-management-system.sql');
        console.log(`📄 Reading migration file: ${migrationPath}`);

        const migrationSQL = fs.readFileSync(migrationPath, 'utf8');

        console.log(`📊 Executing migration SQL...\n`);

        // Split SQL into individual statements
        // Remove comments and split by semicolon
        const statements = migrationSQL
            .split('\n')
            .filter(line => !line.trim().startsWith('--') && line.trim().length > 0)
            .join('\n')
            .split(';')
            .map(stmt => stmt.trim())
            .filter(stmt => stmt.length > 0);

        console.log(`   Found ${statements.length} SQL statements to execute\n`);

        // Execute each statement
        let successCount = 0;
        let skipCount = 0;

        for (let i = 0; i < statements.length; i++) {
            const statement = statements[i];
            try {
                await prisma.$executeRawUnsafe(statement);
                successCount++;
                // Show progress for every 10 statements
                if ((i + 1) % 10 === 0) {
                    console.log(`   Progress: ${i + 1}/${statements.length} statements executed`);
                }
            } catch (error) {
                if (error.message.includes('already exists') || error.code === 'P2010') {
                    skipCount++;
                    // Silently skip "already exists" errors
                } else {
                    console.error(`   ❌ Error in statement ${i + 1}:`, error.message);
                    console.error(`   Statement: ${statement.substring(0, 100)}...`);
                    throw error;
                }
            }
        }

        console.log(`\n✅ Migration completed!`);
        console.log(`   Executed: ${successCount} statements`);
        if (skipCount > 0) {
            console.log(`   Skipped: ${skipCount} (already exists)`);
        }

        // Verify tables
        console.log(`\n🔍 Verifying tables...`);

        const tables = await prisma.$queryRaw`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name IN ('menus', 'menu_items', 'menu_locations', 'menu_location_assignments', 'footer_customizations')
      ORDER BY table_name;
    `;

        console.log(`\n📋 Created tables:`);
        if (tables.length === 0) {
            console.log(`   ⚠️  No menu tables found`);
        } else {
            tables.forEach(table => {
                console.log(`   ✓ ${table.table_name}`);
            });
        }

        // Check locations
        const locations = await prisma.$queryRaw`
      SELECT name, label->>'tr' as label_tr 
      FROM menu_locations 
      ORDER BY name;
    `;

        console.log(`\n📍 Default menu locations:`);
        if (locations.length === 0) {
            console.log(`   ⚠️  No locations found`);
        } else {
            locations.forEach(loc => {
                console.log(`   ✓ ${loc.name} (${loc.label_tr})`);
            });
        }

        console.log(`\n🎉 Menu Management System is ready!`);
        console.log(`   Access at: /settings/menu-management\n`);

    } catch (error) {
        console.error(`\n❌ Migration failed:`, error.message);
        console.error(error);
        process.exit(1);
    } finally {
        await prisma.$disconnect();
    }
}

runMigration()
    .then(() => {
        console.log('✨ Done!');
        process.exit(0);
    })
    .catch((error) => {
        console.error('Fatal error:', error);
        process.exit(1);
    });
