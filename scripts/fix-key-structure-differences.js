#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

const LOCALES_DIR = path.join(__dirname, '..', 'src', 'locales', 'global');

// Missing keys for DE and AR (from audit)
const missingKeys = {
    de: {
        'accessControl.preview': {
            title: 'Konfigurationsvorschau',
            currentScope: 'AKTUELLER BEREICH',
            activeType: 'AKTIVER KONFIGURATIONSTYP',
            priorityLogic: 'PRIORITÄTSLOGIK',
            logicDesc: 'Konfigurationen werden in folgender Reihenfolge zusammengeführt (die letzte gewinnt):',
        },
    },
    ar: {
        'accessControl.preview': {
            title: 'معاينة التكوين',
            currentScope: 'النطاق الحالي',
            activeType: 'نوع التكوين النشط',
            priorityLogic: 'منطق الأولوية',
            logicDesc: 'يتم دمج التكوينات بالترتيب التالي (يفوز الأخير):',
        },
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
    
    if (typeof value === 'object' && !Array.isArray(value)) {
        current[keys[keys.length - 1]] = { ...current[keys[keys.length - 1]], ...value };
    } else {
        current[keys[keys.length - 1]] = value;
    }
}

function addMissingKeys(locale) {
    const filePath = path.join(LOCALES_DIR, `${locale}.json`);
    const content = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    const keys = missingKeys[locale];
    
    if (!content.accessControl) {
        content.accessControl = {};
    }
    
    let added = 0;
    Object.keys(keys).forEach(keyPath => {
        setNestedValue(content, keyPath, keys[keyPath]);
        added++;
    });
    
    fs.writeFileSync(filePath, JSON.stringify(content, null, 2) + '\n', 'utf8');
    console.log(`✅ ${locale.toUpperCase()}: Added missing keys`);
}

console.log('🔧 Fixing key structure differences...\n');
addMissingKeys('de');
addMissingKeys('ar');
console.log('\n✅ Done!');







