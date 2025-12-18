/**
 * Core Database Oluşturma Script
 * 
 * .env dosyasındaki PG_ADMIN_URL kullanarak core database'i oluşturur
 * Usage: node scripts/create-core-db.js
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// .env dosyasını manuel olarak oku
function loadEnv() {
  const envPath = path.join(__dirname, '..', '.env');
  if (fs.existsSync(envPath)) {
    const envContent = fs.readFileSync(envPath, 'utf-8');
    envContent.split('\n').forEach(line => {
      const match = line.match(/^([^=:#]+)=(.*)$/);
      if (match) {
        const key = match[1].trim();
        let value = match[2].trim();
        // Remove quotes if present
        if ((value.startsWith('"') && value.endsWith('"')) || 
            (value.startsWith("'") && value.endsWith("'"))) {
          value = value.slice(1, -1);
        }
        process.env[key] = value;
      }
    });
  }
}

loadEnv();

async function createDatabase() {
  console.log('🗄️  Creating core database...\n');

  // .env dosyasından PG_ADMIN_URL'i al
  const adminUrl = process.env.PG_ADMIN_URL;

  if (!adminUrl) {
    console.error('❌ Error: PG_ADMIN_URL not found in .env file');
    console.log('\nPlease add to your .env file:');
    console.log('PG_ADMIN_URL="postgresql://postgres:password@localhost:5432/postgres"');
    process.exit(1);
  }

  try {
    // URL'den bilgileri parse et
    const url = new URL(adminUrl);
    const dbUser = url.username;
    const dbPassword = url.password;
    const dbHost = url.hostname;
    const dbPort = url.port || '5432';
    const dbName = 'omnex_core';

    console.log(`📝 Connection info:`);
    console.log(`   Host: ${dbHost}:${dbPort}`);
    console.log(`   User: ${dbUser}`);
    console.log(`   Database: ${dbName}`);
    console.log('');

    // Windows için PGPASSWORD environment variable set et
    if (process.platform === 'win32') {
      process.env.PGPASSWORD = dbPassword;
    }

    // psql yolunu bul
    const possiblePaths = [
      'C:\\Program Files\\PostgreSQ\\pgsql\\bin\\psql.exe',
      'C:\\Program Files\\PostgreSQL\\15\\bin\\psql.exe',
      'C:\\Program Files\\PostgreSQL\\14\\bin\\psql.exe',
      'C:\\Program Files\\PostgreSQL\\13\\bin\\psql.exe',
      'psql' // PATH'te varsa
    ];
    
    let psqlPath = 'psql';
    for (const path of possiblePaths) {
      try {
        const fs = require('fs');
        if (fs.existsSync(path)) {
          psqlPath = path;
          break;
        }
      } catch (e) {
        // Continue
      }
    }

    // Database oluştur
    console.log('🔄 Creating database...');
    const createCommand = `"${psqlPath}" -h ${dbHost} -p ${dbPort} -U ${dbUser} -d postgres -c "CREATE DATABASE ${dbName};"`;
    
    try {
      execSync(createCommand, { 
        stdio: 'inherit',
        env: { ...process.env, PGPASSWORD: dbPassword },
        shell: true
      });
      console.log('\n✅ Database created successfully!');
      console.log(`   Database name: ${dbName}`);
    } catch (error) {
      // Database zaten varsa devam et
      if (error.message && error.message.includes('already exists')) {
        console.log('\n⚠️  Database already exists, skipping...');
      } else {
        throw error;
      }
    }

    // Database'in var olduğunu kontrol et
    console.log('\n🔍 Verifying database...');
    const checkCommand = `"${psqlPath}" -h ${dbHost} -p ${dbPort} -U ${dbUser} -d postgres -c "SELECT 1 FROM pg_database WHERE datname='${dbName}';"`;
    
    try {
      execSync(checkCommand, { 
        stdio: 'pipe',
        env: { ...process.env, PGPASSWORD: dbPassword },
        shell: true
      });
      console.log('✅ Database verified!');
    } catch (error) {
      console.log('⚠️  Could not verify database (this is okay if it was just created)');
    }

    console.log('\n📝 Next steps:');
    console.log('   1. Run migration:');
    console.log('      npx prisma migrate dev --schema=prisma/core.schema.prisma --name init');
    console.log('   2. Seed core database (optional):');
    console.log('      npm run db:seed:core');

  } catch (error) {
    console.error('\n❌ Error creating database:');
    console.error(error.message);
    console.log('\n💡 Troubleshooting:');
    console.log('   1. Make sure PostgreSQL is running');
    console.log('   2. Check PG_ADMIN_URL in .env file');
    console.log('   3. Verify psql is in your PATH');
    console.log('   4. Try creating database manually using pgAdmin');
    process.exit(1);
  }
}

createDatabase();

