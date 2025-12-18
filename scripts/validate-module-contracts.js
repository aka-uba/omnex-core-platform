#!/usr/bin/env node

/**
 * Module Contracts Validation Script
 * 
 * Validates that module contract documentation is updated when module schemas change.
 * 
 * Checks:
 * - If prisma/modules/{module-slug}/ changed
 * - Then prisma/docs/module-contracts/{module-slug}.md must be updated
 * 
 * Mode-aware:
 * - DEV MODE: Warning only
 * - GUARDED MODE: Block if contract not updated
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const { isDevMode, handleValidation } = require('./operational-mode');

const PRISMA_DIR = path.join(__dirname, '../prisma');
const DOCS_DIR = path.join(__dirname, '../prisma/docs/module-contracts');

/**
 * Get changed module files from git
 */
function getChangedModules() {
  try {
    // Check if we're in a git repository
    try {
      execSync('git rev-parse --git-dir', { stdio: 'ignore' });
    } catch {
      // Not a git repo, skip validation
      return [];
    }
    
    // Get staged and unstaged changes
    const staged = execSync('git diff --cached --name-only', { encoding: 'utf8' })
      .split('\n')
      .filter(Boolean);
    
    const unstaged = execSync('git diff --name-only', { encoding: 'utf8' })
      .split('\n')
      .filter(Boolean);
    
    const allChanged = [...new Set([...staged, ...unstaged])];
    
    // Filter for module schema files
    const moduleChanges = allChanged.filter(file => 
      file.match(/^prisma\/modules\/([^\/]+)\/.+\.prisma$/)
    );
    
    // Extract module slugs
    const modules = new Set();
    for (const file of moduleChanges) {
      const match = file.match(/^prisma\/modules\/([^\/]+)\//);
      if (match) {
        modules.add(match[1]);
      }
    }
    
    return Array.from(modules);
  } catch (error) {
    // If git command fails, assume no changes (safe fallback)
    return [];
  }
}

/**
 * Check if contract file exists and was recently updated
 */
function checkContractFile(moduleSlug) {
  const contractFile = path.join(DOCS_DIR, `${moduleSlug}.md`);
  
  if (!fs.existsSync(contractFile)) {
    return {
      exists: false,
      updated: false,
      message: `Contract file missing: prisma/docs/module-contracts/${moduleSlug}.md`
    };
  }
  
  // Check if contract file was also changed
  try {
    const staged = execSync('git diff --cached --name-only', { encoding: 'utf8' })
      .split('\n')
      .filter(Boolean);
    
    const unstaged = execSync('git diff --name-only', { encoding: 'utf8' })
      .split('\n')
      .filter(Boolean);
    
    const allChanged = [...new Set([...staged, ...unstaged])];
    const contractChanged = allChanged.includes(`prisma/docs/module-contracts/${moduleSlug}.md`);
    
    return {
      exists: true,
      updated: contractChanged,
      message: contractChanged 
        ? `Contract file updated: prisma/docs/module-contracts/${moduleSlug}.md`
        : `Contract file not updated: prisma/docs/module-contracts/${moduleSlug}.md`
    };
  } catch {
    // If git check fails, assume file exists (safe fallback)
    return {
      exists: true,
      updated: true,
      message: `Contract file exists: prisma/docs/module-contracts/${moduleSlug}.md`
    };
  }
}

/**
 * Validate module contracts
 */
function validateModuleContracts() {
  const changedModules = getChangedModules();
  
  if (changedModules.length === 0) {
    console.log('✅ No module schema changes detected');
    return true;
  }
  
  console.log(`🔍 Found ${changedModules.length} module(s) with schema changes:`);
  changedModules.forEach(m => console.log(`   - ${m}`));
  
  const violations = [];
  
  for (const moduleSlug of changedModules) {
    const check = checkContractFile(moduleSlug);
    
    if (!check.exists || !check.updated) {
      violations.push({
        module: moduleSlug,
        ...check
      });
    }
  }
  
  if (violations.length > 0) {
    const message = `Module contract documentation not updated:\n${violations.map(v => `  - ${v.module}: ${v.message}`).join('\n')}\n\nPlease update prisma/docs/module-contracts/{module-slug}.md when module schemas change.`;
    handleValidation(new Error(message), message);
    return false;
  }
  
  console.log('✅ All module contracts are up to date');
  return true;
}

// Run validation
try {
  // Create docs/module-contracts directory if it doesn't exist
  if (!fs.existsSync(DOCS_DIR)) {
    fs.mkdirSync(DOCS_DIR, { recursive: true });
  }
  
  const isValid = validateModuleContracts();
  if (!isValid && !isDevMode()) {
    process.exit(1);
  }
} catch (error) {
  console.error('❌ Error validating module contracts:', error.message);
  process.exit(1);
}

