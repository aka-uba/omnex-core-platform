import { NextRequest, NextResponse } from 'next/server';
import { corePrisma } from '@/lib/corePrisma';

export async function GET(request: NextRequest) {
  try {
    const coreDatabaseUrl = process.env.CORE_DATABASE_URL || process.env.DATABASE_URL || '';
    const tenantDatabaseUrl = process.env.TENANT_DATABASE_URL || '';

    // Parse database URLs
    const parseDbUrl = (url: string) => {
      try {
        const match = url.match(/postgresql:\/\/([^:]+):([^@]+)@([^:]+):(\d+)\/(.+)/);
        if (match) {
          return {
            user: match[1],
            host: match[3],
            port: match[4],
            database: match[5],
          };
        }
      } catch (e) {
        // Ignore
      }
      return null;
    };

    const coreDbInfo = parseDbUrl(coreDatabaseUrl);
    const tenantDbInfo = parseDbUrl(tenantDatabaseUrl);

    // System information
    const systemInfo: any = {
      nodeVersion: process.version,
      platform: process.platform,
      arch: process.arch,
      uptime: Math.floor(process.uptime()),
      memory: {
        total: Math.round(process.memoryUsage().heapTotal / 1024 / 1024),
        used: Math.round(process.memoryUsage().heapUsed / 1024 / 1024),
        external: Math.round(process.memoryUsage().external / 1024 / 1024),
      },
      environment: process.env.NODE_ENV || 'development',
    };

    // Database status
    const databases: any[] = [];

    // Check core database using singleton
    if (coreDatabaseUrl) {
      try {
        const result = await corePrisma.$queryRaw<Array<{ count: bigint }>>`
          SELECT COUNT(*) as count FROM information_schema.tables
          WHERE table_schema = 'public'
        `;
        const tableCount = Number(result[0]?.count || 0);

        // Get tenant count and total record count
        let tenantCount = 0;
        let totalRecords = 0;
        try {
          tenantCount = await corePrisma.$queryRaw<Array<{ count: bigint }>>`
            SELECT COUNT(*) as count FROM "Tenant"
          `.then(r => Number(r[0]?.count || 0));

          // Get total record count from all tables
          const recordCountResult = await corePrisma.$queryRaw<Array<{ count: bigint }>>`
            SELECT SUM(n_tup_ins - n_tup_del) as count
            FROM pg_stat_user_tables
            WHERE schemaname = 'public'
          `.then(r => Number(r[0]?.count || 0));
          totalRecords = recordCountResult;
        } catch (e) {
          // Table might not exist yet
        }

        databases.push({
          name: 'Core Database',
          status: 'connected',
          url: coreDatabaseUrl.replace(/:[^:@]+@/, ':****@'), // Hide password
          info: coreDbInfo,
          tables: tableCount,
          tenants: tenantCount,
          totalRecords: totalRecords > 0 ? totalRecords : undefined,
          isEmpty: totalRecords === 0 && tableCount > 0,
        });
      } catch (error: any) {
        databases.push({
          name: 'Core Database',
          status: 'error',
          error: error.message,
          url: coreDatabaseUrl.replace(/:[^:@]+@/, ':****@'),
          info: coreDbInfo,
        });
      }
    }

    // Check tenant database - use raw query from core since we're just checking connectivity
    if (tenantDatabaseUrl) {
      try {
        // Parse tenant database name from URL
        const tenantDbName = tenantDbInfo?.database?.split('?')[0] || 'tenant_omnexcore_2025';

        // Check if database exists and get table count
        const dbCheck = await corePrisma.$queryRaw<Array<{ exists: boolean }>>`
          SELECT EXISTS(SELECT 1 FROM pg_database WHERE datname = ${tenantDbName}) as exists
        `;

        if (dbCheck[0]?.exists) {
          // Get table count from tenant database
          const tableResult = await corePrisma.$queryRawUnsafe<Array<{ count: bigint }>>(
            `SELECT COUNT(*) as count FROM information_schema.tables WHERE table_schema = 'public' AND table_catalog = '${tenantDbName}'`
          );
          const tableCount = Number(tableResult[0]?.count || 0);

          databases.push({
            name: 'Tenant Database',
            status: 'connected',
            url: tenantDatabaseUrl.replace(/:[^:@]+@/, ':****@'),
            info: tenantDbInfo,
            tables: tableCount,
            isEmpty: tableCount === 0,
          });
        } else {
          databases.push({
            name: 'Tenant Database',
            status: 'error',
            error: 'Database does not exist',
            url: tenantDatabaseUrl.replace(/:[^:@]+@/, ':****@'),
            info: tenantDbInfo,
          });
        }
      } catch (error: any) {
        databases.push({
          name: 'Tenant Database',
          status: 'error',
          error: error.message,
          url: tenantDatabaseUrl.replace(/:[^:@]+@/, ':****@'),
          info: tenantDbInfo,
        });
      }
    }

    // PostgreSQL version
    let postgresVersion = 'Unknown';
    if (coreDatabaseUrl) {
      try {
        const result = await corePrisma.$queryRaw<Array<{ version: string }>>`
          SELECT version()
        `;
        postgresVersion = result[0]?.version || 'Unknown';
      } catch (e) {
        // Ignore
      }
    }

    // Environment variables (safe ones only)
    const envVars = {
      NODE_ENV: process.env.NODE_ENV,
      ALLOW_SETUP_PAGE: process.env.ALLOW_SETUP_PAGE,
      DEV_MODE: process.env.DEV_MODE,
      CI: process.env.CI,
    };

    return NextResponse.json({
      success: true,
      system: systemInfo,
      databases,
      postgresVersion,
      environment: envVars,
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    return NextResponse.json({
      success: false,
      error: error.message || 'Failed to get system status',
    }, { status: 500 });
  }
}
