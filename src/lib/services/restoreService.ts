/**
 * Restore Service
 * Handles database restoration from backups
 */

import { exec } from 'child_process';
import { promisify } from 'util';
import fs from 'fs';
import path from 'path';
import { corePrisma } from '@/lib/corePrisma';
import { createSystemAuditLog } from './systemAuditLogService';
import { createBackup } from './backupService';

const execAsync = promisify(exec);

// Auto-detect pg_restore on Windows (similar to pg_dump)
const isWindows = process.platform === 'win32';
let PG_RESTORE_PATH = process.env.PG_RESTORE_PATH;

if (!PG_RESTORE_PATH && isWindows) {
    // Try to find pg_restore.exe in common PostgreSQL installation paths
    const commonPaths = [
        'C:\\Program Files\\PostgreSQL\\18\\bin\\pg_restore.exe',
        'C:\\Program Files\\PostgreSQL\\17\\bin\\pg_restore.exe',
        'C:\\Program Files\\PostgreSQL\\16\\bin\\pg_restore.exe',
        'C:\\Program Files\\PostgreSQL\\15\\bin\\pg_restore.exe',
        'C:\\Program Files\\PostgreSQL\\14\\bin\\pg_restore.exe',
        'C:\\Program Files\\PostgreSQL\\13\\bin\\pg_restore.exe',
        'C:\\Program Files (x86)\\PostgreSQL\\18\\bin\\pg_restore.exe',
        'C:\\Program Files (x86)\\PostgreSQL\\17\\bin\\pg_restore.exe',
        'C:\\Program Files (x86)\\PostgreSQL\\16\\bin\\pg_restore.exe',
        'C:\\Program Files (x86)\\PostgreSQL\\15\\bin\\pg_restore.exe',
        'C:\\Program Files (x86)\\PostgreSQL\\14\\bin\\pg_restore.exe',
        'C:\\Program Files (x86)\\PostgreSQL\\13\\bin\\pg_restore.exe',
    ];

    for (const testPath of commonPaths) {
        if (fs.existsSync(testPath)) {
            PG_RESTORE_PATH = testPath;
            break;
        }
    }
}

if (!PG_RESTORE_PATH) {
    PG_RESTORE_PATH = 'pg_restore'; // Fallback to PATH
}

export interface RestoreResult {
    success: boolean;
    message: string;
    rollbackBackupId?: string;
}

/**
 * Restore database from a backup
 */
export async function restoreFromBackup(backupId: string, userId: string): Promise<RestoreResult> {
    // 1. Get backup metadata
    const backup = await corePrisma.backupMetadata.findUnique({
        where: { id: backupId },
        include: { tenant: true },
    });

    if (!backup) throw new Error('Backup not found');
    
    // Resolve backup file path (handle both relative and absolute paths)
    let backupFilePath = backup.filePath;
    if (!path.isAbsolute(backupFilePath)) {
        // Try resolving relative to BACKUP_DIR or process.cwd()
        const BACKUP_DIR = path.join(process.cwd(), 'storage', 'backups');
        const resolvedPath = path.resolve(BACKUP_DIR, backupFilePath);
        if (fs.existsSync(resolvedPath)) {
            backupFilePath = resolvedPath;
        } else {
            const cwdPath = path.resolve(process.cwd(), backupFilePath);
            if (fs.existsSync(cwdPath)) {
                backupFilePath = cwdPath;
            }
        }
    }
    
    if (!fs.existsSync(backupFilePath)) {
        throw new Error(`Backup file not found. Expected path: ${backupFilePath}. Original path: ${backup.filePath}`);
    }

    const tenant = backup.tenant;

    // 2. Create safety backup (Rollback point)
    let rollbackBackupId: string | undefined;
    try {
        const safetyBackup = await createBackup({
            tenantId: tenant.id,
            userId,
            type: 'AUTO', // Mark as auto-generated safety backup
        });
        rollbackBackupId = safetyBackup.id;
    } catch (error) {
        throw new Error(`Failed to create safety backup before restore: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }

    try {
        // 3. Prepare restore command
        const dbUrl = process.env.CORE_DATABASE_URL;
        if (!dbUrl) throw new Error('CORE_DATABASE_URL not set');

        const urlObj = new URL(dbUrl);
        urlObj.pathname = `/${tenant.dbName}`;
        const targetDbUrl = urlObj.toString();

        // pg_restore options:
        // --clean: clean (drop) database objects before recreating
        // --if-exists: used with --clean
        // -d: target database
        // -F c: format custom (matching our backup)
        const escapedFilePath = backupFilePath.replace(/"/g, '\\"');
        const command = isWindows
            ? `"${PG_RESTORE_PATH}" --clean --if-exists --dbname="${targetDbUrl}" "${escapedFilePath}"`
            : `${PG_RESTORE_PATH} --clean --if-exists --dbname="${targetDbUrl}" "${escapedFilePath}"`;

        // 4. Execute restore
        await execAsync(command, {
            maxBuffer: 10 * 1024 * 1024, // 10MB buffer for large restores
            shell: isWindows ? 'cmd.exe' : undefined,
            env: {
                ...process.env,
                PGPASSWORD: urlObj.password || process.env.PGPASSWORD,
            },
        });

        // 5. Log success
        await createSystemAuditLog({
            userId,
            tenantSlug: tenant.slug,
            action: 'RESTORE_BACKUP',
            module: 'backup',
            resource: 'backup',
            resourceId: backupId,
            status: 'SUCCESS',
            details: { rollbackBackupId },
        });

        return {
            success: true,
            message: 'Database restored successfully',
            rollbackBackupId,
        };

    } catch (error) {
        // Log failure
        await createSystemAuditLog({
            userId,
            tenantSlug: tenant.slug,
            action: 'RESTORE_BACKUP',
            module: 'backup',
            resource: 'backup',
            resourceId: backupId,
            status: 'FAILURE',
            errorMessage: error instanceof Error ? error.message : 'Unknown error',
        });

        throw new Error(`Restore failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
}
