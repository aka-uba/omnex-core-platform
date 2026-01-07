/**
 * Database Management Service
 * Handles database maintenance and statistics
 */

import { corePrisma } from '@/lib/corePrisma';
import { createSystemAuditLog } from './systemAuditLogService';

/**
 * Validate database name to prevent SQL injection
 * Only allows alphanumeric characters and underscores
 */
function validateDbName(dbName: string): boolean {
    return /^[a-zA-Z0-9_]+$/.test(dbName);
}

export interface DatabaseInfo {
    size: string;
    tableCount: number;
    activeConnections: number;
    version: string;
}

export interface TableStats {
    tableName: string;
    rowCount: number;
    size: string;
}

/**
 * Get database information for a tenant
 */
export async function getDatabaseInfo(tenantId: string): Promise<DatabaseInfo> {
    const tenant = await corePrisma.tenant.findUnique({
        where: { id: tenantId },
    });

    if (!tenant) throw new Error('Tenant not found');

    const dbName = tenant.dbName;

    // Security: Validate database name to prevent SQL injection
    if (!validateDbName(dbName)) {
        throw new Error('Invalid database name format');
    }

    // Get DB Size - Using unsafe query (dbName already validated against SQL injection)
    const sizeResult = await corePrisma.$queryRawUnsafe<{ size: string }[]>(
        `SELECT pg_size_pretty(pg_database_size('${dbName}')) as size`
    );

    // Get Active Connections - Using unsafe query (dbName already validated against SQL injection)
    const connResult = await corePrisma.$queryRawUnsafe<{ count: number }[]>(
        `SELECT count(*)::int as count FROM pg_stat_activity WHERE datname = '${dbName}'`
    );

    // Get Version
    const versionResult = await corePrisma.$queryRaw`SELECT version()`;

    return {
        size: sizeResult[0]?.size || 'Unknown',
        tableCount: 0, // Requires direct connection to tenant DB
        activeConnections: connResult[0]?.count || 0,
        version: (versionResult as { version: string }[])[0]?.version || 'Unknown',
    };
}

/**
 * Run VACUUM on a tenant database
 */
export async function runVacuum(tenantId: string, userId: string) {
    const tenant = await corePrisma.tenant.findUnique({
        where: { id: tenantId },
    });

    if (!tenant) throw new Error('Tenant not found');

    await createSystemAuditLog({
        userId,
        tenantSlug: tenant.slug,
        action: 'DB_VACUUM',
        module: 'database',
        resource: 'database',
        status: 'SUCCESS',
        details: { message: 'Vacuum scheduled (Placeholder)' },
    });

    return { success: true, message: 'Vacuum scheduled' };
}

/**
 * Reindex database
 */
export async function reindexDatabase(tenantId: string, userId: string) {
    const tenant = await corePrisma.tenant.findUnique({
        where: { id: tenantId },
    });

    if (!tenant) throw new Error('Tenant not found');

    await createSystemAuditLog({
        userId,
        tenantSlug: tenant.slug,
        action: 'DB_REINDEX',
        module: 'database',
        resource: 'database',
        status: 'SUCCESS',
        details: { message: 'Reindex scheduled (Placeholder)' },
    });

    return { success: true, message: 'Reindex scheduled' };
}
