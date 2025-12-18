#!/usr/bin/env tsx

/**
 * Complete i18n Fix Script
 * 
 * 1. Replaces placeholder translations with proper translations
 * 2. Fixes hardcoded texts in components
 * 3. Adds missing i18n imports
 * 
 * TypeScript-safe and follows OMNEX standards
 */

import * as fs from 'fs';
import * as path from 'path';

const SRC_DIR = path.join(__dirname, '..', 'src');
const LOCALES_DIR = path.join(__dirname, '..', 'src', 'locales');
const LOCALES = ['tr', 'en', 'de', 'ar'] as const;
const REPORT_PATH = path.join(__dirname, '..', 'i18n-analysis-report.json');

// Common translation mappings (can be expanded)
const TRANSLATION_MAP: Record<string, Record<string, string>> = {
  en: {
    'Toplam Rapor': 'Total Reports',
    'Tamamlanan': 'Completed',
    'Beklemede': 'Pending',
    'Başarısız': 'Failed',
    'Oluşturuluyor': 'Generating',
    'Veri bulunamadı': 'No data found',
    'Başarılı': 'Success',
    'Hata': 'Error',
    'Kaydet': 'Save',
    'İptal': 'Cancel',
    'Sil': 'Delete',
    'Düzenle': 'Edit',
    'Görüntüle': 'View',
    'Oluştur': 'Create',
    'Ara': 'Search',
    'Filtrele': 'Filter',
    'Seç': 'Select',
    'Tümü': 'All',
  },
  de: {
    'Toplam Rapor': 'Gesamtberichte',
    'Tamamlanan': 'Abgeschlossen',
    'Beklemede': 'Ausstehend',
    'Başarısız': 'Fehlgeschlagen',
    'Oluşturuluyor': 'Wird erstellt',
    'Veri bulunamadı': 'Keine Daten gefunden',
    'Başarılı': 'Erfolg',
    'Hata': 'Fehler',
    'Kaydet': 'Speichern',
    'İptal': 'Abbrechen',
    'Sil': 'Löschen',
    'Düzenle': 'Bearbeiten',
    'Görüntüle': 'Anzeigen',
    'Oluştur': 'Erstellen',
    'Ara': 'Suchen',
    'Filtrele': 'Filtern',
    'Seç': 'Auswählen',
    'Tümü': 'Alle',
  },
  ar: {
    'Toplam Rapor': 'إجمالي التقارير',
    'Tamamlanan': 'مكتمل',
    'Beklemede': 'قيد الانتظار',
    'Başarısız': 'فشل',
    'Oluşturuluyor': 'قيد الإنشاء',
    'Veri bulunamadı': 'لم يتم العثور على بيانات',
    'Başarılı': 'نجاح',
    'Hata': 'خطأ',
    'Kaydet': 'حفظ',
    'İptal': 'إلغاء',
    'Sil': 'حذف',
    'Düzenle': 'تعديل',
    'Görüntüle': 'عرض',
    'Oluştur': 'إنشاء',
    'Ara': 'بحث',
    'Filtrele': 'تصفية',
    'Seç': 'اختيار',
    'Tümü': 'الكل',
  },
};

// Get value by key path
function getValueByPath(obj: any, keyPath: string): any {
  const parts = keyPath.split('.');
  let current = obj;
  
  for (const part of parts) {
    if (current && typeof current === 'object' && part in current) {
      current = current[part];
    } else {
      return undefined;
    }
  }
  
  return current;
}

// Set nested value by key path
function setNestedValue(obj: any, keyPath: string, value: any): void {
  const parts = keyPath.split('.');
  let current = obj;
  
  for (let i = 0; i < parts.length - 1; i++) {
    const part = parts[i];
    if (!(part in current) || typeof current[part] !== 'object' || current[part] === null) {
      current[part] = {};
    }
    current = current[part];
  }
  
  current[parts[parts.length - 1]] = value;
}

// Translate placeholder text
function translatePlaceholder(text: string, targetLocale: string): string {
  // Remove [TR] or [EN] prefix
  const cleaned = text.replace(/^\[(TR|EN)\]\s*/, '');
  
  // Try direct mapping
  if (TRANSLATION_MAP[targetLocale] && TRANSLATION_MAP[targetLocale][cleaned]) {
    return TRANSLATION_MAP[targetLocale][cleaned];
  }
  
  // For English, return cleaned text (it's likely already English)
  if (targetLocale === 'en') {
    return cleaned;
  }
  
  // For other locales, return placeholder with note
  return `[TODO: Translate] ${cleaned}`;
}

// Fix placeholder translations
function fixPlaceholderTranslations(): void {
  console.log('🔧 Fixing placeholder translations...\n');
  
  let fixed = 0;
  
  // Process all namespace directories
  const namespaces = ['global', ...fs.readdirSync(path.join(LOCALES_DIR, 'modules')).map(m => `modules/${m}`)];
  
  namespaces.forEach(namespace => {
    const namespacePath = path.join(LOCALES_DIR, namespace);
    if (!fs.existsSync(namespacePath)) return;
    
    LOCALES.forEach(locale => {
      const filePath = path.join(namespacePath, `${locale}.json`);
      if (!fs.existsSync(filePath)) return;
      
      try {
        const data = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
        let modified = false;
        
        // Recursively find and replace placeholders
        function processObject(obj: any, keyPath = ''): void {
          if (typeof obj !== 'object' || obj === null || Array.isArray(obj)) {
            return;
          }
          
          Object.keys(obj).forEach(key => {
            const fullKey = keyPath ? `${keyPath}.${key}` : key;
            const value = obj[key];
            
            if (typeof value === 'string' && /^\[(TR|EN)\]\s*/.test(value)) {
              const translated = translatePlaceholder(value, locale);
              if (translated !== value) {
                obj[key] = translated;
                modified = true;
                fixed++;
              }
            } else if (typeof value === 'object' && value !== null) {
              processObject(value, fullKey);
            }
          });
        }
        
        processObject(data);
        
        if (modified) {
          fs.writeFileSync(filePath, JSON.stringify(data, null, 2) + '\n', 'utf-8');
        }
      } catch (error) {
        console.warn(`⚠️  Could not process ${filePath}: ${error}`);
      }
    });
  });
  
  console.log(`✅ Fixed ${fixed} placeholder translations\n`);
}

// Get expected namespace from file path
function getExpectedNamespace(file: string): string {
  const relativePath = path.relative(SRC_DIR, file);
  
  if (relativePath.includes('modules/')) {
    const moduleMatch = relativePath.match(/modules\/([^\/]+)/);
    if (moduleMatch) {
      return `modules/${moduleMatch[1]}`;
    }
  }
  
  return 'global';
}

// Check if file needs i18n import
function needsI18nImport(content: string): boolean {
  return !/useTranslation|getServerTranslation/.test(content);
}

// Add i18n import to file
function addI18nImport(file: string, content: string, namespace: string): string {
  const isClient = content.includes("'use client'") || content.includes('"use client"');
  const isServer = content.includes('async') && (content.includes('params:') || content.includes('request:'));
  
  // Check if already has import
  if (!needsI18nImport(content)) {
    return content;
  }
  
  // Determine import type
  const importStatement = isClient
    ? `import { useTranslation } from '@/lib/i18n/client';`
    : `import { getServerTranslation } from '@/lib/i18n/server';`;
  
  // Find last import statement
  const importRegex = /^import\s+.*$/gm;
  const imports = content.match(importRegex) || [];
  const lastImport = imports[imports.length - 1];
  
  if (lastImport) {
    const lastImportIndex = content.lastIndexOf(lastImport) + lastImport.length;
    const beforeImports = content.substring(0, lastImportIndex);
    const afterImports = content.substring(lastImportIndex);
    
    // Add new import after last import
    return beforeImports + '\n' + importStatement + afterImports;
  } else {
    // No imports, add at the beginning (after 'use client' if present)
    const useClientMatch = content.match(/^('use client'|"use client")\s*\n/);
    if (useClientMatch) {
      const afterUseClient = content.indexOf('\n', useClientMatch.index! + useClientMatch[0].length);
      return content.substring(0, afterUseClient + 1) + importStatement + '\n' + content.substring(afterUseClient + 1);
    }
    return importStatement + '\n' + content;
  }
}

// Fix hardcoded texts in a file
function fixHardcodedTexts(file: string, content: string, namespace: string): { content: string; fixed: number } {
  let fixed = 0;
  let modified = content;
  
  // Common Turkish patterns to replace
  const replacements: Array<{ pattern: RegExp; replacement: string; key: string }> = [
    { pattern: /['"]Toplam Rapor['"]/g, replacement: "t('metrics.total')", key: 'metrics.total' },
    { pattern: /['"]Tamamlanan['"]/g, replacement: "t('metrics.completed')", key: 'metrics.completed' },
    { pattern: /['"]Beklemede['"]/g, replacement: "t('metrics.pending')", key: 'metrics.pending' },
    { pattern: /['"]Başarısız['"]/g, replacement: "t('metrics.failed')", key: 'metrics.failed' },
    { pattern: /['"]Veri bulunamadı['"]/g, replacement: "tGlobal('empty.message')", key: 'empty.message' },
    { pattern: /['"]Başarılı['"]/g, replacement: "t('actions.success')", key: 'actions.success' },
    { pattern: /['"]Hata['"]/g, replacement: "t('actions.error')", key: 'actions.error' },
  ];
  
  // Check if file has useTranslation
  const hasTranslation = /useTranslation|getServerTranslation/.test(modified);
  const isClient = modified.includes("'use client'") || modified.includes('"use client"');
  
  // Add translation hook if needed
  if (!hasTranslation && (replacements.some(r => r.pattern.test(modified)))) {
    modified = addI18nImport(file, modified, namespace);
    
    // Add hook call
    if (isClient) {
      // Find function component
      const functionMatch = modified.match(/(export\s+)?(function|const)\s+(\w+)\s*[=\(]/);
      if (functionMatch) {
        const afterFunction = modified.indexOf('{', functionMatch.index!);
        if (afterFunction > 0) {
          const hookCall = `  const { t } = useTranslation('${namespace}');\n  const { t: tGlobal } = useTranslation('global');\n`;
          modified = modified.substring(0, afterFunction + 1) + '\n' + hookCall + modified.substring(afterFunction + 1);
        }
      }
    }
  }
  
  // Apply replacements
  replacements.forEach(({ pattern, replacement }) => {
    if (pattern.test(modified)) {
      modified = modified.replace(pattern, replacement);
      fixed++;
    }
  });
  
  return { content: modified, fixed };
}

// Fix missing imports and hardcoded texts
function fixComponents(report: any): void {
  console.log('🔧 Fixing components (imports and hardcoded texts)...\n');
  
  const missingImports = report.missingImports || [];
  const hardcodedTexts = report.hardcodedTexts || [];
  
  // Group by file
  const filesToFix = new Map<string, { imports: boolean; texts: any[] }>();
  
  missingImports.forEach((mi: any) => {
    if (!filesToFix.has(mi.file)) {
      filesToFix.set(mi.file, { imports: true, texts: [] });
    } else {
      filesToFix.get(mi.file)!.imports = true;
    }
  });
  
  hardcodedTexts.forEach((ht: any) => {
    if (!filesToFix.has(ht.file)) {
      filesToFix.set(ht.file, { imports: false, texts: [] });
    }
    filesToFix.get(ht.file)!.texts.push(ht);
  });
  
  let totalFixed = 0;
  let filesProcessed = 0;
  
  // Process each file (limit to first 100 for safety)
  const filesArray = Array.from(filesToFix.entries()).slice(0, 100);
  
  filesArray.forEach(([filePath, data]) => {
    const fullPath = path.join(SRC_DIR, filePath);
    
    if (!fs.existsSync(fullPath)) {
      return;
    }
    
    try {
      let content = fs.readFileSync(fullPath, 'utf-8');
      const namespace = getExpectedNamespace(fullPath);
      let modified = false;
      let fixed = 0;
      
      // Add import if needed
      if (data.imports && needsI18nImport(content)) {
        content = addI18nImport(fullPath, content, namespace);
        modified = true;
      }
      
      // Fix hardcoded texts
      if (data.texts.length > 0) {
        const result = fixHardcodedTexts(fullPath, content, namespace);
        if (result.fixed > 0) {
          content = result.content;
          fixed += result.fixed;
          modified = true;
        }
      }
      
      if (modified) {
        fs.writeFileSync(fullPath, content, 'utf-8');
        totalFixed += fixed;
        filesProcessed++;
        
        if (filesProcessed % 10 === 0) {
          console.log(`  Processed ${filesProcessed} files...`);
        }
      }
    } catch (error) {
      console.warn(`⚠️  Could not process ${filePath}: ${error}`);
    }
  });
  
  console.log(`✅ Fixed ${totalFixed} issues in ${filesProcessed} files\n`);
}

// Main execution
if (require.main === module) {
  try {
    console.log('🚀 Starting complete i18n fixes...\n');
    
    // Load report
    if (!fs.existsSync(REPORT_PATH)) {
      console.error('❌ Analysis report not found. Please run i18n-analyzer.ts first.');
      process.exit(1);
    }
    
    const report = JSON.parse(fs.readFileSync(REPORT_PATH, 'utf-8'));
    
    // Step 1: Fix placeholder translations
    fixPlaceholderTranslations();
    
    // Step 2: Fix components
    fixComponents(report);
    
    console.log('✅ Complete fixes finished!\n');
    console.log('📝 Next steps:');
    console.log('  1. Review and test the changes');
    console.log('  2. Run typecheck: npm run typecheck');
    console.log('  3. Fix any remaining [TODO: Translate] placeholders manually');
    console.log('  4. Test the application\n');
    
  } catch (error) {
    console.error('❌ Error during fixes:', error);
    process.exit(1);
  }
}

export { fixPlaceholderTranslations, fixComponents };






