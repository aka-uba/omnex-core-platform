/**
 * Setup Demo Modules API Endpoint
 *
 * Setup wizard için modül bazlı demo veri yükleme ve silme işlemleri
 * Bu endpoint tenant context olmadan çalışır (setup sırasında kullanılır)
 */

import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient as CorePrismaClient } from '@prisma/core-client';
import { PrismaClient as TenantPrismaClient } from '@prisma/tenant-client';
import {
  getAllSeeders,
  getSeedersInOrder,
} from '../../../../../prisma/seed/modules';
import type { SeederContext } from '../../../../../prisma/seed/modules';

// Helper function to create seeder context for setup
async function createSetupSeederContext(
  coreDatabaseUrl: string,
  tenantDatabaseUrl: string,
  tenantSlug: string
): Promise<{ ctx: SeederContext; cleanup: () => Promise<void> } | null> {
  const corePrisma = new CorePrismaClient({
    datasources: { db: { url: coreDatabaseUrl } },
  });
  const tenantPrisma = new TenantPrismaClient({
    datasources: { db: { url: tenantDatabaseUrl } },
  });

  try {
    await corePrisma.$connect();
    await tenantPrisma.$connect();

    // Get tenant from core DB
    const tenant = await corePrisma.tenant.findUnique({
      where: { slug: tenantSlug },
    });

    if (!tenant) {
      await corePrisma.$disconnect();
      await tenantPrisma.$disconnect();
      return null;
    }

    // Get first company and admin user from tenant DB
    const company = await tenantPrisma.company.findFirst({
      orderBy: { createdAt: 'asc' },
    });

    const adminUser = await tenantPrisma.user.findFirst({
      where: { role: { in: ['SuperAdmin', 'AgencyUser', 'ClientUser'] } },
      orderBy: { createdAt: 'asc' },
    });

    if (!company || !adminUser) {
      await corePrisma.$disconnect();
      await tenantPrisma.$disconnect();
      return null;
    }

    const cleanup = async () => {
      await corePrisma.$disconnect();
      await tenantPrisma.$disconnect();
    };

    return {
      ctx: {
        tenantPrisma,
        corePrisma,
        tenantId: tenant.id,
        companyId: company.id,
        adminUserId: adminUser.id,
        tenantSlug: tenant.slug,
      },
      cleanup,
    };
  } catch (error) {
    await corePrisma.$disconnect();
    await tenantPrisma.$disconnect();
    throw error;
  }
}

// GET: Mevcut modül listesi ve durumları
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const coreDatabaseUrl = searchParams.get('coreDatabaseUrl');
    const tenantDatabaseUrl = searchParams.get('tenantDatabaseUrl');
    const tenantSlug = searchParams.get('tenantSlug');

    // Sadece modül listesini döndür (bağlantı bilgisi yoksa)
    if (!coreDatabaseUrl || !tenantDatabaseUrl || !tenantSlug) {
      const seeders = getAllSeeders();
      return NextResponse.json({
        success: true,
        data: {
          modules: seeders.map((s) => ({
            slug: s.moduleSlug,
            name: s.moduleName,
            description: s.description,
            dependencies: s.dependencies || [],
          })),
        },
      });
    }

    // Bağlantı bilgisi varsa durum kontrolü yap
    const setup = await createSetupSeederContext(
      coreDatabaseUrl,
      tenantDatabaseUrl,
      tenantSlug
    );

    if (!setup) {
      return NextResponse.json(
        { success: false, error: 'Could not establish database context' },
        { status: 400 }
      );
    }

    const { ctx, cleanup } = setup;

    try {
      const seeders = getAllSeeders();
      const modulesWithStatus = await Promise.all(
        seeders.map(async (s) => {
          try {
            const status = await s.checkStatus(ctx);
            return {
              slug: s.moduleSlug,
              name: s.moduleName,
              description: s.description,
              dependencies: s.dependencies || [],
              hasData: status.hasData,
              count: status.count,
            };
          } catch {
            return {
              slug: s.moduleSlug,
              name: s.moduleName,
              description: s.description,
              dependencies: s.dependencies || [],
              hasData: false,
              count: 0,
              error: 'Status check failed',
            };
          }
        })
      );

      return NextResponse.json({
        success: true,
        data: { modules: modulesWithStatus },
      });
    } finally {
      await cleanup();
    }
  } catch (error) {
    console.error('Error getting demo modules:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to get modules',
      },
      { status: 500 }
    );
  }
}

// POST: Seçili modüllere demo veri yükle
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { coreDatabaseUrl, tenantDatabaseUrl, tenantSlug, modules } = body;

    if (!coreDatabaseUrl || !tenantDatabaseUrl || !tenantSlug) {
      return NextResponse.json(
        { success: false, error: 'Database connection info required' },
        { status: 400 }
      );
    }

    const setup = await createSetupSeederContext(
      coreDatabaseUrl,
      tenantDatabaseUrl,
      tenantSlug
    );

    if (!setup) {
      return NextResponse.json(
        { success: false, error: 'Could not establish database context' },
        { status: 400 }
      );
    }

    const { ctx, cleanup } = setup;

    try {
      const results: Record<
        string,
        { success: boolean; itemsCreated: number; error?: string | undefined }
      > = {};

      // Modül listesi verilmediyse tüm modülleri seed et
      const selectedModules: string[] =
        modules && modules.length > 0
          ? modules
          : getAllSeeders().map((s) => s.moduleSlug);

      // Bağımlılık sırasına göre sırala
      const orderedSeeders = getSeedersInOrder();
      const seedersToRun = orderedSeeders.filter((s) =>
        selectedModules.includes(s.moduleSlug)
      );

      // Seçili modüllerin bağımlılıklarını da ekle
      const allModulesToSeed = new Set<string>();
      for (const seeder of seedersToRun) {
        allModulesToSeed.add(seeder.moduleSlug);
        if (seeder.dependencies) {
          for (const dep of seeder.dependencies) {
            allModulesToSeed.add(dep);
          }
        }
      }

      // Bağımlılık sırasına göre seed et
      for (const seeder of orderedSeeders) {
        if (!allModulesToSeed.has(seeder.moduleSlug)) continue;

        try {
          const result = await seeder.seed(ctx);
          results[seeder.moduleSlug] = {
            success: result.success,
            itemsCreated: result.itemsCreated,
            error: result.error,
          };
        } catch (error: unknown) {
          results[seeder.moduleSlug] = {
            success: false,
            itemsCreated: 0,
            error: error instanceof Error ? error.message : 'Unknown error',
          };
        }
      }

      const totalCreated = Object.values(results).reduce(
        (sum, r) => sum + r.itemsCreated,
        0
      );
      const errors = Object.entries(results)
        .filter(([_, r]) => !r.success)
        .map(([k, r]) => `${k}: ${r.error}`);

      return NextResponse.json({
        success: errors.length === 0,
        data: {
          totalCreated,
          results,
          errors: errors.length > 0 ? errors : undefined,
        },
      });
    } finally {
      await cleanup();
    }
  } catch (error) {
    console.error('Error seeding demo modules:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to seed modules',
      },
      { status: 500 }
    );
  }
}

// DELETE: Seçili modüllerden demo veri kaldır
export async function DELETE(request: NextRequest) {
  try {
    const body = await request.json();
    const { coreDatabaseUrl, tenantDatabaseUrl, tenantSlug, modules } = body;

    if (!coreDatabaseUrl || !tenantDatabaseUrl || !tenantSlug) {
      return NextResponse.json(
        { success: false, error: 'Database connection info required' },
        { status: 400 }
      );
    }

    const setup = await createSetupSeederContext(
      coreDatabaseUrl,
      tenantDatabaseUrl,
      tenantSlug
    );

    if (!setup) {
      return NextResponse.json(
        { success: false, error: 'Could not establish database context' },
        { status: 400 }
      );
    }

    const { ctx, cleanup } = setup;

    try {
      const results: Record<
        string,
        { success: boolean; itemsDeleted: number; error?: string | undefined }
      > = {};

      // Modül listesi verilmediyse tüm modülleri unseed et
      const selectedModules: string[] =
        modules && modules.length > 0
          ? modules
          : getAllSeeders().map((s) => s.moduleSlug);

      // Ters bağımlılık sırasında sil
      const orderedSeeders = getSeedersInOrder().reverse();
      const seedersToRun = orderedSeeders.filter((s) =>
        selectedModules.includes(s.moduleSlug)
      );

      for (const seeder of seedersToRun) {
        try {
          const result = await seeder.unseed(ctx);
          results[seeder.moduleSlug] = {
            success: result.success,
            itemsDeleted: result.itemsDeleted || 0,
            error: result.error,
          };
        } catch (error: unknown) {
          results[seeder.moduleSlug] = {
            success: false,
            itemsDeleted: 0,
            error: error instanceof Error ? error.message : 'Unknown error',
          };
        }
      }

      const totalDeleted = Object.values(results).reduce(
        (sum, r) => sum + r.itemsDeleted,
        0
      );
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
    } finally {
      await cleanup();
    }
  } catch (error) {
    console.error('Error removing demo modules:', error);
    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error ? error.message : 'Failed to remove modules',
      },
      { status: 500 }
    );
  }
}
