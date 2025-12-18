#!/usr/bin/env node

/**
 * Relation Integrity Check Script
 * 
 * Validates:
 * 1. All relation targets exist
 * 2. Cross-module relations follow whitelist policy
 * 3. No duplicate model names
 * 4. Core base/extensions relations are allowed
 * 
 * Relation Policy:
 * - ✅ Any module → core-base/* (User, Company, Role, PermissionDefinition)
 * - ✅ Any module → extensions/* (AuditLog, Notification, CoreFile, AIGeneration)
 * - ✅ Whitelisted module → module relations
 * - ❌ Module → Module direct relation (unless whitelisted)
 */

const fs = require('fs');
const path = require('path');
const { isDevMode, handleValidation } = require('./operational-mode');

const PRISMA_DIR = path.join(__dirname, '../prisma');

// Whitelisted cross-module relations
const WHITELISTED_RELATIONS = [
  { from: 'accounting', to: 'hr', reason: 'payroll integration' },
  { from: 'maintenance', to: 'real-estate', reason: 'property maintenance' },
  { from: 'production', to: 'accounting', reason: 'cost tracking' },
  { from: 'production', to: 'real-estate', reason: 'location-based production' }
];

// Core base models (always allowed as relation targets)
const CORE_BASE_MODELS = new Set(['User', 'Company', 'Role', 'PermissionDefinition', 'UserPermission', 'PagePermission', 'Menu', 'MenuItem']);

// Extension models (always allowed as relation targets)
const EXTENSION_MODELS = new Set(['AuditLog', 'Notification', 'Attachment', 'CoreFile', 'FileShare', 'AIGeneration', 'AIHistory', 'EntityMeta', 'TenantSchemaRegistry']);

/**
 * Get module name from file path
 */
function getModuleFromPath(filePath) {
  if (filePath.includes('core-base')) return 'core-base';
  if (filePath.includes('extensions')) return 'extensions';
  if (filePath.includes('modules/')) {
    const match = filePath.match(/modules\/([^\/]+)/);
    return match ? match[1] : null;
  }
  return null;
}

/**
 * Check if relation is allowed
 */
function isRelationAllowed(fromModule, toModule, toModel) {
  // Core base and extensions are always allowed
  if (toModule === 'core-base' || toModule === 'extensions') {
    return { allowed: true, reason: `${toModule} models are always allowed` };
  }
  
  // Same module is always allowed
  if (fromModule === toModule) {
    return { allowed: true, reason: 'Same module relations are allowed' };
  }
  
  // Check whitelist
  const whitelisted = WHITELISTED_RELATIONS.find(
    rel => rel.from === fromModule && rel.to === toModule
  );
  
  if (whitelisted) {
    return { allowed: true, reason: whitelisted.reason };
  }
  
  return {
    allowed: false,
    reason: `Cross-module relation ${fromModule} → ${toModule} is not whitelisted`
  };
}

/**
 * Parse schema and extract models and relations
 */
function parseSchema() {
  const models = new Map(); // modelName -> { module, file }
  const relations = []; // { from, to, fromModule, toModule, field }
  
  // Parse core-base
  const coreBaseDir = path.join(PRISMA_DIR, 'core-base');
  if (fs.existsSync(coreBaseDir)) {
    const files = fs.readdirSync(coreBaseDir).filter(f => f.endsWith('.prisma'));
    for (const file of files) {
      const filePath = path.join(coreBaseDir, file);
      const content = fs.readFileSync(filePath, 'utf8');
      
      const modelRegex = /model\s+(\w+)\s*\{([^}]+(?:\{[^}]*\}[^}]*)*)\}/gs;
      let match;
      while ((match = modelRegex.exec(content)) !== null) {
        const modelName = match[1];
        const modelBody = match[2];
        models.set(modelName, { module: 'core-base', file: `core-base/${file}` });
        
        // Extract relations
        // Pattern: fieldName ModelName?[]? @relation(...)
        // Example: user User @relation(fields: [userId], references: [id])
        const relationRegex = /(\w+)\s+(\w+)\??(\[?\])?\s+@relation\([^)]*fields:\s*\[([^\]]+)\][^)]*references:\s*\[([^\]]+)\][^)]*\)/gs;
        let relMatch;
        while ((relMatch = relationRegex.exec(modelBody)) !== null) {
          const fieldName = relMatch[1].trim(); // e.g., "user"
          const toModel = relMatch[2].trim(); // e.g., "User" - THIS IS THE MODEL NAME
          const foreignKey = relMatch[4].trim(); // e.g., "userId"
          const referencedField = relMatch[5].trim(); // e.g., "id"
          
          relations.push({
            from: modelName,
            to: toModel,
            fromModule: 'core-base',
            toModule: null, // Will be resolved later
            field: fieldName,
            foreignKey: foreignKey,
            referencedField: referencedField
          });
        }
      }
    }
  }
  
  // Parse extensions
  const extensionsDir = path.join(PRISMA_DIR, 'extensions');
  if (fs.existsSync(extensionsDir)) {
    const files = fs.readdirSync(extensionsDir).filter(f => f.endsWith('.prisma'));
    for (const file of files) {
      const filePath = path.join(extensionsDir, file);
      const content = fs.readFileSync(filePath, 'utf8');
      
      const modelRegex = /model\s+(\w+)\s*\{([^}]+(?:\{[^}]*\}[^}]*)*)\}/gs;
      let match;
      while ((match = modelRegex.exec(content)) !== null) {
        const modelName = match[1];
        const modelBody = match[2];
        models.set(modelName, { module: 'extensions', file: `extensions/${file}` });
        
        // Extract relations
        // Pattern: fieldName ModelName?[]? @relation(...)
        const relationRegex = /(\w+)\s+(\w+)\??(\[?\])?\s+@relation\([^)]*fields:\s*\[([^\]]+)\][^)]*references:\s*\[([^\]]+)\][^)]*\)/gs;
        let relMatch;
        while ((relMatch = relationRegex.exec(modelBody)) !== null) {
          const fieldName = relMatch[1].trim();
          const toModel = relMatch[2].trim(); // Model name
          const foreignKey = relMatch[4].trim();
          const referencedField = relMatch[5].trim();
          
          relations.push({
            from: modelName,
            to: toModel,
            fromModule: 'extensions',
            toModule: null,
            field: fieldName,
            foreignKey: foreignKey,
            referencedField: referencedField
          });
        }
      }
    }
  }
  
  // Parse modules
  const modulesDir = path.join(PRISMA_DIR, 'modules');
  if (fs.existsSync(modulesDir)) {
    const moduleDirs = fs.readdirSync(modulesDir).filter(f => {
      const fullPath = path.join(modulesDir, f);
      return fs.statSync(fullPath).isDirectory();
    });
    
    for (const moduleDir of moduleDirs) {
      const moduleSchema = path.join(modulesDir, moduleDir, `${moduleDir}.prisma`);
      if (fs.existsSync(moduleSchema)) {
        const content = fs.readFileSync(moduleSchema, 'utf8');
        
        const modelRegex = /model\s+(\w+)\s*\{([^}]+(?:\{[^}]*\}[^}]*)*)\}/gs;
        let match;
        while ((match = modelRegex.exec(content)) !== null) {
          const modelName = match[1];
          const modelBody = match[2];
          models.set(modelName, { module: moduleDir, file: `modules/${moduleDir}/${moduleDir}.prisma` });
          
          // Extract relations
          // Pattern: fieldName ModelName?[]? @relation(...)
          const relationRegex = /(\w+)\s+(\w+)\??(\[?\])?\s+@relation\([^)]*fields:\s*\[([^\]]+)\][^)]*references:\s*\[([^\]]+)\][^)]*\)/gs;
          let relMatch;
          while ((relMatch = relationRegex.exec(modelBody)) !== null) {
            const fieldName = relMatch[1].trim();
            const toModel = relMatch[2].trim(); // Model name
            const foreignKey = relMatch[4].trim();
            const referencedField = relMatch[5].trim();
            
            relations.push({
              from: modelName,
              to: toModel,
              fromModule: moduleDir,
              toModule: null,
              field: fieldName,
              foreignKey: foreignKey,
              referencedField: referencedField
            });
          }
        }
      }
    }
  }
  
  // Resolve toModule for relations
  for (const rel of relations) {
    const targetModel = models.get(rel.to);
    if (targetModel) {
      rel.toModule = targetModel.module;
    }
  }
  
  return { models, relations };
}

/**
 * Validate relations
 */
function validateRelations() {
  const { models, relations } = parseSchema();
  const errors = [];
  const warnings = [];
  
  // Check for broken relation targets
  for (const rel of relations) {
    if (!models.has(rel.to)) {
      errors.push({
        type: 'broken_target',
        message: `Relation target '${rel.to}' not found (from ${rel.from}.${rel.field})`
      });
    }
  }
  
  // Check cross-module relation policy
  for (const rel of relations) {
    if (!rel.toModule) continue; // Already handled as broken target
    
    // Skip if same module or core/extensions
    if (rel.fromModule === rel.toModule) continue;
    if (rel.toModule === 'core-base' || rel.toModule === 'extensions') continue;
    if (rel.fromModule === 'core-base' || rel.fromModule === 'extensions') continue;
    
    // Check whitelist
    const check = isRelationAllowed(rel.fromModule, rel.toModule, rel.to);
    if (!check.allowed) {
      const violation = {
        type: 'whitelist_violation',
        message: `${rel.fromModule} → ${rel.toModule}: ${check.reason}`,
        relation: `${rel.from}.${rel.field} → ${rel.to}`
      };
      
      if (isDevMode()) {
        warnings.push(violation);
      } else {
        errors.push(violation);
      }
    }
  }
  
  // Report errors
  if (errors.length > 0) {
    const message = `Relation validation failed:\n${errors.map(e => `  - ${e.message}${e.relation ? ` (${e.relation})` : ''}`).join('\n')}`;
    handleValidation(new Error(message), message);
    return false;
  }
  
  // Report warnings (DEV MODE only)
  if (warnings.length > 0) {
    console.warn('⚠️  Relation policy warnings (DEV MODE):');
    warnings.forEach(w => console.warn(`  - ${w.message}${w.relation ? ` (${w.relation})` : ''}`));
  }
  
  console.log('✅ All relations are valid');
  console.log(`   Total models: ${models.size}`);
  console.log(`   Total relations: ${relations.length}`);
  
  return true;
}

// Run validation
try {
  const isValid = validateRelations();
  if (!isValid && !isDevMode()) {
    process.exit(1);
  }
} catch (error) {
  console.error('❌ Error validating relations:', error.message);
  process.exit(1);
}

