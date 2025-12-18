#!/usr/bin/env tsx
/**
 * Toplu exactOptionalPropertyTypes Düzeltmeleri
 * En çok tekrar eden pattern'leri toplu düzeltir
 */

import * as fs from 'fs';
import * as path from 'path';
import { execSync } from 'child_process';

interface ExactOptionalError {
  file: string;
  line: number;
  column: number;
  message: string;
  pattern: 'className' | 'value' | 'disabled' | 'loading' | 'object-literal' | 'function-arg';
}

function getExactOptionalErrors(): ExactOptionalError[] {
  console.log('🔍 exactOptionalPropertyTypes hataları tespit ediliyor...\n');
  
  let output = '';
  try {
    output = execSync('npm run typecheck', { 
      encoding: 'utf-8',
      stdio: 'pipe',
    });
  } catch (error: any) {
    output = (error.stdout || error.stderr || error.message || '').toString();
  }
  
  const errors: ExactOptionalError[] = [];
  const lines = output.split('\n');
  
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed.includes('error TS2375') && !trimmed.includes('error TS2379')) continue;
    if (trimmed.includes('> omnex-core-platform@') || trimmed.includes('> tsc')) continue;
    if (!trimmed.includes('exactOptionalPropertyTypes')) continue;
    
    // Parse: file(line,col): error TSXXXX: message
    const match = trimmed.match(/^(.+?)\((\d+),(\d+)\):\s+error\s+(TS2375|TS2379):\s+(.+)$/);
    if (!match) continue;
    
    const [, file, lineStr, colStr, , message] = match;
    
    // Sadece src/ klasöründeki dosyaları işle
    if (!file.includes('src/') || file.includes('backups/')) continue;
    
    // Pattern belirleme
    let pattern: ExactOptionalError['pattern'] = 'function-arg';
    if (message.includes('className')) pattern = 'className';
    else if (message.includes('value')) pattern = 'value';
    else if (message.includes('disabled')) pattern = 'disabled';
    else if (message.includes('loading')) pattern = 'loading';
    else if (message.includes('Argument of type') && message.includes('{')) pattern = 'object-literal';
    else if (message.includes('{') && message.includes(':')) pattern = 'object-literal';
    
    errors.push({
      file: file.trim(),
      line: parseInt(lineStr, 10),
      column: parseInt(colStr, 10),
      message: message.trim(),
      pattern,
    });
  }
  
  return errors;
}

function fixClassNameProp(filePath: string, lineNum: number): boolean {
  if (!fs.existsSync(filePath)) return false;
  
  const content = fs.readFileSync(filePath, 'utf-8');
  const lines = content.split('\n');
  
  if (lineNum < 1 || lineNum > lines.length) return false;
  
  const line = lines[lineNum - 1];
  const originalLine = line;
  
  // Pattern: className={variable} where variable is string | undefined
  // Çözüm: className={variable ?? undefined} veya className={variable || undefined}
  
  // className={undefined} -> className={undefined as string | undefined}
  if (line.includes('className={undefined}')) {
    lines[lineNum - 1] = line.replace(
      /className=\{undefined\}/g,
      'className={undefined as string | undefined}'
    );
  }
  // className={variable} -> className={variable ?? undefined}
  else if (line.includes('className={') && !line.includes('??') && !line.includes('||') && !line.includes('as')) {
    const classNameMatch = line.match(/className=\{([^}]+)\}/);
    if (classNameMatch) {
      const value = classNameMatch[1].trim();
      // Sadece değişken ise (fonksiyon çağrısı, string literal değilse)
      if (!value.startsWith('"') && !value.startsWith("'") && !value.includes('(') && !value.includes('`')) {
        lines[lineNum - 1] = line.replace(
          /className=\{([^}]+)\}/,
          'className={$1 ?? undefined}'
        );
      }
    }
  }
  
  if (lines[lineNum - 1] !== originalLine) {
    fs.writeFileSync(filePath, lines.join('\n'), 'utf-8');
    return true;
  }
  
  return false;
}

function fixValueProp(filePath: string, lineNum: number, message: string): boolean {
  if (!fs.existsSync(filePath)) return false;
  
  const content = fs.readFileSync(filePath, 'utf-8');
  const lines = content.split('\n');
  
  if (lineNum < 1 || lineNum > lines.length) return false;
  
  const line = lines[lineNum - 1];
  const originalLine = line;
  
  // Pattern: value={variable} where variable is Type | undefined
  if (line.includes('value={') && !line.includes('??') && !line.includes('||') && !line.includes('as')) {
    const valueMatch = line.match(/value=\{([^}]+)\}/);
    if (valueMatch) {
      const varName = valueMatch[1].trim();
      // Sadece değişken ise
      if (!varName.includes('(') && !varName.includes(')') && varName !== 'undefined') {
        // Type belirle
        let defaultValue = 'undefined';
        if (message.includes('number')) defaultValue = '0';
        else if (message.includes('string')) defaultValue = "''";
        else if (message.includes('boolean')) defaultValue = 'false';
        
        lines[lineNum - 1] = line.replace(
          /value=\{([^}]+)\}/,
          `value={$1 ?? ${defaultValue}}`
        );
      }
    }
  }
  
  if (lines[lineNum - 1] !== originalLine) {
    fs.writeFileSync(filePath, lines.join('\n'), 'utf-8');
    return true;
  }
  
  return false;
}

function fixDisabledLoadingProp(filePath: string, lineNum: number, propName: 'disabled' | 'loading'): boolean {
  if (!fs.existsSync(filePath)) return false;
  
  const content = fs.readFileSync(filePath, 'utf-8');
  const lines = content.split('\n');
  
  if (lineNum < 1 || lineNum > lines.length) return false;
  
  const line = lines[lineNum - 1];
  const originalLine = line;
  
  // Pattern: disabled={variable} or loading={variable} where variable is boolean | undefined
  const propPattern = new RegExp(`${propName}=\\{([^}]+)\\}`);
  if (line.match(propPattern) && !line.includes('??') && !line.includes('||') && !line.includes('as')) {
    const match = line.match(propPattern);
    if (match) {
      const varName = match[1].trim();
      if (!varName.includes('(') && !varName.includes(')') && varName !== 'undefined' && varName !== 'true' && varName !== 'false') {
        lines[lineNum - 1] = line.replace(
          propPattern,
          `${propName}={$1 ?? false}`
        );
      }
    }
  }
  
  if (lines[lineNum - 1] !== originalLine) {
    fs.writeFileSync(filePath, lines.join('\n'), 'utf-8');
    return true;
  }
  
  return false;
}

function fixObjectLiteral(filePath: string, lineNum: number, message: string): boolean {
  if (!fs.existsSync(filePath)) return false;
  
  const content = fs.readFileSync(filePath, 'utf-8');
  const lines = content.split('\n');
  
  if (lineNum < 1 || lineNum > lines.length) return false;
  
  const line = lines[lineNum - 1];
  const originalLine = line;
  
  // Pattern: { prop: undefined } -> { prop: undefined as Type | undefined }
  if (line.includes(': undefined') && line.includes('{')) {
    // Determine type from message
    let type = 'string | undefined';
    if (message.includes('number')) type = 'number | undefined';
    else if (message.includes('boolean')) type = 'boolean | undefined';
    
    // Replace : undefined with : undefined as Type | undefined
    lines[lineNum - 1] = line.replace(
      /:\s*undefined(?=\s*[,}])/g,
      `: undefined as ${type}`
    );
  }
  
  if (lines[lineNum - 1] !== originalLine) {
    fs.writeFileSync(filePath, lines.join('\n'), 'utf-8');
    return true;
  }
  
  return false;
}

function main() {
  console.log('🔧 Toplu exactOptionalPropertyTypes düzeltmeleri başlatılıyor...\n');
  
  const errors = getExactOptionalErrors();
  console.log(`📊 ${errors.length} exactOptionalPropertyTypes hatası bulundu\n`);
  
  // Pattern'e göre grupla
  const byPattern = new Map<ExactOptionalError['pattern'], ExactOptionalError[]>();
  for (const error of errors) {
    if (!byPattern.has(error.pattern)) {
      byPattern.set(error.pattern, []);
    }
    byPattern.get(error.pattern)!.push(error);
  }
  
  console.log('📋 Pattern dağılımı:');
  for (const [pattern, patternErrors] of byPattern.entries()) {
    console.log(`  ${pattern}: ${patternErrors.length} hata`);
  }
  console.log('');
  
  let totalFixed = 0;
  let totalSkipped = 0;
  
  // Her pattern'i işle
  for (const [pattern, patternErrors] of byPattern.entries()) {
    console.log(`\n🔧 ${pattern} pattern'i düzeltiliyor... (${patternErrors.length} hata)`);
    
    // Dosyaya göre grupla
    const byFile = new Map<string, ExactOptionalError[]>();
    for (const error of patternErrors) {
      if (!byFile.has(error.file)) {
        byFile.set(error.file, []);
      }
      byFile.get(error.file)!.push(error);
    }
    
    let patternFixed = 0;
    let patternSkipped = 0;
    
    // Her dosyayı işle
    for (const [file, fileErrors] of byFile.entries()) {
      const filePath = path.join(process.cwd(), file);
      
      // Satır numaralarına göre sırala (büyükten küçüğe)
      fileErrors.sort((a, b) => b.line - a.line);
      
      for (const error of fileErrors) {
        let fixed = false;
        
        switch (pattern) {
          case 'className':
            fixed = fixClassNameProp(filePath, error.line);
            break;
          case 'value':
            fixed = fixValueProp(filePath, error.line, error.message);
            break;
          case 'disabled':
            fixed = fixDisabledLoadingProp(filePath, error.line, 'disabled');
            break;
          case 'loading':
            fixed = fixDisabledLoadingProp(filePath, error.line, 'loading');
            break;
          case 'object-literal':
            fixed = fixObjectLiteral(filePath, error.line, error.message);
            break;
          default:
            // function-arg için şimdilik skip
            break;
        }
        
        if (fixed) {
          patternFixed++;
          totalFixed++;
          if (patternFixed % 10 === 0) {
            console.log(`  ✅ ${patternFixed} hata düzeltildi...`);
          }
        } else {
          patternSkipped++;
          totalSkipped++;
        }
      }
    }
    
    console.log(`  ✅ ${patternFixed} düzeltildi, ⚠️  ${patternSkipped} atlandı`);
  }
  
  console.log(`\n📊 Genel Özet:`);
  console.log(`  ✅ Toplam Düzeltildi: ${totalFixed}`);
  console.log(`  ⚠️  Toplam Atlandı: ${totalSkipped}`);
  console.log(`  📁 İşlenen Dosya: ${new Set(errors.map(e => e.file)).size}`);
  
  if (totalFixed > 0) {
    console.log(`\n💡 Tip: 'npm run typecheck' çalıştırarak kalan hataları kontrol edin`);
  }
}

main();









