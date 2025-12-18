/**
 * Backup Restore API
 */

import { NextRequest } from 'next/server';
import { requireSuperAdmin } from '@/lib/middleware/superAdminMiddleware';
import { restoreFromBackup } from '@/lib/services/restoreService';
import { successResponse, errorResponse } from '@/lib/api/response';

interface RouteParams {
    params: Promise<{
        id: string;
    }>;
}

export async function POST(request: NextRequest, { params }: RouteParams) {
    const auth = await requireSuperAdmin(request);
    if (auth instanceof Response) return auth;

    try {
        const { id } = await params;
        const result = await restoreFromBackup(id, auth.userId);
        return successResponse(result);
    } catch (error) {
        return errorResponse('INTERNAL_ERROR', 'Failed to restore backup', error);
    }
}
