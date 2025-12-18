// Forms API Route - Get by Entity
// FAZ 0.5: Dinamik Form Builder
// GET /api/forms/entity?module=X&entityType=Y - Get form config by entity

import { NextRequest } from 'next/server';
import { withTenant } from '@/lib/api/withTenant';
import { successResponse, errorResponse } from '@/lib/api/errorHandler';
import type { ApiResponse } from '@/lib/api/errorHandler';
import { FormBuilderService } from '@/lib/form-builder/FormBuilderService';
// GET /api/forms/entity - Get form config by entity
export async function GET(request: NextRequest) {
  return withTenant<ApiResponse<{ form: unknown | null }>>(
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

      if (!module || !entityType) {
        return errorResponse('Bad Request', 'module and entityType are required', 400);
      }

      try {
        const formService = new FormBuilderService(tenantPrisma);
        const form = await formService.getFormConfigByEntity(
          tenantContext.id,
          companyId,
          module,
          entityType
        );

        return successResponse({
          form: form
            ? {
                ...form,
                createdAt: form.createdAt.toISOString(),
                updatedAt: form.updatedAt.toISOString(),
              }
            : null,
        });
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Failed to get form config';
        return errorResponse('Internal Server Error', errorMessage, 500);
      }
    },
    { required: true, module: 'forms' }
  );
}









