#!/usr/bin/env node

/**
 * Migration Helper Script
 * 
 * Yeni migration oluştururken yardımcı script.
 * Modül bazlı migration isimlendirmesi ve version check yapar.
 */

const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');

const MODULES = [
  'core-base',
  'extensions',
  'real-estate',
  'accounting',
  'production',
  'hr',
  'chat',
  'maintenance',
  'web-builder',
  'calendar'
];

/**
 * Generate migration name
 */
function generateMigrationName(moduleSlug, description) {
  const now = new Date();
  const timestamp = now.toISOString()
    .replace(/[-:]/g, '')
    .replace(/\.\d{3}/, '')
    .replace('T', '')
    .substring(0, 14);
  
  const slug = description
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '');
  
  return `${timestamp}_${moduleSlug}_${slug}`;
}

/**
 * Validate module slug
 */
function validateModule(moduleSlug) {
  if (!MODULES.includes(moduleSlug)) {
    console.error(`❌ Invalid module: ${moduleSlug}`);
    console.error(`Valid modules: ${MODULES.join(', ')}`);
    process.exit(1);
  }
}

/**
 * Create migration
 */
function createMigration(moduleSlug, description) {
  validateModule(moduleSlug);
  
  const migrationName = generateMigrationName(moduleSlug, description);
  console.log(`📦 Creating migration: ${migrationName}`);
  
  // Run prisma migrate dev with custom name
  // Note: Prisma doesn't support custom migration names directly
  // This script validates the module and description, then runs standard migrate dev
  console.log(`📝 Module: ${moduleSlug}`);
  console.log(`📝 Description: ${description}`);
  console.log(`📝 Suggested name: ${migrationName}`);
  console.log('');
  console.log('⚠️  Note: Prisma will generate its own migration name.');
  console.log('   Please rename the migration folder to match the suggested name after creation.');
  console.log('');
  
  try {
    execSync(
      `npm run prisma:migrate:dev`,
      { stdio: 'inherit' }
    );
    console.log(`✅ Migration created. Please rename to: ${migrationName}`);
  } catch (error) {
    console.error('❌ Migration creation failed');
    process.exit(1);
  }
}

// CLI
const args = process.argv.slice(2);
if (args.length < 2) {
  console.log('Usage: node scripts/migration-helper.js <module-slug> <description>');
  console.log('');
  console.log('Examples:');
  console.log('  node scripts/migration-helper.js real-estate "add property features"');
  console.log('  node scripts/migration-helper.js accounting "update invoice model"');
  console.log('');
  console.log('Valid modules:', MODULES.join(', '));
  process.exit(1);
}

const [moduleSlug, ...descriptionParts] = args;
const description = descriptionParts.join(' ');

createMigration(moduleSlug, description);

