/**
 * Database Maintenance API (Vacuum/Reindex)
 */

import { NextRequest } from 'next/server';
import { requireSuperAdmin } from '@/lib/middleware/superAdminMiddleware';
import { successResponse, errorResponse } from '@/lib/api/response';
import { runVacuum, reindexDatabase } from '@/lib/services/databaseService';
export async function POST(request: NextRequest) {
    const auth = await requireSuperAdmin(request);
    if (auth instanceof Response) return auth;

    try {
        const body = await request.json();
        const { tenantId, action } = body;

        if (!tenantId) return errorResponse('VALIDATION_ERROR', 'Tenant ID is required');

        let result;
        if (action === 'VACUUM') {
            result = await runVacuum(tenantId, auth.userId);
        } else if (action === 'REINDEX') {
            result = await reindexDatabase(tenantId, auth.userId);
        } else {
            return errorResponse('VALIDATION_ERROR', 'Invalid action');
        }

        return successResponse(result);
    } catch (error) {
        return errorResponse('INTERNAL_ERROR', 'Failed to perform maintenance', error);
    }
}
