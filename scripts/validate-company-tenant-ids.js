#!/usr/bin/env node

/**
 * CompanyId ve TenantId Validation Script
 * 
 * Bu script, tüm Prisma modellerinde companyId ve tenantId zorunluluğunu kontrol eder
 * ve API route'larında bu alanların doğru kullanılıp kullanılmadığını tespit eder.
 * 
 * Kullanım:
 *   node scripts/validate-company-tenant-ids.js
 * 
 * Çıktı:
 *   - Zorunlu companyId/tenantId olan modeller listesi
 *   - API route'larında eksik kullanımlar
 *   - Öneriler ve düzeltmeler
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

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

// Prisma schema dosyalarını bul
function findPrismaSchemas() {
  const schemas = [];
  const prismaDir = path.join(process.cwd(), 'prisma');
  
  if (!fs.existsSync(prismaDir)) {
    logError('Prisma dizini bulunamadı!');
    process.exit(1);
  }

  // Tüm .prisma dosyalarını bul
  function findFiles(dir, fileList = []) {
    const files = fs.readdirSync(dir);
    files.forEach(file => {
      const filePath = path.join(dir, file);
      const stat = fs.statSync(filePath);
      if (stat.isDirectory()) {
        findFiles(filePath, fileList);
      } else if (file.endsWith('.prisma')) {
        fileList.push(filePath);
      }
    });
    return fileList;
  }

  return findFiles(prismaDir);
}

// Model tanımlarını parse et
function parseModels(schemaContent) {
  const models = [];
  const modelRegex = /model\s+(\w+)\s*\{([^}]+)\}/gs;
  let match;

  while ((match = modelRegex.exec(schemaContent)) !== null) {
    const modelName = match[1];
    const modelBody = match[2];
    
    // tenantId ve companyId kontrolü
    const hasTenantId = /tenantId\s+String[^?]/.test(modelBody);
    const hasCompanyId = /companyId\s+String[^?]/.test(modelBody);
    const tenantIdOptional = /tenantId\s+String\?/.test(modelBody);
    const companyIdOptional = /companyId\s+String\?/.test(modelBody);

    models.push({
      name: modelName,
      hasTenantId: hasTenantId || tenantIdOptional,
      tenantIdRequired: hasTenantId && !tenantIdOptional,
      hasCompanyId: hasCompanyId || companyIdOptional,
      companyIdRequired: hasCompanyId && !companyIdOptional,
      body: modelBody,
    });
  }

  return models;
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

// API route'unda create/update işlemlerini kontrol et
function checkApiRoute(routePath, models) {
  const issues = [];
  const content = fs.readFileSync(routePath, 'utf-8');
  const relativePath = path.relative(process.cwd(), routePath);

  // Model isimlerini bul (tenantPrisma.modelName.create/update)
  models.forEach(model => {
    const modelName = model.name;
    const createPattern = new RegExp(
      `tenantPrisma\\.${modelName}\\.create\\s*\\([^)]*\\)`,
      'gs'
    );
    const updatePattern = new RegExp(
      `tenantPrisma\\.${modelName}\\.update\\s*\\([^)]*\\)`,
      'gs'
    );

    // Create işlemlerini kontrol et
    if (createPattern.test(content)) {
      // tenantId kontrolü
      if (model.tenantIdRequired) {
        const tenantIdPattern = /tenantId:\s*(tenantContext\.id|tenantContext\?\.id)/;
        if (!tenantIdPattern.test(content)) {
          issues.push({
            type: 'missing_tenantId',
            model: modelName,
            operation: 'create',
            file: relativePath,
            severity: 'error',
          });
        }
      }

      // companyId kontrolü
      if (model.companyIdRequired) {
        const companyIdPattern = /companyId:\s*(companyId|finalCompanyId|firstCompany\.id)/;
        if (!companyIdPattern.test(content)) {
          issues.push({
            type: 'missing_companyId',
            model: modelName,
            operation: 'create',
            file: relativePath,
            severity: 'error',
          });
        }
      }
    }

    // Update işlemlerini kontrol et (genelde güncellenmez ama kontrol edelim)
    if (updatePattern.test(content)) {
      // Update'te genelde tenantId ve companyId güncellenmez
      // Ama yine de kontrol edelim
    }
  });

  return issues;
}

// Ana fonksiyon
function main() {
  log('\n🔍 CompanyId ve TenantId Validation Başlatılıyor...\n', 'blue');

  // 1. Prisma schema'larını bul
  logInfo('Prisma schema dosyaları taranıyor...');
  const schemaFiles = findPrismaSchemas();
  logSuccess(`${schemaFiles.length} schema dosyası bulundu`);

  // 2. Modelleri parse et
  logInfo('Modeller parse ediliyor...');
  const allModels = [];
  schemaFiles.forEach(file => {
    const content = fs.readFileSync(file, 'utf-8');
    const models = parseModels(content);
    allModels.push(...models);
  });

  // 3. Zorunlu alanları olan modelleri filtrele
  const requiredModels = allModels.filter(
    m => m.tenantIdRequired || m.companyIdRequired
  );

  logSuccess(`${requiredModels.length} model zorunlu tenantId/companyId içeriyor`);

  // 4. Model listesini göster
  log('\n📋 Zorunlu Alanları Olan Modeller:\n', 'blue');
  requiredModels.forEach(model => {
    const requirements = [];
    if (model.tenantIdRequired) requirements.push('tenantId (zorunlu)');
    if (model.companyIdRequired) requirements.push('companyId (zorunlu)');
    logInfo(`${model.name}: ${requirements.join(', ')}`);
  });

  // 5. API route'larını kontrol et
  log('\n🔍 API route\'ları kontrol ediliyor...\n', 'blue');
  const apiRoutes = findApiRoutes();
  logSuccess(`${apiRoutes.length} API route dosyası bulundu`);

  const allIssues = [];
  apiRoutes.forEach(route => {
    const issues = checkApiRoute(route, requiredModels);
    allIssues.push(...issues);
  });

  // 6. Sonuçları göster
  log('\n📊 Sonuçlar:\n', 'blue');

  if (allIssues.length === 0) {
    logSuccess('Tüm API route\'ları doğru görünüyor!');
  } else {
    logError(`${allIssues.length} sorun tespit edildi:\n`);

    // Sorunları grupla
    const groupedIssues = {};
    allIssues.forEach(issue => {
      const key = `${issue.type}_${issue.model}`;
      if (!groupedIssues[key]) {
        groupedIssues[key] = [];
      }
      groupedIssues[key].push(issue);
    });

    // Sorunları göster
    Object.values(groupedIssues).forEach(issues => {
      const issue = issues[0];
      logError(`${issue.model}.${issue.operation} - ${issue.type}:`);
      issues.forEach(i => {
        log(`   - ${i.file}`, 'yellow');
      });
      log('');
    });

    // Öneriler
    log('\n💡 Öneriler:\n', 'cyan');
    log('1. API route\'larında companyId için şu pattern\'i kullanın:');
    log('   const firstCompany = await tenantPrisma.company.findFirst({');
    log('     select: { id: true },');
    log('     orderBy: { createdAt: \'asc\' },');
    log('   });');
    log('   const companyId = firstCompany?.id;');
    log('');
    log('2. tenantId için tenantContext.id kullanın');
    log('3. Her create/update işleminde bu alanları kontrol edin');
    log('');
  }

  // 7. Özet rapor
  log('\n📈 Özet:\n', 'blue');
  log(`   Toplam Model: ${allModels.length}`);
  log(`   Zorunlu Alanları Olan Model: ${requiredModels.length}`);
  log(`   API Route: ${apiRoutes.length}`);
  log(`   Tespit Edilen Sorun: ${allIssues.length}`);

  // Exit code
  process.exit(allIssues.length > 0 ? 1 : 0);
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

module.exports = { main, parseModels, checkApiRoute };

















