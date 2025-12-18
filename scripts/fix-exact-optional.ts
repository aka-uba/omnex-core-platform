#!/usr/bin/env tsx
/**
 * Güvenli exactOptionalPropertyTypes Düzeltmeleri
 * undefined değerleri açıkça handle eder
 */

import * as fs from 'fs';
import * as path from 'path';
import { execSync } from 'child_process';

interface ExactOptionalError {
  file: string;
  line: number;
  column: number;
  message: string;
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
    
    errors.push({
      file: file.trim(),
      line: parseInt(lineStr, 10),
      column: parseInt(colStr, 10),
      message: message.trim(),
    });
  }
  
  return errors;
}

function fixExactOptional(filePath: string, lineNum: number, colNum: number, message: string): boolean {
  if (!fs.existsSync(filePath)) return false;
  
  const content = fs.readFileSync(filePath, 'utf-8');
  const lines = content.split('\n');
  
  if (lineNum < 1 || lineNum > lines.length) return false;
  
  const line = lines[lineNum - 1];
  const originalLine = line;
  
  // Pattern 1: className: string | undefined -> className: className || undefined
  // veya className={undefined} -> className={undefined as string | undefined}
  if (message.includes('className') && message.includes('string | undefined')) {
    // className={undefined} -> className={undefined as string | undefined}
    if (line.includes('className={undefined}')) {
      lines[lineNum - 1] = line.replace(
        /className=\{undefined\}/g,
        'className={undefined as string | undefined}'
      );
    }
    // className={value} where value is string | undefined
    else if (line.includes('className={')) {
      const classNameMatch = line.match(/className=\{([^}]+)\}/);
      if (classNameMatch) {
        const value = classNameMatch[1].trim();
        // Eğer değişken ise, undefined check ekle
        if (!value.includes('||') && !value.includes('??') && !value.includes('as')) {
          lines[lineNum - 1] = line.replace(
            /className=\{([^}]+)\}/,
            'className={$1 || undefined}'
          );
        }
      }
    }
  }
  
  // Pattern 2: value: number | undefined -> value: value ?? undefined
  if (message.includes('number | undefined') || message.includes('string | undefined')) {
    // value={undefined} -> value={undefined as Type | undefined}
    if (line.includes('value={undefined}')) {
      const typeMatch = message.match(/Type '(\w+ \| undefined)'/);
      if (typeMatch) {
        lines[lineNum - 1] = line.replace(
          /value=\{undefined\}/,
          `value={undefined as ${typeMatch[1]}}`
        );
      }
    }
    // value={variable} where variable is Type | undefined
    else if (line.includes('value={') && !line.includes('??') && !line.includes('||')) {
      const valueMatch = line.match(/value=\{([^}]+)\}/);
      if (valueMatch) {
        const varName = valueMatch[1].trim();
        // Sadece değişken ise (fonksiyon çağrısı değilse)
        if (!varName.includes('(') && !varName.includes(')')) {
          lines[lineNum - 1] = line.replace(
            /value=\{([^}]+)\}/,
            'value={$1 ?? undefined}'
          );
        }
      }
    }
  }
  
  // Pattern 3: { error: undefined } -> { error: undefined as string | undefined }
  if (message.includes('Type \'undefined\' is not assignable')) {
    if (line.includes(': undefined') && line.includes('{')) {
      // { error: undefined } -> { error: undefined as string | undefined }
      lines[lineNum - 1] = line.replace(
        /:\s*undefined(?=\s*[,}])/g,
        ': undefined as string | undefined'
      );
    }
  }
  
  // Pattern 4: disabled: boolean | undefined -> disabled: disabled ?? false
  if (message.includes('disabled') && message.includes('boolean | undefined')) {
    if (line.includes('disabled={') && !line.includes('??') && !line.includes('||')) {
      const disabledMatch = line.match(/disabled=\{([^}]+)\}/);
      if (disabledMatch) {
        const varName = disabledMatch[1].trim();
        if (!varName.includes('(') && !varName.includes(')')) {
          lines[lineNum - 1] = line.replace(
            /disabled=\{([^}]+)\}/,
            'disabled={$1 ?? false}'
          );
        }
      }
    }
  }
  
  // Pattern 5: loading: boolean | undefined -> loading: loading ?? false
  if (message.includes('loading') && message.includes('boolean | undefined')) {
    if (line.includes('loading={') && !line.includes('??') && !line.includes('||')) {
      const loadingMatch = line.match(/loading=\{([^}]+)\}/);
      if (loadingMatch) {
        const varName = loadingMatch[1].trim();
        if (!varName.includes('(') && !varName.includes(')')) {
          lines[lineNum - 1] = line.replace(
            /loading=\{([^}]+)\}/,
            'loading={$1 ?? false}'
          );
        }
      }
    }
  }
  
  // Pattern 6: Generic property assignment with undefined
  // { prop: value } where value is Type | undefined
  if (message.includes('is not assignable') && message.includes('exactOptionalPropertyTypes')) {
    // Extract the property name from message
    const propMatch = message.match(/property '(\w+)'/);
    if (propMatch) {
      const propName = propMatch[1];
      // Look for object literal assignments
      const objLiteralMatch = line.match(new RegExp(`\\{\\s*${propName}:\\s*([^,}]+)`));
      if (objLiteralMatch) {
        const value = objLiteralMatch[1].trim();
        // If value is undefined or a variable that might be undefined
        if (value === 'undefined' || (!value.includes('(') && !value.includes('??') && !value.includes('||'))) {
          // Add type assertion or nullish coalescing
          if (value === 'undefined') {
            // Determine type from context
            let type = 'string | undefined';
            if (message.includes('number')) type = 'number | undefined';
            else if (message.includes('boolean')) type = 'boolean | undefined';
            
            lines[lineNum - 1] = line.replace(
              new RegExp(`${propName}:\\s*undefined`),
              `${propName}: undefined as ${type}`
            );
          } else {
            // Add nullish coalescing
            lines[lineNum - 1] = line.replace(
              new RegExp(`${propName}:\\s*${value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}`),
              `${propName}: ${value} ?? undefined`
            );
          }
        }
      }
    }
  }
  
  // Pattern 7: Function argument with undefined
  // func({ prop: undefined }) -> func({ prop: undefined as Type | undefined })
  if (message.includes('Argument of type') && message.includes('exactOptionalPropertyTypes')) {
    // Find object literals with undefined values
    const undefinedPropMatch = line.match(/(\w+):\s*undefined(?=\s*[,}])/);
    if (undefinedPropMatch) {
      const propName = undefinedPropMatch[1];
      // Determine type
      let type = 'string | undefined';
      if (message.includes('number')) type = 'number | undefined';
      else if (message.includes('boolean')) type = 'boolean | undefined';
      
      lines[lineNum - 1] = line.replace(
        new RegExp(`${propName}:\\s*undefined(?=\\s*[,}])`),
        `${propName}: undefined as ${type}`
      );
    }
  }
  
  // Pattern 8: Props with optional properties
  // Component prop={value} where value is Type | undefined
  if (message.includes('is not assignable') && line.includes('=') && !line.includes('??') && !line.includes('||')) {
    // Extract prop name from message if available
    const propMatch = message.match(/property '(\w+)'/);
    if (propMatch) {
      const propName = propMatch[1];
      const propPattern = new RegExp(`${propName}=\\{([^}]+)\\}`);
      const match = line.match(propPattern);
      if (match) {
        const value = match[1].trim();
        // Simple variable assignment
        if (!value.includes('(') && !value.includes(')') && value !== 'undefined') {
          lines[lineNum - 1] = line.replace(
            propPattern,
            `${propName}={${value} ?? undefined}`
          );
        }
      }
    }
  }
  
  if (lines[lineNum - 1] !== originalLine) {
    fs.writeFileSync(filePath, lines.join('\n'), 'utf-8');
    return true;
  }
  
  return false;
}

function main() {
  console.log('🔧 exactOptionalPropertyTypes hataları düzeltiliyor...\n');
  
  const errors = getExactOptionalErrors();
  console.log(`📊 ${errors.length} exactOptionalPropertyTypes hatası bulundu\n`);
  
  // Dosyaya göre grupla
  const byFile = new Map<string, ExactOptionalError[]>();
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
      if (fixExactOptional(filePath, error.line, error.column, error.message)) {
        fixed++;
        if (fixed % 20 === 0) {
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

