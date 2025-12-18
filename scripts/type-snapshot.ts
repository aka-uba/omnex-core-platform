#!/usr/bin/env tsx
/**
 * Type Snapshot System
 * 
 * Type hatalarının snapshot'ını alır ve regression'ları tespit eder.
 */

import * as fs from 'fs';
import * as path from 'path';
import { execSync } from 'child_process';

interface TypeSnapshot {
  timestamp: string;
  totalErrors: number;
  errorsByCategory: Record<string, number>;
  errorsByFile: Record<string, number>;
  errorDetails: Array<{
    file: string;
    line: number;
    code: string;
    message: string;
  }>;
}

function parseTypeErrors(output: string): TypeSnapshot['errorDetails'] {
  const errors: TypeSnapshot['errorDetails'] = [];
  const lines = output.split('\n');
  
  for (const line of lines) {
    const trimmed = line.trim();
    
    // Skip npm command output lines
    if (trimmed.includes('> omnex-core-platform@') || trimmed.includes('> tsc --noEmit')) continue;
    if (!trimmed || !trimmed.includes('error TS')) continue;
    
    // Parse: file(path,line,col): error TSXXXX: message
    const match = trimmed.match(/^(.+?)\((\d+),(\d+)\):\s+error\s+(TS\d+):\s+(.+?)(?:\s+Type\s+.*)?$/);
    if (!match) {
      // Try without column
      const match2 = trimmed.match(/^(.+?)\((\d+)\):\s+error\s+(TS\d+):\s+(.+)$/);
      if (!match2) continue;
      const [, file, lineStr, code, message] = match2;
      errors.push({
        file: file.trim(),
        line: parseInt(lineStr, 10),
        code,
        message: message.trim(),
      });
      continue;
    }
    
    const [, file, lineStr, , code, message] = match;
    errors.push({
      file: file.trim(),
      line: parseInt(lineStr, 10),
      code,
      message: message.trim(),
    });
  }
  
  return errors;
}

function createSnapshot(): TypeSnapshot {
  console.log('📸 Creating type snapshot...\n');
  
  let output = '';
  try {
    output = execSync('npm run typecheck', { 
      encoding: 'utf-8',
      stdio: 'pipe',
    });
  } catch (error: any) {
    output = error.stdout || error.message || '';
  }
  
  const errorDetails = parseTypeErrors(output);
  
  const errorsByCategory: Record<string, number> = {};
  const errorsByFile: Record<string, number> = {};
  
  for (const error of errorDetails) {
    // Categorize by error code prefix
    const category = error.code.substring(0, 5); // TS237, TS253, etc.
    errorsByCategory[category] = (errorsByCategory[category] || 0) + 1;
    errorsByFile[error.file] = (errorsByFile[error.file] || 0) + 1;
  }
  
  return {
    timestamp: new Date().toISOString(),
    totalErrors: errorDetails.length,
    errorsByCategory,
    errorsByFile,
    errorDetails,
  };
}

function saveSnapshot(snapshot: TypeSnapshot): string {
  const snapshotsDir = path.join(process.cwd(), '.type-snapshots');
  if (!fs.existsSync(snapshotsDir)) {
    fs.mkdirSync(snapshotsDir, { recursive: true });
  }
  
  const filename = `snapshot-${Date.now()}.json`;
  const filepath = path.join(snapshotsDir, filename);
  
  fs.writeFileSync(filepath, JSON.stringify(snapshot, null, 2));
  
  // Also save latest
  const latestPath = path.join(snapshotsDir, 'latest.json');
  fs.writeFileSync(latestPath, JSON.stringify(snapshot, null, 2));
  
  return filepath;
}

function compareSnapshots(current: TypeSnapshot, previous: TypeSnapshot): void {
  console.log('\n📊 Comparing snapshots...\n');
  
  const newErrors = current.errorDetails.filter(
    curr => !previous.errorDetails.some(
      prev => prev.file === curr.file && prev.line === curr.line && prev.code === curr.code
    )
  );
  
  const fixedErrors = previous.errorDetails.filter(
    prev => !current.errorDetails.some(
      curr => curr.file === prev.file && curr.line === prev.line && curr.code === prev.code
    )
  );
  
  console.log(`✅ Fixed: ${fixedErrors.length} errors`);
  console.log(`❌ New: ${newErrors.length} errors`);
  console.log(`📊 Total: ${current.totalErrors} errors (was ${previous.totalErrors})`);
  
  if (newErrors.length > 0) {
    console.log('\n🆕 New Errors:');
    for (const error of newErrors.slice(0, 10)) {
      console.log(`  - ${error.file}:${error.line} - ${error.message}`);
    }
    if (newErrors.length > 10) {
      console.log(`  ... and ${newErrors.length - 10} more`);
    }
  }
  
  if (fixedErrors.length > 0) {
    console.log('\n✅ Fixed Errors:');
    for (const error of fixedErrors.slice(0, 10)) {
      console.log(`  - ${error.file}:${error.line} - ${error.message}`);
    }
    if (fixedErrors.length > 10) {
      console.log(`  ... and ${fixedErrors.length - 10} more`);
    }
  }
}

function main() {
  const command = process.argv[2] || 'create';
  
  if (command === 'create') {
    const snapshot = createSnapshot();
    const filepath = saveSnapshot(snapshot);
    
    console.log(`\n✅ Snapshot saved to: ${filepath}`);
    console.log(`📊 Total errors: ${snapshot.totalErrors}`);
    
    // Check for previous snapshot
    const latestPath = path.join(process.cwd(), '.type-snapshots', 'latest.json');
    if (fs.existsSync(latestPath)) {
      const previous = JSON.parse(fs.readFileSync(latestPath, 'utf-8')) as TypeSnapshot;
      compareSnapshots(snapshot, previous);
    }
  } else if (command === 'compare') {
    const latestPath = path.join(process.cwd(), '.type-snapshots', 'latest.json');
    if (!fs.existsSync(latestPath)) {
      console.log('❌ No previous snapshot found. Run with "create" first.');
      return;
    }
    
    const previous = JSON.parse(fs.readFileSync(latestPath, 'utf-8')) as TypeSnapshot;
    const current = createSnapshot();
    compareSnapshots(current, previous);
  } else {
    console.log('Usage: npm run type:snapshot [create|compare]');
  }
}

main();

