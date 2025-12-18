#!/usr/bin/env node

/**
 * Fix Turkish text in non-Turkish locale files
 * Replaces Turkish text with English translations from EN locale
 */

const fs = require('fs');
const path = require('path');

const LOCALES_DIR = path.join(__dirname, '..', 'src', 'locales', 'global');
const TURKISH_CHARS = /[çğıöşüÇĞIİÖŞÜ]/;

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

function fixTurkishText(locale) {
    const filePath = path.join(LOCALES_DIR, `${locale}.json`);
    const enPath = path.join(LOCALES_DIR, 'en.json');
    
    if (!fs.existsSync(filePath) || !fs.existsSync(enPath)) {
        return;
    }
    
    const content = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    const enContent = JSON.parse(fs.readFileSync(enPath, 'utf8'));
    const allKeys = getAllKeys(content);
    let fixed = 0;
    const needsTranslation = [];
    
    allKeys.forEach(key => {
        const value = getValueByPath(content, key);
        
        if (typeof value === 'string' && value && TURKISH_CHARS.test(value)) {
            const enValue = getValueByPath(enContent, key);
            
            if (enValue && typeof enValue === 'string' && !TURKISH_CHARS.test(enValue)) {
                // Use English value as fallback
                setNestedValue(content, key, enValue);
                fixed++;
            } else {
                // Mark for manual translation
                needsTranslation.push({ key, value });
            }
        }
    });
    
    if (fixed > 0) {
        fs.writeFileSync(filePath, JSON.stringify(content, null, 2) + '\n', 'utf8');
        console.log(`   ✅ ${locale.toUpperCase()}: Fixed ${fixed} keys (using EN as fallback)`);
    }
    
    if (needsTranslation.length > 0) {
        console.log(`   ⚠️  ${locale.toUpperCase()}: ${needsTranslation.length} keys still need manual translation`);
    }
    
    return { fixed, needsTranslation };
}

console.log('🔧 Fixing Turkish text in non-Turkish locales...\n');

const results = {
    de: fixTurkishText('de'),
    ar: fixTurkishText('ar'),
};

console.log('\n✅ Done!');
console.log(`\n📊 Summary:`);
console.log(`   DE: Fixed ${results.de?.fixed || 0} keys`);
console.log(`   AR: Fixed ${results.ar?.fixed || 0} keys`);







