/**
 * Tenant Configuration
 * 
 * Multi-tenant sistem için yapılandırma ayarları
 */

export interface TenantConfig {
  // Database Configuration
  coreDatabaseUrl: string;
  tenantDbTemplateUrl: string;
  pgAdminUrl: string;
  
  // Routing Configuration
  routing: {
    // Production subdomain pattern
    productionDomain: string;
    // Staging subdomain pattern
    stagingDomain: string;
    // Path-based routing prefix
    pathPrefix: string;
  };
  
  // Database Naming
  dbNaming: {
    // DB name pattern: tenant_{slug}_{year}
    pattern: string;
    // Year format for DB names
    yearFormat: 'YYYY' | 'YY';
  };
  
  // Storage Configuration
  storage: {
    // Storage type: 'local' | 's3'
    type: 'local' | 's3';
    // Local storage path
    localPath?: string;
    // S3 configuration
    s3?: {
      bucket: string;
      region: string;
      prefix: string;
    };
  };
  
  // Audit Log Configuration
  auditLog: {
    // Enable audit logging
    enabled: boolean;
    // Retention days (0 = keep forever)
    retentionDays: number;
    // Async logging (queue)
    async: boolean;
  };
}

/**
 * Get tenant configuration from environment variables
 */
export function getTenantConfig(): TenantConfig {
  const coreDatabaseUrl = process.env.CORE_DATABASE_URL;
  const tenantDbTemplateUrl = process.env.TENANT_DB_TEMPLATE_URL;
  const pgAdminUrl = process.env.PG_ADMIN_URL;

  if (!coreDatabaseUrl) {
    throw new Error('CORE_DATABASE_URL environment variable is required');
  }

  if (!tenantDbTemplateUrl) {
    throw new Error('TENANT_DB_TEMPLATE_URL environment variable is required');
  }

  if (!pgAdminUrl) {
    throw new Error('PG_ADMIN_URL environment variable is required');
  }

  return {
    coreDatabaseUrl,
    tenantDbTemplateUrl,
    pgAdminUrl,
    routing: {
      productionDomain: process.env.PRODUCTION_DOMAIN || 'onwindos.com',
      stagingDomain: process.env.STAGING_DOMAIN || 'staging.onwindos.com',
      pathPrefix: process.env.TENANT_PATH_PREFIX || '/tenant',
    },
    dbNaming: {
      pattern: 'tenant_{slug}_{year}',
      yearFormat: 'YYYY',
    },
    storage: {
      type: (process.env.STORAGE_TYPE as 'local' | 's3') || 'local',
      ...(process.env.STORAGE_LOCAL_PATH ? { localPath: process.env.STORAGE_LOCAL_PATH } : { localPath: './storage/tenants' }),
      ...(process.env.S3_BUCKET
        ? {
            s3: {
              bucket: process.env.S3_BUCKET,
              region: process.env.S3_REGION || 'us-east-1',
              prefix: process.env.S3_PREFIX || 'tenants',
            }
          }
        : {}),
    },
    auditLog: {
      enabled: process.env.AUDIT_LOG_ENABLED !== 'false',
      retentionDays: parseInt(process.env.AUDIT_LOG_RETENTION_DAYS || '365', 10),
      async: process.env.AUDIT_LOG_ASYNC !== 'false',
    },
  };
}

/**
 * Generate tenant database URL from template
 * 
 * @param dbName Database name (e.g., tenant_acme_2025)
 * @returns Full database URL
 */
export function getTenantDatabaseUrl(dbName: string): string {
  const config = getTenantConfig();
  return config.tenantDbTemplateUrl.replace('__DB_NAME__', dbName);
}

/**
 * Generate tenant database name
 * 
 * @param slug Tenant slug
 * @param year Year (default: current year)
 * @returns Database name
 */
export function generateTenantDbName(slug: string, year?: number): string {
  const config = getTenantConfig();
  const yearValue = year || new Date().getFullYear();
  return config.dbNaming.pattern
    .replace('{slug}', slug)
    .replace('{year}', yearValue.toString());
}

/**
 * Extract tenant slug from subdomain
 * 
 * @param host Host header value
 * @returns Tenant slug or null
 */
export function extractTenantFromSubdomain(host: string): string | null {
  const config = getTenantConfig();
  
  // Remove port if present
  const hostname = host.split(':')[0];
  
  // Check production domain
  if (hostname?.endsWith(`.${config.routing.productionDomain}`)) {
    const subdomain = hostname?.replace(`.${config.routing.productionDomain}`, '');
    // Skip 'www', 'admin', 'api' subdomains
    if (subdomain && !['www', 'admin', 'api'].includes(subdomain)) {
      return subdomain;
    }
  }
  
  // Check staging domain
  if (hostname?.endsWith(`.${config.routing.stagingDomain}`)) {
    const subdomain = hostname?.replace(`.${config.routing.stagingDomain}`, '');
    if (subdomain && !['www', 'admin', 'api'].includes(subdomain)) {
      return subdomain;
    }
  }
  
  return null;
}

/**
 * Extract tenant slug from path
 * 
 * @param pathname Pathname (e.g., /tenant/acme/dashboard)
 * @returns Tenant slug or null
 */
export function extractTenantFromPath(pathname: string): string | null {
  const config = getTenantConfig();
  const prefix = config.routing.pathPrefix;
  
  if (pathname.startsWith(prefix)) {
    const parts = pathname.slice(prefix.length).split('/').filter(Boolean);
    if (parts.length > 0 && parts[0]) {
      return parts[0];
    }
  }
  
  return null;
}

/**
 * Get environment type
 */
export function getEnvironment(): 'production' | 'staging' | 'development' {
  const env = (process.env.NODE_ENV || 'development') as string;
  
  if (env === 'production') {
    return 'production';
  }
  
  if (process.env.STAGING === 'true' || env === 'staging') {
    return 'staging';
  }
  
  return 'development';
}


