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
 * Sanitize database name to prevent SQL injection
 * Only allows alphanumeric characters and underscores
 */
function sanitizeDbName(name: string): string {
  // Remove any characters that are not alphanumeric or underscore
  const sanitized = name.replace(/[^a-zA-Z0-9_]/g, '');
  // Ensure it starts with a letter or underscore
  if (!/^[a-zA-Z_]/.test(sanitized)) {
    return `db_${sanitized}`;
  }
  // Limit length to 63 characters (PostgreSQL limit)
  return sanitized.substring(0, 63);
}

/**
 * Sanitize file path to prevent path traversal attacks
 */
function sanitizeFileName(name: string): string {
  // Remove path separators and other dangerous characters
  return name.replace(/[\/\\:*?"<>|]/g, '_').replace(/\.\./g, '_');
}

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

    // Validate file extension
    const safeFileName = sanitizeFileName(file.name);
    if (!safeFileName.endsWith('.tar.gz')) {
      return NextResponse.json(
        {
          success: false,
          error: 'Only .tar.gz files are allowed',
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
    // Use sanitized slug to prevent path traversal
    const safeSlug = sanitizeDbName(tenant.slug);
    const extractDir = path.join(process.cwd(), 'imports', `${safeSlug}_${Date.now()}`);

    // Create extract directory
    await fs.mkdir(extractDir, { recursive: true });

    // Save uploaded file with sanitized name
    const filePath = path.join(extractDir, safeFileName);
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    await fs.writeFile(filePath, buffer);

    // Extract archive - use array form to prevent command injection
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
    const metaFile = path.join(extractDir, path.basename(safeFileName, '.tar.gz'), 'meta.json');
    const metaContent = await fs.readFile(metaFile, 'utf-8');
    const meta = JSON.parse(metaContent);

    // SECURITY: Sanitize database names to prevent SQL injection
    const sourceDb = sanitizeDbName(meta.database || '');
    const restoreDbName = sanitizeDbName(restoreDb || `${sourceDb}_restore`);

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


