/**
 * System Info API
 */

import { NextRequest } from 'next/server';
import { requireSuperAdmin } from '@/lib/middleware/superAdminMiddleware';
import { successResponse, errorResponse } from '@/lib/api/response';
import { getSystemInfo, getResourceUsage } from '@/lib/services/systemMonitorService';
export async function GET(request: NextRequest) {
    const auth = await requireSuperAdmin(request);
    if (auth instanceof Response) return auth;

    try {
        const [info, usage] = await Promise.all([
            getSystemInfo(),
            getResourceUsage(),
        ]);

        return successResponse({ info, usage });
    } catch (error) {
        return errorResponse('INTERNAL_ERROR', 'Failed to get system info', error);
    }
}
