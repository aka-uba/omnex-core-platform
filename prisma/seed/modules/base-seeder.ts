/**
 * Base Seeder Interface
 * Tüm modül seeder'larının uyması gereken arayüz
 */

import { PrismaClient as TenantPrismaClient, Prisma } from '@prisma/tenant-client';
import { PrismaClient as CorePrismaClient } from '@prisma/core-client';

// Static imports for demo data (works in both CLI and Next.js bundled environment)
import demoDataTr from '../locales/demo-data.tr.json';
import demoDataEn from '../locales/demo-data.en.json';
import demoDataDe from '../locales/demo-data.de.json';
import demoDataAr from '../locales/demo-data.ar.json';

// Supported locales for demo data
export type SupportedLocale = 'tr' | 'en' | 'de' | 'ar';

export interface LocaleConfig {
  locale: SupportedLocale;
  country: string;
  dateFormat: string;
}

// Demo data structure for each locale
export interface DemoData {
  locale: string;
  country: string;
  dateFormat: string;
  locations: {
    hq: LocationData;
    factory: LocationData;
    warehouse: LocationData;
  };
  realEstate: RealEstateData;
  hr: HRData;
  production: ProductionData;
  maintenance: MaintenanceData;
  accounting: AccountingData;
  notifications: NotificationsData;
  webBuilder: WebBuilderData;
}

export interface LocationData {
  name: string;
  address: string;
  city: string;
  district: string;
  postalCode: string;
}

export interface RealEstateData {
  properties: Array<{
    name: string;
    type: string;
    address: string;
    city: string;
    district: string;
    neighborhood: string;
    description: string;
  }>;
  tenants: Array<{
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
  }>;
  staffRoles: Record<string, string>;
}

export interface HRData {
  departments: string[];
  positions: Record<string, string>;
  employees: Array<{
    firstName: string;
    lastName: string;
    email: string;
    department: string;
    position: string;
  }>;
  leaveTypes: Record<string, string>;
}

export interface ProductionData {
  products: Array<{
    name: string;
    sku: string;
    unit: string;
    category: string;
  }>;
  orderStatuses: Record<string, string>;
}

export interface MaintenanceData {
  equipment: Array<{
    name: string;
    code: string;
    type: string;
    location: string;
  }>;
  workOrderTypes: Record<string, string>;
}

export interface AccountingData {
  expenseCategories: string[];
  paymentMethods: Record<string, string>;
  invoiceTypes: Record<string, string>;
}

export interface NotificationsData {
  templates: Record<string, string>;
}

export interface WebBuilderData {
  company: {
    name: string;
    slogan: string;
    description: string;
    address: string;
    phone: string;
    email: string;
  };
  pages: Record<string, string>;
}

export interface SeederContext {
  tenantPrisma: TenantPrismaClient;
  corePrisma: CorePrismaClient;
  tenantId: string;
  companyId: string;
  adminUserId: string;
  tenantSlug: string;
  // Locale support
  locale: SupportedLocale;
  demoData: DemoData;
  // NOT: Currency artık demo verilerde yok!
  // Uygulama her zaman GeneralSettings.currency değerini kullanır.
  // DB'ye yazılacak kayıtlar için currency alanını null bırakın veya
  // GeneralSettings'ten okuyun.
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

// Default locale configuration
export const DEFAULT_LOCALE: SupportedLocale = 'tr';

// Static demo data map (no fs operations needed)
const DEMO_DATA_MAP: Record<SupportedLocale, DemoData> = {
  tr: demoDataTr as DemoData,
  en: demoDataEn as DemoData,
  de: demoDataDe as DemoData,
  ar: demoDataAr as DemoData,
};

// Load demo data for a specific locale
export function loadDemoData(locale: SupportedLocale = DEFAULT_LOCALE): DemoData {
  const data = DEMO_DATA_MAP[locale];
  if (!data) {
    console.warn(`Demo data not found for locale "${locale}", falling back to "${DEFAULT_LOCALE}"`);
    return DEMO_DATA_MAP[DEFAULT_LOCALE];
  }
  return data;
}

// Create seeder context with locale support
export function createSeederContext(
  baseContext: Omit<SeederContext, 'locale' | 'demoData'>,
  locale: SupportedLocale = DEFAULT_LOCALE
): SeederContext {
  const demoData = loadDemoData(locale);
  return {
    ...baseContext,
    locale,
    demoData,
  };
}

// Get available locales
export function getAvailableLocales(): SupportedLocale[] {
  // Return all supported locales (statically defined)
  return ['tr', 'en', 'de', 'ar'];
}
