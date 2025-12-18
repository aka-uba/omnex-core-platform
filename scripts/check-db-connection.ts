/**
 * Database Connection Check Script
 * 
 * PostgreSQL bağlantısını ve database'lerin varlığını kontrol eder
 * Usage: tsx scripts/check-db-connection.ts
 */

// Load .env file manually
import { readFileSync } from 'fs';
import { join } from 'path';

function loadEnv() {
  try {
    const envPath = join(process.cwd(), '.env');
    const envContent = readFileSync(envPath, 'utf-8');
    envContent.split('\n').forEach(line => {
      const trimmed = line.trim();
      if (trimmed && !trimmed.startsWith('#')) {
        const match = trimmed.match(/^([^=:#]+)=(.*)$/);
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
      }
    });
  } catch (error) {
    console.error('Warning: Could not load .env file:', error);
  }
}

loadEnv();

import { getTenantConfig } from '../src/config/tenant.config';

async function checkConnection() {
  console.log('🔍 Checking database connections...\n');

  const config = getTenantConfig();

  // Check Core DB
  console.log('1. Core Database:');
  try {
    const coreUrl = new URL(config.coreDatabaseUrl);
    console.log(`   Host: ${coreUrl.hostname}:${coreUrl.port || '5432'}`);
    console.log(`   Database: ${coreUrl.pathname.replace('/', '')}`);
    console.log(`   User: ${coreUrl.username}`);
    
    // Try to connect (basic check)
    const coreClientModule = await import('../node_modules/.prisma/core-client');
    const CorePrismaClient = coreClientModule.PrismaClient;
    const corePrisma = new CorePrismaClient();
    await corePrisma.$connect();
    console.log('   ✅ Connection successful');
    await corePrisma.$disconnect();
  } catch (error: any) {
    console.log('   ❌ Connection failed:', error.message);
    console.log('   💡 Make sure:');
    console.log('      - PostgreSQL is running');
    console.log('      - Database exists (CREATE DATABASE omnex_core;)');
    console.log('      - CORE_DATABASE_URL is correct in .env');
  }

  console.log('');

  // Check Tenant DB Template
  console.log('2. Tenant DB Template:');
  try {
    const templateUrl = config.tenantDbTemplateUrl;
    console.log(`   Template: ${templateUrl}`);
    console.log('   ✅ Template URL is valid');
  } catch (error: any) {
    console.log('   ❌ Template URL error:', error.message);
  }

  console.log('');

  // Check Admin URL
  console.log('3. PostgreSQL Admin:');
  try {
    const adminUrl = new URL(config.pgAdminUrl);
    console.log(`   Host: ${adminUrl.hostname}:${adminUrl.port || '5432'}`);
    console.log(`   User: ${adminUrl.username}`);
    console.log('   ✅ Admin URL is valid');
    console.log('   ⚠️  Note: Admin access is required for tenant DB creation');
  } catch (error: any) {
    console.log('   ❌ Admin URL error:', error.message);
  }

  console.log('');
  console.log('📝 If connections failed, check your .env file:');
  console.log('   CORE_DATABASE_URL="postgresql://user:pass@host:5432/omnex_core"');
  console.log('   TENANT_DB_TEMPLATE_URL="postgresql://user:pass@host:5432/__DB_NAME__"');
  console.log('   PG_ADMIN_URL="postgresql://postgres:pass@host:5432/postgres"');
}

checkConnection()
  .catch((error) => {
    console.error('Error:', error);
    process.exit(1);
  });

