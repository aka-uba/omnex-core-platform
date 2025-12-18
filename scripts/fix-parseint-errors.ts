#!/usr/bin/env tsx

/**
 * Fix parseInt errors in API routes
 * Adds default values to prevent NaN errors in Prisma queries
 */

import * as fs from 'fs';
import * as path from 'path';
import { glob } from 'glob';

const SRC_DIR = path.join(__dirname, '..', 'src');

interface Fix {
  file: string;
  line: number;
  oldText: string;
  newText: string;
}

// Fix parseInt calls in a file
function fixParseInt(filePath: string): Fix[] {
  const fixes: Fix[] = [];
  
  try {
    let content = fs.readFileSync(filePath, 'utf-8');
    const originalContent = content;
    const lines = content.split('\n');
    
    // Pattern 1: parseInt(searchParams.get('page'))
    // Pattern 2: parseInt(searchParams.get('pageSize'))
    // Pattern 3: parseInt(searchParams.get('limit'))
    // Pattern 4: parseInt(searchParams.get('size'))
    // Pattern 5: parseInt(searchParams.get('daysAhead'))
    
    const patterns = [
      {
        regex: /parseInt\(searchParams\.get\(['"]page['"]\)\)/g,
        default: '1',
        replacement: (match: string) => `parseInt(searchParams.get('page') || '1', 10) || 1`,
      },
      {
        regex: /parseInt\(searchParams\.get\(['"]pageSize['"]\)\)/g,
        default: '10',
        replacement: (match: string) => `parseInt(searchParams.get('pageSize') || '10', 10) || 10`,
      },
      {
        regex: /parseInt\(searchParams\.get\(['"]limit['"]\)(?:,\s*10)?\)/g,
        default: '10',
        replacement: (match: string) => {
          if (match.includes(', 10')) {
            return `parseInt(searchParams.get('limit') || '10', 10) || 10`;
          }
          return `parseInt(searchParams.get('limit') || '10', 10) || 10`;
        },
      },
      {
        regex: /parseInt\(searchParams\.get\(['"]size['"]\)\)/g,
        default: '100',
        replacement: (match: string) => `parseInt(searchParams.get('size') || '100', 10) || 100`,
      },
      {
        regex: /parseInt\(searchParams\.get\(['"]daysAhead['"]\)(?:,\s*10)?\)/g,
        default: '30',
        replacement: (match: string) => {
          if (match.includes(', 10')) {
            return `parseInt(searchParams.get('daysAhead') || '30', 10) || 30`;
          }
          return `parseInt(searchParams.get('daysAhead') || '30', 10) || 30`;
        },
      },
    ];
    
    let hasChanges = false;
    
    patterns.forEach(pattern => {
      content = content.replace(pattern.regex, (match) => {
        hasChanges = true;
        return pattern.replacement(match);
      });
    });
    
    // Track fixes
    if (hasChanges) {
      const newLines = content.split('\n');
      newLines.forEach((newLine, index) => {
        const oldLine = lines[index];
        if (oldLine && newLine !== oldLine) {
          fixes.push({
            file: path.relative(SRC_DIR, filePath),
            line: index + 1,
            oldText: oldLine.trim().substring(0, 100),
            newText: newLine.trim().substring(0, 100),
          });
        }
      });
      
      // Write the updated content
      fs.writeFileSync(filePath, content, 'utf-8');
    }
  } catch (error) {
    console.warn(`⚠️  Could not process ${filePath}: ${error}`);
  }
  
  return fixes;
}

// Main execution
if (require.main === module) {
  (async () => {
    try {
      console.log('🔍 Fixing parseInt errors in API routes...\n');
      
      const allFixes: Fix[] = [];
      
      // Find all API route files
      const files = await glob('**/api/**/route.ts', {
        cwd: SRC_DIR,
        ignore: ['**/node_modules/**', '**/.next/**', '**/dist/**', '**/build/**', '**/*.d.ts'],
        absolute: true,
      });
      
      console.log(`📁 Found ${files.length} API route files to process\n`);
      
      // Process each file
      files.forEach((file, index) => {
        const fixes = fixParseInt(file);
        if (fixes.length > 0) {
          allFixes.push(...fixes);
          const relativePath = path.relative(SRC_DIR, file);
          console.log(`  ✅ ${relativePath}: ${fixes.length} fixes applied`);
        }
        
        if ((index + 1) % 20 === 0) {
          console.log(`  Processed ${index + 1}/${files.length} files...`);
        }
      });
      
      console.log('\n📊 Summary:');
      console.log(`  Total files processed: ${files.length}`);
      console.log(`  Files with fixes: ${new Set(allFixes.map(f => f.file)).size}`);
      console.log(`  Total fixes applied: ${allFixes.length}`);
      console.log(`\n✅ All parseInt errors fixed!\n`);
      
    } catch (error) {
      console.error('❌ Error:', error);
      process.exit(1);
    }
  })();
}

export { fixParseInt };






