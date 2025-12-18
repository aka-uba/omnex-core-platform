/**
 * System Audit Logs API
 * SuperAdmin-only endpoint for viewing platform-wide audit logs
 */

import { NextRequest } from 'next/server';
import { requireSuperAdmin, getClientIP, getUserAgent } from '@/lib/middleware/superAdminMiddleware';
import { errorResponse, paginatedResponse } from '@/lib/api/response';
import {
    querySystemAuditLogs,
    createSystemAuditLog,
} from '@/lib/services/systemAuditLogService';

/**
 * GET /api/admin/logs
 * Query audit logs with filters
 */
export async function GET(request: NextRequest) {
    const auth = await requireSuperAdmin(request);
    if (auth instanceof Response) return auth;

    const searchParams = request.nextUrl.searchParams;

    const filters = {
        ...(searchParams.get('userId') ? { userId: searchParams.get('userId')! } : {}),
        ...(searchParams.get('tenantSlug') ? { tenantSlug: searchParams.get('tenantSlug')! } : {}),
        ...(searchParams.get('action') ? { action: searchParams.get('action')! } : {}),
        ...(searchParams.get('module') ? { module: searchParams.get('module')! } : {}),
        ...(searchParams.get('status') ? { status: searchParams.get('status')! } : {}),
        ...(searchParams.get('startDate') ? { startDate: new Date(searchParams.get('startDate')!) } : {}),
        ...(searchParams.get('endDate') ? { endDate: new Date(searchParams.get('endDate')!) } : {}),
        page: searchParams.get('page') ? parseInt(searchParams.get('page')!) : 1,
        limit: searchParams.get('limit') ? parseInt(searchParams.get('limit')!) : 50,
    };

    try {
        const result = await querySystemAuditLogs(filters);

        // Log this action
        await createSystemAuditLog({
            ...(auth.userId ? { userId: auth.userId } : {}),
            ...(auth.tenantSlug ? { tenantSlug: auth.tenantSlug } : {}),
            action: 'VIEW_AUDIT_LOGS',
            module: 'admin',
            resource: 'audit_logs',
            ...(filters ? {
                details: {
                    filters: {
                        page: filters.page,
                        limit: filters.limit,
                        ...(filters.endDate ? { endDate: filters.endDate } : {}),
                        ...(filters.startDate ? { startDate: filters.startDate } : {}),
                        ...(filters.status ? { status: filters.status } : {}),
                        ...(filters.module ? { module: filters.module } : {}),
                        ...(filters.action ? { action: filters.action } : {}),
                        ...(filters.tenantSlug ? { tenantSlug: filters.tenantSlug } : {}),
                        ...(filters.userId ? { userId: filters.userId } : {}),
                    },
                },
            } : {}),
            ...(getClientIP(request) ? { ipAddress: getClientIP(request)! } : {}),
            ...(getUserAgent(request) ? { userAgent: getUserAgent(request)! } : {}),
            status: 'SUCCESS',
        });

        return paginatedResponse(
            result.logs,
            result.page,
            result.limit,
            result.total
        );
    } catch (error) {
        console.error('[admin-logs] Error querying logs:', error);

        await createSystemAuditLog({
            ...(auth.userId ? { userId: auth.userId } : {}),
            ...(auth.tenantSlug ? { tenantSlug: auth.tenantSlug } : {}),
            action: 'VIEW_AUDIT_LOGS',
            module: 'admin',
            resource: 'audit_logs',
            ...(filters ? {
                details: {
                    filters: {
                        page: filters.page,
                        limit: filters.limit,
                        ...(filters.endDate ? { endDate: filters.endDate } : {}),
                        ...(filters.startDate ? { startDate: filters.startDate } : {}),
                        ...(filters.status ? { status: filters.status } : {}),
                        ...(filters.module ? { module: filters.module } : {}),
                        ...(filters.action ? { action: filters.action } : {}),
                        ...(filters.tenantSlug ? { tenantSlug: filters.tenantSlug } : {}),
                        ...(filters.userId ? { userId: filters.userId } : {}),
                    },
                },
            } : {}),
            ...(getClientIP(request) ? { ipAddress: getClientIP(request)! } : {}),
            ...(getUserAgent(request) ? { userAgent: getUserAgent(request)! } : {}),
            status: 'ERROR',
            ...(error instanceof Error ? { errorMessage: error.message } : { errorMessage: 'Unknown error' }),
        });

        return errorResponse('INTERNAL_ERROR', 'Failed to query audit logs', null, 500);
    }
}
