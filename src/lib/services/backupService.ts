/**
 * Backup Service
 * Handles database backups using pg_dump
 */

import { exec } from 'child_process';
import { promisify } from 'util';
import fs from 'fs';
import path from 'path';
import { corePrisma } from '@/lib/corePrisma';
import { createSystemAuditLog } from './systemAuditLogService';

const execAsync = promisify(exec);

// Configuration
const BACKUP_DIR = process.env.BACKUP_STORAGE_PATH || './storage/backups';
// Find pg_dump path - try common Windows locations
function findPgDumpPath(): string {
    if (process.env.PG_DUMP_PATH) {
        return process.env.PG_DUMP_PATH;
    }
    
    if (process.platform === 'win32') {
        // Common PostgreSQL installation paths on Windows
        const commonPaths = [
            'C:\\Program Files\\PostgreSQL\\18\\bin\\pg_dump.exe',
            'C:\\Program Files\\PostgreSQL\\17\\bin\\pg_dump.exe',
            'C:\\Program Files\\PostgreSQL\\16\\bin\\pg_dump.exe',
            'C:\\Program Files\\PostgreSQL\\15\\bin\\pg_dump.exe',
            'C:\\Program Files\\PostgreSQL\\14\\bin\\pg_dump.exe',
            'C:\\Program Files (x86)\\PostgreSQL\\18\\bin\\pg_dump.exe',
            'C:\\Program Files (x86)\\PostgreSQL\\17\\bin\\pg_dump.exe',
            'C:\\Program Files (x86)\\PostgreSQL\\16\\bin\\pg_dump.exe',
            'C:\\Program Files (x86)\\PostgreSQL\\15\\bin\\pg_dump.exe',
            'C:\\Program Files (x86)\\PostgreSQL\\14\\bin\\pg_dump.exe',
        ];
        
        for (const pgPath of commonPaths) {
            if (fs.existsSync(pgPath)) {
                return pgPath;
            }
        }
    }
    
    return 'pg_dump'; // Fallback to PATH
}

const PG_DUMP_PATH = findPgDumpPath();

// Ensure backup directory exists
if (!fs.existsSync(BACKUP_DIR)) {
    fs.mkdirSync(BACKUP_DIR, { recursive: true });
}

export interface BackupOptions {
    tenantId: string;
    userId: string;
    type?: 'MANUAL' | 'SCHEDULED' | 'AUTO';
}

/**
 * Create a database backup for a specific tenant
 */
export async function createBackup({ tenantId, userId, type = 'MANUAL' }: BackupOptions) {
    // Get tenant info to find database name
    const tenant = await corePrisma.tenant.findUnique({
        where: { id: tenantId },
    });

    if (!tenant) {
        throw new Error('Tenant not found');
    }

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const fileName = `${tenant.slug}_${timestamp}.sql`;
    const filePath = path.resolve(BACKUP_DIR, fileName); // Use absolute path

    // Create metadata entry first (PENDING)
    const backup = await corePrisma.backupMetadata.create({
        data: {
            tenantId,
            tenantSlug: tenant.slug,
            fileName,
            filePath,
            fileSize: 0, // Will update later
            status: 'PENDING',
            type,
            createdBy: userId,
        },
    });

    try {
        // Update status to IN_PROGRESS
        await corePrisma.backupMetadata.update({
            where: { id: backup.id },
            data: { status: 'IN_PROGRESS' },
        });

        // Construct pg_dump command
        // Note: This assumes password is in .pgpass or PGPASSWORD env var, 
        // or connection string is used. For simplicity/safety, we'll try to use the connection string 
        // from environment but targeting the specific tenant DB.

        // We need to parse the DATABASE_URL to get credentials, then swap the dbname
        const dbUrl = process.env.CORE_DATABASE_URL;
        if (!dbUrl) throw new Error('CORE_DATABASE_URL not set');

        // Simple replacement of database name in connection string if possible
        // This is a simplification. In a real scenario, we might need robust parsing.
        // Assuming format: postgresql://user:pass@host:port/dbname?schema=public
        // We want to backup tenant.dbName

        // IMPORTANT: For this implementation, we assume the tenant DB is accessible 
        // via the same credentials as the core DB.

        // Construct command: pg_dump --dbname=postgresql://... -f file.sql
        // We replace the DB name in the URL
        const urlObj = new URL(dbUrl);
        urlObj.pathname = `/${tenant.dbName}`;
        const targetDbUrl = urlObj.toString();

        // Execute pg_dump
        // -F p: plain text SQL script (easier for restore/inspection, though custom format -F c is better for large DBs)
        // We'll use plain text for now as per requirements for "readable" backups if needed, 
        // but compression is requested. We can pipe to gzip or let pg_dump compress (-Z).
        // Let's use plain SQL and then gzip it manually or use -Z if using custom format.
        // Requirement said "Compression support".
        // Let's use -Z 9 (max compression) with custom format (-F c) which is standard for pg_restore.
        // OR plain text piped to gzip. Let's stick to standard pg_dump custom format which is compressed by default.

        // Build command - handle Windows paths properly
        const isWindows = process.platform === 'win32';
        
        // For Windows, properly quote paths with spaces
        let pgDumpCmd = PG_DUMP_PATH;
        if (isWindows && PG_DUMP_PATH.includes(' ')) {
            pgDumpCmd = `"${PG_DUMP_PATH}"`;
        }
        
        // Escape file path - Windows needs double quotes escaped
        const escapedFilePath = isWindows 
            ? filePath.replace(/"/g, '""')
            : filePath;
        
        // Build command - use connection string format
        // Note: On Windows, we need to be careful with quotes
        const command = isWindows
            ? `${pgDumpCmd} --dbname="${targetDbUrl}" -F c -f "${escapedFilePath}"`
            : `${pgDumpCmd} --dbname="${targetDbUrl}" -F c -f "${escapedFilePath}"`;

        try {
            await execAsync(command, {
                maxBuffer: 10 * 1024 * 1024, // 10MB buffer for large backups
                shell: isWindows ? 'cmd.exe' : undefined,
                env: {
                    ...process.env,
                    PGPASSWORD: urlObj.password || process.env.PGPASSWORD,
                },
            });
        } catch (error: any) {
            const errorMessage = error.stderr || error.stdout || error.message || 'Backup failed';
            
            // Update status to FAILED
            await corePrisma.backupMetadata.update({
                where: { id: backup.id },
                data: { 
                    status: 'FAILED',
                    errorMessage: errorMessage.substring(0, 500), // Limit error message length
                },
            });
            throw new Error(`Backup failed: ${errorMessage}`);
        }

        // Get file stats
        const stats = fs.statSync(filePath);

        // Update metadata to COMPLETED
        // Convert fileSize to Number to avoid BigInt serialization issues
        const fileSizeNumber = Number(stats.size);
        const completedBackup = await corePrisma.backupMetadata.update({
            where: { id: backup.id },
            data: {
                status: 'COMPLETED',
                fileSize: fileSizeNumber,
                completedAt: new Date(),
                compressed: true, // -F c is compressed
            },
        });

        // Log success
        await createSystemAuditLog({
            userId,
            tenantSlug: tenant.slug,
            action: 'CREATE_BACKUP',
            module: 'backup',
            resource: 'backup',
            resourceId: completedBackup.id,
            status: 'SUCCESS',
            details: { type, fileSize: stats.size },
        });

        return completedBackup;

    } catch (error) {
        // Update metadata to FAILED
        await corePrisma.backupMetadata.update({
            where: { id: backup.id },
            data: {
                status: 'FAILED',
                errorMessage: error instanceof Error ? error.message : 'Unknown error',
                completedAt: new Date(),
            },
        });

        // Log failure
        await createSystemAuditLog({
            userId,
            tenantSlug: tenant.slug,
            action: 'CREATE_BACKUP',
            module: 'backup',
            resource: 'backup',
            resourceId: backup.id,
            status: 'FAILURE',
            errorMessage: error instanceof Error ? error.message : 'Unknown error',
        });

        throw error;
    }
}

/**
 * List backups for a tenant
 */
export async function listBackups(tenantId?: string) {
    try {
        const where = tenantId ? { tenantId } : {};

        return await corePrisma.backupMetadata.findMany({
            where,
            orderBy: { createdAt: 'desc' },
            include: {
                tenant: {
                    select: { name: true, slug: true }
                }
            }
        });
    } catch (error: any) {
        // If tenant relation doesn't exist, try without it
        if (error?.code === 'P2025' || error?.message?.includes('relation')) {
            const where = tenantId ? { tenantId } : {};
            return await corePrisma.backupMetadata.findMany({
                where,
                orderBy: { createdAt: 'desc' },
            });
        }
        throw error;
    }
}

/**
 * Get backup file stream
 */
export async function getBackupFileStream(backupId: string) {
    const backup = await corePrisma.backupMetadata.findUnique({
        where: { id: backupId },
    });

    if (!backup) {
        throw new Error('Backup not found');
    }

    // Resolve file path - handle both relative and absolute paths
    let resolvedPath = backup.filePath;
    
    // If path is already absolute, use it as-is
    if (path.isAbsolute(resolvedPath)) {
        resolvedPath = path.resolve(resolvedPath);
    } else {
        // If relative, check if it already contains BACKUP_DIR in the path
        // This handles cases where filePath is stored as "storage/backups/file.sql"
        const normalizedPath = resolvedPath.replace(/\\/g, '/');
        
        // Check if path already contains backup directory name
        if (normalizedPath.includes('storage/backups') || normalizedPath.includes('storage\\backups')) {
            // Path already contains backup directory, resolve from cwd
            resolvedPath = path.resolve(process.cwd(), resolvedPath);
        } else {
            // Path is just filename or relative to BACKUP_DIR
            // Extract just the filename if path contains directory
            const fileName = path.basename(resolvedPath);
            resolvedPath = path.resolve(BACKUP_DIR, fileName);
        }
    }

    // Also try resolving from process.cwd() if the above doesn't work
    if (!fs.existsSync(resolvedPath)) {
        const cwdPath = path.resolve(process.cwd(), backup.filePath);
        if (fs.existsSync(cwdPath)) {
            resolvedPath = cwdPath;
        }
    }

    // Try original path as-is (in case it's already correct)
    if (!fs.existsSync(resolvedPath) && fs.existsSync(backup.filePath)) {
        resolvedPath = backup.filePath;
    }

    if (!fs.existsSync(resolvedPath)) {
        throw new Error(`Backup file not found on disk. Expected path: ${resolvedPath}. Original path: ${backup.filePath}. BACKUP_DIR: ${BACKUP_DIR}`);
    }

    return {
        stream: fs.createReadStream(resolvedPath),
        filename: backup.fileName,
        size: backup.fileSize || 0,
    };
}

/**
 * Delete a backup
 */
export async function deleteBackup(backupId: string, userId: string) {
    const backup = await corePrisma.backupMetadata.findUnique({
        where: { id: backupId },
    });

    if (!backup) throw new Error('Backup not found');

    // Delete file
    if (fs.existsSync(backup.filePath)) {
        fs.unlinkSync(backup.filePath);
    }

    // Delete metadata
    await corePrisma.backupMetadata.delete({
        where: { id: backupId },
    });

    // Log deletion
    await createSystemAuditLog({
        userId,
        tenantSlug: backup.tenantSlug,
        action: 'DELETE_BACKUP',
        module: 'backup',
        resource: 'backup',
        resourceId: backupId,
        status: 'SUCCESS',
    });
}
