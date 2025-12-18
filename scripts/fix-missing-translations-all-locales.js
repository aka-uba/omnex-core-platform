#!/usr/bin/env node

/**
 * Find and fix missing translations in all locale files
 * 
 * For each locale file:
 * 1. Load TR (reference) and other locales (EN, DE, AR)
 * 2. Find all keys in TR
 * 3. Check which keys are missing in other locales
 * 4. Add missing keys with:
 *    - EN: Use TR value as placeholder (or translate if possible)
 *    - DE/AR: Use EN value as placeholder (or translate if possible)
 */

const fs = require('fs');
const path = require('path');

const LOCALES_DIR = path.join(__dirname, '..', 'src', 'locales');
const LOCALES = ['tr', 'en', 'de', 'ar'];
const REFERENCE_LOCALE = 'tr';

// Translation mappings for common terms (can be expanded)
const TRANSLATION_MAP = {
  de: {
    'Rapor': 'Bericht',
    'Raporlar': 'Berichte',
    'Oluştur': 'Erstellen',
    'Sil': 'Löschen',
    'Düzenle': 'Bearbeiten',
    'Görüntüle': 'Anzeigen',
    'Export': 'Exportieren',
    'Başarılı': 'Erfolg',
    'Hata': 'Fehler',
    'Tamamlandı': 'Abgeschlossen',
    'Beklemede': 'Ausstehend',
    'Başarısız': 'Fehlgeschlagen',
    'Oluşturuluyor': 'Wird erstellt',
  },
  ar: {
    'Rapor': 'تقرير',
    'Raporlar': 'التقارير',
    'Oluştur': 'إنشاء',
    'Sil': 'حذف',
    'Düzenle': 'تعديل',
    'Görüntüle': 'عرض',
    'Export': 'تصدير',
    'Başarılı': 'نجاح',
    'Hata': 'خطأ',
    'Tamamlandı': 'مكتمل',
    'Beklemede': 'قيد الانتظار',
    'Başarısız': 'فشل',
    'Oluşturuluyor': 'قيد الإنشاء',
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
  
  if (targetLocale === 'en') {
    // For EN, try to keep English if it's already English, otherwise use TR as placeholder
    if (/^[A-Za-z\s]+$/.test(text) && text.length > 2) {
      return text; // Already English
    }
    return `[${text}]`; // Placeholder
  }
  
  // For DE and AR, try translation map
  const map = TRANSLATION_MAP[targetLocale] || {};
  let translated = text;
  
  // Try to replace common words
  Object.keys(map).forEach(tr => {
    const regex = new RegExp(tr, 'gi');
    translated = translated.replace(regex, map[tr]);
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
  
  const trFile = path.join(dirPath, `${REFERENCE_LOCALE}.json`);
  
  if (!fs.existsSync(trFile)) {
    return results;
  }
  
  let trContent;
  try {
    trContent = JSON.parse(fs.readFileSync(trFile, 'utf8'));
  } catch (error) {
    console.log(`   ⚠️  Error parsing ${dirName}/${REFERENCE_LOCALE}.json: ${error.message}`);
    return results;
  }
  
  const trKeys = getAllKeys(trContent);
  
  // Process each target locale
  ['en', 'de', 'ar'].forEach(targetLocale => {
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
    const missingKeys = trKeys.filter(key => !targetKeys.includes(key));
    
    if (missingKeys.length > 0) {
      let added = 0;
      
      missingKeys.forEach(key => {
        const trValue = getValueByPath(trContent, key);
        
        if (trValue !== undefined) {
          // Try to get EN value first if available
          let valueToUse = trValue;
          
          if (targetLocale !== 'en' && fileExists) {
            const enFile = path.join(dirPath, 'en.json');
            if (fs.existsSync(enFile)) {
              try {
                const enContent = JSON.parse(fs.readFileSync(enFile, 'utf8'));
                const enValue = getValueByPath(enContent, key);
                if (enValue && typeof enValue === 'string' && !enValue.startsWith('[')) {
                  valueToUse = enValue;
                }
              } catch (error) {
                // Ignore
              }
            }
          }
          
          // Attempt translation
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
console.log('🔍 Finding and fixing missing translations...\n');
console.log('='.repeat(80));
console.log('');

const allResults = [];

// Process global directory
const globalDir = path.join(LOCALES_DIR, 'global');
if (fs.existsSync(globalDir)) {
  console.log('📁 Processing: global\n');
  const result = processLocaleDirectory(globalDir, 'global');
  allResults.push(result);
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

console.log(`\n✅ Total: ${totalAdded} missing translations added across all locales\n`);
console.log('📝 Note: Translations marked with [text] need manual review and translation.');
console.log('   EN values are used as fallback for DE and AR when available.\n');







