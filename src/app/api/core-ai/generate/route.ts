// Core AI API Route - Generate
// FAZ 0.2: Merkezi AI Servisi
// POST /api/core-ai/generate - Generate text from prompt

import { NextRequest } from 'next/server';
import { withTenant } from '@/lib/api/withTenant';
import { successResponse, errorResponse } from '@/lib/api/errorHandler';
import type { ApiResponse } from '@/lib/api/errorHandler';
import { coreAIService } from '@/lib/core-ai/CoreAIService';
// POST /api/core-ai/generate - Generate text
export async function POST(request: NextRequest) {
  return withTenant<ApiResponse<{ response: unknown }>>(
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
        const {
          prompt,
          model,
          provider,
          maxTokens,
          temperature,
          topP,
          frequencyPenalty,
          presencePenalty,
          stop,
          module,
        } = body;

        if (!prompt) {
          return errorResponse('Bad Request', 'Prompt is required', 400);
        }

        // Check quota
        const quota = await coreAIService.checkQuota(tenantContext.id, userId);
        if (quota.remaining.daily <= 0) {
          return errorResponse('Quota Exceeded', 'Daily quota exceeded', 429);
        }

        // Generate
        const response = await coreAIService.generate({
          prompt,
          model,
          provider,
          maxTokens,
          temperature,
          topP,
          frequencyPenalty,
          presencePenalty,
          stop,
          tenantId: tenantContext.id,
          userId,
          module: module || 'core-ai',
        });

        // Log to AI History
        try {
          await tenantPrisma.aIGeneration.create({
            data: {
              tenantId: tenantContext.id,
              userId,
              generatorType: 'text',
              prompt,
              output: response.content,
              settings: {
                model: response.model,
                provider: response.provider,
                temperature,
                maxTokens,
                usage: response.usage,
                cost: response.cost,
              },
            },
          });

          // Also log to AIHistory
          await tenantPrisma.aIHistory.create({
            data: {
              tenantId: tenantContext.id,
              userId,
              generatorType: 'text',
              prompt,
              metadata: {
                model: response.model,
                provider: response.provider,
                usage: response.usage,
                cost: response.cost,
                module: module || 'core-ai',
              },
            },
          });
        } catch (historyError) {
          // Log error but don't fail the request
          if (process.env.NODE_ENV === 'development') {
            console.error('Failed to log AI history:', historyError);
          }
        }

        return successResponse({
          response: {
            ...response,
            createdAt: response.createdAt.toISOString(),
          },
        });
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'AI generation failed';
        return errorResponse('Internal Server Error', errorMessage, 500);
      }
    },
    { required: true, module: 'core-ai' }
  );
}

