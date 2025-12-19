/**
 * Tenant Service
 * 
 * Tenant oluşturma, yönetim ve database işlemleri için service layer
 */

import { execSync } from 'child_process';
import { getTenantConfig, generateTenantDbName, getTenantDatabaseUrl } from '@/config/tenant.config';
import { corePrisma } from '@/lib/corePrisma';
import { logger } from '@/lib/utils/logger';
import {
  createTenantDirectoryStructure,
  uploadCompanyAsset,
  createDefaultExportTemplate,
  createInitialLocation,
  updateCompanyWithWizardData
} from './tenantService-helpers';

export interface CreateTenantInput {
  name: string;
  slug: string;
  subdomain?: string;
  customDomain?: string;
  agencyId?: string;
  year?: number;

  // Company info (NEW)
  companyInfo?: {
    name?: string; // Default: tenant name
    logo?: File | string; // File or path
    favicon?: File | string;
    address?: string;
    city?: string;
    state?: string;
    postalCode?: string;
    country?: string;
    phone?: string;
    email?: string;
    website?: string;
    industry?: string;
    description?: string;
    foundedYear?: number;
    employeeCount?: number;
    capital?: string;
    taxNumber?: string;
    taxOffice?: string;
    registrationNumber?: string;
    mersisNumber?: string;
    iban?: string;
    bankName?: string;
    accountHolder?: string;
  };

  // Initial location (NEW - OPTIONAL)
  initialLocation?: {
    name: string;
    code?: string;
    type: string;
    address?: string;
    city?: string;
    country?: string;
    postalCode?: string;
    phone?: string;
    email?: string;
    latitude?: number;
    longitude?: number;
    description?: string;
  };
}

export interface TenantCreationResult {
  tenant: {
    id: string;
    slug: string;
    name: string;
    dbName: string;
    currentDb: string;
  };
  dbUrl: string;
  credentials: {
    accessUrl: string;
    superAdmin: {
      email: string;
      username: string;
      password: string;
    };
    tenantAdmin: {
      email: string;
      username: string;
      password: string;
    };
    defaultUser: {
      email: string;
      username: string;
      password: string;
    };
    exportTemplateId?: string;
    locationId?: string;
  };
}

/**
 * Create a new tenant
 * 
 * 1. Core DB'ye Tenant kaydı ekle
 * 2. PostgreSQL'de yeni DB oluştur
 * 3. Tenant DB'ye migration uygula
 * 4. Seed işlemleri
 * 5. Storage folder oluştur
 */
export async function createTenant(input: CreateTenantInput): Promise<TenantCreationResult> {
  const config = getTenantConfig();
  const year = input.year || new Date().getFullYear();
  const dbName = generateTenantDbName(input.slug, year);

  try {
    // 1. Core DB'ye Tenant kaydı ekle
    const tenant = await corePrisma.tenant.create({
      data: {
        slug: input.slug,
        name: input.name,
        ...(input.subdomain ? { subdomain: input.subdomain } : {}),
        ...(input.customDomain ? { customDomain: input.customDomain } : {}),
        dbName: dbName,
        currentDb: dbName,
        allDatabases: [dbName],
        ...(input.agencyId ? { agencyId: input.agencyId } : {}),
        status: 'active',
        setupFailed: false,
      },
    });

    // 2. PostgreSQL'de yeni DB oluştur
    try {
      // Extract connection info from PG_ADMIN_URL
      const adminUrl = new URL(config.pgAdminUrl);
      const dbUser = adminUrl.username;
      const dbPassword = adminUrl.password;
      const dbHost = adminUrl.hostname;
      const dbPort = adminUrl.port || '5432';

      // Create database using psql (Windows/Linux compatible)
      const isWindows = process.platform === 'win32';
      const psqlPath = isWindows
        ? 'C:\\Program Files\\PostgreSQL\\18\\bin\\psql.exe'
        : 'psql';

      // Use PGPASSWORD environment variable for password
      // Database names with hyphens need double quotes in PostgreSQL
      // Windows cmd.exe needs \" escape, Linux sh needs just quotes
      const escapedDbName = dbName.includes('-')
        ? (isWindows ? `\\"${dbName}\\"` : `"${dbName}"`)
        : dbName;
      const createDbCommand = isWindows
        ? `"${psqlPath}" -h ${dbHost} -p ${dbPort} -U ${dbUser} -d postgres -c "CREATE DATABASE ${escapedDbName};"`
        : `${psqlPath} -h ${dbHost} -p ${dbPort} -U ${dbUser} -d postgres -c 'CREATE DATABASE ${escapedDbName};'`;

      execSync(createDbCommand, {
        stdio: 'inherit',
        env: { ...process.env, PGPASSWORD: dbPassword },
        shell: isWindows ? 'cmd.exe' : '/bin/sh'
      });
    } catch (error: unknown) {
      // If database already exists, continue
      const errorMessage = error instanceof Error ? error.message : String(error);
      if (!errorMessage?.includes('already exists')) {
        throw error;
      }
    }

    // 3. Tenant DB URL oluştur
    const tenantDbUrl = getTenantDatabaseUrl(dbName);

    // 4. Tenant DB'ye migration uygula
    try {
      execSync(
        `npx prisma migrate deploy --schema=prisma/tenant.schema.prisma`,
        {
          stdio: 'inherit',
          cwd: process.cwd(),
          env: { ...process.env, TENANT_DATABASE_URL: tenantDbUrl }
        }
      );
    } catch (error) {
      logger.error(`Migration failed for tenant DB: ${dbName}`, error, 'tenant-service');
      // Mark tenant as setup_failed
      await corePrisma.tenant.update({
        where: { id: tenant.id },
        data: { setupFailed: true, status: 'setup_failed' },
      });
      throw error;
    }

    // 4.5. Schema sync with db push (migration sonrası eksik kolonları ekle)
    // Bu adım, migration'ların schema ile tam senkron olmadığı durumları düzeltir
    try {
      execSync(
        `npx prisma db push --schema=prisma/tenant.schema.prisma --skip-generate --accept-data-loss`,
        {
          stdio: 'inherit',
          cwd: process.cwd(),
          env: { ...process.env, TENANT_DATABASE_URL: tenantDbUrl }
        }
      );
      logger.info(`Schema sync completed for tenant DB: ${dbName}`, {}, 'tenant-service');
    } catch (error) {
      logger.warn(`Schema sync (db push) failed for tenant DB: ${dbName}`, { error }, 'tenant-service');
      // Continue even if db push fails - migrations might be sufficient
    }

    // 5. Seed işlemleri (default admin user, vb.)
    try {
      // Run tenant seed script
      execSync(
        `tsx prisma/seed/tenant-seed.ts --tenant-slug=${input.slug}`,
        {
          stdio: 'inherit',
          cwd: process.cwd(),
          env: { ...process.env, TENANT_DATABASE_URL: tenantDbUrl }
        }
      );
    } catch (error) {
      logger.warn(`Seed failed for tenant DB: ${dbName}`, { error }, 'tenant-service');
      // Continue even if seed fails
    }

    // 6. Storage dizin yapısını oluştur (GENİŞLETİLDİ)
    try {
      await createTenantDirectoryStructure(input.slug);
    } catch (error) {
      logger.warn('Storage folder creation failed', { error }, 'tenant-service');
      // Continue even if storage folder creation fails
    }

    // 7. Logo/favicon yükle (YENİ)
    let logoUrl: string | undefined;
    let faviconUrl: string | undefined;

    if (input.companyInfo?.logo) {
      try {
        logoUrl = await uploadCompanyAsset(input.slug, input.companyInfo.logo, 'logo');
      } catch (error) {
        logger.warn('Logo upload failed', { error }, 'tenant-service');
      }
    }

    if (input.companyInfo?.favicon) {
      try {
        faviconUrl = await uploadCompanyAsset(input.slug, input.companyInfo.favicon, 'favicon');
      } catch (error) {
        logger.warn('Favicon upload failed', { error }, 'tenant-service');
      }
    }

    // 7.5. Update company with wizard data (NEW)
    // Seed creates a default company, now update it with actual wizard data
    let companyId: string | undefined;
    if (input.companyInfo) {
      try {
        companyId = await updateCompanyWithWizardData(tenantDbUrl, input.slug, {
          name: input.companyInfo.name,
          ...(logoUrl ? { logoUrl } : {}),
          ...(faviconUrl ? { faviconUrl } : {}),
          address: input.companyInfo.address,
          city: input.companyInfo.city,
          state: input.companyInfo.state,
          postalCode: input.companyInfo.postalCode,
          country: input.companyInfo.country,
          phone: input.companyInfo.phone,
          email: input.companyInfo.email,
          website: input.companyInfo.website,
          industry: input.companyInfo.industry,
          description: input.companyInfo.description,
          foundedYear: input.companyInfo.foundedYear,
          employeeCount: input.companyInfo.employeeCount,
          capital: input.companyInfo.capital,
          taxNumber: input.companyInfo.taxNumber,
          taxOffice: input.companyInfo.taxOffice,
          registrationNumber: input.companyInfo.registrationNumber,
          mersisNumber: input.companyInfo.mersisNumber,
          iban: input.companyInfo.iban,
          bankName: input.companyInfo.bankName,
          accountHolder: input.companyInfo.accountHolder,
        });
        logger.info(`Company updated with wizard data for tenant: ${input.slug}`, { companyId }, 'tenant-service');
      } catch (error) {
        logger.warn('Company update with wizard data failed', { error }, 'tenant-service');
      }
    }

    // 8. Default export template oluştur (YENİ)
    let exportTemplateId: string | undefined;
    try {
      exportTemplateId = await createDefaultExportTemplate(tenantDbUrl, input.slug, {
        ...(logoUrl ? { logoUrl } : {}),
        ...(faviconUrl ? { faviconUrl } : {}),
        name: input.companyInfo?.name || input.name,
        ...(input.companyInfo?.address ? { address: input.companyInfo.address } : {}),
        ...(input.companyInfo?.phone ? { phone: input.companyInfo.phone } : {}),
        ...(input.companyInfo?.email ? { email: input.companyInfo.email } : {}),
        ...(input.companyInfo?.website ? { website: input.companyInfo.website } : {}),
        ...(input.companyInfo?.taxNumber ? { taxNumber: input.companyInfo.taxNumber } : {}),
      });
    } catch (error) {
      logger.warn('Export template creation failed', { error }, 'tenant-service');
    }

    // 9. İlk lokasyon oluştur (YENİ - OPSIYONEL)
    let locationId: string | undefined;
    if (input.initialLocation) {
      try {
        locationId = await createInitialLocation(tenantDbUrl, input.slug, input.initialLocation);
      } catch (error) {
        logger.warn('Initial location creation failed', { error }, 'tenant-service');
      }
    }

    // 10. Credentials hazırla (from tenant-seed.ts)
    const accessUrl = input.subdomain
      ? `https://${input.subdomain}.onwindos.com`
      : `/tenant/${input.slug}`;

    return {
      tenant: {
        id: tenant.id,
        slug: tenant.slug,
        name: tenant.name,
        dbName: tenant.dbName,
        currentDb: tenant.currentDb,
      },
      dbUrl: tenantDbUrl,
      credentials: {
        accessUrl,
        superAdmin: {
          email: 'superadmin@omnexcore.com',
          username: 'superadmin',
          password: 'uba1453.2010*',
        },
        tenantAdmin: {
          email: `admin@${input.slug}.com`,
          username: 'admin',
          password: 'omnex.fre.2520*',
        },
        defaultUser: {
          email: `user@${input.slug}.com`,
          username: 'user',
          password: 'user.2024*',
        },
        ...(exportTemplateId !== undefined && exportTemplateId !== null ? { exportTemplateId } : {}),
        ...(locationId !== undefined && locationId !== null ? { locationId } : {}),
      },
    };
  } catch (error) {
    logger.error('Tenant creation failed', error, 'tenant-service');

    // Rollback: Try to delete created database
    try {
      const adminUrl = new URL(config.pgAdminUrl);
      const dbUser = adminUrl.username;
      const dbPassword = adminUrl.password;
      const dbHost = adminUrl.hostname;
      const dbPort = adminUrl.port || '5432';

      const isWindows = process.platform === 'win32';
      const psqlPath = isWindows
        ? 'C:\\Program Files\\PostgreSQL\\18\\bin\\psql.exe'
        : 'psql';
      // Database names with hyphens need double quotes in PostgreSQL
      const escapedDbName = dbName.includes('-')
        ? (isWindows ? `\\"${dbName}\\"` : `"${dbName}"`)
        : dbName;
      const dropDbCommand = isWindows
        ? `"${psqlPath}" -h ${dbHost} -p ${dbPort} -U ${dbUser} -d postgres -c "DROP DATABASE IF EXISTS ${escapedDbName};"`
        : `${psqlPath} -h ${dbHost} -p ${dbPort} -U ${dbUser} -d postgres -c 'DROP DATABASE IF EXISTS ${escapedDbName};'`;
      execSync(dropDbCommand, {
        stdio: 'inherit',
        env: { ...process.env, PGPASSWORD: dbPassword },
        shell: isWindows ? 'cmd.exe' : '/bin/sh'
      });
    } catch (rollbackError) {
      logger.error('Rollback failed', rollbackError, 'tenant-service');
    }

    throw error;
  }
}

/**
 * Get tenant by slug
 */
export async function getTenantBySlug(slug: string) {
  return await corePrisma.tenant.findUnique({
    where: { slug },
    include: {
      agency: true,
    },
  });
}

/**
 * Get tenant by subdomain
 */
export async function getTenantBySubdomain(subdomain: string) {
  return await corePrisma.tenant.findUnique({
    where: { subdomain },
    include: {
      agency: true,
    },
  });
}

/**
 * Get tenant by custom domain
 */
export async function getTenantByCustomDomain(customDomain: string) {
  return await corePrisma.tenant.findUnique({
    where: { customDomain },
    include: {
      agency: true,
    },
  });
}

/**
 * List all tenants
 */
export async function listTenants(options?: {
  agencyId?: string;
  status?: string;
  page?: number;
  pageSize?: number;
}) {
  const page = options?.page || 1;
  const pageSize = options?.pageSize || 10;
  const skip = (page - 1) * pageSize;

  const where: {
    agencyId?: string;
    status?: string;
  } = {};
  if (options?.agencyId) {
    where.agencyId = options.agencyId;
  }
  if (options?.status) {
    where.status = options.status;
  }

  const [tenants, total] = await Promise.all([
    corePrisma.tenant.findMany({
      where,
      include: {
        agency: true,
      },
      skip,
      take: pageSize,
      orderBy: { createdAt: 'desc' },
    }),
    corePrisma.tenant.count({ where }),
  ]);

  return {
    tenants,
    total,
    page,
    pageSize,
  };
}

/**
 * Update tenant
 */
export async function updateTenant(
  tenantId: string,
  data: {
    name?: string;
    subdomain?: string;
    customDomain?: string;
    status?: string;
    metadata?: unknown;
  }
) {
  return await corePrisma.tenant.update({
    where: { id: tenantId },
    data: {
      ...data,
      metadata: data.metadata ? JSON.parse(JSON.stringify(data.metadata)) : undefined,
    },
  });
}

/**
 * Delete tenant (soft delete - mark as inactive)
 */
export async function deleteTenant(tenantId: string) {
  return await corePrisma.tenant.update({
    where: { id: tenantId },
    data: {
      status: 'inactive',
    },
  });
}

/**
 * Get tenant database URL
 */
export function getTenantDbUrl(tenant: { dbName: string } | { currentDb: string }) {
  const dbName = 'dbName' in tenant ? tenant.dbName : tenant.currentDb;
  return getTenantDatabaseUrl(dbName);
}


