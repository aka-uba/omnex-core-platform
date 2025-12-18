// Core AI API Route - Quota
// FAZ 0.2: Merkezi AI Servisi
// GET /api/core-ai/quota - Get quota status

import { NextRequest } from 'next/server';
import { withTenant } from '@/lib/api/withTenant';
import { successResponse, errorResponse } from '@/lib/api/errorHandler';
import type { ApiResponse } from '@/lib/api/errorHandler';
import { coreAIService } from '@/lib/core-ai/CoreAIService';
// GET /api/core-ai/quota - Get quota status
export async function GET(request: NextRequest) {
  return withTenant<ApiResponse<{ quota: unknown }>>(
    request,
    async (tenantPrisma) => {
      const { getTenantFromRequest } = await import('@/lib/api/tenantContext');
      const tenantContext = await getTenantFromRequest(request);
      
      if (!tenantContext) {
        return errorResponse('Bad Request', 'Tenant context not found', 400);
      }

      // TODO: Get user from session/auth
      const userId = request.headers.get('x-user-id');
      if (!userId) {
        return errorResponse('Unauthorized', 'User ID is required', 401);
      }

      try {
        const quota = await coreAIService.checkQuota(tenantContext.id, userId);

        return successResponse({
          quota: {
            ...quota,
            resetAt: {
              daily: quota.resetAt.daily.toISOString(),
              monthly: quota.resetAt.monthly.toISOString(),
            },
          },
        });
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Failed to get quota';
        return errorResponse('Internal Server Error', errorMessage, 500);
      }
    },
    { required: true, module: 'core-ai' }
  );
}









