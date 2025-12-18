import * as fs from 'fs';
import * as path from 'path';
import { glob } from 'glob';

interface KeyUsage {
  key: string;
  namespace: string;
  file: string;
  used: boolean;
  usedInFiles: string[];
}

// Load JSON file safely
function loadJsonFile(filePath: string): any | null {
  try {
    if (!fs.existsSync(filePath)) {
      return null;
    }
    const content = fs.readFileSync(filePath, 'utf-8');
    return JSON.parse(content);
  } catch (error) {
    console.error(`Error loading ${filePath}:`, error);
    return null;
  }
}

// Flatten nested object to dot notation keys
function flattenKeys(obj: any, prefix = '', namespace: string): string[] {
  const keys: string[] = [];
  for (const key in obj) {
    if (obj.hasOwnProperty(key)) {
      const newKey = prefix ? `${prefix}.${key}` : key;
      if (typeof obj[key] === 'object' && obj[key] !== null && !Array.isArray(obj[key])) {
        keys.push(...flattenKeys(obj[key], newKey, namespace));
      } else {
        keys.push(newKey);
      }
    }
  }
  return keys;
}

// Extract i18n key usage from file content
function extractI18nKeyUsages(content: string): Set<string> {
  const keys = new Set<string>();
  
  // Extract t('key') or t("key") patterns
  const tPattern = /t\(['"]([^'"]+)['"]\)/g;
  let match;
  while ((match = tPattern.exec(content)) !== null) {
    keys.add(match[1]);
  }
  
  // Extract tGlobal('key') patterns
  const tGlobalPattern = /tGlobal\(['"]([^'"]+)['"]\)/g;
  while ((match = tGlobalPattern.exec(content)) !== null) {
    keys.add(match[1]);
  }
  
  // Extract getServerTranslation('namespace').t('key') patterns
  const serverTPattern = /\.t\(['"]([^'"]+)['"]\)/g;
  while ((match = serverTPattern.exec(content)) !== null) {
    keys.add(match[1]);
  }
  
  return keys;
}

// Check if a key is used in codebase
function isKeyUsed(key: string, namespace: string, codeFiles: string[]): { used: boolean; usedInFiles: string[] } {
  const usedInFiles: string[] = [];
  
  for (const file of codeFiles) {
    try {
      const content = fs.readFileSync(file, 'utf-8');
      
      // Check if namespace is used in this file
      const namespacePattern = new RegExp(`(useTranslation|getServerTranslation)\\(['"]${namespace.replace(/\//g, '\\/')}['"]\\)`, 'g');
      const hasNamespace = namespacePattern.test(content);
      
      if (!hasNamespace && namespace !== 'global') {
        // Also check for global namespace usage
        const globalPattern = /(useTranslation|getServerTranslation)\(['"]global['"]\)/g;
        if (!globalPattern.test(content)) {
          continue;
        }
      }
      
      // Extract all keys used in this file
      const usedKeys = extractI18nKeyUsages(content);
      
      // Check if our key is used
      if (usedKeys.has(key)) {
        usedInFiles.push(file);
      }
      
      // Also check for partial matches (for nested keys)
      // e.g., if key is "table.actions", also check for "table.actions.edit"
      for (const usedKey of usedKeys) {
        if (usedKey.startsWith(key + '.') || key.startsWith(usedKey + '.')) {
          usedInFiles.push(file);
          break;
        }
      }
    } catch (error) {
      // Skip files that can't be read
      continue;
    }
  }
  
  return {
    used: usedInFiles.length > 0,
    usedInFiles
  };
}

async function main() {
  const srcDir = path.join(process.cwd(), 'src');
  const localesDir = path.join(srcDir, 'locales');
  
  console.log('Finding unused i18n keys...\n');
  
  // Find all tr.json files
  const trFiles = await glob('**/tr.json', { cwd: localesDir });
  
  // Find all code files
  const codeFiles = await glob('**/*.{tsx,ts}', {
    cwd: srcDir,
    ignore: ['**/node_modules/**', '**/.next/**', '**/dist/**', '**/api/**', '**/locales/**', '**/i18n/**', '**/*.d.ts'],
  });
  
  const codeFilePaths = codeFiles.map(f => path.join(srcDir, f));
  
  console.log(`Found ${trFiles.length} translation files`);
  console.log(`Scanning ${codeFiles.length} code files...\n`);
  
  const allKeys: KeyUsage[] = [];
  const unusedKeys: KeyUsage[] = [];
  
  // Process each translation file
  for (const trFile of trFiles) {
    const fullPath = path.join(localesDir, trFile);
    const json = loadJsonFile(fullPath);
    if (!json) continue;
    
    // Determine namespace from file path
    let namespace = 'global';
    if (trFile.includes('modules/')) {
      const moduleMatch = trFile.match(/modules\/([^/]+)\/tr\.json/);
      if (moduleMatch) {
        namespace = `modules/${moduleMatch[1]}`;
      }
    }
    
    // Get all keys from this file
    const keys = flattenKeys(json, '', namespace);
    
    console.log(`Processing ${namespace} (${keys.length} keys)...`);
    
    // Check each key
    for (const key of keys) {
      const usage = isKeyUsed(key, namespace, codeFilePaths);
      const keyUsage: KeyUsage = {
        key,
        namespace,
        file: trFile,
        used: usage.used,
        usedInFiles: usage.usedInFiles
      };
      
      allKeys.push(keyUsage);
      
      if (!usage.used) {
        unusedKeys.push(keyUsage);
      }
    }
  }
  
  // Generate report
  const report = {
    summary: {
      totalKeys: allKeys.length,
      usedKeys: allKeys.filter(k => k.used).length,
      unusedKeys: unusedKeys.length,
      unusedPercentage: ((unusedKeys.length / allKeys.length) * 100).toFixed(2)
    },
    unusedKeysByNamespace: {} as Record<string, KeyUsage[]>,
    unusedKeys: unusedKeys.map(k => ({
      key: k.key,
      namespace: k.namespace,
      file: k.file
    }))
  };
  
  // Group unused keys by namespace
  for (const key of unusedKeys) {
    if (!report.unusedKeysByNamespace[key.namespace]) {
      report.unusedKeysByNamespace[key.namespace] = [];
    }
    report.unusedKeysByNamespace[key.namespace].push(key);
  }
  
  // Save report
  const reportPath = path.join(process.cwd(), 'unused-i18n-keys-report.json');
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2), 'utf-8');
  
  console.log('\n=== Summary ===');
  console.log(`Total keys: ${report.summary.totalKeys}`);
  console.log(`Used keys: ${report.summary.usedKeys}`);
  console.log(`Unused keys: ${report.summary.unusedKeys} (${report.summary.unusedPercentage}%)`);
  console.log(`\nReport saved to: unused-i18n-keys-report.json`);
  
  // Print top unused namespaces
  const namespacesByCount = Object.entries(report.unusedKeysByNamespace)
    .map(([ns, keys]) => ({ namespace: ns, count: keys.length }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10);
  
  if (namespacesByCount.length > 0) {
    console.log('\n=== Top 10 Namespaces with Unused Keys ===');
    for (const { namespace, count } of namespacesByCount) {
      console.log(`${namespace}: ${count} unused keys`);
    }
  }
}

main().catch(console.error);






