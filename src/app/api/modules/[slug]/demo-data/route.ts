/**
 * Demo Data API Endpoint
 *
 * Modül bazlı demo veri yükleme ve silme işlemleri
 * Supports localized demo data (tr, en, de, ar)
 */

import { NextRequest, NextResponse } from 'next/server';
import { getTenantFromRequest, getTenantPrismaFromRequest } from '@/lib/api/tenantContext';
import { corePrisma } from '@/lib/corePrisma';
import {
  getSeeder,
  checkAllModulesStatus,
  seedAllModules,
  unseedAllModules,
  loadDemoData,
  getAvailableLocales,
  DEFAULT_LOCALE,
} from '../../../../../../prisma/seed/modules';
import type { SeederContext, SupportedLocale } from '../../../../../../prisma/seed/modules';

// Helper function to create seeder context with locale support
async function createSeederContext(
  request: NextRequest,
  locale: SupportedLocale = DEFAULT_LOCALE
): Promise<SeederContext | null> {
  const tenant = await getTenantFromRequest(request);
  if (!tenant) {
    return null;
  }

  const tenantPrisma = await getTenantPrismaFromRequest(request);
  if (!tenantPrisma) {
    return null;
  }

  // Get first company and admin user
  const company = await tenantPrisma.company.findFirst({
    orderBy: { createdAt: 'asc' },
  });

  const adminUser = await tenantPrisma.user.findFirst({
    where: { role: { in: ['SuperAdmin', 'AgencyUser', 'ClientUser'] } },
    orderBy: { createdAt: 'asc' },
  });

  if (!company || !adminUser) {
    return null;
  }

  // Load localized demo data
  const demoData = loadDemoData(locale);

  return {
    tenantPrisma,
    corePrisma,
    tenantId: tenant.id,
    companyId: company.id,
    adminUserId: adminUser.id,
    tenantSlug: tenant.slug,
    locale,
    demoData,
  };
}

// Helper to parse locale from request
function getLocaleFromRequest(request: NextRequest): SupportedLocale {
  const url = new URL(request.url);
  const localeParam = url.searchParams.get('locale');
  if (localeParam && ['tr', 'en', 'de', 'ar'].includes(localeParam)) {
    return localeParam as SupportedLocale;
  }
  return DEFAULT_LOCALE;
}

// GET: Demo veri durumunu kontrol et
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await context.params;
    const locale = getLocaleFromRequest(request);

    // Special endpoint to get available locales
    // Note: Currency is no longer locale-specific. System uses GeneralSettings.currency
    if (slug === 'locales') {
      const locales = getAvailableLocales();
      return NextResponse.json({
        success: true,
        data: {
          locales: locales.map((loc) => ({
            code: loc,
            name: loc === 'tr' ? 'Türkçe' : loc === 'en' ? 'English' : loc === 'de' ? 'Deutsch' : 'العربية',
          })),
          defaultLocale: DEFAULT_LOCALE,
        },
      });
    }

    const ctx = await createSeederContext(request, locale);
    if (!ctx) {
      return NextResponse.json(
        { success: false, error: 'Tenant context not available' },
        { status: 400 }
      );
    }

    // Eğer slug "all" ise tüm modüllerin durumunu getir
    if (slug === 'all') {
      const statuses = await checkAllModulesStatus(ctx);
      return NextResponse.json({
        success: true,
        data: statuses,
      });
    }

    // Tek modül için durum kontrolü
    const seeder = getSeeder(slug);
    if (!seeder) {
      return NextResponse.json(
        { success: false, error: `Seeder not found for module: ${slug}` },
        { status: 404 }
      );
    }

    const status = await seeder.checkStatus(ctx);

    return NextResponse.json({
      success: true,
      data: {
        moduleSlug: slug,
        moduleName: seeder.moduleName,
        description: seeder.description,
        hasData: status.hasData,
        count: status.count,
        dependencies: seeder.dependencies || [],
      },
    });
  } catch (error) {
    console.error('Error checking demo data status:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to check status',
      },
      { status: 500 }
    );
  }
}

// POST: Demo veri yükle
export async function POST(
  request: NextRequest,
  context: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await context.params;
    const locale = getLocaleFromRequest(request);

    const ctx = await createSeederContext(request, locale);
    if (!ctx) {
      return NextResponse.json(
        { success: false, error: 'Tenant context not available' },
        { status: 400 }
      );
    }

    // Eğer slug "all" ise tüm modülleri seed et
    if (slug === 'all') {
      const results = await seedAllModules(ctx);
      const totalCreated = Object.values(results).reduce((sum, r) => sum + r.itemsCreated, 0);
      const errors = Object.entries(results)
        .filter(([_, r]) => !r.success)
        .map(([k, r]) => `${k}: ${r.error}`);

      return NextResponse.json({
        success: errors.length === 0,
        data: {
          totalCreated,
          results,
          locale,
          errors: errors.length > 0 ? errors : undefined,
        },
      });
    }

    // Tek modül için seed
    const seeder = getSeeder(slug);
    if (!seeder) {
      return NextResponse.json(
        { success: false, error: `Seeder not found for module: ${slug}` },
        { status: 404 }
      );
    }

    // Önce bağımlılıkları kontrol et ve gerekirse seed et
    if (seeder.dependencies) {
      for (const dep of seeder.dependencies) {
        const depSeeder = getSeeder(dep);
        if (depSeeder) {
          const depStatus = await depSeeder.checkStatus(ctx);
          if (!depStatus.hasData) {
            await depSeeder.seed(ctx);
          }
        }
      }
    }

    const result = await seeder.seed(ctx);

    return NextResponse.json({
      success: result.success,
      data: {
        moduleSlug: slug,
        moduleName: seeder.moduleName,
        itemsCreated: result.itemsCreated,
        details: result.details,
        locale,
        error: result.error,
      },
    });
  } catch (error) {
    console.error('Error seeding demo data:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to seed demo data',
      },
      { status: 500 }
    );
  }
}

// DELETE: Demo veriyi sil
export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await context.params;

    const ctx = await createSeederContext(request);
    if (!ctx) {
      return NextResponse.json(
        { success: false, error: 'Tenant context not available' },
        { status: 400 }
      );
    }

    // Eğer slug "all" ise tüm modülleri unseed et
    if (slug === 'all') {
      const results = await unseedAllModules(ctx);
      const totalDeleted = Object.values(results).reduce((sum, r) => sum + (r.itemsDeleted || 0), 0);
      const errors = Object.entries(results)
        .filter(([_, r]) => !r.success)
        .map(([k, r]) => `${k}: ${r.error}`);

      return NextResponse.json({
        success: errors.length === 0,
        data: {
          totalDeleted,
          results,
          errors: errors.length > 0 ? errors : undefined,
        },
      });
    }

    // Tek modül için unseed
    const seeder = getSeeder(slug);
    if (!seeder) {
      return NextResponse.json(
        { success: false, error: `Seeder not found for module: ${slug}` },
        { status: 404 }
      );
    }

    const result = await seeder.unseed(ctx);

    return NextResponse.json({
      success: result.success,
      data: {
        moduleSlug: slug,
        moduleName: seeder.moduleName,
        itemsDeleted: result.itemsDeleted,
        error: result.error,
      },
    });
  } catch (error) {
    console.error('Error removing demo data:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to remove demo data',
      },
      { status: 500 }
    );
  }
}
