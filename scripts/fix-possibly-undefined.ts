#!/usr/bin/env tsx
/**
 * Güvenli Possibly Undefined Düzeltmeleri
 * Optional chaining ve null checks ekler
 */

import * as fs from 'fs';
import * as path from 'path';
import { execSync } from 'child_process';

interface PossiblyUndefinedError {
  file: string;
  line: number;
  column: number;
  message: string;
}

function getPossiblyUndefinedErrors(): PossiblyUndefinedError[] {
  console.log('🔍 Possibly undefined hataları tespit ediliyor...\n');
  
  let output = '';
  try {
    output = execSync('npm run typecheck', { 
      encoding: 'utf-8',
      stdio: 'pipe',
    });
  } catch (error: any) {
    output = (error.stdout || error.stderr || error.message || '').toString();
  }
  
  const errors: PossiblyUndefinedError[] = [];
  const lines = output.split('\n');
  
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed.includes('error TS2532') && 
        !trimmed.includes('error TS18048') && 
        !trimmed.includes('error TS2538')) continue;
    if (trimmed.includes('> omnex-core-platform@') || trimmed.includes('> tsc')) continue;
    
    // Parse: file(line,col): error TSXXXX: message
    const match = trimmed.match(/^(.+?)\((\d+),(\d+)\):\s+error\s+(TS2532|TS18048|TS2538):\s+(.+)$/);
    if (!match) continue;
    
    const [, file, lineStr, colStr, , message] = match;
    
    // Sadece src/ klasöründeki dosyaları işle
    if (!file.includes('src/') || file.includes('backups/')) continue;
    
    errors.push({
      file: file.trim(),
      line: parseInt(lineStr, 10),
      column: parseInt(colStr, 10),
      message: message.trim(),
    });
  }
  
  return errors;
}

function fixPossiblyUndefined(filePath: string, lineNum: number, colNum: number, message: string): boolean {
  if (!fs.existsSync(filePath)) return false;
  
  const content = fs.readFileSync(filePath, 'utf-8');
  const lines = content.split('\n');
  
  if (lineNum < 1 || lineNum > lines.length) return false;
  
  const line = lines[lineNum - 1];
  const originalLine = line;
  
  // TS2532: Object is possibly 'undefined'
  // TS18048: 'property' is possibly 'undefined'
  // TS2538: Type 'undefined' cannot be used as an index type
  
  // Pattern 1: obj.property -> obj?.property
  if (message.includes('is possibly \'undefined\'') || message.includes('Object is possibly \'undefined\'')) {
    // Basit property access: obj.property
    const propertyAccessMatch = line.substring(colNum - 1).match(/^(\w+)\.(\w+)/);
    if (propertyAccessMatch) {
      const objName = propertyAccessMatch[1];
      const propName = propertyAccessMatch[2];
      const before = line.substring(0, colNum - 1);
      const after = line.substring(colNum - 1 + propertyAccessMatch[0].length);
      lines[lineNum - 1] = before + `${objName}?.${propName}` + after;
    } 
    // Nested property: obj.prop1.prop2 -> obj?.prop1?.prop2
    else {
      const nestedMatch = line.substring(colNum - 1).match(/^(\w+)(\.\w+)+/);
      if (nestedMatch) {
        const expr = nestedMatch[0];
        const before = line.substring(0, colNum - 1);
        const after = line.substring(colNum - 1 + expr.length);
        // Tüm . karakterlerini ?. ile değiştir
        const fixed = expr.replace(/\./g, '?.');
        lines[lineNum - 1] = before + fixed + after;
      }
      // Array access: arr[index]
      else {
        const arrayAccessMatch = line.substring(colNum - 1).match(/^(\w+)\[([^\]]+)\]/);
        if (arrayAccessMatch) {
          const arrName = arrayAccessMatch[1];
          const index = arrayAccessMatch[2];
          const before = line.substring(0, colNum - 1);
          const after = line.substring(colNum - 1 + arrayAccessMatch[0].length);
          lines[lineNum - 1] = before + `${arrName}?.[${index}]` + after;
        } 
        // Method call: obj.method() -> obj?.method()
        else {
          const methodMatch = line.substring(colNum - 1).match(/^(\w+)\.(\w+)\s*\(/);
          if (methodMatch) {
            const objName = methodMatch[1];
            const methodName = methodMatch[2];
            const before = line.substring(0, colNum - 1);
            const after = line.substring(colNum - 1 + methodMatch[0].length - 1); // -1 for '('
            lines[lineNum - 1] = before + `${objName}?.${methodName}(` + after;
          } else {
            return false;
          }
        }
      }
    }
  }
  
  // Pattern 2: undefined as index
  if (message.includes('cannot be used as an index type')) {
    // arr[undefined] -> arr[undefined ?? ''] veya arr?.[index]
    const indexMatch = line.substring(colNum - 1).match(/\[([^\]]+)\]/);
    if (indexMatch && indexMatch[1].includes('undefined')) {
      const before = line.substring(0, colNum - 1);
      const indexExpr = indexMatch[1];
      const after = line.substring(colNum - 1 + indexMatch[0].length);
      // undefined -> (undefined ?? '')
      const fixedIndex = indexExpr.replace(/\bundefined\b/g, '(undefined ?? \'\')');
      lines[lineNum - 1] = before + `[${fixedIndex}]` + after;
    } else {
      return false;
    }
  }
  
  if (lines[lineNum - 1] !== originalLine) {
    fs.writeFileSync(filePath, lines.join('\n'), 'utf-8');
    return true;
  }
  
  return false;
}

function main() {
  console.log('🔧 Possibly undefined hataları düzeltiliyor...\n');
  
  const errors = getPossiblyUndefinedErrors();
  console.log(`📊 ${errors.length} possibly undefined hatası bulundu\n`);
  
  // Dosyaya göre grupla
  const byFile = new Map<string, PossiblyUndefinedError[]>();
  for (const error of errors) {
    if (!byFile.has(error.file)) {
      byFile.set(error.file, []);
    }
    byFile.get(error.file)!.push(error);
  }
  
  let fixed = 0;
  let skipped = 0;
  
  // Her dosyayı işle (satır numaralarına göre ters sırada)
  for (const [file, fileErrors] of byFile.entries()) {
    const filePath = path.join(process.cwd(), file);
    
    // Satır numaralarına göre sırala (büyükten küçüğe)
    fileErrors.sort((a, b) => b.line - a.line);
    
    for (const error of fileErrors) {
      if (fixPossiblyUndefined(filePath, error.line, error.column, error.message)) {
        fixed++;
        if (fixed % 10 === 0) {
          console.log(`✅ ${fixed} hata düzeltildi...`);
        }
      } else {
        skipped++;
      }
    }
  }
  
  console.log(`\n📊 Özet:`);
  console.log(`  ✅ Düzeltildi: ${fixed}`);
  console.log(`  ⚠️  Atlandı: ${skipped}`);
  console.log(`  📁 Dosya sayısı: ${byFile.size}`);
  
  if (fixed > 0) {
    console.log(`\n💡 Tip: 'npm run typecheck' çalıştırarak kalan hataları kontrol edin`);
  }
}

main();

