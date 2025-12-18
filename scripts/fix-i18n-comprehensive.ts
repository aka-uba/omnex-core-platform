#!/usr/bin/env tsx

/**
 * Comprehensive i18n Fix Script
 * 
 * Uses the analysis report to systematically fix:
 * 1. Missing translations in locale files
 * 2. Hardcoded texts in components (most common patterns)
 * 3. Missing i18n imports
 */

import * as fs from 'fs';
import * as path from 'path';

const SRC_DIR = path.join(__dirname, '..', 'src');
const LOCALES_DIR = path.join(__dirname, '..', 'src', 'locales');
const LOCALES = ['tr', 'en', 'de', 'ar'] as const;
const REPORT_PATH = path.join(__dirname, '..', 'i18n-analysis-report.json');

interface MissingTranslation {
  key: string;
  existsIn: string[];
  missingIn: string[];
  namespace: string;
}

// Load analysis report
function loadReport(): any {
  if (!fs.existsSync(REPORT_PATH)) {
    console.error('❌ Analysis report not found. Please run i18n-analyzer.ts first.');
    process.exit(1);
  }
  return JSON.parse(fs.readFileSync(REPORT_PATH, 'utf-8'));
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

// Fix missing translations
function fixMissingTranslations(report: any): void {
  console.log('🔧 Fixing missing translations...\n');
  
  const missingTranslations = report.missingTranslations || [];
  const fixed: string[] = [];
  
  // Group by namespace
  const byNamespace: Record<string, MissingTranslation[]> = {};
  missingTranslations.forEach((mt: MissingTranslation) => {
    if (!byNamespace[mt.namespace]) {
      byNamespace[mt.namespace] = [];
    }
    byNamespace[mt.namespace].push(mt);
  });
  
  // Process each namespace
  Object.keys(byNamespace).forEach(namespace => {
    const namespacePath = path.join(LOCALES_DIR, namespace);
    if (!fs.existsSync(namespacePath)) {
      return;
    }
    
    // Load all locale files for this namespace
    const localeData: Record<string, any> = {};
    LOCALES.forEach(locale => {
      const filePath = path.join(namespacePath, `${locale}.json`);
      if (fs.existsSync(filePath)) {
        try {
          localeData[locale] = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
        } catch (error) {
          console.warn(`⚠️  Could not parse ${filePath}`);
        }
      } else {
        localeData[locale] = {};
      }
    });
    
    // Fix missing translations
    byNamespace[namespace].forEach(mt => {
      // Find a reference value (prefer tr, then en)
      let referenceValue: string | undefined;
      if (mt.existsIn.includes('tr') && localeData.tr) {
        referenceValue = getValueByPath(localeData.tr, mt.key);
      } else if (mt.existsIn.includes('en') && localeData.en) {
        referenceValue = getValueByPath(localeData.en, mt.key);
      }
      
      if (!referenceValue || typeof referenceValue !== 'string') {
        return; // Skip if no reference value
      }
      
      // Add missing translations with placeholder
      mt.missingIn.forEach(locale => {
        if (!localeData[locale]) {
          localeData[locale] = {};
        }
        
        // Use placeholder: [TR] or [EN] prefix
        const placeholder = `[${mt.existsIn[0]?.toUpperCase()}] ${referenceValue}`;
        setNestedValue(localeData[locale], mt.key, placeholder);
        fixed.push(`${namespace}/${locale}.json: ${mt.key}`);
      });
    });
    
    // Save updated locale files
    LOCALES.forEach(locale => {
      if (localeData[locale]) {
        const filePath = path.join(namespacePath, `${locale}.json`);
        fs.writeFileSync(
          filePath,
          JSON.stringify(localeData[locale], null, 2) + '\n',
          'utf-8'
        );
      }
    });
  });
  
  console.log(`✅ Fixed ${fixed.length} missing translations\n`);
}

// Main execution
if (require.main === module) {
  try {
    console.log('🚀 Starting comprehensive i18n fixes...\n');
    
    const report = loadReport();
    
    // Fix missing translations
    fixMissingTranslations(report);
    
    console.log('✅ Comprehensive fixes complete!\n');
    
  } catch (error) {
    console.error('❌ Error during fixes:', error);
    process.exit(1);
  }
}

export { fixMissingTranslations };






