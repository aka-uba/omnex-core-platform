// Core AI API Route - Chat
// FAZ 0.2: Merkezi AI Servisi
// POST /api/core-ai/chat - Chat with AI

import { NextRequest } from 'next/server';
import { withTenant } from '@/lib/api/withTenant';
import { successResponse, errorResponse } from '@/lib/api/errorHandler';
import type { ApiResponse } from '@/lib/api/errorHandler';
import { coreAIService } from '@/lib/core-ai/CoreAIService';
import { AIMessage } from '@/lib/core-ai/types';
// POST /api/core-ai/chat - Chat with AI
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
          messages,
          model,
          provider,
          temperature,
          maxTokens,
          systemPrompt,
          module,
        } = body;

        if (!messages || !Array.isArray(messages) || messages.length === 0) {
          return errorResponse('Bad Request', 'Messages array is required', 400);
        }

        // Validate messages format
        const aiMessages: AIMessage[] = messages.map((msg: any) => ({
          role: msg.role,
          content: msg.content,
          ...(msg.name && { name: msg.name }),
        }));

        // Check quota
        const quota = await coreAIService.checkQuota(tenantContext.id, userId);
        if (quota.remaining.daily <= 0) {
          return errorResponse('Quota Exceeded', 'Daily quota exceeded', 429);
        }

        // Chat
        const response = await coreAIService.chat(aiMessages, {
          model,
          provider,
          temperature,
          maxTokens,
          systemPrompt,
          tenantId: tenantContext.id,
          userId,
          module: module || 'core-ai',
        });

        // Log to AI History
        try {
          const promptText = aiMessages.map(m => `${m.role}: ${m.content}`).join('\n');
          
          await tenantPrisma.aIGeneration.create({
            data: {
              tenantId: tenantContext.id,
              userId,
              generatorType: 'chat',
              prompt: promptText,
              output: response.content,
              settings: {
                model: response.model,
                provider: response.provider,
                temperature,
                maxTokens,
                systemPrompt,
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
              generatorType: 'chat',
              prompt: promptText,
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
        const errorMessage = error instanceof Error ? error.message : 'AI chat failed';
        return errorResponse('Internal Server Error', errorMessage, 500);
      }
    },
    { required: true, module: 'core-ai' }
  );
}

