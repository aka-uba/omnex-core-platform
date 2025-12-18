/**
 * Tenant Export API
 * 
 * POST /api/tenants/[id]/export - Export tenant database and files
 */

import { NextRequest, NextResponse } from 'next/server';
import { corePrisma } from '@/lib/corePrisma';
import { getTenantConfig, getTenantDatabaseUrl } from '@/config/tenant.config';
import { execSync } from 'child_process';
import path from 'path';
import fs from 'fs/promises';

/**
 * POST /api/tenants/[id]/export
 * Export tenant database and files
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const resolvedParams = await params;
    const body = await request.json();
    const year = body.year || new Date().getFullYear();

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

    const config = getTenantConfig();
    const dbName = `tenant_${tenant.slug}_${year}`;
    const exportDir = path.join(process.cwd(), 'exports', `${tenant.slug}_${year}`);
    const exportFile = path.join(process.cwd(), 'exports', `${tenant.slug}_${year}.tar.gz`);

    // Create export directory
    await fs.mkdir(exportDir, { recursive: true });
    await fs.mkdir(path.join(exportDir, 'files'), { recursive: true });

    // 1. Export database
    try {
      const adminUrl = new URL(config.pgAdminUrl);
      const dbHost = adminUrl.hostname;
      const dbPort = adminUrl.port || '5432';

      const dbUrl = getTenantDatabaseUrl(dbName);
      const dbUrlObj = new URL(dbUrl);
      const dbUserExport = dbUrlObj.username;
      const dbPasswordExport = dbUrlObj.password;

      const dumpCommand = `PGPASSWORD="${dbPasswordExport}" pg_dump -h ${dbHost} -p ${dbPort} -U ${dbUserExport} -d ${dbName} -F p -f ${path.join(exportDir, 'db-dump.sql')}`;
      execSync(dumpCommand, { stdio: 'pipe' });
    } catch (error: any) {
      return NextResponse.json(
        {
          success: false,
          error: `Failed to export database: ${error.message}`,
        },
        { status: 500 }
      );
    }

    // 2. Copy files (if local storage)
    if (config.storage.type === 'local' && config.storage.localPath) {
      const tenantStorage = path.join(config.storage.localPath, tenant.slug);
      try {
        const files = await fs.readdir(tenantStorage);
        for (const file of files) {
          const srcPath = path.join(tenantStorage, file);
          const destPath = path.join(exportDir, 'files', file);
          const stat = await fs.stat(srcPath);
          if (stat.isDirectory()) {
            // Copy directory recursively
            await fs.cp(srcPath, destPath, { recursive: true });
          } else {
            await fs.copyFile(srcPath, destPath);
          }
        }
      } catch (error: any) {
        // Storage directory might not exist, continue
      }
    }

    // 3. Create meta.json
    const meta = {
      tenant: tenant.slug,
      year,
      schema_version: '1.0.0',
      exported_at: new Date().toISOString(),
      database: dbName,
      storage_type: config.storage.type,
    };
    await fs.writeFile(
      path.join(exportDir, 'meta.json'),
      JSON.stringify(meta, null, 2)
    );

    // 4. Create tar.gz archive
    try {
      execSync(
        `cd ${path.join(process.cwd(), 'exports')} && tar -czf ${path.basename(exportFile)} ${path.basename(exportDir)}`,
        { stdio: 'pipe' }
      );
    } catch (error: any) {
      return NextResponse.json(
        {
          success: false,
          error: `Failed to create archive: ${error.message}`,
        },
        { status: 500 }
      );
    }

    // 5. Cleanup temporary directory
    await fs.rm(exportDir, { recursive: true, force: true });

    // Get file size
    const stats = await fs.stat(exportFile);
    const fileSize = stats.size;

    return NextResponse.json({
      success: true,
      message: 'Tenant exported successfully',
      data: {
        file: path.basename(exportFile),
        path: exportFile,
        size: fileSize,
        sizeFormatted: formatBytes(fileSize),
        meta,
      },
    });
  } catch (error: any) {
    console.error('Error exporting tenant:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to export tenant',
      },
      { status: 500 }
    );
  }
}

function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
}


