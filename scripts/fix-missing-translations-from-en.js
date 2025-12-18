#!/usr/bin/env node

/**
 * Find and fix missing translations based on English (EN) as reference
 * 
 * For each locale file:
 * 1. Load EN (reference) and other locales (TR, DE, AR)
 * 2. Find all keys in EN
 * 3. Check which keys are missing in other locales
 * 4. Add missing keys with:
 *    - TR: Use EN value as placeholder (or translate if possible)
 *    - DE/AR: Use EN value as placeholder (or translate if possible)
 */

const fs = require('fs');
const path = require('path');

const LOCALES_DIR = path.join(__dirname, '..', 'src', 'locales');
const LOCALES = ['tr', 'en', 'de', 'ar'];
const REFERENCE_LOCALE = 'en';

// Translation mappings for common terms (can be expanded)
const TRANSLATION_MAP = {
  tr: {
    'Report': 'Rapor',
    'Reports': 'Raporlar',
    'Create': 'Oluştur',
    'Delete': 'Sil',
    'Edit': 'Düzenle',
    'View': 'Görüntüle',
    'Export': 'Export',
    'Success': 'Başarılı',
    'Error': 'Hata',
    'Completed': 'Tamamlandı',
    'Pending': 'Beklemede',
    'Failed': 'Başarısız',
    'Generating': 'Oluşturuluyor',
  },
  de: {
    'Report': 'Bericht',
    'Reports': 'Berichte',
    'Create': 'Erstellen',
    'Delete': 'Löschen',
    'Edit': 'Bearbeiten',
    'View': 'Anzeigen',
    'Export': 'Exportieren',
    'Success': 'Erfolg',
    'Error': 'Fehler',
    'Completed': 'Abgeschlossen',
    'Pending': 'Ausstehend',
    'Failed': 'Fehlgeschlagen',
    'Generating': 'Wird erstellt',
  },
  ar: {
    'Report': 'تقرير',
    'Reports': 'التقارير',
    'Create': 'إنشاء',
    'Delete': 'حذف',
    'Edit': 'تعديل',
    'View': 'عرض',
    'Export': 'تصدير',
    'Success': 'نجاح',
    'Error': 'خطأ',
    'Completed': 'مكتمل',
    'Pending': 'قيد الانتظار',
    'Failed': 'فشل',
    'Generating': 'قيد الإنشاء',
  },
};

// Get all keys from a nested object
function getAllKeys(obj, prefix = '') {
  const keys = [];
  
  if (typeof obj !== 'object' || obj === null || Array.isArray(obj)) {
    return keys;
  }
  
  Object.keys(obj).forEach(key => {
    const fullKey = prefix ? `${prefix}.${key}` : key;
    
    if (typeof obj[key] === 'object' && obj[key] !== null && !Array.isArray(obj[key])) {
      keys.push(fullKey);
      keys.push(...getAllKeys(obj[key], fullKey));
    } else {
      keys.push(fullKey);
    }
  });
  
  return keys;
}

// Get value by key path
function getValueByPath(obj, keyPath) {
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
function setNestedValue(obj, keyPath, value) {
  const parts = keyPath.split('.');
  let current = obj;
  
  for (let i = 0; i < parts.length - 1; i++) {
    const part = parts[i];
    if (!current[part] || typeof current[part] !== 'object') {
      current[part] = {};
    }
    current = current[part];
  }
  
  current[parts[parts.length - 1]] = value;
}

// Simple translation attempt (basic word replacement)
function attemptTranslation(text, targetLocale) {
  if (typeof text !== 'string') return text;
  
  // For TR, DE, AR, try translation map
  const map = TRANSLATION_MAP[targetLocale] || {};
  let translated = text;
  
  // Try to replace common words
  Object.keys(map).forEach(en => {
    const regex = new RegExp(`\\b${en}\\b`, 'gi');
    translated = translated.replace(regex, map[en]);
  });
  
  // If translation changed, return it, otherwise use placeholder
  if (translated !== text) {
    return translated;
  }
  
  return `[${text}]`; // Placeholder for manual translation
}

// Process a single locale directory
function processLocaleDirectory(dirPath, dirName) {
  const results = {
    directory: dirName,
    files: [],
  };
  
  const enFile = path.join(dirPath, `${REFERENCE_LOCALE}.json`);
  
  if (!fs.existsSync(enFile)) {
    return results;
  }
  
  let enContent;
  try {
    enContent = JSON.parse(fs.readFileSync(enFile, 'utf8'));
  } catch (error) {
    console.log(`   ⚠️  Error parsing ${dirName}/${REFERENCE_LOCALE}.json: ${error.message}`);
    return results;
  }
  
  const enKeys = getAllKeys(enContent);
  
  // Process each target locale (TR, DE, AR)
  ['tr', 'de', 'ar'].forEach(targetLocale => {
    const targetFile = path.join(dirPath, `${targetLocale}.json`);
    let targetContent = {};
    let fileExists = false;
    
    if (fs.existsSync(targetFile)) {
      try {
        targetContent = JSON.parse(fs.readFileSync(targetFile, 'utf8'));
        fileExists = true;
      } catch (error) {
        console.log(`   ⚠️  Error parsing ${dirName}/${targetLocale}.json: ${error.message}`);
      }
    }
    
    const targetKeys = getAllKeys(targetContent);
    const missingKeys = enKeys.filter(key => !targetKeys.includes(key));
    
    if (missingKeys.length > 0) {
      let added = 0;
      
      missingKeys.forEach(key => {
        const enValue = getValueByPath(enContent, key);
        
        if (enValue !== undefined) {
          // Attempt translation
          let valueToUse = enValue;
          
          if (typeof valueToUse === 'string') {
            valueToUse = attemptTranslation(valueToUse, targetLocale);
          }
          
          setNestedValue(targetContent, key, valueToUse);
          added++;
        }
      });
      
      if (added > 0) {
        // Sort keys for better readability
        const sortedContent = sortObjectKeys(targetContent);
        fs.writeFileSync(targetFile, JSON.stringify(sortedContent, null, 2) + '\n', 'utf8');
        
        results.files.push({
          locale: targetLocale,
          added: added,
          keys: missingKeys.slice(0, 10), // First 10 examples
        });
        
        console.log(`   ✅ ${targetLocale.toUpperCase()}: Added ${added} missing keys`);
      }
    } else {
      console.log(`   ✅ ${targetLocale.toUpperCase()}: All keys present`);
    }
  });
  
  return results;
}

// Sort object keys recursively
function sortObjectKeys(obj) {
  if (typeof obj !== 'object' || obj === null || Array.isArray(obj)) {
    return obj;
  }
  
  const sorted = {};
  Object.keys(obj).sort().forEach(key => {
    sorted[key] = sortObjectKeys(obj[key]);
  });
  
  return sorted;
}

// Main execution
console.log('🔍 Finding and fixing missing translations (EN as reference)...\n');
console.log('='.repeat(80));
console.log('');

const allResults = [];

// Process global directory
const globalDir = path.join(LOCALES_DIR, 'global');
if (fs.existsSync(globalDir)) {
  console.log('📁 Processing: global\n');
  const result = processLocaleDirectory(globalDir, 'global');
  if (result.files.length > 0) {
    allResults.push(result);
  }
  console.log('');
}

// Process modules directories
const modulesDir = path.join(LOCALES_DIR, 'modules');
if (fs.existsSync(modulesDir)) {
  const moduleDirs = fs.readdirSync(modulesDir, { withFileTypes: true })
    .filter(entry => entry.isDirectory())
    .map(entry => entry.name);
  
  moduleDirs.forEach(moduleName => {
    const moduleDir = path.join(modulesDir, moduleName);
    console.log(`📁 Processing: modules/${moduleName}\n`);
    const result = processLocaleDirectory(moduleDir, `modules/${moduleName}`);
    if (result.files.length > 0) {
      allResults.push(result);
    }
    console.log('');
  });
}

// Summary
console.log('='.repeat(80));
console.log('📊 SUMMARY\n');

let totalAdded = 0;
allResults.forEach(result => {
  if (result.files.length > 0) {
    console.log(`${result.directory}:`);
    result.files.forEach(file => {
      console.log(`  ${file.locale.toUpperCase()}: ${file.added} keys added`);
      totalAdded += file.added;
    });
  }
});

if (totalAdded === 0) {
  console.log('✅ All locales are in sync with English!');
} else {
  console.log(`\n✅ Total: ${totalAdded} missing translations added across all locales\n`);
  console.log('📝 Note: Translations marked with [text] need manual review and translation.');
  console.log('   EN values are used as base for TR, DE, and AR translations.\n');
}







