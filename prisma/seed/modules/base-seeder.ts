/**
 * Base Seeder Interface
 * Tüm modül seeder'larının uyması gereken arayüz
 */

import { PrismaClient as TenantPrismaClient, Prisma } from '@prisma/tenant-client';
import { PrismaClient as CorePrismaClient } from '@prisma/core-client';

export interface SeederContext {
  tenantPrisma: TenantPrismaClient;
  corePrisma: CorePrismaClient;
  tenantId: string;
  companyId: string;
  adminUserId: string;
  tenantSlug: string;
}

export interface SeederResult {
  success: boolean;
  itemsCreated: number;
  itemsDeleted?: number;
  error?: string;
  details?: Record<string, number>;
}

export interface ModuleSeeder {
  // Modül tanımlayıcı bilgileri
  moduleSlug: string;
  moduleName: string;
  description: string;

  // Bağımlılıklar (önce seed edilmesi gereken modüller)
  dependencies?: string[];

  // Seed işlemleri
  seed(ctx: SeederContext): Promise<SeederResult>;

  // Silme işlemleri
  unseed(ctx: SeederContext): Promise<SeederResult>;

  // Mevcut demo veri sayısını kontrol et
  checkStatus(ctx: SeederContext): Promise<{ hasData: boolean; count: number }>;
}

// Helper functions
export function randomDate(start: Date, end: Date): Date {
  return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
}

export function randomDecimal(min: number, max: number): Prisma.Decimal {
  return new Prisma.Decimal((Math.random() * (max - min) + min).toFixed(2));
}

export function randomChoice<T>(arr: T[]): T {
  if (arr.length === 0) {
    throw new Error('randomChoice: array cannot be empty');
  }
  return arr[Math.floor(Math.random() * arr.length)] as T;
}

export function generateDemoId(tenantSlug: string, module: string, suffix: string): string {
  return `${tenantSlug}-demo-${module}-${suffix}`;
}

// Demo data marker - tüm demo veriler bu prefix ile işaretlenir
export const DEMO_DATA_PREFIX = 'demo-';

export function isDemoData(id: string): boolean {
  return id.includes(DEMO_DATA_PREFIX) || id.includes('-demo-');
}
