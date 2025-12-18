#!/usr/bin/env tsx
/**
 * Type-Break Risk Scanner
 * 
 * Projeyi tarar ve potansiyel type-break risklerini tespit eder:
 * - Eksik type annotations
 * - any kullanımları
 * - Type assertions
 * - Missing return types
 * - Unsafe type operations
 */

import * as fs from 'fs';
import * as path from 'path';

interface Risk {
  file: string;
  line: number;
  type: 'any-usage' | 'type-assertion' | 'missing-return-type' | 'unsafe-operation';
  severity: 'high' | 'medium' | 'low';
  description: string;
  suggestion: string;
}

function scanFile(filePath: string): Risk[] {
  const risks: Risk[] = [];
  
  if (!fs.existsSync(filePath)) return risks;
  
  const content = fs.readFileSync(filePath, 'utf-8');
  const lines = content.split('\n');
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const lineNum = i + 1;
    
    // Check for 'any' usage
    if (line.includes(': any') || line.includes('<any>') || line.includes('any[]')) {
      risks.push({
        file: filePath,
        line: lineNum,
        type: 'any-usage',
        severity: 'high',
        description: 'Usage of `any` type',
        suggestion: 'Replace with specific type or `unknown`',
      });
    }
    
    // Check for type assertions
    if (line.includes(' as ') && (line.includes(' as any') || line.includes(' as unknown'))) {
      risks.push({
        file: filePath,
        line: lineNum,
        type: 'type-assertion',
        severity: 'medium',
        description: 'Unsafe type assertion',
        suggestion: 'Use type guards or proper type narrowing',
      });
    }
    
    // Check for missing return types in function declarations
    if (line.match(/^\s*(export\s+)?(async\s+)?function\s+\w+\([^)]*\)\s*[:{]/) && !line.includes(':')) {
      risks.push({
        file: filePath,
        line: lineNum,
        type: 'missing-return-type',
        severity: 'medium',
        description: 'Function missing explicit return type',
        suggestion: 'Add explicit return type annotation',
      });
    }
    
    // Check for unsafe operations
    if (line.includes('!') && (line.includes('!.') || line.includes('!['))) {
      risks.push({
        file: filePath,
        line: lineNum,
        type: 'unsafe-operation',
        severity: 'high',
        description: 'Non-null assertion operator',
        suggestion: 'Use optional chaining or null checks',
      });
    }
  }
  
  return risks;
}

function scanDirectory(dir: string, risks: Risk[] = []): Risk[] {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    
    // Skip node_modules, .next, etc.
    if (entry.name.startsWith('.') || 
        entry.name === 'node_modules' || 
        entry.name === '.next' ||
        entry.name === 'yedek' ||
        entry.name === 'backups') {
      continue;
    }
    
    if (entry.isDirectory()) {
      scanDirectory(fullPath, risks);
    } else if (entry.isFile() && (entry.name.endsWith('.ts') || entry.name.endsWith('.tsx'))) {
      const fileRisks = scanFile(fullPath);
      risks.push(...fileRisks);
    }
  }
  
  return risks;
}

function generateReport(risks: Risk[]): void {
  const report: string[] = [];
  
  report.push('# Type-Break Risk Scan Report\n');
  report.push(`**Total Risks:** ${risks.length}\n`);
  report.push(`**Generated:** ${new Date().toISOString()}\n\n`);
  
  // Group by type
  const byType = new Map<string, Risk[]>();
  for (const risk of risks) {
    if (!byType.has(risk.type)) {
      byType.set(risk.type, []);
    }
    byType.get(risk.type)!.push(risk);
  }
  
  report.push('## Risk Categories\n\n');
  for (const [type, typeRisks] of byType.entries()) {
    const high = typeRisks.filter(r => r.severity === 'high').length;
    report.push(`### ${type} (${typeRisks.length} risks)\n`);
    report.push(`- High severity: ${high}\n`);
    report.push(`- Medium severity: ${typeRisks.filter(r => r.severity === 'medium').length}\n`);
    report.push(`- Low severity: ${typeRisks.filter(r => r.severity === 'low').length}\n\n`);
    
    // Show first 10 risks
    const samples = typeRisks.slice(0, 10);
    report.push('**Sample Risks:**\n');
    for (const risk of samples) {
      report.push(`- \`${risk.file}:${risk.line}\` (${risk.severity}) - ${risk.description}\n`);
      report.push(`  - Suggestion: ${risk.suggestion}\n`);
    }
    if (typeRisks.length > 10) {
      report.push(`- ... and ${typeRisks.length - 10} more\n`);
    }
    report.push('\n');
  }
  
  // Save report
  const reportPath = path.join(process.cwd(), 'type-risks-report.md');
  fs.writeFileSync(reportPath, report.join(''));
  console.log(`✅ Report saved to: ${reportPath}`);
}

function main() {
  console.log('🔍 Scanning for type-break risks...\n');
  
  const srcDir = path.join(process.cwd(), 'src');
  if (!fs.existsSync(srcDir)) {
    console.log('❌ src directory not found');
    return;
  }
  
  console.log('Scanning src directory...\n');
  const risks = scanDirectory(srcDir);
  
  console.log(`Found ${risks.length} potential risks\n`);
  
  // Group by severity
  const bySeverity = new Map<'high' | 'medium' | 'low', Risk[]>();
  for (const risk of risks) {
    if (!bySeverity.has(risk.severity)) {
      bySeverity.set(risk.severity, []);
    }
    bySeverity.get(risk.severity)!.push(risk);
  }
  
  console.log('📊 Summary:');
  console.log(`  High: ${bySeverity.get('high')?.length || 0}`);
  console.log(`  Medium: ${bySeverity.get('medium')?.length || 0}`);
  console.log(`  Low: ${bySeverity.get('low')?.length || 0}`);
  
  generateReport(risks);
}

main();









