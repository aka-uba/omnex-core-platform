/**
 * Tenant Import API
 * 
 * POST /api/tenants/[id]/import - Import tenant from export package
 */

import { NextRequest, NextResponse } from 'next/server';
import { corePrisma } from '@/lib/corePrisma';
import { getTenantConfig } from '@/config/tenant.config';
import { execSync } from 'child_process';
import path from 'path';
import fs from 'fs/promises';

/**
 * POST /api/tenants/[id]/import
 * Import tenant from export package
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const resolvedParams = await params;
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const restoreDb = formData.get('restoreDb') as string | null;

    if (!file) {
      return NextResponse.json(
        {
          success: false,
          error: 'Export file is required',
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

    const config = getTenantConfig();
    const extractDir = path.join(process.cwd(), 'imports', `${tenant.slug}_${Date.now()}`);

    // Create extract directory
    await fs.mkdir(extractDir, { recursive: true });

    // Save uploaded file
    const filePath = path.join(extractDir, file.name);
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    await fs.writeFile(filePath, buffer);

    // Extract archive
    try {
      execSync(`tar -xzf "${filePath}" -C "${extractDir}"`, { stdio: 'pipe' });
    } catch (error: any) {
      await fs.rm(extractDir, { recursive: true, force: true });
      return NextResponse.json(
        {
          success: false,
          error: `Failed to extract archive: ${error.message}`,
        },
        { status: 500 }
      );
    }

    // Read metadata
    const metaFile = path.join(extractDir, path.basename(file.name, '.tar.gz'), 'meta.json');
    const metaContent = await fs.readFile(metaFile, 'utf-8');
    const meta = JSON.parse(metaContent);

    const sourceDb = meta.database;
    const restoreDbName = restoreDb || `${sourceDb}_restore`;

    // 1. Create restore database
    try {
      const adminUrl = new URL(config.pgAdminUrl);
      const dbUser = adminUrl.username;
      const dbPassword = adminUrl.password;
      const dbHost = adminUrl.hostname;
      const dbPort = adminUrl.port || '5432';

      const createDbCommand = `PGPASSWORD="${dbPassword}" psql -h ${dbHost} -p ${dbPort} -U ${dbUser} -d postgres -c "DROP DATABASE IF EXISTS ${restoreDbName};" -c "CREATE DATABASE ${restoreDbName};"`;
      execSync(createDbCommand, { stdio: 'pipe' });
    } catch (error: any) {
      await fs.rm(extractDir, { recursive: true, force: true });
      return NextResponse.json(
        {
          success: false,
          error: `Failed to create restore database: ${error.message}`,
        },
        { status: 500 }
      );
    }

    // 2. Import database
    const dumpFile = path.join(extractDir, path.basename(file.name, '.tar.gz'), 'db-dump.sql');
    try {
      const adminUrl = new URL(config.pgAdminUrl);
      const dbUser = adminUrl.username;
      const dbPassword = adminUrl.password;
      const dbHost = adminUrl.hostname;
      const dbPort = adminUrl.port || '5432';

      const importCommand = `PGPASSWORD="${dbPassword}" psql -h ${dbHost} -p ${dbPort} -U ${dbUser} -d ${restoreDbName} -f "${dumpFile}"`;
      execSync(importCommand, { stdio: 'pipe' });
    } catch (error: any) {
      // Rollback: drop database
      try {
        const adminUrl = new URL(config.pgAdminUrl);
        const dbUser = adminUrl.username;
        const dbPassword = adminUrl.password;
        const dbHost = adminUrl.hostname;
        const dbPort = adminUrl.port || '5432';
        
        const dropDbCommand = `PGPASSWORD="${dbPassword}" psql -h ${dbHost} -p ${dbPort} -U ${dbUser} -d postgres -c "DROP DATABASE IF EXISTS ${restoreDbName};"`;
        execSync(dropDbCommand, { stdio: 'pipe' });
      } catch (rollbackError) {
        console.error('Rollback failed:', rollbackError);
      }

      await fs.rm(extractDir, { recursive: true, force: true });
      return NextResponse.json(
        {
          success: false,
          error: `Failed to import database: ${error.message}`,
        },
        { status: 500 }
      );
    }

    // 3. Restore files (if local storage)
    if (meta.storage_type === 'local' && config.storage.type === 'local' && config.storage.localPath) {
      const filesDir = path.join(extractDir, path.basename(file.name, '.tar.gz'), 'files');
      const tenantStorage = path.join(config.storage.localPath, tenant.slug);
      
      try {
        const files = await fs.readdir(filesDir);
        await fs.mkdir(tenantStorage, { recursive: true });
        for (const file of files) {
          const srcPath = path.join(filesDir, file);
          const destPath = path.join(tenantStorage, file);
          const stat = await fs.stat(srcPath);
          if (stat.isDirectory()) {
            await fs.cp(srcPath, destPath, { recursive: true });
          } else {
            await fs.copyFile(srcPath, destPath);
          }
        }
      } catch (error: any) {
        // Failed to restore files - continue
      }
    }

    // Cleanup
    await fs.rm(extractDir, { recursive: true, force: true });

    return NextResponse.json({
      success: true,
      message: 'Tenant imported successfully',
      data: {
        restoreDb: restoreDbName,
        meta,
      },
    });
  } catch (error: any) {
    console.error('Error importing tenant:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to import tenant',
      },
      { status: 500 }
    );
  }
}


