// Forms API Route
// FAZ 0.5: Dinamik Form Builder
// GET /api/forms - List form configs
// POST /api/forms - Create form config

import { NextRequest } from 'next/server';
import { withTenant } from '@/lib/api/withTenant';
import { successResponse, errorResponse } from '@/lib/api/errorHandler';
import type { ApiResponse } from '@/lib/api/errorHandler';
import { FormBuilderService } from '@/lib/form-builder/FormBuilderService';
// GET /api/forms - List form configs
export async function GET(request: NextRequest) {
  return withTenant<ApiResponse<{ forms: unknown[] }>>(
    request,
    async (tenantPrisma) => {
      const { getTenantFromRequest } = await import('@/lib/api/tenantContext');
      const { getCompanyIdFromRequest } = await import('@/lib/api/companyContext');

      const tenantContext = await getTenantFromRequest(request);

      if (!tenantContext) {
        return errorResponse('Bad Request', 'Tenant context not found', 400);
      }

      const companyId = await getCompanyIdFromRequest(request, tenantPrisma);
      if (!companyId) {
        return errorResponse('Bad Request', 'Company ID is required', 400);
      }

      const searchParams = request.nextUrl.searchParams;
      const module = searchParams.get('module');
      const entityType = searchParams.get('entityType');

      const formService = new FormBuilderService(tenantPrisma);

      const forms = await formService.getFormConfigs(
        tenantContext.id,
        companyId,
        module || undefined,
        entityType || undefined
      );

      return successResponse({
        forms: forms.map(form => ({
          ...form,
          createdAt: form.createdAt.toISOString(),
          updatedAt: form.updatedAt.toISOString(),
        })),
      });
    },
    { required: true, module: 'forms' }
  );
}

// POST /api/forms - Create form config
export async function POST(request: NextRequest) {
  return withTenant<ApiResponse<{ form: unknown }>>(
    request,
    async (tenantPrisma) => {
      const { getTenantFromRequest } = await import('@/lib/api/tenantContext');
      const tenantContext = await getTenantFromRequest(request);
      
      if (!tenantContext) {
        return errorResponse('Bad Request', 'Tenant context not found', 400);
      }

      try {
        const body = await request.json();
        const { module, entityType, name, fields, isActive } = body;

        if (!module || !entityType || !name || !fields) {
          return errorResponse('Bad Request', 'module, entityType, name, and fields are required', 400);
        }

        if (!Array.isArray(fields) || fields.length === 0) {
          return errorResponse('Bad Request', 'fields must be a non-empty array', 400);
        }

        // Get companyId
        const { getCompanyIdFromRequest } = await import('@/lib/api/companyContext');
        const companyId = await getCompanyIdFromRequest(request, tenantPrisma);
        
        if (!companyId) {
          return errorResponse('Bad Request', 'Company ID is required', 400);
        }

        const formService = new FormBuilderService(tenantPrisma);
        
        const form = await formService.createFormConfig(tenantContext.id, companyId, {
          module,
          entityType,
          name,
          fields,
          isActive: isActive ?? true,
        });

        return successResponse({
          form: {
            ...form,
            createdAt: form.createdAt.toISOString(),
            updatedAt: form.updatedAt.toISOString(),
          },
        });
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Failed to create form config';
        return errorResponse('Internal Server Error', errorMessage, 500);
      }
    },
    { required: true, module: 'forms' }
  );
}









