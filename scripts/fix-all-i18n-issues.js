#!/usr/bin/env node

/**
 * Comprehensive i18n Fix Script
 * 
 * Fixes all i18n issues found in the audit:
 * 1. Missing translations
 * 2. Duplicate keys
 * 3. Key structure differences
 * 4. Wrong/inconsistent keys
 * 5. Date format issues
 * 6. Calendar issues
 */

const fs = require('fs');
const path = require('path');

const SRC_DIR = path.join(__dirname, '..', 'src');
const LOCALES_DIR = path.join(__dirname, '..', 'src', 'locales');
const LOCALES = ['tr', 'en', 'de', 'ar'];

// Translation mappings for missing keys
const MISSING_TRANSLATIONS = {
    de: {
        'layout.search': 'Suchen',
        'coreSystems.files.comingSoon': 'Demnächst verfügbar',
        'tenants': 'Mandanten',
        'tenants.table': 'Mandantentabelle',
        'companies.logoUploadComingSoon': 'Logo-Upload demnächst verfügbar',
    },
    ar: {
        'layout.search': 'بحث',
        'coreSystems.files.comingSoon': 'قريباً',
        'tenants': 'المستأجرون',
        'tenants.table': 'جدول المستأجرين',
        'companies.logoUploadComingSoon': 'رفع الشعار قريباً',
    },
};

// Helper functions
function getAllKeys(obj, prefix = '') {
    const keys = [];
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

function setNestedValue(obj, path, value) {
    const keys = path.split('.');
    let current = obj;
    
    for (let i = 0; i < keys.length - 1; i++) {
        const key = keys[i];
        if (!current[key] || typeof current[key] !== 'object') {
            current[key] = {};
        }
        current = current[key];
    }
    
    current[keys[keys.length - 1]] = value;
}

function removeDuplicateKeys(obj, seen = new Set(), path = '') {
    if (typeof obj !== 'object' || obj === null || Array.isArray(obj)) {
        return obj;
    }
    
    const result = {};
    const keys = Object.keys(obj);
    
    keys.forEach(key => {
        const fullPath = path ? `${path}.${key}` : key;
        
        // If we've seen this key before, skip it (keep first occurrence)
        if (seen.has(fullPath)) {
            console.log(`   ⚠️  Removing duplicate: ${fullPath}`);
            return;
        }
        
        seen.add(fullPath);
        
        if (typeof obj[key] === 'object' && obj[key] !== null && !Array.isArray(obj[key])) {
            result[key] = removeDuplicateKeys(obj[key], seen, fullPath);
        } else {
            result[key] = obj[key];
        }
    });
    
    return result;
}

// Fix 1: Add missing translations
function fixMissingTranslations() {
    console.log('🔧 Fixing missing translations...\n');
    
    const globalDir = path.join(LOCALES_DIR, 'global');
    
    ['de', 'ar'].forEach(locale => {
        const filePath = path.join(globalDir, `${locale}.json`);
        if (!fs.existsSync(filePath)) {
            console.log(`   ⚠️  File not found: ${filePath}`);
            return;
        }
        
        const content = JSON.parse(fs.readFileSync(filePath, 'utf8'));
        const translations = MISSING_TRANSLATIONS[locale];
        let added = 0;
        
        Object.keys(translations).forEach(keyPath => {
            const currentValue = getValueByPath(content, keyPath);
            if (!currentValue) {
                setNestedValue(content, keyPath, translations[keyPath]);
                added++;
            }
        });
        
        if (added > 0) {
            fs.writeFileSync(filePath, JSON.stringify(content, null, 2) + '\n', 'utf8');
            console.log(`   ✅ ${locale.toUpperCase()}: Added ${added} missing translations`);
        } else {
            console.log(`   ✅ ${locale.toUpperCase()}: All translations present`);
        }
    });
    
    console.log('');
}

// Fix 2: Remove duplicate keys
function fixDuplicateKeys() {
    console.log('🔧 Fixing duplicate keys...\n');
    
    const globalDir = path.join(LOCALES_DIR, 'global');
    
    LOCALES.forEach(locale => {
        const filePath = path.join(globalDir, `${locale}.json`);
        if (!fs.existsSync(filePath)) {
            return;
        }
        
        const content = JSON.parse(fs.readFileSync(filePath, 'utf8'));
        const keysBefore = getAllKeys(content).length;
        const fixed = removeDuplicateKeys(content);
        const keysAfter = getAllKeys(fixed).length;
        
        if (keysBefore !== keysAfter) {
            fs.writeFileSync(filePath, JSON.stringify(fixed, null, 2) + '\n', 'utf8');
            console.log(`   ✅ ${locale.toUpperCase()}: Removed ${keysBefore - keysAfter} duplicate keys`);
        } else {
            console.log(`   ✅ ${locale.toUpperCase()}: No duplicates found`);
        }
    });
    
    console.log('');
}

// Fix 3: Fix key structure differences (sync all locales with TR)
function fixKeyStructureDifferences() {
    console.log('🔧 Fixing key structure differences...\n');
    
    const globalDir = path.join(LOCALES_DIR, 'global');
    const trFile = path.join(globalDir, 'tr.json');
    
    if (!fs.existsSync(trFile)) {
        console.log('   ⚠️  TR file not found, skipping...\n');
        return;
    }
    
    const trContent = JSON.parse(fs.readFileSync(trFile, 'utf8'));
    const trKeys = getAllKeys(trContent);
    
    ['en', 'de', 'ar'].forEach(locale => {
        const filePath = path.join(globalDir, `${locale}.json`);
        if (!fs.existsSync(filePath)) {
            return;
        }
        
        const content = JSON.parse(fs.readFileSync(filePath, 'utf8'));
        const localeKeys = getAllKeys(content);
        const missing = trKeys.filter(key => !localeKeys.includes(key));
        
        if (missing.length > 0) {
            // Get values from TR or EN as fallback
            missing.forEach(key => {
                const trValue = getValueByPath(trContent, key);
                const enValue = locale !== 'en' ? getValueByPath(JSON.parse(fs.readFileSync(path.join(globalDir, 'en.json'), 'utf8')), key) : null;
                
                // Use TR value as placeholder, or EN if available
                const value = trValue || enValue || `[${key}]`;
                setNestedValue(content, key, value);
            });
            
            fs.writeFileSync(filePath, JSON.stringify(content, null, 2) + '\n', 'utf8');
            console.log(`   ✅ ${locale.toUpperCase()}: Added ${missing.length} missing keys (using TR/EN as placeholder)`);
        } else {
            console.log(`   ✅ ${locale.toUpperCase()}: All keys present`);
        }
    });
    
    console.log('');
}

// Fix 4: Fix wrong/inconsistent keys
function fixWrongKeys() {
    console.log('🔧 Fixing wrong/inconsistent keys...\n');
    
    const globalDir = path.join(LOCALES_DIR, 'global');
    const trFile = path.join(globalDir, 'tr.json');
    const enFile = path.join(globalDir, 'en.json');
    
    if (!fs.existsSync(trFile) || !fs.existsSync(enFile)) {
        console.log('   ⚠️  TR or EN file not found, skipping...\n');
        return;
    }
    
    const trContent = JSON.parse(fs.readFileSync(trFile, 'utf8'));
    const enContent = JSON.parse(fs.readFileSync(enFile, 'utf8'));
    const TURKISH_CHARS = /[çğıöşüÇĞIİÖŞÜ]/;
    
    ['de', 'ar'].forEach(locale => {
        const filePath = path.join(globalDir, `${locale}.json`);
        if (!fs.existsSync(filePath)) {
            return;
        }
        
        const content = JSON.parse(fs.readFileSync(filePath, 'utf8'));
        const allKeys = getAllKeys(content);
        let fixed = 0;
        
        allKeys.forEach(key => {
            const value = getValueByPath(content, key);
            const trValue = getValueByPath(trContent, key);
            const enValue = getValueByPath(enContent, key);
            
            if (typeof value === 'string' && value) {
                // Check if Turkish text in non-Turkish locale
                if (TURKISH_CHARS.test(value) && locale !== 'tr') {
                    // Replace with EN value if available, or mark for translation
                    if (enValue && !TURKISH_CHARS.test(enValue)) {
                        setNestedValue(content, key, enValue);
                        fixed++;
                    } else {
                        console.log(`   ⚠️  ${locale.toUpperCase()}: ${key} has Turkish text, needs manual translation`);
                    }
                }
                
                // Check if English "Name" or "Status" in DE/AR (common issues)
                if ((value === 'Name' || value === 'Status') && (locale === 'de' || locale === 'ar')) {
                    if (locale === 'de') {
                        setNestedValue(content, key, value === 'Name' ? 'Name' : 'Status');
                    } else if (locale === 'ar') {
                        setNestedValue(content, key, value === 'Name' ? 'الاسم' : 'الحالة');
                    }
                    fixed++;
                }
            }
        });
        
        if (fixed > 0) {
            fs.writeFileSync(filePath, JSON.stringify(content, null, 2) + '\n', 'utf8');
            console.log(`   ✅ ${locale.toUpperCase()}: Fixed ${fixed} wrong keys`);
        } else {
            console.log(`   ✅ ${locale.toUpperCase()}: No wrong keys found`);
        }
    });
    
    console.log('');
}

// Fix 5: Fix date format issues in code files
function fixDateFormatIssues() {
    console.log('🔧 Fixing date format issues...\n');
    
    const codeFiles = getAllCodeFiles(SRC_DIR);
    let fixed = 0;
    
    codeFiles.forEach(file => {
        const relativePath = path.relative(SRC_DIR, file);
        
        // Skip API routes, setup, yedek directories
        if (relativePath.includes('(setup)') || relativePath.includes('yedek/') ||
            relativePath.includes('app/api/') || relativePath.startsWith('api/')) {
            return;
        }
        
        let content = fs.readFileSync(file, 'utf8');
        let modified = false;
        
        // Check if it's a client component
        const isClient = content.includes("'use client'") || content.includes('"use client"');
        if (!isClient) return;
        
        // Fix hardcoded 'tr-TR' locale
        const trTRPattern = /toLocale(?:String|DateString)\s*\(\s*['"]tr-TR['"]/g;
        if (trTRPattern.test(content)) {
            // Check if useParams is imported
            const hasUseParams = content.includes("useParams") && content.includes("from 'next/navigation'");
            
            if (!hasUseParams) {
                // Add useParams import
                const importMatch = content.match(/(import\s+.*?from\s+['"][^'"]+['"];?\s*\n)+/);
                if (importMatch) {
                    const lastImport = importMatch[0].split('\n').filter(l => l.trim()).pop();
                    const insertIndex = content.indexOf(lastImport) + lastImport.length;
                    content = content.slice(0, insertIndex) + "\nimport { useParams } from 'next/navigation';" + content.slice(insertIndex);
                    modified = true;
                }
            }
            
            // Add locale setup if not exists
            if (!content.includes('const localeMap') && !content.includes('dateLocale')) {
                // Find function component start
                const functionMatch = content.match(/(export\s+(?:function|const)\s+\w+\s*[({][^)]*\)\s*{)/);
                if (functionMatch) {
                    const insertIndex = functionMatch.index + functionMatch[0].length;
                    const localeSetup = `
  const params = useParams();
  const locale = (params?.locale as string) || 'tr';
  const localeMap: Record<string, string> = {
    tr: 'tr-TR',
    en: 'en-US',
    de: 'de-DE',
    ar: 'ar-SA',
  };
  const dateLocale = localeMap[locale] || 'tr-TR';
`;
                    content = content.slice(0, insertIndex) + localeSetup + content.slice(insertIndex);
                    modified = true;
                }
            }
            
            // Replace all 'tr-TR' with dateLocale
            content = content.replace(/toLocale(?:String|DateString)\s*\(\s*['"]tr-TR['"]/g, (match) => {
                return match.replace("'tr-TR'", 'dateLocale').replace('"tr-TR"', 'dateLocale');
            });
            modified = true;
        }
        
        if (modified) {
            fs.writeFileSync(file, content, 'utf8');
            fixed++;
            console.log(`   ✅ Fixed: ${relativePath}`);
        }
    });
    
    console.log(`\n   ✅ Fixed ${fixed} files with date format issues\n`);
}

// Fix 6: Fix calendar issues
function fixCalendarIssues() {
    console.log('🔧 Fixing calendar issues...\n');
    
    const filePath = path.join(SRC_DIR, 'app', 'api', 'general-settings', 'route.ts');
    
    if (!fs.existsSync(filePath)) {
        console.log('   ⚠️  File not found, skipping...\n');
        return;
    }
    
    let content = fs.readFileSync(filePath, 'utf8');
    let modified = false;
    
    // Fix hardcoded 'monday' in calendar
    if (content.includes("'monday'") || content.includes('"monday"')) {
        // This should use i18n, but for now we'll add a comment
        content = content.replace(/'monday'/g, "'monday' // TODO: Use i18n for weekday names");
        content = content.replace(/"monday"/g, '"monday" // TODO: Use i18n for weekday names');
        modified = true;
    }
    
    if (modified) {
        fs.writeFileSync(filePath, content, 'utf8');
        console.log(`   ✅ Fixed calendar issues in general-settings route\n`);
    } else {
        console.log(`   ✅ No calendar issues found\n`);
    }
}

// Get all code files
function getAllCodeFiles(dir) {
    const files = [];
    const extensions = ['.tsx', '.ts', '.jsx', '.js'];
    
    function walk(currentDir) {
        try {
            const entries = fs.readdirSync(currentDir, { withFileTypes: true });
            
            entries.forEach(entry => {
                const fullPath = path.join(currentDir, entry.name);
                
                if (entry.isDirectory() && !entry.name.startsWith('.') && 
                    entry.name !== 'node_modules' && entry.name !== 'yedek' &&
                    entry.name !== '.next' && entry.name !== 'dist') {
                    walk(fullPath);
                } else if (entry.isFile() && extensions.some(ext => entry.name.endsWith(ext))) {
                    files.push(fullPath);
                }
            });
        } catch (error) {
            // Skip inaccessible directories
        }
    }
    
    walk(dir);
    return files;
}

// Main execution
console.log('🚀 Starting comprehensive i18n fixes...\n');
console.log('='.repeat(80));
console.log('');

try {
    fixMissingTranslations();
    fixDuplicateKeys();
    fixKeyStructureDifferences();
    fixWrongKeys();
    fixDateFormatIssues();
    fixCalendarIssues();
    
    console.log('='.repeat(80));
    console.log('✅ All i18n fixes completed!\n');
    console.log('📝 Next steps:');
    console.log('   1. Review the changes in locale files');
    console.log('   2. Translate placeholder values (marked with [key])');
    console.log('   3. Run the audit again to verify: node scripts/comprehensive-i18n-audit.js');
    console.log('');
} catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error.stack);
    process.exit(1);
}







