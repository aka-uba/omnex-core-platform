// Forms API Route - Single Form
// FAZ 0.5: Dinamik Form Builder
// GET /api/forms/[id] - Get form config
// PATCH /api/forms/[id] - Update form config
// DELETE /api/forms/[id] - Delete form config

import { NextRequest } from 'next/server';
import { withTenant } from '@/lib/api/withTenant';
import { successResponse, errorResponse } from '@/lib/api/errorHandler';
import type { ApiResponse } from '@/lib/api/errorHandler';
import { FormBuilderService } from '@/lib/form-builder/FormBuilderService';
// GET /api/forms/[id] - Get form config
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return withTenant<ApiResponse<{ form: unknown }>>(
    request,
    async (tenantPrisma) => {
      const { id } = await params;
      const formId = id;

      try {
        const formService = new FormBuilderService(tenantPrisma);
        const form = await formService.getFormConfig(formId);

        if (!form) {
          return errorResponse('Not Found', 'Form config not found', 404);
        }

        return successResponse({
          form: {
            ...form,
            createdAt: form.createdAt.toISOString(),
            updatedAt: form.updatedAt.toISOString(),
          },
        });
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Failed to get form config';
        return errorResponse('Internal Server Error', errorMessage, 500);
      }
    },
    { required: true, module: 'forms' }
  );
}

// PATCH /api/forms/[id] - Update form config
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return withTenant<ApiResponse<{ form: unknown }>>(
    request,
    async (tenantPrisma) => {
      const { id } = await params;
      const formId = id;

      try {
        const body = await request.json();
        const { module, entityType, name, fields, isActive } = body;

        const formService = new FormBuilderService(tenantPrisma);
        
        const form = await formService.updateFormConfig(formId, {
          module,
          entityType,
          name,
          fields,
          isActive,
        });

        return successResponse({
          form: {
            ...form,
            createdAt: form.createdAt.toISOString(),
            updatedAt: form.updatedAt.toISOString(),
          },
        });
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Failed to update form config';
        return errorResponse('Internal Server Error', errorMessage, 500);
      }
    },
    { required: true, module: 'forms' }
  );
}

// DELETE /api/forms/[id] - Delete form config
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return withTenant<ApiResponse<{ success: boolean }>>(
    request,
    async (tenantPrisma) => {
      const { id } = await params;
      const formId = id;

      try {
        const formService = new FormBuilderService(tenantPrisma);
        await formService.deleteFormConfig(formId);

        return successResponse({ success: true });
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Failed to delete form config';
        return errorResponse('Internal Server Error', errorMessage, 500);
      }
    },
    { required: true, module: 'forms' }
  );
}

