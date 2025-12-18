#!/usr/bin/env node

/**
 * Tenant Bound Validation Script
 * 
 * Validates that all tenant-specific models include:
 * - tenantId field (String, required)
 * - companyId field (String, required)
 * 
 * Exceptions:
 * - Core models: User, Company (these are tenant-bound by design)
 * - Extensions may have different patterns
 */

const fs = require('fs');
const path = require('path');
const { isDevMode, handleValidation } = require('./operational-mode');

const PRISMA_DIR = path.join(__dirname, '../prisma');

// Models that are exempt from tenant/company ID requirements
const EXEMPT_MODELS = new Set(['User', 'Company']);

/**
 * Check if a model has tenantId and companyId fields
 */
function checkTenantBound(modelName, modelBody) {
  if (EXEMPT_MODELS.has(modelName)) {
    return { valid: true, missing: [] };
  }
  
  const hasTenantId = /tenantId\s+String/.test(modelBody);
  const hasCompanyId = /companyId\s+String/.test(modelBody);
  
  const missing = [];
  if (!hasTenantId) missing.push('tenantId');
  if (!hasCompanyId) missing.push('companyId');
  
  return {
    valid: missing.length === 0,
    missing
  };
}

/**
 * Parse and validate all schema files
 */
function validateTenantBound() {
  const errors = [];
  
  // Check core-base (except User, Company)
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
        const check = checkTenantBound(modelName, modelBody);
        
        if (!check.valid) {
          errors.push({
            model: modelName,
            file: `core-base/${file}`,
            missing: check.missing
          });
        }
      }
    }
  }
  
  // Check extensions
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
        const check = checkTenantBound(modelName, modelBody);
        
        if (!check.valid) {
          errors.push({
            model: modelName,
            file: `extensions/${file}`,
            missing: check.missing
          });
        }
      }
    }
  }
  
  // Check modules
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
          const check = checkTenantBound(modelName, modelBody);
          
          if (!check.valid) {
            errors.push({
              model: modelName,
              file: `modules/${moduleDir}/${moduleDir}.prisma`,
              missing: check.missing
            });
          }
        }
      }
    }
  }
  
  // Report errors
  if (errors.length > 0) {
    const message = `Tenant-bound validation failed. ${errors.length} model(s) missing required fields:\n${errors.map(e => `  - ${e.model} (${e.file}): missing ${e.missing.join(', ')}`).join('\n')}`;
    handleValidation(new Error(message), message);
    return false;
  }
  
  console.log('✅ All models are properly tenant-bound');
  return true;
}

// Run validation
try {
  const isValid = validateTenantBound();
  if (!isValid && !isDevMode()) {
    process.exit(1);
  }
} catch (error) {
  console.error('❌ Error validating tenant-bound models:', error.message);
  process.exit(1);
}


















