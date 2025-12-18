import * as fs from 'fs';
import * as path from 'path';
import { glob } from 'glob';

interface ConversionResult {
  file: string;
  fallbacksRemoved: number;
  hardcodedConverted: number;
  errors: string[];
}

// Load report
function loadReport(): any {
  const reportPath = path.join(process.cwd(), 'hardcoded-texts-report.json');
  if (!fs.existsSync(reportPath)) {
    return null;
  }
  return JSON.parse(fs.readFileSync(reportPath, 'utf-8'));
}

// Remove fallback texts (|| 'text' patterns)
function removeFallbacks(content: string): { content: string; count: number } {
  let newContent = content;
  let count = 0;
  
  // Pattern: t('key') || 'fallback text'
  const fallbackPattern = /t\(['"]([^'"]+)['"]\)\s*\|\|\s*['"]([^'"]+)['"]/g;
  newContent = newContent.replace(fallbackPattern, (match, key, fallback) => {
    count++;
    return `t('${key}')`;
  });
  
  // Pattern: tGlobal('key') || 'fallback text'
  const tGlobalPattern = /tGlobal\(['"]([^'"]+)['"]\)\s*\|\|\s*['"]([^'"]+)['"]/g;
  newContent = newContent.replace(tGlobalPattern, (match, key, fallback) => {
    count++;
    return `tGlobal('${key}')`;
  });
  
  return { content: newContent, count };
}

// Convert hardcoded string to i18n (only in JSX/TSX contexts)
function convertHardcodedText(content: string, filePath: string, namespace: string): { content: string; count: number; addedKeys: string[] } {
  let newContent = content;
  let count = 0;
  const addedKeys: string[] = [];
  
  // Only process if file uses i18n
  if (!content.includes('useTranslation') && !content.includes('getServerTranslation')) {
    return { content, count: 0, addedKeys: [] };
  }
  
  // Get hardcoded texts for this file from report
  const report = loadReport();
  if (!report) return { content, count: 0, addedKeys: [] };
  
  const fileData = report.byFile.find((f: any) => f.file === filePath.replace(process.cwd() + path.sep, ''));
  if (!fileData) return { content, count: 0, addedKeys: [] };
  
  const lines = content.split('\n');
  const sortedTexts = [...fileData.texts].sort((a: any, b: any) => b.line - a.line);
  
  for (const hcText of sortedTexts) {
    const lineIndex = hcText.line - 1;
    if (lineIndex < 0 || lineIndex >= lines.length) continue;
    
    const line = lines[lineIndex];
    
    // Skip if already using i18n
    if (line.includes("t('") || line.includes('t("') || line.includes('t(`')) continue;
    
    // Skip if in comment
    if (line.trim().startsWith('//') || line.includes('/*') || line.includes('*/')) continue;
    
    // Skip if it's an import or technical string
    if (line.includes('import ') || line.includes('from ') || line.includes('://') || line.includes('@')) continue;
    
    // Only process string literals in JSX/TSX contexts
    const stringPattern = new RegExp(`(['"\`])${hcText.text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\1`, 'g');
    
    if (stringPattern.test(line)) {
      // Generate a simple key
      const key = hcText.text.toLowerCase().replace(/[^a-z0-9ığüşöç]/g, '.').replace(/\.+/g, '.').replace(/^\.|\.$/g, '');
      const fullKey = key.length > 0 ? key : 'text';
      
      // Replace in line
      const newLine = line.replace(stringPattern, (match, quote) => {
        // Check if we're in JSX attribute
        if (line.includes('=') && line.indexOf('=') < line.indexOf(match)) {
          return `{t('${fullKey}')}`;
        }
        // Check if we're in JSX content
        if (line.includes('<') && line.includes('>')) {
          return `{t('${fullKey}')}`;
        }
        return `t('${fullKey}')`;
      });
      
      if (newLine !== line) {
        lines[lineIndex] = newLine;
        addedKeys.push(fullKey);
        count++;
      }
    }
  }
  
  return { content: lines.join('\n'), count, addedKeys };
}

// Add keys to translation file
function addKeysToTranslation(keys: string[], texts: string[], namespace: string, localesDir: string): void {
  let filePath: string;
  if (namespace === 'global') {
    filePath = path.join(localesDir, 'global', 'tr.json');
  } else if (namespace.startsWith('modules/')) {
    const moduleName = namespace.replace('modules/', '');
    filePath = path.join(localesDir, 'modules', moduleName, 'tr.json');
  } else {
    return;
  }
  
  if (!fs.existsSync(filePath)) return;
  
  const json = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
  
  for (let i = 0; i < keys.length; i++) {
    const key = keys[i];
    const text = texts[i];
    
    const keyParts = key.split('.');
    let current = json;
    
    for (let j = 0; j < keyParts.length - 1; j++) {
      const part = keyParts[j];
      if (!(part in current) || typeof current[part] !== 'object') {
        current[part] = {};
      }
      current = current[part];
    }
    
    const lastPart = keyParts[keyParts.length - 1];
    if (!(lastPart in current)) {
      current[lastPart] = text;
    }
  }
  
  fs.writeFileSync(filePath, JSON.stringify(json, null, 2), 'utf-8');
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
  const srcDir = path.join(process.cwd(), 'src');
  const localesDir = path.join(srcDir, 'locales');
  
  console.log('Removing fallbacks and converting hardcoded texts...\n');
  
  // Find all component/page files
  const codeFiles = await glob('**/*.{tsx,ts}', {
    cwd: srcDir,
    ignore: [
      '**/node_modules/**',
      '**/.next/**',
      '**/dist/**',
      '**/api/**',
      '**/locales/**',
      '**/i18n/**',
      '**/*.d.ts',
      '**/scripts/**',
      '**/__tests__/**',
      '**/*.test.ts',
      '**/*.test.tsx',
    ],
  });
  
  console.log(`Processing ${codeFiles.length} files...\n`);
  
  const results: ConversionResult[] = [];
  let totalFallbacksRemoved = 0;
  let totalHardcodedConverted = 0;
  
  // Process files
  for (const file of codeFiles) {
    const filePath = path.join(srcDir, file);
    const relativePath = file.replace(/\\/g, '/');
    
    try {
      let content = fs.readFileSync(filePath, 'utf-8');
      const namespace = getNamespace(filePath);
      
      const result: ConversionResult = {
        file: relativePath,
        fallbacksRemoved: 0,
        hardcodedConverted: 0,
        errors: []
      };
      
      // Step 1: Remove fallbacks
      const { content: contentWithoutFallbacks, count: fallbackCount } = removeFallbacks(content);
      result.fallbacksRemoved = fallbackCount;
      totalFallbacksRemoved += fallbackCount;
      
      // Step 2: Convert hardcoded texts (only if file uses i18n)
      if (content.includes('useTranslation') || content.includes('getServerTranslation')) {
        const { content: convertedContent, count: convertedCount, addedKeys } = convertHardcodedText(
          contentWithoutFallbacks,
          relativePath,
          namespace
        );
        result.hardcodedConverted = convertedCount;
        totalHardcodedConverted += convertedCount;
        
        // Add keys to translation file
        if (addedKeys.length > 0) {
          // Get texts from report
          const report = loadReport();
          if (report) {
            const fileData = report.byFile.find((f: any) => f.file === relativePath);
            if (fileData) {
              const texts = addedKeys.map(key => {
                const hcText = fileData.texts.find((t: any) => {
                  const genKey = t.text.toLowerCase().replace(/[^a-z0-9ığüşöç]/g, '.').replace(/\.+/g, '.').replace(/^\.|\.$/g, '');
                  return genKey === key;
                });
                return hcText ? hcText.text : key;
              });
              addKeysToTranslation(addedKeys, texts, namespace, localesDir);
            }
          }
        }
        
        content = convertedContent;
      } else {
        content = contentWithoutFallbacks;
      }
      
      // Write file if changes were made
      if (result.fallbacksRemoved > 0 || result.hardcodedConverted > 0) {
        fs.writeFileSync(filePath, content, 'utf-8');
        
        if (result.fallbacksRemoved > 0 || result.hardcodedConverted > 0) {
          console.log(`✓ ${relativePath}`);
          if (result.fallbacksRemoved > 0) {
            console.log(`  - Removed ${result.fallbacksRemoved} fallbacks`);
          }
          if (result.hardcodedConverted > 0) {
            console.log(`  - Converted ${result.hardcodedConverted} hardcoded texts`);
          }
        }
      }
      
      results.push(result);
    } catch (error: any) {
      console.error(`✗ Error processing ${relativePath}: ${error.message}`);
    }
  }
  
  console.log('\n=== Summary ===');
  console.log(`Files processed: ${results.length}`);
  console.log(`Fallbacks removed: ${totalFallbacksRemoved}`);
  console.log(`Hardcoded texts converted: ${totalHardcodedConverted}`);
  
  // Save results
  const resultsPath = path.join(process.cwd(), 'i18n-conversion-results.json');
  fs.writeFileSync(resultsPath, JSON.stringify(results, null, 2), 'utf-8');
  console.log(`\nResults saved to: i18n-conversion-results.json`);
  
  console.log('\n⚠ Please run TypeScript check:');
  console.log('  npx tsc --noEmit');
}

main().catch(console.error);






