#!/usr/bin/env tsx

/**
 * Remove unused getServerTranslation imports from API routes
 */

import * as fs from 'fs';
import * as path from 'path';

const SRC_DIR = path.join(__dirname, '..', 'src');
const API_DIR = path.join(SRC_DIR, 'app', 'api');

function getAllApiFiles(dir: string): string[] {
  const files: string[] = [];
  
  function walk(currentDir: string) {
    try {
      const entries = fs.readdirSync(currentDir, { withFileTypes: true });
      
      entries.forEach(entry => {
        const fullPath = path.join(currentDir, entry.name);
        
        if (entry.isDirectory()) {
          walk(fullPath);
        } else if (entry.isFile() && entry.name === 'route.ts') {
          files.push(fullPath);
        }
      });
    } catch (error) {
      // Skip
    }
  }
  
  walk(dir);
  return files;
}

function removeUnusedImport(file: string): boolean {
  try {
    let content = fs.readFileSync(file, 'utf-8');
    const originalContent = content;
    
    // Check if getServerTranslation is imported but not used
    if (content.includes("import { getServerTranslation }")) {
      // Check if it's actually used
      const importMatch = content.match(/import\s*{\s*getServerTranslation\s*}\s*from\s*['"]@\/lib\/i18n\/server['"];?\s*\n/);
      if (importMatch) {
        // Check if getServerTranslation is used in the file
        const usedMatch = content.match(/\bgetServerTranslation\s*\(/);
        if (!usedMatch) {
          // Remove the import line
          content = content.replace(/import\s*{\s*getServerTranslation\s*}\s*from\s*['"]@\/lib\/i18n\/server['"];?\s*\n/g, '');
          fs.writeFileSync(file, content, 'utf-8');
          return true;
        }
      }
    }
    
    return false;
  } catch (error) {
    return false;
  }
}

// Main execution
if (require.main === module) {
  try {
    console.log('🔧 Removing unused getServerTranslation imports...\n');
    
    const files = getAllApiFiles(API_DIR);
    let fixed = 0;
    
    files.forEach((file, index) => {
      if (removeUnusedImport(file)) {
        fixed++;
        if (fixed % 10 === 0) {
          console.log(`  Fixed ${fixed} files...`);
        }
      }
    });
    
    console.log(`\n✅ Removed unused imports from ${fixed} files\n`);
    
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

export { removeUnusedImport };






