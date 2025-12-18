#!/usr/bin/env node

/**
 * Find and fix hardcoded table texts in all components
 * 
 * Fixes:
 * - "Sayfa başına:" → t('table.pagination.recordsPerPage')
 * - "kayıt gösteriliyor" → t('table.pagination.showing')
 * - "İşlemler" → t('table.actions')
 * - Other table-related hardcoded texts
 */

const fs = require('fs');
const path = require('path');

const SRC_DIR = path.join(__dirname, '..', 'src');

// Patterns to find and replace
const HARDCODED_PATTERNS = [
  {
    pattern: /Sayfa başına:/g,
    replacement: "{tGlobal('table.pagination.recordsPerPage')}",
    key: 'table.pagination.recordsPerPage',
  },
  {
    pattern: /kayıt gösteriliyor/g,
    replacement: "{tGlobal('table.pagination.showing')}",
    key: 'table.pagination.showing',
  },
  {
    pattern: /\{startRecord\} - \{endRecord\} \/ \{processedData\.length\} kayıt gösteriliyor/g,
    replacement: "{startRecord} - {endRecord} {tGlobal('table.pagination.of')} {processedData.length} {tGlobal('table.pagination.showing')}",
    key: 'table.pagination.of',
  },
  {
    pattern: /\{startIndex \+ 1\} - \{Math\.min\(startIndex \+ pageSize, filteredReports\.length\)\} \/ \{filteredReports\.length\} kayıt gösteriliyor/g,
    replacement: "{startIndex + 1} - {Math.min(startIndex + pageSize, filteredReports.length)} {tGlobal('table.pagination.of')} {filteredReports.length} {tGlobal('table.pagination.showing')}",
    key: 'table.pagination.of',
  },
  {
    pattern: /label:\s*['"]İşlemler['"]/g,
    replacement: "label: tGlobal('table.actions')",
    key: 'table.actions',
  },
  {
    pattern: /['"]İşlemler['"]/g,
    replacement: "{tGlobal('table.actions')}",
    key: 'table.actions',
  },
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
            entry.name !== '.next' && entry.name !== 'dist') {
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

// Check if file uses translation
function usesTranslation(content) {
  return content.includes('useTranslation') || content.includes('tGlobal') || content.includes("from '@/lib/i18n/client'");
}

// Fix a single file
function fixFile(filePath) {
  try {
    let content = fs.readFileSync(filePath, 'utf8');
    const originalContent = content;
    
    // Skip if not a client component or doesn't use translations
    if (!content.includes("'use client'") && !content.includes('"use client"')) {
      return { fixed: false, reason: 'Not a client component' };
    }
    
    let modified = false;
    const addedKeys = new Set();
    
    // Apply each pattern
    HARDCODED_PATTERNS.forEach(({ pattern, replacement, key }) => {
      if (pattern.test(content)) {
        content = content.replace(pattern, replacement);
        addedKeys.add(key);
        modified = true;
      }
    });
    
    if (modified) {
      // Check if useTranslation is imported
      const hasUseTranslation = content.includes("useTranslation") && 
                                 (content.includes("from '@/lib/i18n/client'") || 
                                  content.includes('from "@/lib/i18n/client"'));
      
      // Check if tGlobal is used
      const usesTGlobal = content.includes('tGlobal(');
      
      if (usesTGlobal && !hasUseTranslation) {
        // Add useTranslation import
        const lines = content.split('\n');
        let lastImportIndex = -1;
        
        for (let i = 0; i < lines.length; i++) {
          if (lines[i].trim().startsWith('import ') && 
              !lines[i].trim().startsWith('import type ') &&
              !lines[i].trim().startsWith('import(')) {
            lastImportIndex = i;
          }
        }
        
        if (lastImportIndex !== -1) {
          // Check if already imported
          const hasI18nImport = content.includes("from '@/lib/i18n/client'") || 
                               content.includes('from "@/lib/i18n/client"');
          
          if (!hasI18nImport) {
            lines.splice(lastImportIndex + 1, 0, "import { useTranslation } from '@/lib/i18n/client';");
            content = lines.join('\n');
          }
        }
      }
      
      // Add tGlobal hook call if needed
      if (usesTGlobal && !content.includes('const { t: tGlobal }')) {
        // Find function component start
        const functionMatch = content.match(/(export\s+(?:function|const)\s+\w+\s*[({][^)]*\)\s*{)/);
        if (functionMatch) {
          const insertIndex = functionMatch.index + functionMatch[0].length;
          const hookCall = `
  const { t: tGlobal } = useTranslation('global');`;
          content = content.slice(0, insertIndex) + hookCall + content.slice(insertIndex);
        }
      }
      
      fs.writeFileSync(filePath, content, 'utf8');
      return { fixed: true, keys: Array.from(addedKeys) };
    }
    
    return { fixed: false, reason: 'No hardcoded texts found' };
  } catch (error) {
    return { fixed: false, reason: `Error: ${error.message}` };
  }
}

// Main execution
console.log('🔍 Scanning for hardcoded table texts...\n');

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
    results.fixed.push({ file: relativePath, keys: result.keys });
    console.log(`✅ Fixed: ${relativePath} (${result.keys.join(', ')})`);
  } else if (result.reason?.includes('Error')) {
    results.errors.push({ file: relativePath, reason: result.reason });
  }
});

console.log('\n' + '='.repeat(80));
console.log('📊 SUMMARY\n');
console.log(`✅ Fixed: ${results.fixed.length} files`);
console.log(`⏭️  Skipped: ${results.skipped.length} files`);
console.log(`❌ Errors: ${results.errors.length} files\n`);

if (results.fixed.length > 0) {
  console.log('Fixed files:');
  results.fixed.forEach(({ file, keys }) => {
    console.log(`  - ${file}`);
    console.log(`    Keys: ${keys.join(', ')}`);
  });
}

console.log('\n✅ Done!');







