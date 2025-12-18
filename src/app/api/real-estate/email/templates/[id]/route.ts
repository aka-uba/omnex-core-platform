import { NextRequest } from 'next/server';
import { withTenant } from '@/lib/api/withTenant';
import { successResponse, errorResponse } from '@/lib/api/errorHandler';
import type { ApiResponse } from '@/lib/api/errorHandler';
import { emailTemplateUpdateSchema } from '@/modules/real-estate/schemas/email-template.schema';
import { getTenantFromRequest } from '@/lib/api/tenantContext';

interface RouteParams {
  params: Promise<{ id: string }>;
}

// GET /api/real-estate/email/templates/[id] - Get single email template
export async function GET(request: NextRequest, { params }: RouteParams) {
  return withTenant<ApiResponse<{ template: unknown }>>(
    request,
    async (tenantPrisma) => {
      const { id } = await params;
      const tenantContext = await getTenantFromRequest(request);
      if (!tenantContext) {
        return errorResponse('Tenant context required', 'Tenant context could not be determined', 400);
      }

      const template = await tenantPrisma.emailTemplate.findFirst({
        where: {
          id,
          tenantId: tenantContext.id,
        },
      });

      if (!template) {
        return errorResponse('Template not found', `Email template with id ${id} not found`, 404);
      }

      return successResponse({
        template: {
          ...template,
          createdAt: template.createdAt.toISOString(),
          updatedAt: template.updatedAt.toISOString(),
          variables: template.variables || null,
        },
      });
    },
    { required: true, module: 'real-estate' }
  );
}

// PATCH /api/real-estate/email/templates/[id] - Update email template
export async function PATCH(request: NextRequest, { params }: RouteParams) {
  return withTenant<ApiResponse<{ template: unknown }>>(
    request,
    async (tenantPrisma) => {
      const { id } = await params;
      const tenantContext = await getTenantFromRequest(request);
      if (!tenantContext) {
        return errorResponse('Tenant context required', 'Tenant context could not be determined', 400);
      }

      const body = await request.json();
      const validatedData = emailTemplateUpdateSchema.parse(body);

      // Check if template exists
      const existingTemplate = await tenantPrisma.emailTemplate.findFirst({
        where: {
          id,
          tenantId: tenantContext.id,
        },
      });

      if (!existingTemplate) {
        return errorResponse('Template not found', `Email template with id ${id} not found`, 404);
      }

      // If this is set as default, unset other defaults
      if (validatedData.isDefault) {
        await tenantPrisma.emailTemplate.updateMany({
          where: {
            tenantId: tenantContext.id,
            companyId: existingTemplate.companyId,
            isDefault: true,
            id: { not: id },
          },
          data: { isDefault: false },
        });
      }

      // Update template
      const template = await tenantPrisma.emailTemplate.update({
        where: { id },
        data: {
          ...(validatedData.name && { name: validatedData.name }),
          ...(validatedData.category && { category: validatedData.category }),
          ...(validatedData.subject && { subject: validatedData.subject }),
          ...(validatedData.htmlContent && { htmlContent: validatedData.htmlContent }),
          ...(validatedData.textContent !== undefined && { textContent: validatedData.textContent || null }),
          ...(validatedData.variables !== undefined && { variables: validatedData.variables as any || null }),
          ...(validatedData.isDefault !== undefined && { isDefault: validatedData.isDefault }),
          ...(validatedData.isActive !== undefined && { isActive: validatedData.isActive }),
        },
      });

      return successResponse({
        template: {
          ...template,
          createdAt: template.createdAt.toISOString(),
          updatedAt: template.updatedAt.toISOString(),
          variables: template.variables || null,
        },
      });
    },
    { required: true, module: 'real-estate' }
  );
}

// DELETE /api/real-estate/email/templates/[id] - Delete email template
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  return withTenant<ApiResponse<{ success: boolean }>>(
    request,
    async (tenantPrisma) => {
      const { id } = await params;
      const tenantContext = await getTenantFromRequest(request);
      if (!tenantContext) {
        return errorResponse('Tenant context required', 'Tenant context could not be determined', 400);
      }

      // Check if template exists
      const existingTemplate = await tenantPrisma.emailTemplate.findFirst({
        where: {
          id,
          tenantId: tenantContext.id,
        },
      });

      if (!existingTemplate) {
        return errorResponse('Template not found', `Email template with id ${id} not found`, 404);
      }

      // Check if template is used in campaigns
      const campaignCount = await tenantPrisma.emailCampaign.count({
        where: {
          templateId: id,
          tenantId: tenantContext.id,
        },
      });

      if (campaignCount > 0) {
        return errorResponse(
          'Template in use',
          `Cannot delete template. It is used in ${campaignCount} campaign(s).`,
          400
        );
      }

      // Delete template
      await tenantPrisma.emailTemplate.delete({
        where: { id },
      });

      return successResponse({ success: true });
    },
    { required: true, module: 'real-estate' }
  );
}








