/**
 * Seeder Registry
 * Tüm modül seeder'larını merkezi yönetim
 */

import { ModuleSeeder, SeederContext, SeederResult } from './base-seeder';
import { LocationsSeeder } from './locations.seed';
import { MaintenanceSeeder } from './maintenance.seed';
import { RealEstateSeeder } from './real-estate.seed';
import { AccountingSeeder } from './accounting.seed';
import { HRSeeder } from './hr.seed';
import { ProductionSeeder } from './production.seed';
import { NotificationsSeeder } from './notifications.seed';
import { ChatSeeder } from './chat.seed';
import { WebBuilderSeeder } from './web-builder.seed';
import { AISeeder } from './ai.seed';
import { FileManagementSeeder } from './file-management.seed';
import { ReportsSeeder } from './reports.seed';
import { AuditSeeder } from './audit.seed';
import { CalendarSeeder } from './calendar.seed';

// Tüm seeder'lar
const seeders: ModuleSeeder[] = [
  new LocationsSeeder(),
  new MaintenanceSeeder(),
  new RealEstateSeeder(),
  new AccountingSeeder(),
  new HRSeeder(),
  new ProductionSeeder(),
  new NotificationsSeeder(),
  new ChatSeeder(),
  new WebBuilderSeeder(),
  new AISeeder(),
  new FileManagementSeeder(),
  new ReportsSeeder(),
  new AuditSeeder(),
  new CalendarSeeder(),
];

// Slug alias mapping - maps UI slugs to seeder slugs
const slugAliases: Record<string, string> = {
  'file-manager': 'file-management',
  'raporlar': 'reports',
  'sohbet': 'chat',
};

// Slug ile seeder bul
export function getSeeder(moduleSlug: string): ModuleSeeder | undefined {
  // Check for alias first
  const resolvedSlug = slugAliases[moduleSlug] || moduleSlug;
  return seeders.find(s => s.moduleSlug === resolvedSlug);
}

// Tüm seeder'ları getir
export function getAllSeeders(): ModuleSeeder[] {
  return seeders;
}

// Tüm modül slug'larını getir
export function getAllModuleSlugs(): string[] {
  return seeders.map(s => s.moduleSlug);
}

// Bağımlılık sırasına göre sıralı seeder listesi
export function getSeedersInOrder(): ModuleSeeder[] {
  const ordered: ModuleSeeder[] = [];
  const visited = new Set<string>();

  function visit(seeder: ModuleSeeder) {
    if (visited.has(seeder.moduleSlug)) return;
    visited.add(seeder.moduleSlug);

    // Önce bağımlılıkları işle
    if (seeder.dependencies) {
      for (const dep of seeder.dependencies) {
        const depSeeder = getSeeder(dep);
        if (depSeeder) {
          visit(depSeeder);
        }
      }
    }

    ordered.push(seeder);
  }

  for (const seeder of seeders) {
    visit(seeder);
  }

  return ordered;
}

// Tek modül seed et
export async function seedModule(
  moduleSlug: string,
  ctx: SeederContext
): Promise<SeederResult> {
  const seeder = getSeeder(moduleSlug);
  if (!seeder) {
    return {
      success: false,
      itemsCreated: 0,
      error: `Seeder not found for module: ${moduleSlug}`,
    };
  }

  // Bağımlılıkları kontrol et
  if (seeder.dependencies) {
    for (const dep of seeder.dependencies) {
      const depSeeder = getSeeder(dep);
      if (depSeeder) {
        const status = await depSeeder.checkStatus(ctx);
        if (!status.hasData) {
          // Bağımlılığı seed et
          await depSeeder.seed(ctx);
        }
      }
    }
  }

  return seeder.seed(ctx);
}

// Tek modül unseed et
export async function unseedModule(
  moduleSlug: string,
  ctx: SeederContext
): Promise<SeederResult> {
  const seeder = getSeeder(moduleSlug);
  if (!seeder) {
    return {
      success: false,
      itemsCreated: 0,
      itemsDeleted: 0,
      error: `Seeder not found for module: ${moduleSlug}`,
    };
  }

  return seeder.unseed(ctx);
}

// Tüm modülleri seed et
export async function seedAllModules(
  ctx: SeederContext
): Promise<Record<string, SeederResult>> {
  const results: Record<string, SeederResult> = {};
  const orderedSeeders = getSeedersInOrder();

  for (const seeder of orderedSeeders) {
    try {
      results[seeder.moduleSlug] = await seeder.seed(ctx);
    } catch (error: any) {
      results[seeder.moduleSlug] = {
        success: false,
        itemsCreated: 0,
        error: error.message || 'Unknown error',
      };
    }
  }

  return results;
}

// Tüm modülleri unseed et
export async function unseedAllModules(
  ctx: SeederContext
): Promise<Record<string, SeederResult>> {
  const results: Record<string, SeederResult> = {};
  // Ters sırada sil (bağımlılıklar en son)
  const orderedSeeders = getSeedersInOrder().reverse();

  for (const seeder of orderedSeeders) {
    try {
      results[seeder.moduleSlug] = await seeder.unseed(ctx);
    } catch (error: any) {
      results[seeder.moduleSlug] = {
        success: false,
        itemsCreated: 0,
        itemsDeleted: 0,
        error: error.message || 'Unknown error',
      };
    }
  }

  return results;
}

// Tüm modüllerin durumunu kontrol et
export async function checkAllModulesStatus(
  ctx: SeederContext
): Promise<Record<string, { hasData: boolean; count: number }>> {
  const statuses: Record<string, { hasData: boolean; count: number }> = {};

  for (const seeder of seeders) {
    try {
      statuses[seeder.moduleSlug] = await seeder.checkStatus(ctx);
    } catch {
      statuses[seeder.moduleSlug] = { hasData: false, count: 0 };
    }
  }

  return statuses;
}
