#!/usr/bin/env tsx
/**
 * Agresif Unused Imports Temizleme
 * Daha kapsamlı pattern matching ile tüm unused import'ları temizler
 */

import * as fs from 'fs';
import * as path from 'path';
import { execSync } from 'child_process';

interface UnusedItem {
  file: string;
  line: number;
  name: string;
  type: 'import' | 'variable' | 'type';
}

function getAllUnusedItems(): UnusedItem[] {
  console.log('🔍 Tüm unused items tespit ediliyor...\n');
  
  let output = '';
  try {
    output = execSync('npm run typecheck', { 
      encoding: 'utf-8',
      stdio: 'pipe',
    });
  } catch (error: any) {
    output = (error.stdout || error.stderr || error.message || '').toString();
  }
  
  const unused: UnusedItem[] = [];
  const lines = output.split('\n');
  
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed.includes('error TS6133') && !trimmed.includes('error TS6196')) continue;
    if (trimmed.includes('> omnex-core-platform@') || trimmed.includes('> tsc')) continue;
    
    // Parse: file(line,col): error TSXXXX: 'name' is declared but its value is never read.
    const match = trimmed.match(/^(.+?)\((\d+),\d+\):\s+error\s+TS(6133|6196):\s+'([^']+)'/);
    if (!match) continue;
    
    const [, file, lineStr, , name] = match;
    
    // Sadece src/ klasöründeki dosyaları işle
    if (!file.includes('src/') || file.includes('backups/')) continue;
    
    // Type import mu kontrol et
    const isType = trimmed.includes('is declared but never used') && 
                   (trimmed.includes('type') || name.startsWith('type '));
    
    unused.push({
      file: file.trim(),
      line: parseInt(lineStr, 10),
      name: name.trim().replace(/^type\s+/, ''),
      type: isType ? 'type' : 'import',
    });
  }
  
  return unused;
}

function removeUnusedItem(filePath: string, item: UnusedItem): boolean {
  if (!fs.existsSync(filePath)) return false;
  
  const content = fs.readFileSync(filePath, 'utf-8');
  const lines = content.split('\n');
  
  if (item.line < 1 || item.line > lines.length) return false;
  
  // Satır numarası değişmiş olabilir, dosyada ara
  let targetLineIndex = -1;
  let targetLine = '';
  
  // Önce tam satırı kontrol et
  if (lines[item.line - 1].includes(item.name)) {
    targetLineIndex = item.line - 1;
    targetLine = lines[targetLineIndex];
  } else {
    // Yukarı doğru ara (max 20 satır)
    for (let i = item.line - 1; i >= Math.max(0, item.line - 21); i--) {
      if (lines[i].includes(item.name)) {
        targetLineIndex = i;
        targetLine = lines[i];
        break;
      }
    }
  }
  
  if (targetLineIndex === -1) return false;
  
  const originalLine = targetLine;
  
  // Pattern 1: Named import - import { Name, Other } from '...'
  const namedImportMatch = targetLine.match(/import\s+{\s*([^}]+)\s*}\s+from\s+['"]([^'"]+)['"]/);
  if (namedImportMatch) {
    const importsStr = namedImportMatch[1];
    const fromPath = namedImportMatch[2];
    const imports = importsStr.split(',').map(i => i.trim());
    
    // Import'u listede bul
    const importIndex = imports.findIndex(i => {
      const clean = i.replace(/^type\s+/, '').trim();
      return clean === item.name || i.trim() === item.name;
    });
    
    if (importIndex !== -1) {
      imports.splice(importIndex, 1);
      
      if (imports.length === 0) {
        // Tüm import'lar kaldırıldı, satırı sil
        lines.splice(targetLineIndex, 1);
      } else {
        // Kalan import'ları yaz
        lines[targetLineIndex] = targetLine.replace(
          /{\s*[^}]+\s*}/,
          `{ ${imports.join(', ')} }`
        );
      }
      fs.writeFileSync(filePath, lines.join('\n'), 'utf-8');
      return true;
    }
  }
  
  // Pattern 2: Default import - import Name from '...'
  const defaultImportMatch = targetLine.match(new RegExp(`import\\s+${item.name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\s+from`));
  if (defaultImportMatch) {
    lines.splice(targetLineIndex, 1);
    fs.writeFileSync(filePath, lines.join('\n'), 'utf-8');
    return true;
  }
  
  // Pattern 3: Type import - import type { Name } from '...'
  const typeImportMatch = targetLine.match(/import\s+type\s+{\s*([^}]+)\s*}\s+from\s+['"]([^'"]+)['"]/);
  if (typeImportMatch) {
    const importsStr = typeImportMatch[1];
    const imports = importsStr.split(',').map(i => i.trim());
    const remainingImports = imports.filter(i => {
      const clean = i.replace(/^type\s+/, '').trim();
      return clean !== item.name && i.trim() !== item.name;
    });
    
    if (remainingImports.length === 0) {
      lines.splice(targetLineIndex, 1);
    } else {
      lines[targetLineIndex] = targetLine.replace(
        /{\s*[^}]+\s*}/,
        `{ ${remainingImports.join(', ')} }`
      );
    }
    fs.writeFileSync(filePath, lines.join('\n'), 'utf-8');
    return true;
  }
  
  // Pattern 4: Variable declaration - const/let/var Name = ...
  const varMatch = targetLine.match(new RegExp(`(const|let|var)\\s+${item.name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\s*[=:]`));
  if (varMatch) {
    // Eğer satır sadece bu değişkeni içeriyorsa satırı sil
    if (targetLine.trim().match(new RegExp(`^(const|let|var)\\s+${item.name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\s*[=:].*;$`))) {
      lines.splice(targetLineIndex, 1);
      fs.writeFileSync(filePath, lines.join('\n'), 'utf-8');
      return true;
    }
  }
  
  // Pattern 5: Destructuring - const { Name } = ...
  const destructureMatch = targetLine.match(new RegExp(`(const|let|var)\\s*{\\s*([^}]+)\\s*}\\s*=`));
  if (destructureMatch) {
    const vars = destructureMatch[2].split(',').map(v => v.trim().split(':')[0].trim());
    if (vars.includes(item.name)) {
      const remainingVars = vars.filter(v => v !== item.name);
      if (remainingVars.length === 0) {
        lines.splice(targetLineIndex, 1);
      } else {
        lines[targetLineIndex] = targetLine.replace(
          /{\s*[^}]+\s*}/,
          `{ ${remainingVars.join(', ')} }`
        );
      }
      fs.writeFileSync(filePath, lines.join('\n'), 'utf-8');
      return true;
    }
  }
  
  return false;
}

function main() {
  console.log('🧹 Agresif unused imports temizleme başlatılıyor...\n');
  
  const unused = getAllUnusedItems();
  console.log(`📊 ${unused.length} unused item bulundu\n`);
  
  // Dosyaya göre grupla
  const byFile = new Map<string, UnusedItem[]>();
  for (const item of unused) {
    if (!byFile.has(item.file)) {
      byFile.set(item.file, []);
    }
    byFile.get(item.file)!.push(item);
  }
  
  let fixed = 0;
  let skipped = 0;
  const skippedItems: UnusedItem[] = [];
  
  // Her dosyayı işle (satır numaralarına göre ters sırada)
  for (const [file, items] of byFile.entries()) {
    const filePath = path.join(process.cwd(), file);
    
    // Satır numaralarına göre sırala (büyükten küçüğe)
    items.sort((a, b) => b.line - a.line);
    
    // Dosyayı bir kez oku
    let content = fs.readFileSync(filePath, 'utf-8');
    let lines = content.split('\n');
    let fileModified = false;
    
    for (const item of items) {
      if (removeUnusedItem(filePath, item)) {
        fixed++;
        fileModified = true;
        // Dosyayı yeniden oku (satır numaraları değişmiş olabilir)
        content = fs.readFileSync(filePath, 'utf-8');
        lines = content.split('\n');
        
        if (fixed % 50 === 0) {
          console.log(`✅ ${fixed} item temizlendi...`);
        }
      } else {
        skipped++;
        skippedItems.push(item);
      }
    }
  }
  
  console.log(`\n📊 Özet:`);
  console.log(`  ✅ Düzeltildi: ${fixed}`);
  console.log(`  ⚠️  Atlandı: ${skipped}`);
  console.log(`  📁 Dosya sayısı: ${byFile.size}`);
  
  if (skippedItems.length > 0 && skippedItems.length <= 20) {
    console.log(`\n⚠️  Atlanan items (ilk 20):`);
    for (const item of skippedItems.slice(0, 20)) {
      console.log(`  - ${item.file}:${item.line} - ${item.name}`);
    }
  }
  
  if (fixed > 0) {
    console.log(`\n💡 Tip: 'npm run typecheck' çalıştırarak kalan hataları kontrol edin`);
  }
}

main();









