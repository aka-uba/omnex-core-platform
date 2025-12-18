import * as fs from 'fs';
import * as path from 'path';
import { glob } from 'glob';

interface HardcodedText {
  file: string;
  line: number;
  text: string;
  context: string;
  type: 'turkish' | 'english';
}

interface ConversionResult {
  file: string;
  converted: number;
  errors: string[];
  skipped: number;
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
    return null;
  }
}

// Save JSON file safely
function saveJsonFile(filePath: string, data: any): void {
  const content = JSON.stringify(data, null, 2);
  fs.writeFileSync(filePath, content, 'utf-8');
}

// Generate i18n key from text
function generateI18nKey(text: string, namespace: string, filePath: string): string {
  // Clean text
  let cleanText = text.trim().toLowerCase();
  
  // Remove special characters, keep only alphanumeric and spaces
  cleanText = cleanText.replace(/[^a-z0-9ığüşöçİĞÜŞÖÇ\s]/g, '');
  
  // Replace spaces with dots
  cleanText = cleanText.replace(/\s+/g, '.');
  
  // Limit length
  if (cleanText.length > 50) {
    cleanText = cleanText.substring(0, 50);
  }
  
  // Determine key prefix based on context
  if (filePath.includes('/components/')) {
    return `components.${cleanText}`;
  } else if (filePath.includes('/pages/') || filePath.includes('/page.tsx')) {
    return `pages.${cleanText}`;
  } else if (filePath.includes('/forms/') || filePath.includes('Form.tsx')) {
    return `forms.${cleanText}`;
  } else if (filePath.includes('/lists/') || filePath.includes('List.tsx')) {
    return `lists.${cleanText}`;
  } else {
    return cleanText;
  }
}

// Check if key exists in namespace
function keyExists(key: string, namespace: string, localesDir: string): boolean {
  let filePath: string;
  if (namespace === 'global') {
    filePath = path.join(localesDir, 'global', 'tr.json');
  } else if (namespace.startsWith('modules/')) {
    const moduleName = namespace.replace('modules/', '');
    filePath = path.join(localesDir, 'modules', moduleName, 'tr.json');
  } else {
    return false;
  }
  
  const json = loadJsonFile(filePath);
  if (!json) return false;
  
  const keys = key.split('.');
  let current = json;
  for (const k of keys) {
    if (!(k in current) || typeof current[k] !== 'object') {
      return false;
    }
    current = current[k];
  }
  return true;
}

// Add key to namespace if it doesn't exist
function ensureKeyExists(key: string, text: string, namespace: string, localesDir: string): void {
  let filePath: string;
  if (namespace === 'global') {
    filePath = path.join(localesDir, 'global', 'tr.json');
  } else if (namespace.startsWith('modules/')) {
    const moduleName = namespace.replace('modules/', '');
    filePath = path.join(localesDir, 'modules', moduleName, 'tr.json');
  } else {
    return;
  }
  
  const json = loadJsonFile(filePath) || {};
  
  // Set nested value
  const keys = key.split('.');
  let current = json;
  for (let i = 0; i < keys.length - 1; i++) {
    const k = keys[i];
    if (!(k in current) || typeof current[k] !== 'object' || current[k] === null) {
      current[k] = {};
    }
    current = current[k];
  }
  
  const lastKey = keys[keys.length - 1];
  if (!(lastKey in current)) {
    current[lastKey] = text; // Use original text as translation
  }
  
  saveJsonFile(filePath, json);
}

// Determine namespace from file path
function getNamespace(filePath: string): string {
  if (filePath.includes('modules/')) {
    const match = filePath.match(/modules\/([^/]+)/);
    if (match) {
      return `modules/${match[1]}`;
    }
  }
  return 'global';
}

// Convert hardcoded text to i18n in a file
function convertFile(filePath: string, hardcodedTexts: HardcodedText[], localesDir: string): ConversionResult {
  const result: ConversionResult = {
    file: filePath,
    converted: 0,
    errors: [],
    skipped: 0
  };
  
  try {
    let content = fs.readFileSync(filePath, 'utf-8');
    const lines = content.split('\n');
    const namespace = getNamespace(filePath);
    
    // Check if file already uses i18n
    const hasI18n = content.includes('useTranslation') || content.includes('getServerTranslation');
    
    // Sort by line number (descending) to avoid line number shifts
    const sortedTexts = [...hardcodedTexts].sort((a, b) => b.line - a.line);
    
    for (const hcText of sortedTexts) {
      try {
        const lineIndex = hcText.line - 1;
        if (lineIndex < 0 || lineIndex >= lines.length) {
          result.skipped++;
          continue;
        }
        
        const originalLine = lines[lineIndex];
        
        // Skip if already using i18n
        if (originalLine.includes("t('") || originalLine.includes('t("') || originalLine.includes('t(`')) {
          result.skipped++;
          continue;
        }
        
        // Skip if in comment
        if (originalLine.trim().startsWith('//') || originalLine.includes('/*') || originalLine.includes('*/')) {
          result.skipped++;
          continue;
        }
        
        // Generate key
        const key = generateI18nKey(hcText.text, namespace, filePath);
        const fullKey = `${namespace === 'global' ? '' : namespace + '/'}${key}`;
        
        // Ensure key exists in translation file
        ensureKeyExists(key, hcText.text, namespace, localesDir);
        
        // Replace text in line
        // Find the text in the line and replace with t('key')
        const textPattern = new RegExp(`(['"\`])${hcText.text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\1`, 'g');
        const newLine = originalLine.replace(textPattern, (match, quote) => {
          // Check if we're in a JSX attribute
          if (originalLine.includes('=') && originalLine.indexOf('=') < originalLine.indexOf(match)) {
            return `{t('${key}')}`;
          }
          // Check if we're in a string
          return `t('${key}')`;
        });
        
        if (newLine !== originalLine) {
          lines[lineIndex] = newLine;
          
          // Add useTranslation import if needed
          if (!hasI18n && !content.includes('useTranslation')) {
            // Find import section
            const importIndex = lines.findIndex(line => line.includes("from 'react'") || line.includes('from "react"'));
            if (importIndex >= 0) {
              lines.splice(importIndex + 1, 0, "import { useTranslation } from '@/lib/i18n/client';");
            }
          }
          
          result.converted++;
        } else {
          result.skipped++;
        }
      } catch (error: any) {
        result.errors.push(`Line ${hcText.line}: ${error.message}`);
        result.skipped++;
      }
    }
    
    // Write file if changes were made
    if (result.converted > 0) {
      const newContent = lines.join('\n');
      
      // Add useTranslation hook if needed
      if (!hasI18n && result.converted > 0) {
        // Find function/component definition
        const functionIndex = lines.findIndex(line => 
          line.includes('function ') || line.includes('const ') && line.includes('= (')
        );
        if (functionIndex >= 0) {
          // Find opening brace
          const braceIndex = lines.slice(functionIndex).findIndex(line => line.includes('{'));
          if (braceIndex >= 0) {
            const insertIndex = functionIndex + braceIndex + 1;
            lines.splice(insertIndex, 0, `  const { t } = useTranslation('${namespace}');`);
          }
        }
      }
      
      fs.writeFileSync(filePath, lines.join('\n'), 'utf-8');
    }
  } catch (error: any) {
    result.errors.push(`File error: ${error.message}`);
  }
  
  return result;
}

async function main() {
  const reportPath = path.join(process.cwd(), 'hardcoded-texts-report.json');
  const srcDir = path.join(process.cwd(), 'src');
  const localesDir = path.join(srcDir, 'locales');
  
  if (!fs.existsSync(reportPath)) {
    console.error('hardcoded-texts-report.json not found. Please run find-hardcoded-turkish-texts.ts first.');
    process.exit(1);
  }
  
  const report = loadJsonFile(reportPath) as any;
  if (!report || !report.byFile) {
    console.error('Invalid report format');
    process.exit(1);
  }
  
  console.log('Converting hardcoded texts to i18n...\n');
  console.log(`Processing ${report.byFile.length} files...\n`);
  
  const results: ConversionResult[] = [];
  
  // Process files with most hardcoded texts first (top 50)
  const filesToProcess = report.byFile
    .filter((f: any) => f.count > 10) // Only files with more than 10 hardcoded texts
    .sort((a: any, b: any) => b.count - a.count)
    .slice(0, 50); // Process top 50 files
  
  for (const fileData of filesToProcess) {
    const filePath = path.join(srcDir, fileData.file);
    
    if (!fs.existsSync(filePath)) {
      console.log(`⚠ File not found: ${fileData.file}`);
      continue;
    }
    
    console.log(`Processing ${fileData.file} (${fileData.texts.length} texts)...`);
    
    const result = convertFile(filePath, fileData.texts, localesDir);
    results.push(result);
    
    if (result.converted > 0) {
      console.log(`  ✓ Converted ${result.converted} texts`);
    }
    if (result.errors.length > 0) {
      console.log(`  ⚠ ${result.errors.length} errors`);
    }
    if (result.skipped > 0) {
      console.log(`  - Skipped ${result.skipped} texts`);
    }
  }
  
  // Summary
  const totalConverted = results.reduce((sum, r) => sum + r.converted, 0);
  const totalErrors = results.reduce((sum, r) => sum + r.errors.length, 0);
  const totalSkipped = results.reduce((sum, r) => sum + r.skipped, 0);
  
  console.log('\n=== Summary ===');
  console.log(`Files processed: ${results.length}`);
  console.log(`Texts converted: ${totalConverted}`);
  console.log(`Texts skipped: ${totalSkipped}`);
  console.log(`Errors: ${totalErrors}`);
  
  // Save results
  const resultsPath = path.join(process.cwd(), 'i18n-conversion-results.json');
  fs.writeFileSync(resultsPath, JSON.stringify(results, null, 2), 'utf-8');
  console.log(`\nResults saved to: i18n-conversion-results.json`);
  
  console.log('\n⚠ Please review the changes and run TypeScript check:');
  console.log('  npx tsc --noEmit');
}

main().catch(console.error);






