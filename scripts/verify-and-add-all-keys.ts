import * as fs from 'fs';
import * as path from 'path';

// Load conversion results
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

// Check if key exists
function keyExists(key: string, json: any): boolean {
  if (!json || typeof json !== 'object') {
    return false;
  }
  
  const keys = key.split('.');
  let current = json;
  
  for (const k of keys) {
    if (!(k in current)) {
      return false;
    }
    if (keys.indexOf(k) < keys.length - 1) {
      if (typeof current[k] !== 'object' || current[k] === null) {
        return false;
      }
    }
    current = current[k];
  }
  
  return typeof current === 'string';
}

// Set nested value
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
  current[lastKey] = value;
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

// Generate Turkish translation from key
function generateTurkishTranslation(key: string): string {
  // Common mappings
  const mappings: Record<string, string> = {
    'titles.success': 'Başarılı',
    'titles.error': 'Hata',
    'titles.download': 'İndir',
    'titles.onizle': 'Önizle',
    'titles.tum': 'Tümü',
    'common.tum': 'Tümü',
    'common.no': 'Hayır',
    'common.basariyla': 'Başarıyla',
    'common.yapilandirma': 'Yapılandırma',
    'common.description': 'Açıklama',
    'table.description': 'Açıklama',
    'form.description': 'Açıklama',
    'form.subscription': 'Abonelik',
    'list.subscription': 'Abonelik',
    'labels.donem.secin': 'Dönem Seçin',
    'errors.tum': 'Tümü',
    'errors.description': 'Açıklama',
  };
  
  if (mappings[key]) {
    return mappings[key];
  }
  
  // Try to generate from key parts
  const parts = key.split('.');
  const lastPart = parts[parts.length - 1];
  
  // Simple word mappings
  const wordMappings: Record<string, string> = {
    'success': 'Başarılı',
    'error': 'Hata',
    'download': 'İndir',
    'description': 'Açıklama',
    'subscription': 'Abonelik',
    'tum': 'Tümü',
    'no': 'Hayır',
    'basariyla': 'Başarıyla',
    'yapilandirma': 'Yapılandırma',
  };
  
  if (wordMappings[lastPart]) {
    return wordMappings[lastPart];
  }
  
  // Default: use key as placeholder
  return `[TODO: ${key}]`;
}

async function main() {
  const results = loadConversionResults();
  const localesDir = path.join(process.cwd(), 'src', 'locales');
  
  console.log('Verifying and adding missing i18n keys...\n');
  
  const missingByNamespace: Record<string, Array<{ key: string; file: string }>> = {};
  let totalMissing = 0;
  
  for (const result of results) {
    if (!result.addedKeys || result.addedKeys.length === 0) continue;
    
    const namespace = getNamespace(result.file);
    const filePath = getNamespaceFilePath(namespace, localesDir);
    
    if (!filePath) {
      console.log(`⚠ Could not determine file path for: ${result.file}`);
      continue;
    }
    
    if (!fs.existsSync(filePath)) {
      console.log(`⚠ File not found: ${filePath}`);
      // Create file
      saveJsonFile(filePath, {});
    }
    
    const json = loadJsonFile(filePath);
    
    if (!missingByNamespace[namespace]) {
      missingByNamespace[namespace] = [];
    }
    
    for (const key of result.addedKeys) {
      if (!keyExists(key, json)) {
        missingByNamespace[namespace].push({ key, file: result.file });
        totalMissing++;
      }
    }
  }
  
  if (totalMissing === 0) {
    console.log('✅ All keys exist in tr.json files!');
    return;
  }
  
  console.log(`Found ${totalMissing} missing keys across ${Object.keys(missingByNamespace).length} namespaces.\n`);
  
  // Add missing keys
  for (const [namespace, missingKeys] of Object.entries(missingByNamespace)) {
    const filePath = getNamespaceFilePath(namespace, localesDir);
    const json = loadJsonFile(filePath);
    let added = 0;
    
    for (const { key } of missingKeys) {
      const translation = generateTurkishTranslation(key);
      setNestedValue(json, key, translation);
      added++;
    }
    
    if (added > 0) {
      saveJsonFile(filePath, json);
      console.log(`✓ Added ${added} keys to ${namespace} (${filePath})`);
    }
  }
  
  console.log('\n✅ Done!');
  console.log('\n⚠ Please review the translations and update [TODO: ...] placeholders with proper Turkish text.');
}

main().catch(console.error);






