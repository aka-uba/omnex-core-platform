#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

const LOCALES_DIR = path.join(__dirname, '..', 'src', 'locales', 'global');

// Common English words that should be translated in DE and AR
const translations = {
    de: {
        'error.rename': 'Name',
        'form.name': 'Name',
        'form.personal.fullName': 'Vollständiger Name',
        'form.statusDraft': 'Status',
        'form.statusScheduled': 'Status',
        'form.statusPublished': 'Status',
        'form.statusNeedsRevision': 'Status',
    },
    ar: {
        'error.rename': 'الاسم',
        'form.name': 'الاسم',
        'form.personal.fullName': 'الاسم الكامل',
        'form.statusDraft': 'الحالة',
        'form.statusScheduled': 'الحالة',
        'form.statusPublished': 'الحالة',
        'form.statusNeedsRevision': 'الحالة',
    },
};

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

function fixWrongKeys(locale) {
    const filePath = path.join(LOCALES_DIR, `${locale}.json`);
    const content = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    const keys = translations[locale];
    
    if (!keys) return;
    
    let fixed = 0;
    Object.keys(keys).forEach(keyPath => {
        const currentValue = getNestedValue(content, keyPath);
        const newValue = keys[keyPath];
        
        // Only fix if current value is English "Name" or "Status"
        if (currentValue === 'Name' || currentValue === 'Status') {
            setNestedValue(content, keyPath, newValue);
            fixed++;
        }
    });
    
    if (fixed > 0) {
        fs.writeFileSync(filePath, JSON.stringify(content, null, 2) + '\n', 'utf8');
        console.log(`✅ ${locale.toUpperCase()}: Fixed ${fixed} wrong keys`);
    } else {
        console.log(`   ${locale.toUpperCase()}: No keys to fix`);
    }
}

function getNestedValue(obj, path) {
    const keys = path.split('.');
    let current = obj;
    
    for (const key of keys) {
        if (current && typeof current === 'object' && key in current) {
            current = current[key];
        } else {
            return undefined;
        }
    }
    
    return current;
}

console.log('🔧 Fixing wrong/inconsistent keys...\n');
fixWrongKeys('de');
fixWrongKeys('ar');
console.log('\n✅ Done!');







