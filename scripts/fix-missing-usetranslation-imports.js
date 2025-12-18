#!/usr/bin/env node

/**
 * Find and fix missing useTranslation imports
 * 
 * Scans all component files and adds useTranslation import if:
 * 1. File uses t() or tGlobal() function calls
 * 2. File doesn't have useTranslation import
 * 3. File is a client component ('use client')
 */

const fs = require('fs');
const path = require('path');

const SRC_DIR = path.join(__dirname, '..', 'src');
const I18N_IMPORT = "import { useTranslation } from '@/lib/i18n/client';";
const USE_TRANSLATION_PATTERN = /useTranslation\s*\(/;
const T_FUNCTION_PATTERNS = [
  /t\(['"`]/,
  /tGlobal\(['"`]/,
  /t\s*\(/,
  /tGlobal\s*\(/,
  /\.t\(/,
  /\.tGlobal\(/,
];

// Get all TypeScript/TSX files
function getAllCodeFiles(dir) {
  const files = [];
  const extensions = ['.tsx', '.ts'];
  
  function walk(currentDir) {
    try {
      const entries = fs.readdirSync(currentDir, { withFileTypes: true });
      
      entries.forEach(entry => {
        const fullPath = path.join(currentDir, entry.name);
        
        if (entry.isDirectory() && !entry.name.startsWith('.') && 
            entry.name !== 'node_modules' && entry.name !== 'yedek' &&
            entry.name !== '.next' && entry.name !== 'dist' &&
            entry.name !== 'types' && entry.name !== '__tests__') {
          walk(fullPath);
        } else if (entry.isFile() && extensions.some(ext => entry.name.endsWith(ext))) {
          files.push(fullPath);
        }
      });
    } catch (error) {
      // Skip inaccessible directories
    }
  }
  
  walk(dir);
  return files;
}

// Check if file uses translation functions
function usesTranslation(content) {
  // Check if any translation pattern exists
  return T_FUNCTION_PATTERNS.some(pattern => pattern.test(content));
}

// Check if file already has useTranslation import
function hasUseTranslationImport(content) {
  return content.includes("useTranslation") && 
         (content.includes("from '@/lib/i18n/client'") || 
          content.includes('from "@/lib/i18n/client"') ||
          content.includes("from '@/lib/i18n/client'") ||
          content.includes('from "@/lib/i18n/client"'));
}

// Check if file is a client component
function isClientComponent(content) {
  return content.includes("'use client'") || content.includes('"use client"');
}

// Find the best place to insert the import
function findImportInsertionPoint(content) {
  const lines = content.split('\n');
  
  // Find the last import statement
  let lastImportIndex = -1;
  for (let i = 0; i < lines.length; i++) {
    if (lines[i].trim().startsWith('import ') && 
        !lines[i].trim().startsWith('import type ') &&
        !lines[i].trim().startsWith('import(')) {
      lastImportIndex = i;
    }
  }
  
  return lastImportIndex;
}

// Fix a single file
function fixFile(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    
    // Skip if not a client component
    if (!isClientComponent(content)) {
      return { fixed: false, reason: 'Not a client component' };
    }
    
    // Skip if already has useTranslation import
    if (hasUseTranslationImport(content)) {
      return { fixed: false, reason: 'Already has useTranslation import' };
    }
    
    // Skip if doesn't use translation functions
    if (!usesTranslation(content)) {
      return { fixed: false, reason: 'Does not use translation functions' };
    }
    
    // Check if useTranslation hook is actually used (not just t() calls)
    if (!USE_TRANSLATION_PATTERN.test(content)) {
      // File uses t() but doesn't call useTranslation hook
      // This might be intentional (using t from props), so we'll add it
    }
    
    // Find insertion point
    const lines = content.split('\n');
    const lastImportIndex = findImportInsertionPoint(content);
    
    if (lastImportIndex === -1) {
      // No imports found, add at the beginning (after 'use client')
      const useClientIndex = lines.findIndex(line => 
        line.includes("'use client'") || line.includes('"use client"')
      );
      
      if (useClientIndex !== -1) {
        lines.splice(useClientIndex + 1, 0, '', I18N_IMPORT);
      } else {
        lines.unshift(I18N_IMPORT, '');
      }
    } else {
      // Insert after last import
      lines.splice(lastImportIndex + 1, 0, I18N_IMPORT);
    }
    
    const newContent = lines.join('\n');
    fs.writeFileSync(filePath, newContent, 'utf8');
    
    return { fixed: true, reason: 'Added useTranslation import' };
  } catch (error) {
    return { fixed: false, reason: `Error: ${error.message}` };
  }
}

// Main execution
console.log('🔍 Scanning for missing useTranslation imports...\n');

const files = getAllCodeFiles(SRC_DIR);
console.log(`📁 Found ${files.length} files to check\n`);

const results = {
  fixed: [],
  skipped: [],
  errors: [],
};

files.forEach(file => {
  const relativePath = path.relative(SRC_DIR, file);
  const result = fixFile(file);
  
  if (result.fixed) {
    results.fixed.push(relativePath);
    console.log(`✅ Fixed: ${relativePath}`);
  } else if (result.reason?.includes('Error')) {
    results.errors.push({ file: relativePath, reason: result.reason });
  } else {
    results.skipped.push({ file: relativePath, reason: result.reason });
  }
});

console.log('\n' + '='.repeat(80));
console.log('📊 SUMMARY\n');
console.log(`✅ Fixed: ${results.fixed.length} files`);
console.log(`⏭️  Skipped: ${results.skipped.length} files`);
console.log(`❌ Errors: ${results.errors.length} files\n`);

if (results.fixed.length > 0) {
  console.log('Fixed files:');
  results.fixed.forEach(file => console.log(`  - ${file}`));
}

if (results.errors.length > 0) {
  console.log('\nErrors:');
  results.errors.forEach(({ file, reason }) => console.log(`  - ${file}: ${reason}`));
}

console.log('\n✅ Done!');







