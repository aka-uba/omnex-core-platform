import { NextRequest } from 'next/server';
import { withTenant } from '@/lib/api/withTenant';
import { successResponse, errorResponse } from '@/lib/api/errorHandler';
import type { ApiResponse } from '@/lib/api/errorHandler';
import { contractTemplateUpdateSchema } from '@/modules/real-estate/schemas/contract-template.schema';
import { getTenantFromRequest } from '@/lib/api/tenantContext';
import { getAuditContext, logUpdate, logDelete } from '@/lib/api/auditHelper';

// GET /api/real-estate/contract-templates/[id] - Get single contract template
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

      // Find template
      const template = await tenantPrisma.contractTemplate.findFirst({
        where: {
          id,
          tenantId: tenantContext.id,
        },
        include: {
          _count: {
            select: {
              contracts: true,
            },
          },
        },
      });

      if (!template) {
        return errorResponse('Template not found', `Contract template with ID ${id} not found`, 404);
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

// PATCH /api/real-estate/contract-templates/[id] - Update contract template
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return withTenant<ApiResponse<{ template: unknown }>>(
    request,
    async (tenantPrisma) => {
      const { id } = await params;
      const body = await request.json();

      // Validate request body
      const validationResult = contractTemplateUpdateSchema.safeParse(body);
      if (!validationResult.success) {
        return errorResponse(
          'Validation error',
          validationResult.error.issues.map((e: any) => `${e.path.join('.')}: ${e.message}`).join(', '),
          400
        );
      }

      const data = validationResult.data;

      // Get tenant context
      const tenantContext = await getTenantFromRequest(request);
      if (!tenantContext) {
        return errorResponse('Tenant context required', 'Tenant context could not be determined', 400);
      }

      // Get audit context
      const auditContext = await getAuditContext(request);

      // Find template
      const existingTemplate = await (tenantPrisma as any).contractTemplate.findFirst({
        where: {
          id,
          tenantId: tenantContext.id,
        },
      });

      if (!existingTemplate) {
        return errorResponse('Template not found', `Contract template with ID ${id} not found`, 404);
      }

      // Check if default template exists and unset others if this is default
      if (data.isDefault) {
        await tenantPrisma.contractTemplate.updateMany({
          where: {
            tenantId: tenantContext.id,
            companyId: existingTemplate.companyId,
            isDefault: true,
            id: { not: id },
          },
          data: {
            isDefault: false,
          },
        });
      }

      // Update template
      const updateData: any = {};
      if (data.name) updateData.name = data.name;
      if (data.description !== undefined) updateData.description = data.description || null;
      if (data.type) updateData.type = data.type;
      if (data.category !== undefined) updateData.category = data.category || null;
      if (data.content) updateData.content = data.content;
      if (data.variables !== undefined) updateData.variables = data.variables ? (data.variables as any) : null;
      if (data.isDefault !== undefined) updateData.isDefault = data.isDefault;
      if (data.isActive !== undefined) updateData.isActive = data.isActive;

      const template = await tenantPrisma.contractTemplate.update({
        where: { id },
        data: updateData,
      });

      // Log audit
      logUpdate(tenantContext, auditContext, 'ContractTemplate', id, existingTemplate, template, existingTemplate.companyId);

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

// DELETE /api/real-estate/contract-templates/[id] - Delete contract template
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return withTenant<ApiResponse<void>>(
    request,
    async (tenantPrisma) => {
      const { id } = await params;

      // Get tenant context
      const tenantContext = await getTenantFromRequest(request);
      if (!tenantContext) {
        return errorResponse('Tenant context required', 'Tenant context could not be determined', 400);
      }

      // Get audit context
      const auditContext = await getAuditContext(request);

      // Find template
      const template = await tenantPrisma.contractTemplate.findFirst({
        where: {
          id,
          tenantId: tenantContext.id,
        },
        include: {
          _count: {
            select: {
              contracts: true,
            },
          },
        },
      });

      if (!template) {
        return errorResponse('Template not found', `Contract template with ID ${id} not found`, 404);
      }

      // Check if template is used in contracts
      if (template._count.contracts > 0) {
        return errorResponse(
          'Template in use',
          `Cannot delete template that is used in ${template._count.contracts} contract(s)`,
          400
        );
      }

      // Delete template
      await tenantPrisma.contractTemplate.delete({
        where: { id },
      });

      // Log audit
      logDelete(tenantContext, auditContext, 'ContractTemplate', id, template.companyId ?? undefined, {
        name: template.name,
        type: template.type,
      });

      return successResponse(undefined);
    },
    { required: true, module: 'real-estate' }
  );
}

