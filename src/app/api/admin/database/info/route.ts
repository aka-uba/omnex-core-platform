/**
 * Database Management API
 */

import { NextRequest } from 'next/server';
import { requireSuperAdmin } from '@/lib/middleware/superAdminMiddleware';
import { successResponse, errorResponse } from '@/lib/api/response';
import { getDatabaseInfo } from '@/lib/services/databaseService';
/**
 * GET /api/admin/database/info
 */
export async function GET(request: NextRequest) {
    const auth = await requireSuperAdmin(request);
    if (auth instanceof Response) return auth;

    try {
        const tenantId = request.nextUrl.searchParams.get('tenantId');
        if (!tenantId) return errorResponse('VALIDATION_ERROR', 'Tenant ID is required');

        const info = await getDatabaseInfo(tenantId);
        return successResponse(info);
    } catch (error) {
        return errorResponse('INTERNAL_ERROR', 'Failed to get database info', error);
    }
}
