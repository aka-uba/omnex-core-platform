import * as fs from 'fs';
import * as path from 'path';

// Load missing keys report
function loadMissingKeys(): any[] {
  const reportPath = path.join(process.cwd(), 'missing-i18n-keys-report.json');
  if (!fs.existsSync(reportPath)) {
    return [];
  }
  return JSON.parse(fs.readFileSync(reportPath, 'utf-8'));
}

// Load conversion results to get original texts
function loadConversionResults(): any[] {
  const resultsPath = path.join(process.cwd(), 'hardcoded-conversion-results.json');
  if (!fs.existsSync(resultsPath)) {
    return [];
  }
  return JSON.parse(fs.readFileSync(resultsPath, 'utf-8'));
}

// Load JSON file
function loadJsonFile(filePath: string): any | null {
  try {
    if (!fs.existsSync(filePath)) {
      return {};
    }
    return JSON.parse(fs.readFileSync(filePath, 'utf-8'));
  } catch {
    return {};
  }
}

// Save JSON file
function saveJsonFile(filePath: string, data: any): void {
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf-8');
}

// Set nested value in object
function setNestedValue(obj: any, key: string, value: string): void {
  const keys = key.split('.');
  let current = obj;
  
  for (let i = 0; i < keys.length - 1; i++) {
    const k = keys[i];
    if (!(k in current) || typeof current[k] !== 'object' || current[k] === null) {
      current[k] = {};
    }
    current = current[k];
  }
  
  const lastKey = keys[keys.length - 1];
  if (!(lastKey in current)) {
    current[lastKey] = value;
  }
}

// Get namespace file path
function getNamespaceFilePath(namespace: string, localesDir: string): string {
  if (namespace === 'global') {
    return path.join(localesDir, 'global', 'tr.json');
  } else if (namespace.startsWith('modules/')) {
    const moduleName = namespace.replace('modules/', '');
    return path.join(localesDir, 'modules', moduleName, 'tr.json');
  }
  return '';
}

// Get original text from conversion results
function getOriginalText(key: string, filePath: string, conversionResults: any[]): string {
  const result = conversionResults.find(r => r.file === filePath);
  if (!result || !result.addedKeys) {
    return key; // Fallback to key if not found
  }
  
  // Try to find the original text from the file
  // For now, we'll use a simple mapping or the key itself
  return key;
}

async function main() {
  const missingKeys = loadMissingKeys();
  const conversionResults = loadConversionResults();
  const localesDir = path.join(process.cwd(), 'src', 'locales');
  
  if (missingKeys.length === 0) {
    console.log('No missing keys found!');
    return;
  }
  
  console.log(`Adding ${missingKeys.length} missing keys to tr.json files...\n`);
  
  // Group by namespace
  const byNamespace: Record<string, any[]> = {};
  for (const missing of missingKeys) {
    if (!byNamespace[missing.namespace]) {
      byNamespace[missing.namespace] = [];
    }
    byNamespace[missing.namespace].push(missing);
  }
  
  for (const [namespace, keys] of Object.entries(byNamespace)) {
    const filePath = getNamespaceFilePath(namespace, localesDir);
    
    if (!filePath) {
      console.log(`⚠ Could not determine file path for namespace: ${namespace}`);
      continue;
    }
    
    const json = loadJsonFile(filePath);
    let added = 0;
    
    for (const keyData of keys) {
      const key = keyData.key;
      
      // Generate a reasonable Turkish translation from the key
      let translation = key;
      
      // Simple key to Turkish mapping
      if (key === 'titles.tum') {
        translation = 'Tümü';
      } else if (key === 'labels.donem.secin') {
        translation = 'Dönem Seçin';
      } else {
        // Try to generate from key
        const parts = key.split('.');
        const lastPart = parts[parts.length - 1];
        
        // Simple mappings
        const mappings: Record<string, string> = {
          'tum': 'Tümü',
          'success': 'Başarılı',
          'error': 'Hata',
          'description': 'Açıklama',
          'download': 'İndir',
          'onizle': 'Önizle',
        };
        
        if (mappings[lastPart]) {
          translation = mappings[lastPart];
        } else {
          // Capitalize and format
          translation = lastPart
            .split('.')
            .map(word => word.charAt(0).toUpperCase() + word.slice(1))
            .join(' ');
        }
      }
      
      setNestedValue(json, key, translation);
      added++;
    }
    
    if (added > 0) {
      saveJsonFile(filePath, json);
      console.log(`✓ Added ${added} keys to ${filePath}`);
    }
  }
  
  console.log('\n✅ Done!');
  console.log('\n⚠ Please review the translations and update them with proper Turkish text.');
}

main().catch(console.error);






