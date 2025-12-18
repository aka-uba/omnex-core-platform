// Core AI API Route - Templates
// FAZ 0.2: Merkezi AI Servisi
// GET /api/core-ai/templates - Get templates
// POST /api/core-ai/templates - Register template

import { NextRequest } from 'next/server';
import { withTenant } from '@/lib/api/withTenant';
import { successResponse, errorResponse } from '@/lib/api/errorHandler';
import type { ApiResponse } from '@/lib/api/errorHandler';
import { coreAIService } from '@/lib/core-ai/CoreAIService';
import { templateRegistry } from '@/lib/core-ai/templates/TemplateRegistry';
import { PromptTemplate } from '@/lib/core-ai/types';
// GET /api/core-ai/templates - Get templates
export async function GET(request: NextRequest) {
  return withTenant<ApiResponse<{ templates: unknown[] }>>(
    request,
    async () => {
      const searchParams = request.nextUrl.searchParams;
      const module = searchParams.get('module');

      try {
        const templates = module
          ? templateRegistry.getByModule(module)
          : templateRegistry.getAll();

        return successResponse({ templates });
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Failed to get templates';
        return errorResponse('Internal Server Error', errorMessage, 500);
      }
    },
    { required: true, module: 'core-ai' }
  );
}

// POST /api/core-ai/templates - Register template
export async function POST(request: NextRequest) {
  return withTenant<ApiResponse<{ template: unknown }>>(
    request,
    async () => {
      try {
        const body = await request.json();
        const template = body as PromptTemplate;

        if (!template.id || !template.name || !template.template) {
          return errorResponse('Bad Request', 'Template id, name, and template are required', 400);
        }

        coreAIService.registerTemplate(template);

        return successResponse({ template });
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Failed to register template';
        return errorResponse('Internal Server Error', errorMessage, 500);
      }
    },
    { required: true, module: 'core-ai' }
  );
}









