// Core AI API Route - Models
// FAZ 0.2: Merkezi AI Servisi
// GET /api/core-ai/models - Get available models

import { NextRequest } from 'next/server';
import { withTenant } from '@/lib/api/withTenant';
import { successResponse, errorResponse } from '@/lib/api/errorHandler';
import type { ApiResponse } from '@/lib/api/errorHandler';
import { coreAIService } from '@/lib/core-ai/CoreAIService';
// GET /api/core-ai/models - Get available models
export async function GET(request: NextRequest) {
  return withTenant<ApiResponse<{ models: unknown[] }>>(
    request,
    async () => {
      try {
        const models = await coreAIService.getAvailableModels();

        return successResponse({
          models: models.map(model => ({
            ...model,
            // Remove sensitive information
            costPerToken: model.costPerToken,
          })),
        });
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Failed to get models';
        return errorResponse('Internal Server Error', errorMessage, 500);
      }
    },
    { required: true, module: 'core-ai' }
  );
}

