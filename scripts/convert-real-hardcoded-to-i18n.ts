import * as fs from 'fs';
import * as path from 'path';
import { glob } from 'glob';

interface HardcodedText {
  file: string;
  line: number;
  text: string;
  context: string;
  type: 'turkish' | 'english';
}

interface ConversionResult {
  file: string;
  converted: number;
  errors: string[];
  addedKeys: string[];
}

// Load report
function loadReport(): any {
  const reportPath = path.join(process.cwd(), 'hardcoded-texts-report.json');
  if (!fs.existsSync(reportPath)) {
    return null;
  }
  return JSON.parse(fs.readFileSync(reportPath, 'utf-8'));
}

// Load JSON file
function loadJsonFile(filePath: string): any | null {
  try {
    if (!fs.existsSync(filePath)) {
      return null;
    }
    return JSON.parse(fs.readFileSync(filePath, 'utf-8'));
  } catch {
    return null;
  }
}

// Save JSON file
function saveJsonFile(filePath: string, data: any): void {
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf-8');
}

// Generate i18n key from text
function generateI18nKey(text: string, context: string): string {
  // Clean text
  let cleanText = text.trim();
  
  // Common mappings
  const mappings: Record<string, string> = {
    'Kaydet': 'save',
    'İptal': 'cancel',
    'Sil': 'delete',
    'Düzenle': 'edit',
    'Oluştur': 'create',
    'Görüntüle': 'view',
    'Ara': 'search',
    'Filtre': 'filter',
    'Başarılı': 'success',
    'Hata': 'error',
    'Uyarı': 'warning',
    'Bilgi': 'info',
    'Yükle': 'upload',
    'İndir': 'download',
    'Dışa Aktar': 'export',
    'İçe Aktar': 'import',
    'Yazdır': 'print',
    'Tarih': 'date',
    'Saat': 'time',
    'Ad': 'name',
    'Başlık': 'title',
    'Açıklama': 'description',
    'Durum': 'status',
    'Tamamlandı': 'completed',
    'Beklemede': 'pending',
    'Onaylandı': 'approved',
    'Reddedildi': 'rejected',
    'Müşteri': 'customer',
    'Kullanıcı': 'user',
    'Rol': 'role',
    'İzin': 'permission',
    'Modül': 'module',
    'Sayfa': 'page',
    'Menü': 'menu',
    'Ayar': 'setting',
    'Ekle': 'add',
    'Güncelle': 'update',
    'Seç': 'select',
    'Temizle': 'clear',
    'Uygula': 'apply',
    'Onayla': 'confirm',
    'Kapat': 'close',
    'Gönder': 'submit',
    'Geri': 'back',
    'İleri': 'next',
    'Önceki': 'previous',
    'Tümü': 'all',
    'Hiçbiri': 'none',
    'Evet': 'yes',
    'Hayır': 'no',
    'Veri bulunamadı': 'noData',
    'Yükleniyor': 'loading',
    'Başarıyla': 'successfully',
    'Gerekli': 'required',
    'Opsiyonel': 'optional',
  };
  
  // Check direct mapping first
  if (mappings[cleanText]) {
    return mappings[cleanText];
  }
  
  // Convert to lowercase and clean
  cleanText = cleanText.toLowerCase()
    .replace(/[ığüşöç]/g, (m) => {
      const map: Record<string, string> = { 'ı': 'i', 'ğ': 'g', 'ü': 'u', 'ş': 's', 'ö': 'o', 'ç': 'c' };
      return map[m] || m;
    })
    .replace(/[^a-z0-9\s]/g, '')
    .replace(/\s+/g, '.')
    .replace(/\.+/g, '.')
    .replace(/^\.|\.$/g, '');
  
  // Limit length
  if (cleanText.length > 40) {
    cleanText = cleanText.substring(0, 40);
  }
  
  return cleanText || 'text';
}

// Determine key prefix based on context
function getKeyPrefix(filePath: string, lineContext: string): string {
  // Check context for common patterns
  if (lineContext.includes('label=') || lineContext.includes('label:')) {
    return 'labels';
  }
  if (lineContext.includes('placeholder=') || lineContext.includes('placeholder:')) {
    return 'placeholders';
  }
  if (lineContext.includes('title=') || lineContext.includes('title:')) {
    return 'titles';
  }
  if (lineContext.includes('description=') || lineContext.includes('description:')) {
    return 'descriptions';
  }
  if (lineContext.includes('button') || lineContext.includes('Button')) {
    return 'buttons';
  }
  if (lineContext.includes('message') || lineContext.includes('Message')) {
    return 'messages';
  }
  if (lineContext.includes('error') || lineContext.includes('Error')) {
    return 'errors';
  }
  if (lineContext.includes('success') || lineContext.includes('Success')) {
    return 'success';
  }
  if (lineContext.includes('table') || lineContext.includes('Table')) {
    return 'table';
  }
  if (lineContext.includes('form') || lineContext.includes('Form')) {
    return 'form';
  }
  if (lineContext.includes('filter') || lineContext.includes('Filter')) {
    return 'filters';
  }
  
  // Check file path
  if (filePath.includes('/components/')) {
    return 'components';
  }
  if (filePath.includes('/pages/') || filePath.includes('/page.tsx')) {
    return 'pages';
  }
  if (filePath.includes('List.tsx')) {
    return 'list';
  }
  if (filePath.includes('Form.tsx')) {
    return 'form';
  }
  
  return 'common';
}

// Add key to translation file
function addKeyToTranslation(key: string, text: string, namespace: string, localesDir: string): void {
  let filePath: string;
  if (namespace === 'global') {
    filePath = path.join(localesDir, 'global', 'tr.json');
  } else if (namespace.startsWith('modules/')) {
    const moduleName = namespace.replace('modules/', '');
    filePath = path.join(localesDir, 'modules', moduleName, 'tr.json');
  } else {
    return;
  }
  
  if (!fs.existsSync(filePath)) {
    // Create file with empty object
    saveJsonFile(filePath, {});
  }
  
  const json = loadJsonFile(filePath) || {};
  
  // Set nested value
  const keys = key.split('.');
  let current = json;
  for (let i = 0; i < keys.length - 1; i++) {
    const k = keys[i];
    if (!(k in current) || typeof current[k] !== 'object' || current[k] === null) {
      current[k] = {};
    }
    current = current[k];
  }
  
  const lastKey = keys[keys.length - 1];
  // Only add if doesn't exist
  if (!(lastKey in current)) {
    current[lastKey] = text;
  }
  
  saveJsonFile(filePath, json);
}

// Determine namespace from file path
function getNamespace(filePath: string): string {
  if (filePath.includes('modules/')) {
    const match = filePath.match(/modules[\\/]([^\\/]+)/);
    if (match) {
      return `modules/${match[1]}`;
    }
  }
  return 'global';
}

// Check if text is already using i18n
function isUsingI18n(line: string, text: string): boolean {
  // Check for t('...'), tGlobal('...'), etc.
  if (line.includes("t('") || line.includes('t("') || line.includes('t(`')) {
    return true;
  }
  if (line.includes("tGlobal('") || line.includes('tGlobal("') || line.includes('tGlobal(`')) {
    return true;
  }
  // Check if text is in a comment
  const textIndex = line.indexOf(text);
  if (textIndex > 0) {
    const before = line.substring(0, textIndex);
    if (before.includes('//') || before.includes('/*') || before.includes('*')) {
      return true;
    }
  }
  return false;
}

// Convert hardcoded text in a file
function convertFile(filePath: string, hardcodedTexts: HardcodedText[], localesDir: string): ConversionResult {
  const result: ConversionResult = {
    file: filePath,
    converted: 0,
    errors: [],
    addedKeys: []
  };
  
  try {
    let content = fs.readFileSync(filePath, 'utf-8');
    const lines = content.split('\n');
    const namespace = getNamespace(filePath);
    
    // Check if file uses i18n
    const hasI18n = content.includes('useTranslation') || content.includes('getServerTranslation');
    if (!hasI18n) {
      // Skip files that don't use i18n
      return result;
    }
    
    // Sort by line number (descending) to avoid line shifts
    const sortedTexts = [...hardcodedTexts].sort((a, b) => b.line - a.line);
    
    for (const hcText of sortedTexts) {
      try {
        const lineIndex = hcText.line - 1;
        if (lineIndex < 0 || lineIndex >= lines.length) {
          continue;
        }
        
        const originalLine = lines[lineIndex];
        
        // Skip if already using i18n
        if (isUsingI18n(originalLine, hcText.text)) {
          continue;
        }
        
        // Skip if in comment
        if (originalLine.trim().startsWith('//') || originalLine.includes('/*') || originalLine.includes('*/')) {
          continue;
        }
        
        // Skip technical strings (URLs, paths, etc.)
        if (hcText.text.includes('://') || hcText.text.includes('@') || hcText.text.includes('\\') || 
            hcText.text.match(/^[a-zA-Z0-9._-]+$/) && hcText.text.length < 10) {
          continue;
        }
        
        // Skip very short texts
        if (hcText.text.trim().length < 3) {
          continue;
        }
        
        // Generate key
        const prefix = getKeyPrefix(filePath, hcText.context);
        const baseKey = generateI18nKey(hcText.text, hcText.context);
        const fullKey = `${prefix}.${baseKey}`;
        
        // Add key to translation file
        addKeyToTranslation(fullKey, hcText.text, namespace, localesDir);
        result.addedKeys.push(fullKey);
        
        // Replace text in line
        // Find the exact string literal containing the text
        const escapedText = hcText.text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        const stringPattern = new RegExp(`(['"\`])${escapedText}\\1`, 'g');
        
        const newLine = originalLine.replace(stringPattern, (match, quote) => {
          // Determine if we're in JSX attribute or content
          const matchIndex = originalLine.indexOf(match);
          const beforeMatch = originalLine.substring(0, matchIndex);
          
          // Check if we're in JSX attribute (has = before)
          if (beforeMatch.includes('=') && !beforeMatch.includes('{')) {
            return `{t('${fullKey}')}`;
          }
          
          // Check if we're in JSX content (has < before)
          if (beforeMatch.includes('<') && beforeMatch.includes('>')) {
            return `{t('${fullKey}')}`;
          }
          
          // Otherwise, it's a regular string
          return `t('${fullKey}')`;
        });
        
        if (newLine !== originalLine) {
          lines[lineIndex] = newLine;
          result.converted++;
        }
      } catch (error: any) {
        result.errors.push(`Line ${hcText.line}: ${error.message}`);
      }
    }
    
    // Write file if changes were made
    if (result.converted > 0) {
      fs.writeFileSync(filePath, lines.join('\n'), 'utf-8');
    }
  } catch (error: any) {
    result.errors.push(`File error: ${error.message}`);
  }
  
  return result;
}

async function main() {
  const report = loadReport();
  if (!report || !report.byFile) {
    console.error('Report not found or invalid');
    process.exit(1);
  }
  
  const srcDir = path.join(process.cwd(), 'src');
  const localesDir = path.join(srcDir, 'locales');
  
  console.log('Converting real hardcoded texts to i18n...\n');
  
  // Process files with most hardcoded texts (top 100)
  const filesToProcess = report.byFile
    .filter((f: any) => f.count > 5) // Only files with more than 5 hardcoded texts
    .sort((a: any, b: any) => b.count - a.count)
    .slice(0, 100); // Process top 100 files
  
  console.log(`Processing ${filesToProcess.length} files...\n`);
  
  const results: ConversionResult[] = [];
  let totalConverted = 0;
  let totalErrors = 0;
  
  for (const fileData of filesToProcess) {
    const filePath = path.join(srcDir, fileData.file.replace(/\//g, path.sep));
    
    if (!fs.existsSync(filePath)) {
      console.log(`⚠ File not found: ${fileData.file}`);
      continue;
    }
    
    const result = convertFile(filePath, fileData.texts, localesDir);
    results.push(result);
    
    if (result.converted > 0 || result.addedKeys.length > 0) {
      console.log(`✓ ${fileData.file}`);
      if (result.converted > 0) {
        console.log(`  - Converted ${result.converted} texts`);
      }
      if (result.addedKeys.length > 0) {
        console.log(`  - Added ${result.addedKeys.length} i18n keys`);
      }
    }
    
    if (result.errors.length > 0) {
      console.log(`  ⚠ ${result.errors.length} errors`);
      totalErrors += result.errors.length;
    }
    
    totalConverted += result.converted;
  }
  
  console.log('\n=== Summary ===');
  console.log(`Files processed: ${results.length}`);
  console.log(`Texts converted: ${totalConverted}`);
  console.log(`Errors: ${totalErrors}`);
  
  // Save results
  const resultsPath = path.join(process.cwd(), 'hardcoded-conversion-results.json');
  fs.writeFileSync(resultsPath, JSON.stringify(results, null, 2), 'utf-8');
  console.log(`\nResults saved to: hardcoded-conversion-results.json`);
  
  console.log('\n⚠ Please run TypeScript check:');
  console.log('  npx tsc --noEmit');
}

main().catch(console.error);






