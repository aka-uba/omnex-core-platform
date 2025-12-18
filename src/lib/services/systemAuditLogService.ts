/**
 * System Audit Logging Service (Core Database)
 * Tracks platform-wide user actions and system events
 * Stored in core database for centralized logging across all tenants
 */

import { corePrisma } from '@/lib/corePrisma';

export interface SystemAuditLogData {
    userId?: string;
    tenantSlug?: string;
    action: string;
    module: string;
    resource?: string;
    resourceId?: string;
    details?: any;
    ipAddress?: string;
    userAgent?: string;
    status: 'SUCCESS' | 'FAILURE' | 'ERROR';
    errorMessage?: string;
}

export interface SystemAuditLogFilters {
    userId?: string;
    tenantSlug?: string;
    action?: string;
    module?: string;
    status?: string;
    startDate?: Date;
    endDate?: Date;
    page?: number;
    limit?: number;
}

/**
 * Create a system audit log entry
 */
export async function createSystemAuditLog(data: SystemAuditLogData) {
    try {
        return await corePrisma.auditLog.create({
            data: {
                ...(data.userId ? { userId: data.userId } : {}),
                ...(data.tenantSlug ? { tenantSlug: data.tenantSlug } : {}),
                action: data.action,
                module: data.module,
                ...(data.resource ? { resource: data.resource } : {}),
                ...(data.resourceId ? { resourceId: data.resourceId } : {}),
                ...(data.details ? { details: data.details } : {}),
                ...(data.ipAddress ? { ipAddress: data.ipAddress } : {}),
                ...(data.userAgent ? { userAgent: data.userAgent } : {}),
                status: data.status,
                ...(data.errorMessage ? { errorMessage: data.errorMessage } : {}),
            },
        });
    } catch (error) {
        console.error('[system-audit-log] Failed to create audit log:', error);
        // Don't throw - audit logging should not break the main flow
        return null;
    }
}

/**
 * Query system audit logs with filters and pagination
 */
export async function querySystemAuditLogs(filters: SystemAuditLogFilters) {
    const {
        userId,
        tenantSlug,
        action,
        module,
        status,
        startDate,
        endDate,
        page = 1,
        limit = 50,
    } = filters;

    const where: any = {};

    if (userId) where.userId = userId;
    if (tenantSlug) where.tenantSlug = tenantSlug;
    if (action) where.action = action;
    if (module) where.module = module;
    if (status) where.status = status;

    if (startDate || endDate) {
        where.createdAt = {};
        if (startDate) where.createdAt.gte = startDate;
        if (endDate) where.createdAt.lte = endDate;
    }

    const [logs, total] = await Promise.all([
        corePrisma.auditLog.findMany({
            where,
            orderBy: { createdAt: 'desc' },
            skip: (page - 1) * limit,
            take: limit,
        }),
        corePrisma.auditLog.count({ where }),
    ]);

    return {
        logs,
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
    };
}

/**
 * Export audit logs to JSON
 */
export async function exportSystemAuditLogsJSON(filters: SystemAuditLogFilters) {
    const { logs } = await querySystemAuditLogs({ ...filters, limit: 10000 });
    return Buffer.from(JSON.stringify(logs, null, 2));
}

/**
 * Export audit logs to CSV
 */
export async function exportSystemAuditLogsCSV(filters: SystemAuditLogFilters) {
    const { logs } = await querySystemAuditLogs({ ...filters, limit: 10000 });

    const headers = [
        'ID',
        'User ID',
        'Tenant',
        'Action',
        'Module',
        'Resource',
        'Resource ID',
        'Status',
        'IP Address',
        'Created At',
        'Error Message',
    ];

    const rows = logs.map((log) => [
        log.id,
        log.userId || '',
        log.tenantSlug || '',
        log.action,
        log.module,
        log.resource || '',
        log.resourceId || '',
        log.status,
        log.ipAddress || '',
        log.createdAt.toISOString(),
        log.errorMessage || '',
    ]);

    const csv = [headers, ...rows].map((row) => row.join(',')).join('\n');
    return Buffer.from(csv);
}

/**
 * Clean up old audit logs
 */
export async function cleanupOldSystemLogs(retentionDays: number = 90) {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - retentionDays);

    const result = await corePrisma.auditLog.deleteMany({
        where: {
            createdAt: {
                lt: cutoffDate,
            },
        },
    });

    return result.count;
}

/**
 * Get audit log statistics
 */
export async function getSystemAuditLogStats(tenantSlug?: string) {
    const where = tenantSlug ? { tenantSlug } : {};

    const [total, byAction, byModule, byStatus, recentErrors] = await Promise.all([
        corePrisma.auditLog.count({ where }),
        corePrisma.auditLog.groupBy({
            by: ['action'],
            where,
            _count: true,
            orderBy: { _count: { action: 'desc' } },
            take: 10,
        }),
        corePrisma.auditLog.groupBy({
            by: ['module'],
            where,
            _count: true,
            orderBy: { _count: { module: 'desc' } },
            take: 10,
        }),
        corePrisma.auditLog.groupBy({
            by: ['status'],
            where,
            _count: true,
        }),
        corePrisma.auditLog.findMany({
            where: { ...where, status: 'ERROR' },
            orderBy: { createdAt: 'desc' },
            take: 10,
            select: {
                id: true,
                action: true,
                module: true,
                errorMessage: true,
                createdAt: true,
            },
        }),
    ]);

    return {
        total,
        byAction,
        byModule,
        byStatus,
        recentErrors,
    };
}
