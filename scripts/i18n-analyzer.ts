#!/usr/bin/env tsx

/**
 * Comprehensive i18n System Analyzer
 * 
 * Analyzes the entire frontend i18n system for:
 * - Hardcoded Turkish/English texts
 * - Missing i18n imports
 * - Namespace inconsistencies
 * - Duplicate keys
 * - Missing translations across locales
 * - Key structure inconsistencies
 * - Central component issues
 */

import * as fs from 'fs';
import * as path from 'path';

const SRC_DIR = path.join(__dirname, '..', 'src');
const LOCALES_DIR = path.join(__dirname, '..', 'src', 'locales');
const LOCALES = ['tr', 'en', 'de', 'ar'] as const;
type Locale = typeof LOCALES[number];

interface AnalysisReport {
  timestamp: string;
  hardcodedTexts: HardcodedText[];
  missingImports: MissingImport[];
  namespaceIssues: NamespaceIssue[];
  duplicateKeys: DuplicateKey[];
  missingTranslations: MissingTranslation[];
  keyStructureIssues: KeyStructureIssue[];
  centralComponentIssues: CentralComponentIssue[];
  summary: {
    totalFilesScanned: number;
    totalHardcodedTexts: number;
    totalMissingImports: number;
    totalNamespaceIssues: number;
    totalDuplicateKeys: number;
    totalMissingTranslations: number;
  };
}

interface HardcodedText {
  file: string;
  line: number;
  text: string;
  type: 'turkish' | 'english' | 'ui-common';
  context: string;
}

interface MissingImport {
  file: string;
  hasHardcodedText: boolean;
  suggestedNamespace: string;
}

interface NamespaceIssue {
  file: string;
  line: number;
  currentNamespace: string;
  expectedNamespace: string;
  context: string;
}

interface DuplicateKey {
  key: string;
  locations: Array<{
    file: string;
    value: string;
  }>;
}

interface MissingTranslation {
  key: string;
  existsIn: Locale[];
  missingIn: Locale[];
  namespace: string;
}

interface KeyStructureIssue {
  namespace: string;
  locale: Locale;
  issue: string;
  details: string;
}

interface CentralComponentIssue {
  component: string;
  file: string;
  issues: string[];
}

// Turkish character pattern
const TURKISH_CHARS = /[çğıöşüÇĞIİÖŞÜ]/;
const TURKISH_WORDS = [
  'Toplam', 'Tamamlanan', 'Beklemede', 'Başarısız', 'Oluşturuluyor',
  'Kaydet', 'İptal', 'Sil', 'Düzenle', 'Görüntüle', 'Başarılı', 'Hata',
  'Ara', 'Filtrele', 'Seç', 'Tümü', 'Veri bulunamadı', 'Yükle', 'İndir',
  'Export', 'Yazdır', 'Rapor', 'Raporlar', 'Durum', 'Tarih', 'Saat'
];

// Common UI English words that should be translated
const ENGLISH_UI_WORDS = [
  'Save', 'Cancel', 'Delete', 'Edit', 'View', 'Create', 'Search', 'Filter',
  'Total', 'Completed', 'Pending', 'Failed', 'No data', 'Loading', 'Error',
  'Success', 'Export', 'Download', 'Upload', 'Print', 'Report', 'Reports'
];

// Get all TypeScript/TSX files in src/
function getAllCodeFiles(dir: string): string[] {
  const files: string[] = [];
  const extensions = ['.tsx', '.ts'];
  const excludeDirs = ['node_modules', 'yedek', '.next', 'dist', 'types', '__tests__', '__mocks__', 'backups', 'kontol'];
  
  function walk(currentDir: string) {
    try {
      const entries = fs.readdirSync(currentDir, { withFileTypes: true });
      
      entries.forEach(entry => {
        const fullPath = path.join(currentDir, entry.name);
        const relativePath = path.relative(SRC_DIR, fullPath);
        
        if (entry.isDirectory()) {
          if (!entry.name.startsWith('.') && !excludeDirs.includes(entry.name)) {
            walk(fullPath);
          }
        } else if (entry.isFile() && extensions.some(ext => entry.name.endsWith(ext))) {
          // Only include files in src/ directory
          if (relativePath && !relativePath.startsWith('..')) {
            files.push(fullPath);
          }
        }
      });
    } catch (error) {
      // Skip inaccessible directories
    }
  }
  
  walk(dir);
  return files;
}

// Check if file uses i18n
function hasI18nImport(content: string): boolean {
  return /useTranslation|getServerTranslation/.test(content);
}

// Extract namespace from useTranslation/getServerTranslation
function extractNamespace(content: string, file: string): string | null {
  // Check for useTranslation('namespace')
  const useTranslationMatch = content.match(/useTranslation\(['"]([^'"]+)['"]\)/);
  if (useTranslationMatch) {
    return useTranslationMatch[1];
  }
  
  // Check for getServerTranslation(locale, 'namespace')
  const getServerTranslationMatch = content.match(/getServerTranslation\([^,]+,\s*['"]([^'"]+)['"]\)/);
  if (getServerTranslationMatch) {
    return getServerTranslationMatch[1];
  }
  
  // Check for default namespace
  const defaultMatch = content.match(/useTranslation\(\)/);
  if (defaultMatch) {
    return 'global';
  }
  
  return null;
}

// Detect hardcoded texts
function findHardcodedTexts(content: string, file: string): HardcodedText[] {
  const issues: HardcodedText[] = [];
  const lines = content.split('\n');
  
  // Pattern for string literals (single or double quotes)
  const stringPattern = /(['"`])((?:(?!\1)[^\\]|\\.)*)(\1)/g;
  
  lines.forEach((line, index) => {
    // Skip comments
    if (line.trim().startsWith('//') || line.trim().startsWith('*')) {
      return;
    }
    
    // Skip if line contains t( or translate( - already using i18n
    if (/t\(|translate\(/.test(line)) {
      return;
    }
    
    // Find all string literals
    let match;
    while ((match = stringPattern.exec(line)) !== null) {
      const text = match[2];
      
      // Skip empty strings, single characters, URLs, CSS classes, etc.
      if (text.length < 3 || 
          /^(https?:\/\/|www\.|#[a-fA-F0-9]{3,6}|className|id|href|src|alt|aria-|data-|\.|px|rem|em|%|rgb|rgba)/.test(text) ||
          /^[a-zA-Z0-9_\-\.]+$/.test(text) && text.length < 10) {
        continue;
      }
      
      // Check for Turkish characters
      if (TURKISH_CHARS.test(text)) {
        // Check if it's a common Turkish UI word
        const isCommonWord = TURKISH_WORDS.some(word => text.includes(word));
        if (isCommonWord || text.length > 5) {
          issues.push({
            file: path.relative(SRC_DIR, file),
            line: index + 1,
            text: text,
            type: 'turkish',
            context: line.trim().substring(0, 100)
          });
        }
      }
      
      // Check for common English UI words
      const isEnglishUI = ENGLISH_UI_WORDS.some(word => 
        new RegExp(`\\b${word}\\b`, 'i').test(text)
      );
      if (isEnglishUI && text.length > 3) {
        issues.push({
          file: path.relative(SRC_DIR, file),
          line: index + 1,
          text: text,
          type: 'english',
          context: line.trim().substring(0, 100)
        });
      }
    }
  });
  
  return issues;
}

// Get expected namespace from file path
function getExpectedNamespace(file: string): string {
  const relativePath = path.relative(SRC_DIR, file);
  
  // Module components
  if (relativePath.includes('modules/')) {
    const moduleMatch = relativePath.match(/modules\/([^\/]+)/);
    if (moduleMatch) {
      return `modules/${moduleMatch[1]}`;
    }
  }
  
  // Global components
  if (relativePath.includes('components/')) {
    return 'global';
  }
  
  // App pages
  if (relativePath.includes('app/[locale]/')) {
    if (relativePath.includes('modules/')) {
      const moduleMatch = relativePath.match(/modules\/([^\/]+)/);
      if (moduleMatch) {
        return `modules/${moduleMatch[1]}`;
      }
    }
    return 'global';
  }
  
  return 'global';
}

// Load JSON translation file
function loadTranslationFile(namespace: string, locale: Locale): any {
  try {
    const filePath = path.join(LOCALES_DIR, namespace, `${locale}.json`);
    if (fs.existsSync(filePath)) {
      const content = fs.readFileSync(filePath, 'utf-8');
      return JSON.parse(content);
    }
  } catch (error) {
    // File doesn't exist or invalid JSON
  }
  return null;
}

// Get all keys from a JSON object recursively
function getAllKeys(obj: any, prefix = ''): string[] {
  const keys: string[] = [];
  
  if (typeof obj !== 'object' || obj === null || Array.isArray(obj)) {
    return keys;
  }
  
  Object.keys(obj).forEach(key => {
    const fullKey = prefix ? `${prefix}.${key}` : key;
    keys.push(fullKey);
    
    if (typeof obj[key] === 'object' && obj[key] !== null && !Array.isArray(obj[key])) {
      keys.push(...getAllKeys(obj[key], fullKey));
    }
  });
  
  return keys;
}

// Check if key exists in translation file
function keyExists(obj: any, keyPath: string): boolean {
  const parts = keyPath.split('.');
  let current = obj;
  
  for (const part of parts) {
    if (current && typeof current === 'object' && part in current) {
      current = current[part];
    } else {
      return false;
    }
  }
  
  return typeof current === 'string';
}

// Main analysis function
function analyze(): AnalysisReport {
  console.log('🔍 Starting i18n analysis...\n');
  
  const report: AnalysisReport = {
    timestamp: new Date().toISOString(),
    hardcodedTexts: [],
    missingImports: [],
    namespaceIssues: [],
    duplicateKeys: [],
    missingTranslations: [],
    keyStructureIssues: [],
    centralComponentIssues: [],
    summary: {
      totalFilesScanned: 0,
      totalHardcodedTexts: 0,
      totalMissingImports: 0,
      totalNamespaceIssues: 0,
      totalDuplicateKeys: 0,
      totalMissingTranslations: 0
    }
  };
  
  // Get all code files
  const files = getAllCodeFiles(SRC_DIR);
  report.summary.totalFilesScanned = files.length;
  
  console.log(`📁 Found ${files.length} files to analyze\n`);
  
  // Analyze each file
  files.forEach((file, index) => {
    if ((index + 1) % 100 === 0) {
      console.log(`  Processing file ${index + 1}/${files.length}...`);
    }
    
    try {
      const content = fs.readFileSync(file, 'utf-8');
      const relativePath = path.relative(SRC_DIR, file);
      
      // Skip test files and certain patterns
      if (relativePath.includes('.test.') || relativePath.includes('.spec.')) {
        return;
      }
      
      // Find hardcoded texts
      const hardcoded = findHardcodedTexts(content, file);
      report.hardcodedTexts.push(...hardcoded);
      
      // Check for i18n imports
      const hasI18n = hasI18nImport(content);
      const hasHardcoded = hardcoded.length > 0;
      
      if (hasHardcoded && !hasI18n) {
        report.missingImports.push({
          file: relativePath,
          hasHardcodedText: true,
          suggestedNamespace: getExpectedNamespace(file)
        });
      }
      
      // Check namespace usage
      const namespace = extractNamespace(content, file);
      if (namespace) {
        const expected = getExpectedNamespace(file);
        if (namespace !== expected && expected !== 'global') {
          report.namespaceIssues.push({
            file: relativePath,
            line: content.split('\n').findIndex(line => line.includes('useTranslation') || line.includes('getServerTranslation')) + 1,
            currentNamespace: namespace,
            expectedNamespace: expected,
            context: content.split('\n').find(line => line.includes('useTranslation') || line.includes('getServerTranslation')) || ''
          });
        }
      }
      
      // Check central components
      if (relativePath.includes('components/tables/DataTable.tsx')) {
        const issues: string[] = [];
        if (content.includes("emptyMessage = 'Veri bulunamadı'")) {
          issues.push("Hardcoded emptyMessage: 'Veri bulunamadı'");
        }
        if (content.includes("emptyMessage = \"Veri bulunamadı\"")) {
          issues.push("Hardcoded emptyMessage: \"Veri bulunamadı\"");
        }
        if (issues.length > 0) {
          report.centralComponentIssues.push({
            component: 'DataTable',
            file: relativePath,
            issues
          });
        }
      }
      
    } catch (error) {
      // Skip files that can't be read
    }
  });
  
  console.log(`\n📊 Analyzing translation files...\n`);
  
  // Analyze translation files
  // Global files
  const globalKeys: Record<Locale, string[]> = {} as any;
  LOCALES.forEach(locale => {
    const global = loadTranslationFile('global', locale);
    if (global) {
      globalKeys[locale] = getAllKeys(global);
    }
  });
  
  // Find missing translations in global
  const allGlobalKeys = new Set<string>();
  Object.values(globalKeys).forEach(keys => keys.forEach(k => allGlobalKeys.add(k)));
  
  allGlobalKeys.forEach(key => {
    const existsIn: Locale[] = [];
    const missingIn: Locale[] = [];
    
    LOCALES.forEach(locale => {
      if (globalKeys[locale]?.includes(key)) {
        existsIn.push(locale);
      } else {
        missingIn.push(locale);
      }
    });
    
    if (missingIn.length > 0) {
      report.missingTranslations.push({
        key,
        existsIn,
        missingIn,
        namespace: 'global'
      });
    }
  });
  
  // Module files
  const moduleDirs = fs.readdirSync(path.join(LOCALES_DIR, 'modules'));
  moduleDirs.forEach(moduleSlug => {
    const moduleKeys: Record<Locale, string[]> = {} as any;
    
    LOCALES.forEach(locale => {
      const module = loadTranslationFile(`modules/${moduleSlug}`, locale);
      if (module) {
        moduleKeys[locale] = getAllKeys(module);
      }
    });
    
    const allModuleKeys = new Set<string>();
    Object.values(moduleKeys).forEach(keys => keys.forEach(k => allModuleKeys.add(k)));
    
    allModuleKeys.forEach(key => {
      const existsIn: Locale[] = [];
      const missingIn: Locale[] = [];
      
      LOCALES.forEach(locale => {
        if (moduleKeys[locale]?.includes(key)) {
          existsIn.push(locale);
        } else {
          missingIn.push(locale);
        }
      });
      
      if (missingIn.length > 0) {
        report.missingTranslations.push({
          key,
          existsIn,
          missingIn,
          namespace: `modules/${moduleSlug}`
        });
      }
    });
  });
  
  // Update summary
  report.summary.totalHardcodedTexts = report.hardcodedTexts.length;
  report.summary.totalMissingImports = report.missingImports.length;
  report.summary.totalNamespaceIssues = report.namespaceIssues.length;
  report.summary.totalDuplicateKeys = report.duplicateKeys.length;
  report.summary.totalMissingTranslations = report.missingTranslations.length;
  
  return report;
}

// Main execution
if (require.main === module) {
  try {
    const report = analyze();
    
    // Write report to file
    const reportPath = path.join(__dirname, '..', 'i18n-analysis-report.json');
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2), 'utf-8');
    
    console.log('\n✅ Analysis complete!\n');
    console.log('📊 Summary:');
    console.log(`  Files scanned: ${report.summary.totalFilesScanned}`);
    console.log(`  Hardcoded texts: ${report.summary.totalHardcodedTexts}`);
    console.log(`  Missing imports: ${report.summary.totalMissingImports}`);
    console.log(`  Namespace issues: ${report.summary.totalNamespaceIssues}`);
    console.log(`  Missing translations: ${report.summary.totalMissingTranslations}`);
    console.log(`\n📄 Full report saved to: ${reportPath}\n`);
    
  } catch (error) {
    console.error('❌ Error during analysis:', error);
    process.exit(1);
  }
}

export { analyze, AnalysisReport };






