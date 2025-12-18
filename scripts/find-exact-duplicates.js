#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

const LOCALES_DIR = path.join(__dirname, '..', 'src', 'locales', 'global');
const LOCALES = ['tr', 'en', 'de', 'ar'];

function getAllKeysWithPaths(obj, prefix = '', keyMap = {}) {
    if (typeof obj !== 'object' || obj === null || Array.isArray(obj)) {
        return keyMap;
    }
    
    Object.keys(obj).forEach(key => {
        const fullKey = prefix ? `${prefix}.${key}` : key;
        
        if (!keyMap[fullKey]) {
            keyMap[fullKey] = [];
        }
        keyMap[fullKey].push(fullKey);
        
        if (typeof obj[key] === 'object' && obj[key] !== null && !Array.isArray(obj[key])) {
            getAllKeysWithPaths(obj[key], fullKey, keyMap);
        }
    });
    
    return keyMap;
}

function findDuplicates(locale) {
    const filePath = path.join(LOCALES_DIR, `${locale}.json`);
    const content = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    
    const keyMap = getAllKeysWithPaths(content);
    const duplicates = Object.keys(keyMap).filter(key => keyMap[key].length > 1);
    
    if (duplicates.length > 0) {
        console.log(`\n${locale.toUpperCase()}: ${duplicates.length} duplicate keys found`);
        duplicates.forEach(key => {
            console.log(`  - ${key} (appears ${keyMap[key].length} times)`);
        });
        return duplicates;
    }
    
    return [];
}

// Also check raw JSON for actual duplicate keys at same level
function findRawDuplicates(locale) {
    const filePath = path.join(LOCALES_DIR, `${locale}.json`);
    const rawContent = fs.readFileSync(filePath, 'utf8');
    
    // Find duplicate keys in raw JSON (same level)
    const lines = rawContent.split('\n');
    const duplicates = [];
    const keyStack = [];
    
    lines.forEach((line, index) => {
        const trimmed = line.trim();
        // Match key pattern: "key": or "key":
        const keyMatch = trimmed.match(/^"([^"]+)":/);
        if (keyMatch) {
            const key = keyMatch[1];
            const indent = line.match(/^(\s*)/)[1].length;
            
            // Check if this key exists at same level
            while (keyStack.length > 0 && keyStack[keyStack.length - 1].indent >= indent) {
                keyStack.pop();
            }
            
            // Check for duplicate at current level
            const currentLevelKeys = keyStack.filter(k => k.indent === indent).map(k => k.key);
            if (currentLevelKeys.includes(key)) {
                duplicates.push({
                    key,
                    line: index + 1,
                    indent
                });
            }
            
            keyStack.push({ key, indent, line: index + 1 });
        }
    });
    
    if (duplicates.length > 0) {
        console.log(`\n${locale.toUpperCase()}: ${duplicates.length} raw duplicate keys found`);
        duplicates.forEach(dup => {
            console.log(`  - "${dup.key}" at line ${dup.line}`);
        });
    }
    
    return duplicates;
}

console.log('🔍 Finding exact duplicate keys...\n');
LOCALES.forEach(locale => {
    findDuplicates(locale);
    findRawDuplicates(locale);
});







