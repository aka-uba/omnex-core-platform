#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

const LOCALES_DIR = path.join(__dirname, '..', 'src', 'locales', 'global');
const LOCALES = ['tr', 'en', 'de', 'ar'];

function getAllKeys(obj, prefix = '', keyMap = {}) {
    if (typeof obj !== 'object' || obj === null || Array.isArray(obj)) {
        return keyMap;
    }
    
    Object.keys(obj).forEach(key => {
        const fullKey = prefix ? `${prefix}.${key}` : key;
        
        // Check for duplicate at same level
        if (keyMap[fullKey]) {
            keyMap[fullKey].push(fullKey);
        } else {
            keyMap[fullKey] = [fullKey];
        }
        
        if (typeof obj[key] === 'object' && obj[key] !== null && !Array.isArray(obj[key])) {
            getAllKeys(obj[key], fullKey, keyMap);
        }
    });
    
    return keyMap;
}

function findDuplicates(locale) {
    const filePath = path.join(LOCALES_DIR, `${locale}.json`);
    const content = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    
    const keyMap = getAllKeys(content);
    const duplicates = Object.keys(keyMap).filter(key => keyMap[key].length > 1);
    
    if (duplicates.length > 0) {
        console.log(`\n${locale.toUpperCase()}: ${duplicates.length} duplicate keys found`);
        duplicates.forEach(key => {
            console.log(`  - ${key}`);
        });
        return duplicates;
    }
    
    return [];
}

console.log('🔍 Finding duplicate keys...\n');
LOCALES.forEach(locale => {
    findDuplicates(locale);
});







