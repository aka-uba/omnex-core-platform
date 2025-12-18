// Core AI API Route - Analyze
// FAZ 0.2: Merkezi AI Servisi
// POST /api/core-ai/analyze - Analyze data

import { NextRequest } from 'next/server';
import { withTenant } from '@/lib/api/withTenant';
import { successResponse, errorResponse } from '@/lib/api/errorHandler';
import type { ApiResponse } from '@/lib/api/errorHandler';
import { coreAIService } from '@/lib/core-ai/CoreAIService';
// POST /api/core-ai/analyze - Analyze data
export async function POST(request: NextRequest) {
  return withTenant<ApiResponse<{ analysis: unknown }>>(
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
        const body = await request.json();
        const { data, analysisType } = body;

        if (!data) {
          return errorResponse('Bad Request', 'Data is required', 400);
        }

        if (!analysisType) {
          return errorResponse('Bad Request', 'Analysis type is required', 400);
        }

        // Check quota
        const quota = await coreAIService.checkQuota(tenantContext.id, userId);
        if (quota.remaining.daily <= 0) {
          return errorResponse('Quota Exceeded', 'Daily quota exceeded', 429);
        }

        // Analyze
        const analysis = await coreAIService.analyze(data, analysisType);

        return successResponse({ analysis });
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'AI analysis failed';
        return errorResponse('Internal Server Error', errorMessage, 500);
      }
    },
    { required: true, module: 'core-ai' }
  );
}

