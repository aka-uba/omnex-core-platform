/**
 * Tenant Rotation API
 *
 * POST /api/tenants/[id]/rotate - Rotate tenant to new year database
 */

import { NextRequest, NextResponse } from 'next/server';
import { corePrisma } from '@/lib/corePrisma';
import { getTenantConfig, generateTenantDbName, getTenantDatabaseUrl } from '@/config/tenant.config';
import { execSync } from 'child_process';

/**
 * Sanitize name to prevent command injection
 * Only allows alphanumeric characters and underscores
 */
function sanitizeName(name: string): string {
  const sanitized = name.replace(/[^a-zA-Z0-9_]/g, '');
  if (!/^[a-zA-Z_]/.test(sanitized)) {
    return `db_${sanitized}`;
  }
  return sanitized.substring(0, 63);
}

/**
 * POST /api/tenants/[id]/rotate
 * Rotate tenant to new year database
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const resolvedParams = await params;
    const body = await request.json();
    const rawYear = body.year || new Date().getFullYear() + 1;

    // SECURITY: Validate year is a number
    const year = typeof rawYear === 'number' ? rawYear : parseInt(String(rawYear), 10);
    if (isNaN(year) || year < 2000 || year > 2100) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid year value',
        },
        { status: 400 }
      );
    }

    // Get tenant from core DB
    const tenant = await corePrisma.tenant.findUnique({
      where: { id: resolvedParams.id },
    });

    if (!tenant) {
      return NextResponse.json(
        {
          success: false,
          error: 'Tenant not found',
        },
        { status: 404 }
      );
    }

    if (tenant.status !== 'active') {
      return NextResponse.json(
        {
          success: false,
          error: 'Tenant is not active',
        },
        { status: 400 }
      );
    }

    const config = getTenantConfig();

    // SECURITY: Sanitize tenant slug before generating DB name
    const safeSlug = sanitizeName(tenant.slug);

    // Generate new DB name (and sanitize again for extra safety)
    const newDbName = sanitizeName(generateTenantDbName(safeSlug, year));

    // Check if new DB already exists
    const existingDbs = tenant.allDatabases || [];
    if (existingDbs.includes(newDbName)) {
      return NextResponse.json(
        {
          success: false,
          error: `Database ${newDbName} already exists`,
        },
        { status: 400 }
      );
    }

    // Create new database
    try {
      const adminUrl = new URL(config.pgAdminUrl);
      const dbUser = adminUrl.username;
      const dbPassword = adminUrl.password;
      const dbHost = adminUrl.hostname;
      const dbPort = adminUrl.port || '5432';

      const createDbCommand = `PGPASSWORD="${dbPassword}" psql -h ${dbHost} -p ${dbPort} -U ${dbUser} -d postgres -c "CREATE DATABASE ${newDbName};"`;
      execSync(createDbCommand, { stdio: 'pipe' });
    } catch (error: any) {
      if (!error.message?.includes('already exists')) {
        return NextResponse.json(
          {
            success: false,
            error: `Failed to create database: ${error.message}`,
          },
          { status: 500 }
        );
      }
    }

    // Run migrations on new database
    const newDbUrl = getTenantDatabaseUrl(newDbName);
    try {
      execSync(
        `TENANT_DATABASE_URL="${newDbUrl}" npx prisma migrate deploy --schema=prisma/tenant.schema.prisma`,
        { stdio: 'pipe', cwd: process.cwd() }
      );
    } catch (error: any) {
      // Rollback: drop database
      try {
        const adminUrl = new URL(config.pgAdminUrl);
        const dbUser = adminUrl.username;
        const dbPassword = adminUrl.password;
        const dbHost = adminUrl.hostname;
        const dbPort = adminUrl.port || '5432';
        
        const dropDbCommand = `PGPASSWORD="${dbPassword}" psql -h ${dbHost} -p ${dbPort} -U ${dbUser} -d postgres -c "DROP DATABASE IF EXISTS ${newDbName};"`;
        execSync(dropDbCommand, { stdio: 'pipe' });
      } catch (rollbackError) {
        console.error('Rollback failed:', rollbackError);
      }

      return NextResponse.json(
        {
          success: false,
          error: `Failed to run migrations: ${error.message}`,
        },
        { status: 500 }
      );
    }

    // Update core DB
    const updatedAllDatabases = [...(tenant.allDatabases || []), newDbName];
    
    await corePrisma.tenant.update({
      where: { id: tenant.id },
      data: {
        currentDb: newDbName,
        allDatabases: updatedAllDatabases,
        dbName: newDbName,
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Tenant rotated successfully',
      data: {
        oldDb: tenant.currentDb,
        newDb: newDbName,
        allDatabases: updatedAllDatabases,
      },
    });
  } catch (error: any) {
    console.error('Error rotating tenant:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to rotate tenant',
      },
      { status: 500 }
    );
  }
}


