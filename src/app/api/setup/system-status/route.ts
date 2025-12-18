import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/core-client';


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

    // Check core database
    if (coreDatabaseUrl) {
      try {
        const prisma = new PrismaClient({
          datasources: {
            db: { url: coreDatabaseUrl },
          },
        });
        await prisma.$connect();
        const result = await prisma.$queryRaw<Array<{ count: bigint }>>`
          SELECT COUNT(*) as count FROM information_schema.tables 
          WHERE table_schema = 'public'
        `;
        const tableCount = Number(result[0]?.count || 0);
        
        // Get tenant count and total record count
        let tenantCount = 0;
        let totalRecords = 0;
        try {
          tenantCount = await prisma.$queryRaw<Array<{ count: bigint }>>`
            SELECT COUNT(*) as count FROM "Tenant"
          `.then(r => Number(r[0]?.count || 0));
          
          // Get total record count from all tables
          const recordCountResult = await prisma.$queryRaw<Array<{ count: bigint }>>`
            SELECT SUM(n_tup_ins - n_tup_del) as count
            FROM pg_stat_user_tables
            WHERE schemaname = 'public'
          `.then(r => Number(r[0]?.count || 0));
          totalRecords = recordCountResult;
        } catch (e) {
          // Table might not exist yet
        }

        await prisma.$disconnect();

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

    // Check tenant database
    if (tenantDatabaseUrl) {
      try {
        const prisma = new PrismaClient({
          datasources: {
            db: { url: tenantDatabaseUrl },
          },
        });
        await prisma.$connect();
        const result = await prisma.$queryRaw<Array<{ count: bigint }>>`
          SELECT COUNT(*) as count FROM information_schema.tables 
          WHERE table_schema = 'public'
        `;
        const tableCount = Number(result[0]?.count || 0);
        
        // Check if database has any data (sample a few key tables)
        let hasData = false;
        try {
          // Check a few key tables for data
          const sampleTables = ['User', 'Company', 'Property', 'Product', 'Invoice'];
          for (const tableName of sampleTables) {
            try {
              const countResult = await prisma.$queryRaw<Array<{ count: bigint }>>`
                SELECT COUNT(*) as count FROM "${tableName}"
              `.then(r => Number(r[0]?.count || 0));
              if (countResult > 0) {
                hasData = true;
                break;
              }
            } catch (e) {
              // Table might not exist, continue
            }
          }
        } catch (e) {
          // Ignore
        }
        
        await prisma.$disconnect();

        databases.push({
          name: 'Tenant Database',
          status: 'connected',
          url: tenantDatabaseUrl.replace(/:[^:@]+@/, ':****@'), // Hide password
          info: tenantDbInfo,
          tables: tableCount,
          isEmpty: !hasData && tableCount > 0, // Tables exist but no data
        });
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

    // PostgreSQL version (if available)
    let postgresVersion = 'Unknown';
    if (coreDatabaseUrl) {
      try {
        const prisma = new PrismaClient({
          datasources: {
            db: { url: coreDatabaseUrl },
          },
        });
        await prisma.$connect();
        const result = await prisma.$queryRaw<Array<{ version: string }>>`
          SELECT version()
        `;
        postgresVersion = result[0]?.version || 'Unknown';
        await prisma.$disconnect();
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


