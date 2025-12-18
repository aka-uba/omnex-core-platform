/**
 * Audit Logs Export API
 * Export logs to JSON or CSV format
 */

import { NextRequest } from 'next/server';
import { requireSuperAdmin, getClientIP, getUserAgent } from '@/lib/middleware/superAdminMiddleware';
import { errorResponse } from '@/lib/api/response';
import {
    exportSystemAuditLogsJSON,
    exportSystemAuditLogsCSV,
    createSystemAuditLog,
} from '@/lib/services/systemAuditLogService';

/**
 * GET /api/admin/logs/export
 * Export audit logs
 */
export async function GET(request: NextRequest) {
    const auth = await requireSuperAdmin(request);
    if (auth instanceof Response) return auth;

    const searchParams = request.nextUrl.searchParams;
    const format = searchParams.get('format');

    const filters = {
        ...(searchParams.get('userId') ? { userId: searchParams.get('userId')! } : {}),
        ...(searchParams.get('tenantSlug') ? { tenantSlug: searchParams.get('tenantSlug')! } : {}),
        ...(searchParams.get('action') ? { action: searchParams.get('action')! } : {}),
        ...(searchParams.get('module') ? { module: searchParams.get('module')! } : {}),
        ...(searchParams.get('status') ? { status: searchParams.get('status')! } : {}),
        ...(searchParams.get('startDate') ? { startDate: new Date(searchParams.get('startDate')!) } : {}),
        ...(searchParams.get('endDate') ? { endDate: new Date(searchParams.get('endDate')!) } : {}),
    };

    try {
        let buffer: Buffer;
        let contentType: string;
        let filename: string;

        if (format === 'csv') {
            buffer = await exportSystemAuditLogsCSV(filters);
            contentType = 'text/csv';
            filename = `audit-logs-${new Date().toISOString().split('T')[0]}.csv`;
        } else {
            buffer = await exportSystemAuditLogsJSON(filters);
            contentType = 'application/json';
            filename = `audit-logs-${new Date().toISOString().split('T')[0]}.json`;
        }

        // Log export action
        await createSystemAuditLog({
            ...(auth.userId ? { userId: auth.userId } : {}),
            ...(auth.tenantSlug ? { tenantSlug: auth.tenantSlug } : {}),
            action: 'EXPORT_AUDIT_LOGS',
            module: 'admin',
            resource: 'audit_logs',
            ...(format || filters ? {
                details: {
                    ...(format ? { format } : {}),
                    ...(filters ? {
                        filters: {
                            ...(filters.endDate ? { endDate: filters.endDate } : {}),
                            ...(filters.startDate ? { startDate: filters.startDate } : {}),
                            ...(filters.status ? { status: filters.status } : {}),
                            ...(filters.module ? { module: filters.module } : {}),
                            ...(filters.action ? { action: filters.action } : {}),
                            ...(filters.tenantSlug ? { tenantSlug: filters.tenantSlug } : {}),
                            ...(filters.userId ? { userId: filters.userId } : {}),
                        },
                    } : {}),
                },
            } : {}),
            ...(getClientIP(request) ? { ipAddress: getClientIP(request)! } : {}),
            ...(getUserAgent(request) ? { userAgent: getUserAgent(request)! } : {}),
            status: 'SUCCESS',
        });

        return new Response(buffer as any, {
            headers: {
                'Content-Type': contentType,
                'Content-Disposition': `attachment; filename="${filename}"`,
            },
        });
    } catch (error) {
        console.error('[admin-logs-export] Error exporting logs:', error);

        await createSystemAuditLog({
            ...(auth.userId ? { userId: auth.userId } : {}),
            ...(auth.tenantSlug ? { tenantSlug: auth.tenantSlug } : {}),
            action: 'EXPORT_AUDIT_LOGS',
            module: 'admin',
            resource: 'audit_logs',
            ...(format || filters ? {
                details: {
                    ...(format ? { format } : {}),
                    ...(filters ? {
                        filters: {
                            ...(filters.endDate ? { endDate: filters.endDate } : {}),
                            ...(filters.startDate ? { startDate: filters.startDate } : {}),
                            ...(filters.status ? { status: filters.status } : {}),
                            ...(filters.module ? { module: filters.module } : {}),
                            ...(filters.action ? { action: filters.action } : {}),
                            ...(filters.tenantSlug ? { tenantSlug: filters.tenantSlug } : {}),
                            ...(filters.userId ? { userId: filters.userId } : {}),
                        },
                    } : {}),
                },
            } : {}),
            ...(getClientIP(request) ? { ipAddress: getClientIP(request)! } : {}),
            ...(getUserAgent(request) ? { userAgent: getUserAgent(request)! } : {}),
            status: 'ERROR',
            ...(error instanceof Error ? { errorMessage: error.message } : { errorMessage: 'Unknown error' }),
        });

        return errorResponse('INTERNAL_ERROR', 'Failed to export audit logs', null, 500);
    }
}
