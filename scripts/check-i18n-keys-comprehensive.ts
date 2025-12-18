import * as fs from 'fs';
import * as path from 'path';
import { glob } from 'glob';

interface I18nKeyUsage {
  file: string;
  keys: Set<string>;
  namespace?: string;
}

interface I18nFileStructure {
  [key: string]: any;
}

// Flatten nested object to dot notation keys
function flattenKeys(obj: any, prefix = ''): string[] {
  const keys: string[] = [];
  for (const key in obj) {
    if (obj.hasOwnProperty(key)) {
      const newKey = prefix ? `${prefix}.${key}` : key;
      if (typeof obj[key] === 'object' && obj[key] !== null && !Array.isArray(obj[key])) {
        keys.push(...flattenKeys(obj[key], newKey));
      } else {
        keys.push(newKey);
      }
    }
  }
  return keys;
}

// Extract i18n keys from file content
function extractI18nKeys(content: string, filePath: string): I18nKeyUsage {
  const keys = new Set<string>();
  let namespace: string | undefined;

  // Extract namespace from useTranslation or getServerTranslation
  const namespaceMatch = content.match(/(?:useTranslation|getServerTranslation)\(['"]([^'"]+)['"]\)/);
  if (namespaceMatch) {
    namespace = namespaceMatch[1];
  }

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

  return { file: filePath, keys, namespace };
}

// Load and parse JSON file
function loadJsonFile(filePath: string): I18nFileStructure | null {
  try {
    const content = fs.readFileSync(filePath, 'utf-8');
    return JSON.parse(content);
  } catch (error) {
    return null;
  }
}

async function checkI18nKeys() {
  const srcDir = path.join(process.cwd(), 'src');
  const localesDir = path.join(srcDir, 'locales');
  
  // Find all tr.json files
  const trFiles = await glob('**/tr.json', { cwd: localesDir });
  
  // Build map of namespace -> available keys
  const availableKeys: Map<string, Set<string>> = new Map();
  
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
    
    const keys = flattenKeys(json);
    availableKeys.set(namespace, new Set(keys));
  }
  
  // Find all component and page files
  const componentFiles = await glob('**/*.{tsx,ts}', {
    cwd: srcDir,
    ignore: ['**/node_modules/**', '**/.next/**', '**/dist/**', '**/api/**', '**/locales/**', '**/i18n/**'],
  });
  
  // Extract i18n key usage from files
  const keyUsages: I18nKeyUsage[] = [];
  const missingKeys: Map<string, Set<string>> = new Map();
  
  for (const file of componentFiles) {
    const fullPath = path.join(srcDir, file);
    const content = fs.readFileSync(fullPath, 'utf-8');
    const usage = extractI18nKeys(content, file);
    
    if (usage.keys.size > 0) {
      keyUsages.push(usage);
      
      // Check if keys exist in namespace
      const namespace = usage.namespace || 'global';
      const available = availableKeys.get(namespace) || new Set();
      
      for (const key of usage.keys) {
        if (!available.has(key)) {
          if (!missingKeys.has(namespace)) {
            missingKeys.set(namespace, new Set());
          }
          missingKeys.get(namespace)!.add(key);
        }
      }
    }
  }
  
  // Generate report
  const report: any = {
    summary: {
      totalFiles: componentFiles.length,
      filesWithI18n: keyUsages.length,
      totalNamespaces: availableKeys.size,
      missingKeysCount: Array.from(missingKeys.values()).reduce((sum, set) => sum + set.size, 0),
    },
    availableKeys: {},
    missingKeys: {},
    keyUsage: keyUsages.map(u => ({
      file: u.file,
      namespace: u.namespace || 'global',
      keys: Array.from(u.keys),
      missingKeys: u.namespace 
        ? Array.from(u.keys).filter(k => !(availableKeys.get(u.namespace!) || new Set()).has(k))
        : [],
    })),
  };
  
  // Add available keys
  for (const [namespace, keys] of availableKeys.entries()) {
    report.availableKeys[namespace] = Array.from(keys).sort();
  }
  
  // Add missing keys
  for (const [namespace, keys] of missingKeys.entries()) {
    report.missingKeys[namespace] = Array.from(keys).sort();
  }
  
  // Save report
  fs.writeFileSync(
    'i18n-keys-analysis.json',
    JSON.stringify(report, null, 2),
    'utf-8'
  );
  
  console.log('i18n Keys Analysis Complete!');
  console.log(`Total files scanned: ${report.summary.totalFiles}`);
  console.log(`Files using i18n: ${report.summary.filesWithI18n}`);
  console.log(`Total namespaces: ${report.summary.totalNamespaces}`);
  console.log(`Missing keys: ${report.summary.missingKeysCount}`);
  console.log('\nReport saved to: i18n-keys-analysis.json');
  
  // Print missing keys by namespace
  if (missingKeys.size > 0) {
    console.log('\n=== Missing Keys by Namespace ===');
    for (const [namespace, keys] of missingKeys.entries()) {
      console.log(`\n${namespace}:`);
      Array.from(keys).sort().forEach(key => console.log(`  - ${key}`));
    }
  }
}

checkI18nKeys().catch(console.error);






