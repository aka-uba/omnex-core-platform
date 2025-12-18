import { NextRequest } from 'next/server';
import { withTenant } from '@/lib/api/withTenant';
import { successResponse, errorResponse } from '@/lib/api/errorHandler';
import type { ApiResponse } from '@/lib/api/errorHandler';
import { getTenantFromRequest } from '@/lib/api/tenantContext';
import { agreementReportTemplateUpdateSchema } from '@/modules/real-estate/schemas/agreement-report-template.schema';
import { z } from 'zod';

// GET /api/real-estate/agreement-report-templates/[id] - Get single template
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return withTenant<ApiResponse<{ template: unknown }>>(
    request,
    async (tenantPrisma) => {
      const { id } = await params;

      // Get tenant context
      const tenantContext = await getTenantFromRequest(request);
      if (!tenantContext) {
        return errorResponse('Tenant context required', 'Tenant context could not be determined', 400);
      }

      // Get template
      const template = await tenantPrisma.agreementReportTemplate.findUnique({
        where: { id },
      });

      if (!template) {
        return errorResponse('Template not found', 'Agreement report template not found', 404);
      }

      // Check tenant access
      if (template.tenantId !== tenantContext.id) {
        return errorResponse('Forbidden', 'Access denied', 403);
      }

      return successResponse({ template });
    }
  );
}

// PATCH /api/real-estate/agreement-report-templates/[id] - Update template
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return withTenant<ApiResponse<{ template: unknown }>>(
    request,
    async (tenantPrisma) => {
      try {
        const { id } = await params;
        const body = await request.json();

        // Get tenant context
        const tenantContext = await getTenantFromRequest(request);
        if (!tenantContext) {
          return errorResponse('Tenant context required', 'Tenant context could not be determined', 400);
        }

        // Get existing template
        const existing = await tenantPrisma.agreementReportTemplate.findUnique({
          where: { id },
        });

        if (!existing) {
          return errorResponse('Template not found', 'Agreement report template not found', 404);
        }

        // Check tenant access
        if (existing.tenantId !== tenantContext.id) {
          return errorResponse('Forbidden', 'Access denied', 403);
        }

        // Validate input
        const validatedData = agreementReportTemplateUpdateSchema.parse(body);

        // If this is set as default, unset other defaults
        if (validatedData.isDefault) {
          await tenantPrisma.agreementReportTemplate.updateMany({
            where: {
              tenantId: tenantContext.id,
              companyId: existing.companyId,
              isDefault: true,
              id: { not: id },
            },
            data: { isDefault: false },
          });
        }

        // Update template
        const template = await tenantPrisma.agreementReportTemplate.update({
          where: { id },
          data: {
            ...(validatedData.name && { name: validatedData.name }),
            ...(validatedData.category && { category: validatedData.category }),
            ...(validatedData.description !== undefined && { description: validatedData.description || null }),
            ...(validatedData.htmlContent && { htmlContent: validatedData.htmlContent }),
            ...(validatedData.textContent !== undefined && { textContent: validatedData.textContent || null }),
            ...(validatedData.variables !== undefined && { variables: validatedData.variables as any || null }),
            ...(validatedData.isDefault !== undefined && { isDefault: validatedData.isDefault }),
            ...(validatedData.isActive !== undefined && { isActive: validatedData.isActive }),
          },
        });

        return successResponse({ template });
      } catch (error) {
        if (error instanceof z.ZodError) {
          const firstError = error.issues[0];
          return errorResponse('Validation error', firstError?.message || 'Invalid input', 400);
        }
        console.error('Error updating agreement report template:', error);
        return errorResponse(
          'Failed to update agreement report template',
          error instanceof Error ? error.message : 'Unknown error',
          500
        );
      }
    }
  );
}

// DELETE /api/real-estate/agreement-report-templates/[id] - Delete template
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return withTenant<ApiResponse<{ success: boolean }>>(
    request,
    async (tenantPrisma) => {
      const { id } = await params;

      // Get tenant context
      const tenantContext = await getTenantFromRequest(request);
      if (!tenantContext) {
        return errorResponse('Tenant context required', 'Tenant context could not be determined', 400);
      }

      // Get existing template
      const existing = await tenantPrisma.agreementReportTemplate.findUnique({
        where: { id },
      });

      if (!existing) {
        return errorResponse('Template not found', 'Agreement report template not found', 404);
      }

      // Check tenant access
      if (existing.tenantId !== tenantContext.id) {
        return errorResponse('Forbidden', 'Access denied', 403);
      }

      // Delete template
      await tenantPrisma.agreementReportTemplate.delete({
        where: { id },
      });

      return successResponse({ success: true });
    }
  );
}








