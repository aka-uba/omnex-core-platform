// Core AI API Route - Template by ID
// FAZ 0.2: Merkezi AI Servisi
// GET /api/core-ai/templates/[id] - Get template
// POST /api/core-ai/templates/[id] - Generate with template

import { NextRequest } from 'next/server';
import { withTenant } from '@/lib/api/withTenant';
import { successResponse, errorResponse } from '@/lib/api/errorHandler';
import type { ApiResponse } from '@/lib/api/errorHandler';
import { coreAIService } from '@/lib/core-ai/CoreAIService';
// GET /api/core-ai/templates/[id] - Get template
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return withTenant<ApiResponse<{ template: unknown }>>(
    request,
    async () => {
      const { id } = await params;
      const templateId = id;

      try {
        const template = coreAIService.getTemplate(templateId);

        if (!template) {
          return errorResponse('Not Found', 'Template not found', 404);
        }

        return successResponse({ template });
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Failed to get template';
        return errorResponse('Internal Server Error', errorMessage, 500);
      }
    },
    { required: true, module: 'core-ai' }
  );
}

// POST /api/core-ai/templates/[id] - Generate with template
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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

      const { id } = await params;
      const templateId = id;

      try {
        const body = await request.json();
        const { variables } = body;

        if (!variables || typeof variables !== 'object') {
          return errorResponse('Bad Request', 'Variables object is required', 400);
        }

        // Check quota
        const quota = await coreAIService.checkQuota(tenantContext.id, userId);
        if (quota.remaining.daily <= 0) {
          return errorResponse('Quota Exceeded', 'Daily quota exceeded', 429);
        }

        // Generate with template
        const response = await coreAIService.generateWithTemplate(templateId, variables);

        return successResponse({
          response: {
            ...response,
            createdAt: response.createdAt.toISOString(),
          },
        });
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Failed to generate with template';
        return errorResponse('Internal Server Error', errorMessage, 500);
      }
    },
    { required: true, module: 'core-ai' }
  );
}

