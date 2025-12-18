#!/usr/bin/env tsx
/**
 * Return Type Missing Düzeltmeleri
 * Eksik return type'ları ekler
 */

import * as fs from 'fs';
import * as path from 'path';
import { execSync } from 'child_process';

interface ReturnTypeError {
  file: string;
  line: number;
  message: string;
}

function getReturnTypeErrors(): ReturnTypeError[] {
  console.log('🔍 Return type hataları tespit ediliyor...\n');
  
  let output = '';
  try {
    output = execSync('npm run typecheck', { 
      encoding: 'utf-8',
      stdio: 'pipe',
    });
  } catch (error: any) {
    output = (error.stdout || error.stderr || error.message || '').toString();
  }
  
  const errors: ReturnTypeError[] = [];
  const lines = output.split('\n');
  
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed.includes('error TS7030')) continue;
    if (trimmed.includes('> omnex-core-platform@') || trimmed.includes('> tsc')) continue;
    
    // Parse: file(line,col): error TS7030: Not all code paths return a value.
    const match = trimmed.match(/^(.+?)\((\d+),\d+\):\s+error\s+TS7030:\s+(.+)$/);
    if (!match) continue;
    
    const [, file, lineStr, message] = match;
    
    // Sadece src/ klasöründeki dosyaları işle
    if (!file.includes('src/') || file.includes('backups/')) continue;
    
    errors.push({
      file: file.trim(),
      line: parseInt(lineStr, 10),
      message: message.trim(),
    });
  }
  
  return errors;
}

function fixReturnType(filePath: string, lineNum: number): boolean {
  if (!fs.existsSync(filePath)) return false;
  
  const content = fs.readFileSync(filePath, 'utf-8');
  const lines = content.split('\n');
  
  if (lineNum < 1 || lineNum > lines.length) return false;
  
  // Function signature'ı bulmak için yukarı doğru bak
  let funcStartLine = lineNum - 1;
  let funcLine = '';
  let braceCount = 0;
  
  // Function başlangıcını bul
  while (funcStartLine >= 0) {
    const line = lines[funcStartLine];
    funcLine = line + funcLine;
    
    // Function declaration bul
    if (line.match(/^\s*(export\s+)?(async\s+)?function\s+\w+/)) {
      break;
    }
    
    // Arrow function bul
    if (line.match(/^\s*(export\s+)?(const|let|var)\s+\w+\s*=\s*(async\s+)?\(/)) {
      break;
    }
    
    funcStartLine--;
    if (funcStartLine < 0) return false;
  }
  
  if (funcStartLine < 0) return false;
  
  const funcLineContent = lines[funcStartLine];
  const originalLine = funcLineContent;
  
  // Function signature'ı analiz et
  // Pattern 1: function name() { -> function name(): ReturnType {
  if (funcLineContent.match(/^\s*(export\s+)?(async\s+)?function\s+\w+\s*\([^)]*\)\s*[:{]/)) {
    // Return type yoksa ekle
    if (!funcLineContent.includes(':')) {
      // Async function -> Promise<void>
      if (funcLineContent.includes('async')) {
        lines[funcStartLine] = funcLineContent.replace(
          /(\))\s*[:{]/,
          '$1: Promise<void> {'
        );
      } else {
        // Sync function -> void
        lines[funcStartLine] = funcLineContent.replace(
          /(\))\s*[:{]/,
          '$1: void {'
        );
      }
    }
  }
  
  // Pattern 2: const name = () => { -> const name = (): ReturnType => {
  if (funcLineContent.match(/=\s*(async\s+)?\([^)]*\)\s*=>\s*{/)) {
    if (!funcLineContent.includes(':')) {
      if (funcLineContent.includes('async')) {
        lines[funcStartLine] = funcLineContent.replace(
          /(\))\s*=>\s*{/,
          '$1: Promise<void> => {'
        );
      } else {
        lines[funcStartLine] = funcLineContent.replace(
          /(\))\s*=>\s*{/,
          '$1: void => {'
        );
      }
    }
  }
  
  if (lines[funcStartLine] !== originalLine) {
    fs.writeFileSync(filePath, lines.join('\n'), 'utf-8');
    return true;
  }
  
  return false;
}

function main() {
  console.log('🔧 Return type hataları düzeltiliyor...\n');
  
  const errors = getReturnTypeErrors();
  console.log(`📊 ${errors.length} return type hatası bulundu\n`);
  
  // Dosyaya göre grupla
  const byFile = new Map<string, ReturnTypeError[]>();
  for (const error of errors) {
    if (!byFile.has(error.file)) {
      byFile.set(error.file, []);
    }
    byFile.get(error.file)!.push(error);
  }
  
  let fixed = 0;
  let skipped = 0;
  
  // Her dosyayı işle
  for (const [file, fileErrors] of byFile.entries()) {
    const filePath = path.join(process.cwd(), file);
    
    // Satır numaralarına göre sırala (büyükten küçüğe)
    fileErrors.sort((a, b) => b.line - a.line);
    
    for (const error of fileErrors) {
      if (fixReturnType(filePath, error.line)) {
        fixed++;
        console.log(`✅ ${file}:${error.line} - Return type eklendi`);
      } else {
        skipped++;
        console.log(`⚠️  ${file}:${error.line} - Return type eklenemedi (manuel kontrol gerekli)`);
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









