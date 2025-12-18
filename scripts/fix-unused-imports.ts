#!/usr/bin/env tsx
/**
 * Güvenli Unused Imports Temizleme
 * Sadece kesinlikle kullanılmayan import'ları kaldırır
 */

import * as fs from 'fs';
import * as path from 'path';
import { execSync } from 'child_process';
import { execSync } from 'child_process';

interface UnusedImport {
  file: string;
  line: number;
  name: string;
}

function getUnusedImports(): UnusedImport[] {
  console.log('🔍 Unused imports tespit ediliyor...\n');
  
  let output = '';
  try {
    output = execSync('npm run typecheck', { 
      encoding: 'utf-8',
      stdio: 'pipe',
    });
  } catch (error: any) {
    output = (error.stdout || error.stderr || error.message || '').toString();
  }
  
  const unused: UnusedImport[] = [];
  const lines = output.split('\n');
  
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed.includes('error TS6133') && !trimmed.includes('error TS6196')) continue;
    if (trimmed.includes('> omnex-core-platform@') || trimmed.includes('> tsc')) continue;
    
    // Parse: file(line,col): error TS6133: 'name' is declared but its value is never read.
    const match = trimmed.match(/^(.+?)\((\d+),\d+\):\s+error\s+TS(6133|6196):\s+'([^']+)'/);
    if (!match) continue;
    
    const [, file, lineStr, , name] = match;
    
    // Sadece src/ klasöründeki dosyaları işle, backups'ı atla
    if (!file.includes('src/') || file.includes('backups/')) continue;
    
    unused.push({
      file: file.trim(),
      line: parseInt(lineStr, 10),
      name: name.trim(),
    });
  }
  
  return unused;
}

function removeUnusedImport(filePath: string, lineNum: number, importName: string): boolean {
  if (!fs.existsSync(filePath)) return false;
  
  const content = fs.readFileSync(filePath, 'utf-8');
  const lines = content.split('\n');
  
  if (lineNum < 1 || lineNum > lines.length) return false;
  
  // Önce import satırını bul (satır numarası değişmiş olabilir)
  let importLineIndex = -1;
  let importLine = '';
  
  // Önce tam satırı kontrol et
  if (lines[lineNum - 1].includes('import')) {
    importLineIndex = lineNum - 1;
    importLine = lines[importLineIndex];
  } else {
    // Yukarı doğru ara (max 10 satır)
    for (let i = lineNum - 1; i >= Math.max(0, lineNum - 11); i--) {
      if (lines[i].includes('import') && lines[i].includes(importName)) {
        importLineIndex = i;
        importLine = lines[i];
        break;
      }
    }
  }
  
  if (importLineIndex === -1) return false;
  
  // Named import: import { Name } from '...'
  // Daha esnek pattern matching
  const namedImportMatch = importLine.match(/import\s+{\s*([^}]+)\s*}\s+from/);
  if (namedImportMatch) {
    const imports = namedImportMatch[1].split(',').map(i => i.trim().replace(/^type\s+/, ''));
    const importNameClean = importName.trim();
    
    // Import'u listede bul
    const importIndex = imports.findIndex(i => i === importNameClean || i === `type ${importNameClean}`);
    if (importIndex !== -1) {
      // Import'u listeden çıkar
      imports.splice(importIndex, 1);
      
      if (imports.length === 0) {
        // Tüm import'lar kaldırıldı, satırı sil
        lines.splice(importLineIndex, 1);
      } else {
        // Kalan import'ları yaz
        const originalImports = namedImportMatch[1].split(',').map(i => i.trim());
        const remainingOriginal = originalImports.filter(i => {
          const clean = i.replace(/^type\s+/, '');
          return clean !== importNameClean && i !== importNameClean;
        });
        lines[importLineIndex] = importLine.replace(
          /{\s*[^}]+\s*}/,
          `{ ${remainingOriginal.join(', ')} }`
        );
      }
      fs.writeFileSync(filePath, lines.join('\n'), 'utf-8');
      return true;
    }
  }
  
  // Default import: import Name from '...'
  const defaultImportMatch = importLine.match(new RegExp(`import\\s+${importName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\s+from`));
  if (defaultImportMatch) {
    lines.splice(importLineIndex, 1);
    fs.writeFileSync(filePath, lines.join('\n'), 'utf-8');
    return true;
  }
  
  // Type import: import type { Name } from '...'
  const typeImportMatch = importLine.match(/import\s+type\s+{\s*([^}]+)\s*}\s+from/);
  if (typeImportMatch) {
    const imports = typeImportMatch[1].split(',').map(i => i.trim());
    const remainingImports = imports.filter(i => i !== importName && i !== `type ${importName}`);
    if (remainingImports.length === 0) {
      lines.splice(importLineIndex, 1);
    } else {
      lines[importLineIndex] = importLine.replace(
        /{\s*[^}]+\s*}/,
        `{ ${remainingImports.join(', ')} }`
      );
    }
    fs.writeFileSync(filePath, lines.join('\n'), 'utf-8');
    return true;
  }
  
  // Variable declaration: const/let/var Name = ...
  if (importLine.match(new RegExp(`(const|let|var)\\s+${importName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\s*=`))) {
    lines.splice(importLineIndex, 1);
    fs.writeFileSync(filePath, lines.join('\n'), 'utf-8');
    return true;
  }
  
  return false;
}

function main() {
  console.log('🧹 Unused imports temizleniyor...\n');
  
  const unused = getUnusedImports();
  console.log(`📊 ${unused.length} unused import bulundu\n`);
  
  // Dosyaya göre grupla
  const byFile = new Map<string, UnusedImport[]>();
  for (const item of unused) {
    if (!byFile.has(item.file)) {
      byFile.set(item.file, []);
    }
    byFile.get(item.file)!.push(item);
  }
  
  let fixed = 0;
  let skipped = 0;
  
  // Her dosyayı işle (satır numaralarına göre ters sırada - yukarıdan aşağıya)
  for (const [file, items] of byFile.entries()) {
    const filePath = path.join(process.cwd(), file);
    
    // Satır numaralarına göre sırala (büyükten küçüğe - aşağıdan yukarıya)
    items.sort((a, b) => b.line - a.line);
    
    for (const item of items) {
      if (removeUnusedImport(filePath, item.line, item.name)) {
        fixed++;
        console.log(`✅ ${file}:${item.line} - ${item.name} kaldırıldı`);
      } else {
        skipped++;
        console.log(`⚠️  ${file}:${item.line} - ${item.name} kaldırılamadı (manuel kontrol gerekli)`);
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

