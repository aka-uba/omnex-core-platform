#!/usr/bin/env node

/**
 * API Schema Consistency Validation Script
 * 
 * Bu script, tüm API route'larında schema uyumluluğunu kontrol eder:
 * - Date alanlarının doğru işlendiğini kontrol eder
 * - Schema'daki tüm alanların CRUD işlemlerinde kullanıldığını kontrol eder
 * - Eksik alanları tespit eder
 * - Date dönüşümlerini kontrol eder
 * 
 * Kullanım:
 *   node scripts/validate-api-schema-consistency.js
 * 
 * Çıktı:
 *   - Schema-API uyumsuzlukları
 *   - Eksik alanlar
 *   - Date işleme sorunları
 *   - Öneriler ve düzeltmeler
 */

const fs = require('fs');
const path = require('path');

// ANSI renk kodları
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function logError(message) {
  log(`❌ ${message}`, 'red');
}

function logSuccess(message) {
  log(`✅ ${message}`, 'green');
}

function logWarning(message) {
  log(`⚠️  ${message}`, 'yellow');
}

function logInfo(message) {
  log(`ℹ️  ${message}`, 'cyan');
}

// Zod schema dosyalarını bul
function findSchemaFiles() {
  const schemas = [];
  const modulesDir = path.join(process.cwd(), 'src', 'modules');
  
  if (!fs.existsSync(modulesDir)) {
    return schemas;
  }

  function findFiles(dir, fileList = []) {
    const files = fs.readdirSync(dir);
    files.forEach(file => {
      const filePath = path.join(dir, file);
      const stat = fs.statSync(filePath);
      if (stat.isDirectory()) {
        findFiles(filePath, fileList);
      } else if (file.endsWith('.schema.ts') || file.endsWith('.schema.js')) {
        fileList.push(filePath);
      }
    });
    return fileList;
  }

  return findFiles(modulesDir);
}

// Schema'dan date alanlarını parse et
function parseSchemaDates(schemaContent) {
  const dateFields = [];
  
  // z.coerce.date() veya z.date() pattern'lerini bul
  const datePattern = /(\w+):\s*z\.(?:coerce\.)?date\(\)/g;
  let match;
  
  while ((match = datePattern.exec(schemaContent)) !== null) {
    dateFields.push(match[1]);
  }
  
  return dateFields;
}

// Schema'dan tüm alanları parse et
function parseSchemaFields(schemaContent) {
  const fields = [];
  
  // z.object içindeki alanları bul
  const objectMatch = schemaContent.match(/z\.object\(({[^}]+})\)/s);
  if (!objectMatch) return fields;
  
  const objectContent = objectMatch[1];
  
  // Her alanı bul: fieldName: z.type()
  const fieldPattern = /(\w+):\s*z\.[^,}]+/g;
  let match;
  
  while ((match = fieldPattern.exec(objectContent)) !== null) {
    const fieldName = match[1];
    // Özel alanları atla (isActive, createdAt, updatedAt gibi)
    if (!['isActive', 'createdAt', 'updatedAt', 'id'].includes(fieldName)) {
      fields.push(fieldName);
    }
  }
  
  return fields;
}

// API route dosyalarını bul
function findApiRoutes() {
  const apiDir = path.join(process.cwd(), 'src', 'app', 'api');
  const routes = [];

  if (!fs.existsSync(apiDir)) {
    return routes;
  }

  function findRouteFiles(dir, fileList = []) {
    const files = fs.readdirSync(dir);
    files.forEach(file => {
      const filePath = path.join(dir, file);
      const stat = fs.statSync(filePath);
      if (stat.isDirectory()) {
        findRouteFiles(filePath, fileList);
      } else if (file === 'route.ts') {
        fileList.push(filePath);
      }
    });
    return fileList;
  }

  return findRouteFiles(apiDir);
}

// API route'unda date alanlarının işlenip işlenmediğini kontrol et
function checkDateHandling(routeContent, dateFields, operation) {
  const issues = [];
  const relativePath = path.relative(process.cwd(), routeContent.file);
  
  // Schema'da z.coerce.date() kullanılıp kullanılmadığını kontrol et
  const schemaFile = routeContent.schemaFile;
  let usesCoerceDate = false;
  if (schemaFile && fs.existsSync(schemaFile)) {
    const schemaContent = fs.readFileSync(schemaFile, 'utf-8');
    usesCoerceDate = schemaContent.includes('z.coerce.date()');
  }
  
  dateFields.forEach(dateField => {
    // Create/Update işlemlerinde date dönüşümü kontrolü
    if (operation === 'create' || operation === 'update') {
      // z.coerce.date() kullanılıyorsa new Date() dönüşümüne gerek yok
      if (usesCoerceDate) {
        // Sadece alanın kullanıldığını kontrol et
        const fieldUsagePattern = new RegExp(
          `${dateField}:\\s*(validatedData\\.${dateField}|updateData\\.${dateField})`,
          'g'
        );
        
        if (!fieldUsagePattern.test(routeContent.content)) {
          issues.push({
            type: 'date_field_missing',
            field: dateField,
            operation,
            file: relativePath,
            severity: 'warning',
            message: `Date field '${dateField}' is not used in ${operation} operation`,
          });
        }
      } else {
        // z.coerce.date() kullanılmıyorsa new Date() dönüşümü gerekli
        const dateConversionPattern = new RegExp(
          `${dateField}:\\s*validatedData\\.${dateField}\\s*\\?\\s*new Date\\(validatedData\\.${dateField}\\)`,
          'g'
        );
        
        const directAssignment = new RegExp(
          `${dateField}:\\s*validatedData\\.${dateField}`,
          'g'
        );
        
        if (directAssignment.test(routeContent.content) && !dateConversionPattern.test(routeContent.content)) {
          issues.push({
            type: 'date_conversion_missing',
            field: dateField,
            operation,
            file: relativePath,
            severity: 'error',
            message: `Date field '${dateField}' should be converted with 'new Date()' or use 'z.coerce.date()' in schema`,
          });
        }
      }
    }
    
    // GET response'larda ISO string dönüşümü kontrolü
    if (operation === 'get') {
      const isoConversionPattern = new RegExp(
        `${dateField}:\\s*\\w+\\.${dateField}\\?\\s*\\.toISOString\\(\\)`,
        'g'
      );
      
      if (!isoConversionPattern.test(routeContent.content)) {
        issues.push({
          type: 'date_iso_conversion_missing',
          field: dateField,
          operation,
          file: relativePath,
          severity: 'warning',
          message: `Date field '${dateField}' should be converted to ISO string in GET response`,
        });
      }
    }
  });
  
  return issues;
}

// API route'unda schema alanlarının kullanılıp kullanılmadığını kontrol et
function checkFieldUsage(routeContent, schemaFields, operation) {
  const issues = [];
  const relativePath = path.relative(process.cwd(), routeContent.file);
  const content = routeContent.content;
  
  // İgnore edilecek alanlar (başka modellerden gelen alanlar)
  const ignoreFields = ['userId', 'contactId', 'tenantNumber', 'moveInDate', 'moveOutDate', 
    'paymentScore', 'contactScore', 'maintenanceScore', 'overallScore', 'notes', 'analysis',
    'name', 'email', 'phone', 'permissions', 'propertyIds', 'apartmentIds'];
  
  schemaFields.forEach(field => {
    // Ignore listesindeki alanları atla (bunlar başka modellerden gelebilir)
    if (ignoreFields.includes(field)) {
      return;
    }
    
    // Create/Update işlemlerinde alan kullanımı kontrolü
    if (operation === 'create' || operation === 'update') {
      // Alanın data objesinde kullanılıp kullanılmadığını kontrol et
      const fieldPattern = new RegExp(
        `${field}:\\s*(validatedData\\.${field}|\\w+\\.${field})`,
        'g'
      );
      
      if (!fieldPattern.test(content)) {
        // Bazı alanlar opsiyonel olabilir, kontrol edelim
        const optionalPattern = new RegExp(
          `${field}:\\s*validatedData\\.${field}\\s*\\|\\|\\s*null`,
          'g'
        );
        
        if (!optionalPattern.test(content)) {
          // Update işlemlerinde bazı alanlar opsiyonel olabilir
          if (operation === 'update') {
            const updatePattern = new RegExp(
              `if\\s*\\(validatedData\\.${field}\\s*!==\\s*undefined\\)`,
              'g'
            );
            if (updatePattern.test(content)) {
              return; // Update'te undefined check varsa sorun yok
            }
          }
          
          issues.push({
            type: 'field_missing',
            field,
            operation,
            file: relativePath,
            severity: 'warning',
            message: `Field '${field}' from schema is not used in ${operation} operation`,
          });
        }
      }
    }
  });
  
  return issues;
}

// Schema ve API route eşleştirmesi
function matchSchemaToRoute(schemaFile, apiRoutes) {
  const schemaName = path.basename(schemaFile, '.schema.ts');
  const moduleName = path.basename(path.dirname(path.dirname(schemaFile)));
  const schemaPath = path.relative(process.cwd(), schemaFile);
  
  // Schema import path'ini oluştur
  // Örnek: src/modules/real-estate/schemas/apartment.schema.ts -> modules/real-estate/schemas/apartment.schema
  const schemaImportPath = schemaPath.replace(/\\/g, '/').replace(/\.ts$/, '').replace(/^src\//, '');
  
  // API route'larını modül adına ve schema import'una göre filtrele
  const matchingRoutes = apiRoutes.filter(route => {
    const routePath = path.relative(process.cwd(), route);
    const routePathNormalized = routePath.replace(/\\/g, '/');
    
    // Modül adına göre filtrele
    const routeModule = routePath.split(path.sep)[3];
    if (routeModule !== moduleName) {
      return false;
    }
    
    // Schema import'unu kontrol et
    try {
      const routeContent = fs.readFileSync(route, 'utf-8');
      const schemaImportPattern = new RegExp(
        `from\\s+['"]@/modules/${moduleName}/schemas/${schemaName}\\.schema['"]`,
        'g'
      );
      
      if (schemaImportPattern.test(routeContent)) {
        return true;
      }
      
      // Alternatif: route path'inde schema adı geçiyor mu?
      // Örnek: apartments/route.ts -> apartment schema
      const routeEntity = routePath.split(path.sep).slice(-2, -1)[0];
      if (routeEntity && schemaName.toLowerCase().includes(routeEntity.toLowerCase())) {
        return true;
      }
      
      return false;
    } catch (error) {
      return false;
    }
  });
  
  return matchingRoutes;
}

// Ana fonksiyon
function main() {
  log('\n🔍 API Schema Consistency Validation Başlatılıyor...\n', 'blue');

  // 1. Schema dosyalarını bul
  logInfo('Schema dosyaları taranıyor...');
  const schemaFiles = findSchemaFiles();
  logSuccess(`${schemaFiles.length} schema dosyası bulundu`);

  // 2. API route dosyalarını bul
  logInfo('API route dosyaları taranıyor...');
  const apiRoutes = findApiRoutes();
  logSuccess(`${apiRoutes.length} API route dosyası bulundu`);

  const allIssues = [];

  // 3. Her schema için kontrol yap
  schemaFiles.forEach(schemaFile => {
    const relativeSchemaPath = path.relative(process.cwd(), schemaFile);
    logInfo(`\nKontrol ediliyor: ${relativeSchemaPath}`);
    
    try {
      const schemaContent = fs.readFileSync(schemaFile, 'utf-8');
      
      // Schema'dan date alanlarını ve tüm alanları parse et
      const dateFields = parseSchemaDates(schemaContent);
      const allFields = parseSchemaFields(schemaContent);
      
      if (dateFields.length > 0) {
        log(`   Date alanları: ${dateFields.join(', ')}`, 'cyan');
      }
      
      if (allFields.length > 0) {
        log(`   Toplam alan: ${allFields.length}`, 'cyan');
      }
      
      // İlgili API route'larını bul
      const matchingRoutes = matchSchemaToRoute(schemaFile, apiRoutes);
      
      if (matchingRoutes.length === 0) {
        logWarning(`   İlgili API route bulunamadı`);
        return;
      }
      
      // Her route için kontrol yap
      matchingRoutes.forEach(routeFile => {
        const routeContent = fs.readFileSync(routeFile, 'utf-8');
        const relativeRoutePath = path.relative(process.cwd(), routeFile);
        
        // POST (create) kontrolü
        if (routeContent.includes('export async function POST')) {
          const createIssues = [
            ...checkDateHandling({ file: routeFile, content: routeContent, schemaFile }, dateFields, 'create'),
            ...checkFieldUsage({ file: routeFile, content: routeContent, schemaFile }, allFields, 'create'),
          ];
          allIssues.push(...createIssues);
        }
        
        // PATCH (update) kontrolü
        if (routeContent.includes('export async function PATCH')) {
          const updateIssues = [
            ...checkDateHandling({ file: routeFile, content: routeContent, schemaFile }, dateFields, 'update'),
            ...checkFieldUsage({ file: routeFile, content: routeContent, schemaFile }, allFields, 'update'),
          ];
          allIssues.push(...updateIssues);
        }
        
        // GET kontrolü
        if (routeContent.includes('export async function GET')) {
          const getIssues = checkDateHandling({ file: routeFile, content: routeContent, schemaFile }, dateFields, 'get');
          allIssues.push(...getIssues);
        }
      });
      
    } catch (error) {
      logError(`Schema parse hatası: ${error.message}`);
    }
  });

  // 4. Sonuçları göster
  log('\n📊 Sonuçlar:\n', 'blue');

  if (allIssues.length === 0) {
    logSuccess('Tüm API route\'ları schema ile uyumlu görünüyor!');
  } else {
    // Sorunları grupla
    const groupedIssues = {};
    allIssues.forEach(issue => {
      const key = `${issue.type}_${issue.file}`;
      if (!groupedIssues[key]) {
        groupedIssues[key] = [];
      }
      groupedIssues[key].push(issue);
    });

    // Hata seviyesine göre sırala
    const errors = allIssues.filter(i => i.severity === 'error');
    const warnings = allIssues.filter(i => i.severity === 'warning');

    if (errors.length > 0) {
      logError(`\n${errors.length} HATA tespit edildi:\n`);
      errors.forEach(issue => {
        logError(`${issue.file} - ${issue.field || issue.type}:`);
        log(`   ${issue.message}`, 'yellow');
      });
    }

    if (warnings.length > 0) {
      logWarning(`\n${warnings.length} UYARI tespit edildi:\n`);
      warnings.forEach(issue => {
        logWarning(`${issue.file} - ${issue.field || issue.type}:`);
        log(`   ${issue.message}`, 'yellow');
      });
    }

    // Öneriler
    log('\n💡 Öneriler:\n', 'cyan');
    log('1. Date alanları için:');
    log('   Schema\'da: z.coerce.date() kullanın');
    log('   API route\'da: new Date(validatedData.dateField) kullanın');
    log('   GET response\'da: dateField?.toISOString() kullanın');
    log('');
    log('2. Eksik alanlar için:');
    log('   Schema\'daki tüm alanları create/update işlemlerinde kullanın');
    log('   Opsiyonel alanlar için: field: validatedData.field || null');
    log('');
    log('3. Schema güncellemeleri:');
    log('   Schema değiştiğinde ilgili API route\'ları da güncelleyin');
    log('');
  }

  // 5. Özet rapor
  const errors = allIssues.filter(i => i.severity === 'error');
  const warnings = allIssues.filter(i => i.severity === 'warning');
  
  log('\n📈 Özet:\n', 'blue');
  log(`   Schema Dosyası: ${schemaFiles.length}`);
  log(`   API Route: ${apiRoutes.length}`);
  log(`   Tespit Edilen Hata: ${errors.length}`);
  log(`   Tespit Edilen Uyarı: ${warnings.length}`);

  // Exit code
  process.exit(errors.length > 0 ? 1 : 0);
}

// Script'i çalıştır
if (require.main === module) {
  try {
    main();
  } catch (error) {
    logError(`Hata: ${error.message}`);
    console.error(error);
    process.exit(1);
  }
}

module.exports = { main, parseSchemaDates, parseSchemaFields, checkDateHandling, checkFieldUsage };

