#!/usr/bin/env tsx
/**
 * Type Error Analyzer
 * 
 * Analiz eder ve kategorize eder:
 * - Unused imports/variables
 * - exactOptionalPropertyTypes hataları
 * - Possibly undefined hataları
 * - Type assignment hataları
 * - Return type eksiklikleri
 */

import { execSync } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';

interface TypeError {
  file: string;
  line: number;
  column: number;
  code: string;
  message: string;
  category: string;
  autoFixable: boolean;
  priority: 'high' | 'medium' | 'low';
}

const ERROR_CATEGORIES = {
  UNUSED: {
    codes: ['TS6133', 'TS6192'],
    name: 'Unused Imports/Variables',
    autoFixable: true,
    priority: 'low' as const,
  },
  EXACT_OPTIONAL: {
    codes: ['TS2375', 'TS2379'],
    name: 'exactOptionalPropertyTypes',
    autoFixable: false,
    priority: 'high' as const,
  },
  POSSIBLY_UNDEFINED: {
    codes: ['TS2532', 'TS18048', 'TS2538'],
    name: 'Possibly Undefined',
    autoFixable: true,
    priority: 'high' as const,
  },
  TYPE_ASSIGNMENT: {
    codes: ['TS2322', 'TS2345'],
    name: 'Type Assignment',
    autoFixable: false,
    priority: 'high' as const,
  },
  RETURN_TYPE: {
    codes: ['TS7030'],
    name: 'Return Type Missing',
    autoFixable: false,
    priority: 'medium' as const,
  },
};

function categorizeError(code: string, message: string): typeof ERROR_CATEGORIES[keyof typeof ERROR_CATEGORIES] | null {
  for (const category of Object.values(ERROR_CATEGORIES)) {
    if (category.codes.includes(code)) {
      return category;
    }
  }
  return null;
}

function parseTypeErrors(output: string): TypeError[] {
  const lines = output.split('\n');
  const errors: TypeError[] = [];
  
  for (const line of lines) {
    const trimmed = line.trim();
    
    // Skip npm command output lines
    if (trimmed.includes('> omnex-core-platform@') || trimmed.includes('> tsc --noEmit')) continue;
    if (!trimmed || !trimmed.includes('error TS')) continue;
    
    // Parse: file(path,line,col): error TSXXXX: message
    // Format: path/to/file.ts(line,col): error TSXXXX: message
    // Example: src/app/page.tsx(10,5): error TS2322: Type 'string' is not assignable
    // Use more flexible regex that handles trailing spaces
    const match = trimmed.match(/^(.+?)\((\d+),(\d+)\):\s+error\s+(TS\d+):\s+(.+?)(?:\s+Type\s+.*)?$/);
    if (!match) {
      // Try without column (some errors might not have column)
      const match2 = trimmed.match(/^(.+?)\((\d+)\):\s+error\s+(TS\d+):\s+(.+)$/);
      if (!match2) {
        continue;
      }
      const [, file, lineStr, code, message] = match2;
      const lineNum = parseInt(lineStr, 10);
      
      const category = categorizeError(code, message);
      if (!category) continue;
      
      errors.push({
        file: file.trim(),
        line: lineNum,
        column: 0,
        code,
        message: message.trim(),
        category: category.name,
        autoFixable: category.autoFixable,
        priority: category.priority,
      });
      continue;
    }
    
    const [, file, lineStr, colStr, code, message] = match;
    const lineNum = parseInt(lineStr, 10);
    const colNum = parseInt(colStr, 10);
    
    const category = categorizeError(code, message);
    if (!category) continue;
    
    errors.push({
      file: file.trim(),
      line: lineNum,
      column: colNum,
      code,
      message: message.trim(),
      category: category.name,
      autoFixable: category.autoFixable,
      priority: category.priority,
    });
  }
  
  return errors;
}

function generateReport(errors: TypeError[]): void {
  const report: string[] = [];
  
  report.push('# Type Error Analysis Report\n');
  report.push(`**Total Errors:** ${errors.length}\n`);
  report.push(`**Generated:** ${new Date().toISOString()}\n\n`);
  
  // Group by category
  const byCategory = new Map<string, TypeError[]>();
  for (const error of errors) {
    if (!byCategory.has(error.category)) {
      byCategory.set(error.category, []);
    }
    byCategory.get(error.category)!.push(error);
  }
  
  report.push('## Error Categories\n\n');
  for (const [category, categoryErrors] of byCategory.entries()) {
    const autoFixable = categoryErrors.filter(e => e.autoFixable).length;
    report.push(`### ${category} (${categoryErrors.length} errors)\n`);
    report.push(`- Auto-fixable: ${autoFixable}\n`);
    report.push(`- Manual fix required: ${categoryErrors.length - autoFixable}\n\n`);
    
    // Show first 10 errors
    const samples = categoryErrors.slice(0, 10);
    report.push('**Sample Errors:**\n');
    for (const error of samples) {
      report.push(`- \`${error.file}:${error.line}\` - ${error.message}\n`);
    }
    if (categoryErrors.length > 10) {
      report.push(`- ... and ${categoryErrors.length - 10} more\n`);
    }
    report.push('\n');
  }
  
  // Priority breakdown
  report.push('## Priority Breakdown\n\n');
  const byPriority = new Map<'high' | 'medium' | 'low', TypeError[]>();
  for (const error of errors) {
    if (!byPriority.has(error.priority)) {
      byPriority.set(error.priority, []);
    }
    byPriority.get(error.priority)!.push(error);
  }
  
  for (const [priority, priorityErrors] of byPriority.entries()) {
    report.push(`### ${priority.toUpperCase()} Priority: ${priorityErrors.length} errors\n\n`);
  }
  
  // Auto-fixable summary
  const autoFixable = errors.filter(e => e.autoFixable);
  report.push(`## Auto-Fixable Errors: ${autoFixable.length}\n\n`);
  if (autoFixable.length > 0) {
    report.push('Run `npm run type:fix:auto` to automatically fix these.\n\n');
  }
  
  // Save report
  const reportPath = path.join(process.cwd(), 'type-errors-report.md');
  fs.writeFileSync(reportPath, report.join(''));
  console.log(`✅ Report saved to: ${reportPath}`);
}

function main() {
  console.log('🔍 Running TypeScript type check...\n');
  
  let output = '';
  try {
    // Run typecheck and capture both stdout and stderr
    output = execSync('npm run typecheck', { 
      encoding: 'utf-8',
      stdio: ['pipe', 'pipe', 'pipe'],
    });
  } catch (error: any) {
    // execSync throws on non-zero exit, but we want the output
    // TypeScript errors go to stdout, not stderr
    output = (error.stdout || error.stderr || error.message || '').toString();
  }
  
  // Check if there are any errors in the output
  if (!output || !output.includes('error TS')) {
    console.log('✅ No type errors found!');
    return;
  }
  
  console.log('📊 Analyzing errors...\n');
  const errors = parseTypeErrors(output);
  
  if (errors.length === 0) {
    console.log('⚠️  Found error output but couldn\'t parse errors. Raw output:');
    console.log(output.split('\n').slice(0, 20).join('\n'));
    return;
  }
  
  console.log(`Found ${errors.length} type errors\n`);
  console.log('Categorizing...\n');
  
  generateReport(errors);
  
  // Print summary
  const byCategory = new Map<string, TypeError[]>();
  for (const error of errors) {
    if (!byCategory.has(error.category)) {
      byCategory.set(error.category, []);
    }
    byCategory.get(error.category)!.push(error);
  }
  
  console.log('\n📋 Summary:');
  for (const [category, categoryErrors] of byCategory.entries()) {
    const autoFixable = categoryErrors.filter(e => e.autoFixable).length;
    console.log(`  ${category}: ${categoryErrors.length} (${autoFixable} auto-fixable)`);
  }
  
  const autoFixable = errors.filter(e => e.autoFixable).length;
  if (autoFixable > 0) {
    console.log(`\n💡 Tip: Run 'npm run type:fix:auto' to fix ${autoFixable} errors automatically`);
  }
}

main();

