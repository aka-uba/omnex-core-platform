/**
 * Audit Logs Statistics API
 * Get statistics and insights from audit logs
 */

import { NextRequest } from 'next/server';
import { requireSuperAdmin } from '@/lib/middleware/superAdminMiddleware';
import { successResponse, errorResponse } from '@/lib/api/response';
import { getSystemAuditLogStats } from '@/lib/services/systemAuditLogService';
/**
 * GET /api/admin/logs/stats
 * Get audit log statistics
 */
export async function GET(request: NextRequest) {
    const auth = await requireSuperAdmin(request);
    if (auth instanceof Response) return auth;

    try {
        const searchParams = request.nextUrl.searchParams;
        const tenantSlug = searchParams.get('tenantSlug') || undefined;

        const stats = await getSystemAuditLogStats(tenantSlug);

        return successResponse(stats);
    } catch (error) {
        console.error('[admin-logs-stats] Error getting stats:', error);
        return errorResponse('INTERNAL_ERROR', 'Failed to get audit log statistics', null, 500);
    }
}
