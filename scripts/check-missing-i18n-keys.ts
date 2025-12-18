import * as fs from 'fs';
import * as path from 'path';

interface MissingKey {
  namespace: string;
  key: string;
  file: string;
  expectedValue: string;
}

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
      return null;
    }
    return JSON.parse(fs.readFileSync(filePath, 'utf-8'));
  } catch {
    return null;
  }
}

// Check if key exists in JSON
function keyExists(key: string, json: any): boolean {
  if (!json || typeof json !== 'object') {
    return false;
  }
  
  const keys = key.split('.');
  let current = json;
  
  for (const k of keys) {
    if (!(k in current) || typeof current[k] !== 'object' && keys.indexOf(k) < keys.length - 1) {
      return false;
    }
    current = current[k];
  }
  
  return typeof current === 'string';
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

async function main() {
  const results = loadConversionResults();
  const localesDir = path.join(process.cwd(), 'src', 'locales');
  const missingKeys: MissingKey[] = [];
  
  console.log('Checking if all added i18n keys exist in tr.json files...\n');
  
  for (const result of results) {
    if (result.addedKeys.length === 0) continue;
    
    const namespace = getNamespace(result.file);
    const filePath = getNamespaceFilePath(namespace, localesDir);
    
    if (!filePath || !fs.existsSync(filePath)) {
      console.log(`⚠ File not found: ${filePath}`);
      for (const key of result.addedKeys) {
        missingKeys.push({
          namespace,
          key,
          file: result.file,
          expectedValue: key // We don't have the original text, use key as placeholder
        });
      }
      continue;
    }
    
    const json = loadJsonFile(filePath);
    if (!json) {
      console.log(`⚠ Could not load: ${filePath}`);
      continue;
    }
    
    for (const key of result.addedKeys) {
      if (!keyExists(key, json)) {
        missingKeys.push({
          namespace,
          key,
          file: result.file,
          expectedValue: key
        });
      }
    }
  }
  
  if (missingKeys.length === 0) {
    console.log('✅ All keys exist in tr.json files!');
  } else {
    console.log(`❌ Found ${missingKeys.length} missing keys:\n`);
    
    // Group by namespace
    const byNamespace: Record<string, MissingKey[]> = {};
    for (const missing of missingKeys) {
      if (!byNamespace[missing.namespace]) {
        byNamespace[missing.namespace] = [];
      }
      byNamespace[missing.namespace].push(missing);
    }
    
    for (const [namespace, keys] of Object.entries(byNamespace)) {
      const filePath = getNamespaceFilePath(namespace, localesDir);
      console.log(`\n📁 ${namespace} (${filePath}):`);
      console.log(`   Missing ${keys.length} keys:`);
      
      for (const key of keys.slice(0, 10)) {
        console.log(`   - ${key.key}`);
      }
      
      if (keys.length > 10) {
        console.log(`   ... and ${keys.length - 10} more`);
      }
    }
    
    // Save report
    const reportPath = path.join(process.cwd(), 'missing-i18n-keys-report.json');
    fs.writeFileSync(reportPath, JSON.stringify(missingKeys, null, 2), 'utf-8');
    console.log(`\n📄 Report saved to: missing-i18n-keys-report.json`);
  }
}

main().catch(console.error);






