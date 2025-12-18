import { NextRequest } from 'next/server';
import { withTenant } from '@/lib/api/withTenant';
import { successResponse, errorResponse } from '@/lib/api/errorHandler';
import type { ApiResponse } from '@/lib/api/errorHandler';
import { productionStepSchema } from '@/modules/production/schemas/product.schema';
import { getTenantFromRequest } from '@/lib/api/tenantContext';

interface RouteParams {
  params: Promise<{
    id: string;
  }>;
}

// GET /api/production/steps/[id] - Get production step by ID
export async function GET(request: NextRequest, { params }: RouteParams) {
  return withTenant<ApiResponse<{ step: unknown }>>(
    request,
    async (tenantPrisma) => {
      const { id } = await params;

      // Get tenant context
      const tenantContext = await getTenantFromRequest(request);
      if (!tenantContext) {
        return errorResponse('Tenant context required', 'Tenant context could not be determined', 400);
      }

      // Get production step
      const step = await tenantPrisma.productionStep.findFirst({
        where: {
          id,
          tenantId: tenantContext.id,
        },
        include: {
          order: {
            select: {
              id: true,
              orderNumber: true,
              product: {
                select: {
                  id: true,
                  name: true,
                  code: true,
                },
              },
            },
          },
        },
      });

      if (!step) {
        return errorResponse('Not found', 'Production step not found', 404);
      }

      return successResponse({
        step: {
          ...step,
          laborHours: step.laborHours ? Number(step.laborHours) : null,
          plannedStart: step.plannedStart?.toISOString() || null,
          plannedEnd: step.plannedEnd?.toISOString() || null,
          actualStart: step.actualStart?.toISOString() || null,
          actualEnd: step.actualEnd?.toISOString() || null,
          createdAt: step.createdAt.toISOString(),
          updatedAt: step.updatedAt.toISOString(),
        },
      });
    },
    { required: true, module: 'production' }
  );
}

// PATCH /api/production/steps/[id] - Update production step
export async function PATCH(request: NextRequest, { params }: RouteParams) {
  return withTenant<ApiResponse<{ step: unknown }>>(
    request,
    async (tenantPrisma) => {
      const { id } = await params;
      const body = await request.json();

      // Validate request body (partial update)
      const validatedData = productionStepSchema.partial().parse(body);

      // Get tenant context
      const tenantContext = await getTenantFromRequest(request);
      if (!tenantContext) {
        return errorResponse('Tenant context required', 'Tenant context could not be determined', 400);
      }

      // Check if step exists
      const existing = await tenantPrisma.productionStep.findFirst({
        where: {
          id,
          tenantId: tenantContext.id,
        },
      });

      if (!existing) {
        return errorResponse('Not found', 'Production step not found', 404);
      }

      // Update production step
      const step = await tenantPrisma.productionStep.update({
        where: { id },
        data: {
          ...(validatedData.stepNumber !== undefined && { stepNumber: validatedData.stepNumber }),
          ...(validatedData.name && { name: validatedData.name }),
          ...(validatedData.description !== undefined && { description: validatedData.description || null }),
          ...(validatedData.status && { status: validatedData.status }),
          ...(validatedData.plannedStart !== undefined && { plannedStart: validatedData.plannedStart ? new Date(validatedData.plannedStart) : null }),
          ...(validatedData.plannedEnd !== undefined && { plannedEnd: validatedData.plannedEnd ? new Date(validatedData.plannedEnd) : null }),
          ...(validatedData.assignedTo !== undefined && { assignedTo: validatedData.assignedTo || null }),
          ...(validatedData.laborHours !== undefined && { laborHours: validatedData.laborHours || null }),
          ...(validatedData.notes !== undefined && { notes: validatedData.notes || null }),
          ...(validatedData.actualStart !== undefined && { actualStart: validatedData.actualStart ? new Date(validatedData.actualStart) : null }),
          ...(validatedData.actualEnd !== undefined && { actualEnd: validatedData.actualEnd ? new Date(validatedData.actualEnd) : null }),
        },
        include: {
          order: {
            select: {
              id: true,
              orderNumber: true,
              product: {
                select: {
                  id: true,
                  name: true,
                  code: true,
                },
              },
            },
          },
        },
      });

      return successResponse({
        step: {
          ...step,
          laborHours: step.laborHours ? Number(step.laborHours) : null,
          plannedStart: step.plannedStart?.toISOString() || null,
          plannedEnd: step.plannedEnd?.toISOString() || null,
          actualStart: step.actualStart?.toISOString() || null,
          actualEnd: step.actualEnd?.toISOString() || null,
          createdAt: step.createdAt.toISOString(),
          updatedAt: step.updatedAt.toISOString(),
        },
      });
    },
    { required: true, module: 'production' }
  );
}

// DELETE /api/production/steps/[id] - Delete production step
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  return withTenant<ApiResponse<{ success: boolean }>>(
    request,
    async (tenantPrisma) => {
      const { id } = await params;

      // Get tenant context
      const tenantContext = await getTenantFromRequest(request);
      if (!tenantContext) {
        return errorResponse('Tenant context required', 'Tenant context could not be determined', 400);
      }

      // Check if step exists
      const existing = await tenantPrisma.productionStep.findFirst({
        where: {
          id,
          tenantId: tenantContext.id,
        },
      });

      if (!existing) {
        return errorResponse('Not found', 'Production step not found', 404);
      }

      // Delete production step
      await tenantPrisma.productionStep.delete({
        where: { id },
      });

      return successResponse({ success: true });
    },
    { required: true, module: 'production' }
  );
}








