import { PrismaClient } from '@prisma/tenant-client';
import { PrismaClient as CorePrismaClient } from '@prisma/core-client';

const tenantPrisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.TENANT_DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/tenant_omnexcore_2025'
    }
  }
});

const corePrisma = new CorePrismaClient({
  datasources: {
    db: {
      url: process.env.CORE_DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/omnex_core'
    }
  }
});

interface ModelCheck {
  model: string;
  total: number;
  withCorrectTenantId: number;
  withWrongTenantId: number;
  issues: string[];
}

async function checkSeederData() {
  try {
    await tenantPrisma.$connect();
    await corePrisma.$connect();

    // Get correct tenant ID from core
    const tenant = await corePrisma.tenant.findFirst({
      where: { slug: 'omnexcore' },
      select: { id: true, slug: true }
    });

    if (!tenant) {
      console.error('❌ Tenant not found in core DB!');
      process.exit(1);
    }

    console.log(`✅ Found tenant: ${tenant.slug} (ID: ${tenant.id})\n`);

    // Get company
    const company = await tenantPrisma.company.findFirst({
      orderBy: { createdAt: 'asc' },
      select: { id: true, name: true }
    });

    if (!company) {
      console.error('❌ Company not found!');
      process.exit(1);
    }

    console.log(`✅ Found company: ${company.name} (ID: ${company.id})\n`);

    const checks: ModelCheck[] = [];

    // Check models that should use core tenant ID
    const coreTenantModels = [
      'property',
      'apartment',
      'contract',
      'realEstateStaff',
      'maintenanceRecord',
      'emailTemplate',
      'emailCampaign',
      'report',
    ];
    
    // Models that use Real Estate Tenant ID (not core tenant ID) - check by companyId instead
    const reTenantModels = [
      'appointment',
    ];

    for (const modelName of coreTenantModels) {
      try {
        const model = (tenantPrisma as any)[modelName];
        if (!model) continue;

        const total = await model.count();
        const withCorrectTenantId = await model.count({
          where: { tenantId: tenant.id }
        });
        const withWrongTenantId = total - withCorrectTenantId;

        const issues: string[] = [];
        if (withWrongTenantId > 0) {
          issues.push(`${withWrongTenantId} records have wrong tenantId (should be "${tenant.id}")`);
        }
        if (total === 0) {
          issues.push('No data found - seed may not have run');
        }

        checks.push({
          model: modelName,
          total,
          withCorrectTenantId,
          withWrongTenantId,
          issues
        });
      } catch (error: any) {
        checks.push({
          model: modelName,
          total: 0,
          withCorrectTenantId: 0,
          withWrongTenantId: 0,
          issues: [`Error checking: ${error.message}`]
        });
      }
    }

    // Check models that use Real Estate Tenant ID (check by companyId instead)
    for (const modelName of reTenantModels) {
      try {
        const model = (tenantPrisma as any)[modelName];
        if (!model) continue;

        const total = await model.count();
        const withCompany = await model.count({
          where: { companyId: company.id }
        });
        const withoutCompany = total - withCompany;

        const issues: string[] = [];
        if (withoutCompany > 0) {
          issues.push(`${withoutCompany} records don't have correct companyId (should be "${company.id}")`);
        }
        if (total === 0) {
          issues.push('No data found - seed may not have run');
        }

        checks.push({
          model: modelName,
          total,
          withCorrectTenantId: withCompany,
          withWrongTenantId: withoutCompany,
          issues
        });
      } catch (error: any) {
        checks.push({
          model: modelName,
          total: 0,
          withCorrectTenantId: 0,
          withWrongTenantId: 0,
          issues: [`Error checking: ${error.message}`]
        });
      }
    }

    // Check Payment model (uses companyId, not tenantId)
    try {
      const total = await tenantPrisma.payment.count();
      const withCompany = await tenantPrisma.payment.count({
        where: { companyId: company.id }
      });
      const withoutCompany = total - withCompany;

      const issues: string[] = [];
      if (withoutCompany > 0) {
        issues.push(`${withoutCompany} payments don't have correct companyId`);
      }
      if (total === 0) {
        issues.push('No payments found - seed may not have run');
      }

      checks.push({
        model: 'payment',
        total,
        withCorrectTenantId: withCompany,
        withWrongTenantId: withoutCompany,
        issues
      });
    } catch (error: any) {
      checks.push({
        model: 'payment',
        total: 0,
        withCorrectTenantId: 0,
        withWrongTenantId: 0,
        issues: [`Error checking: ${error.message}`]
      });
    }

    // Print results
    console.log('📊 Seeder Data Check Results:\n');
    console.log('='.repeat(80));

    let hasIssues = false;

    for (const check of checks) {
      const status = check.issues.length === 0 ? '✅' : '⚠️';
      if (check.issues.length > 0) hasIssues = true;

      console.log(`\n${status} ${check.model}`);
      console.log(`   Total: ${check.total}`);
      console.log(`   Correct: ${check.withCorrectTenantId}`);
      console.log(`   Wrong: ${check.withWrongTenantId}`);

      if (check.issues.length > 0) {
        console.log(`   Issues:`);
        check.issues.forEach(issue => console.log(`     - ${issue}`));
      }
    }

    console.log('\n' + '='.repeat(80));

    if (hasIssues) {
      console.log('\n⚠️  Some models have issues. Check the details above.');
      console.log('💡 Tip: Run demo seed again or check API routes for correct filtering.');
    } else {
      console.log('\n✅ All models look good!');
    }

    await corePrisma.$disconnect();
    await tenantPrisma.$disconnect();
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

checkSeederData();

