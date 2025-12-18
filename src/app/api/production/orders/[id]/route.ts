import { NextRequest } from 'next/server';
import { withTenant } from '@/lib/api/withTenant';
import { successResponse, errorResponse } from '@/lib/api/errorHandler';
import type { ApiResponse } from '@/lib/api/errorHandler';
import { productionOrderUpdateSchema } from '@/modules/production/schemas/product.schema';
import { getTenantFromRequest } from '@/lib/api/tenantContext';

interface RouteParams {
  params: Promise<{
    id: string;
  }>;
}

// GET /api/production/orders/[id] - Get production order by ID
export async function GET(request: NextRequest, { params }: RouteParams) {
  return withTenant<ApiResponse<{ order: unknown }>>(
    request,
    async (tenantPrisma) => {
      const { id } = await params;

      // Get tenant context
      const tenantContext = await getTenantFromRequest(request);
      if (!tenantContext) {
        return errorResponse('Tenant context required', 'Tenant context could not be determined', 400);
      }

      // Get production order
      const order = await tenantPrisma.productionOrder.findFirst({
        where: {
          id,
          tenantId: tenantContext.id,
        },
        include: {
          location: {
            select: {
              id: true,
              name: true,
            },
          },
          product: {
            select: {
              id: true,
              name: true,
              code: true,
              unit: true,
            },
          },
          productionSteps: {
            orderBy: { stepNumber: 'asc' },
            include: {
              order: {
                select: {
                  id: true,
                  orderNumber: true,
                },
              },
            },
          },
        },
      });

      if (!order) {
        return errorResponse('Not found', 'Production order not found', 404);
      }

      return successResponse({
        order: {
          ...order,
          quantity: Number(order.quantity),
          estimatedCost: order.estimatedCost ? Number(order.estimatedCost) : null,
          actualCost: order.actualCost ? Number(order.actualCost) : null,
          plannedStartDate: order.plannedStartDate?.toISOString() || null,
          plannedEndDate: order.plannedEndDate?.toISOString() || null,
          actualStartDate: order.actualStartDate?.toISOString() || null,
          actualEndDate: order.actualEndDate?.toISOString() || null,
          createdAt: order.createdAt.toISOString(),
          updatedAt: order.updatedAt.toISOString(),
        },
      });
    },
    { required: true, module: 'production' }
  );
}

// PATCH /api/production/orders/[id] - Update production order
export async function PATCH(request: NextRequest, { params }: RouteParams) {
  return withTenant<ApiResponse<{ order: unknown }>>(
    request,
    async (tenantPrisma) => {
      const { id } = await params;
      const body = await request.json();

      // Validate request body
      const validatedData = productionOrderUpdateSchema.parse(body);

      // Get tenant context
      const tenantContext = await getTenantFromRequest(request);
      if (!tenantContext) {
        return errorResponse('Tenant context required', 'Tenant context could not be determined', 400);
      }

      // Check if order exists
      const existingOrder = await tenantPrisma.productionOrder.findFirst({
        where: {
          id,
          tenantId: tenantContext.id,
        },
      });

      if (!existingOrder) {
        return errorResponse('Not found', 'Production order not found', 404);
      }

      // Update production order
      const updatedOrder = await tenantPrisma.productionOrder.update({
        where: { id },
        data: {
          ...(validatedData.locationId && { locationId: validatedData.locationId }),
          ...(validatedData.productId && { productId: validatedData.productId }),
          ...(validatedData.quantity !== undefined && { quantity: validatedData.quantity }),
          ...(validatedData.unit && { unit: validatedData.unit }),
          ...(validatedData.status && { status: validatedData.status }),
          ...(validatedData.plannedStartDate !== undefined && { 
            plannedStartDate: validatedData.plannedStartDate ? new Date(validatedData.plannedStartDate) : null 
          }),
          ...(validatedData.plannedEndDate !== undefined && { 
            plannedEndDate: validatedData.plannedEndDate ? new Date(validatedData.plannedEndDate) : null 
          }),
          ...(validatedData.actualStartDate !== undefined && { 
            actualStartDate: validatedData.actualStartDate ? new Date(validatedData.actualStartDate) : null 
          }),
          ...(validatedData.actualEndDate !== undefined && { 
            actualEndDate: validatedData.actualEndDate ? new Date(validatedData.actualEndDate) : null 
          }),
          ...(validatedData.estimatedCost !== undefined && { estimatedCost: validatedData.estimatedCost }),
          ...(validatedData.actualCost !== undefined && { actualCost: validatedData.actualCost }),
          ...(validatedData.notes !== undefined && { notes: validatedData.notes }),
          ...(validatedData.priority && { priority: validatedData.priority }),
          ...(validatedData.isActive !== undefined && { isActive: validatedData.isActive }),
        },
        include: {
          location: {
            select: {
              id: true,
              name: true,
            },
          },
          product: {
            select: {
              id: true,
              name: true,
              code: true,
              unit: true,
            },
          },
          productionSteps: {
            orderBy: { stepNumber: 'asc' },
          },
        },
      });

      return successResponse({
        order: {
          ...updatedOrder,
          quantity: Number(updatedOrder.quantity),
          estimatedCost: updatedOrder.estimatedCost ? Number(updatedOrder.estimatedCost) : null,
          actualCost: updatedOrder.actualCost ? Number(updatedOrder.actualCost) : null,
          plannedStartDate: updatedOrder.plannedStartDate?.toISOString() || null,
          plannedEndDate: updatedOrder.plannedEndDate?.toISOString() || null,
          actualStartDate: updatedOrder.actualStartDate?.toISOString() || null,
          actualEndDate: updatedOrder.actualEndDate?.toISOString() || null,
          createdAt: updatedOrder.createdAt.toISOString(),
          updatedAt: updatedOrder.updatedAt.toISOString(),
        },
      });
    },
    { required: true, module: 'production' }
  );
}

// DELETE /api/production/orders/[id] - Delete production order
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  return withTenant<ApiResponse<{ message: string }>>(
    request,
    async (tenantPrisma) => {
      const { id } = await params;

      // Get tenant context
      const tenantContext = await getTenantFromRequest(request);
      if (!tenantContext) {
        return errorResponse('Tenant context required', 'Tenant context could not be determined', 400);
      }

      // Check if order exists
      const existingOrder = await tenantPrisma.productionOrder.findFirst({
        where: {
          id,
          tenantId: tenantContext.id,
        },
      });

      if (!existingOrder) {
        return errorResponse('Not found', 'Production order not found', 404);
      }

      // Check if order is in progress or completed
      if (existingOrder.status === 'in_progress' || existingOrder.status === 'completed') {
        // Soft delete instead
        await tenantPrisma.productionOrder.update({
          where: { id },
          data: { isActive: false },
        });
        return successResponse({ message: 'Production order deactivated (cannot delete in progress or completed orders)' });
      }

      // Hard delete
      await tenantPrisma.productionOrder.delete({
        where: { id },
      });

      return successResponse({ message: 'Production order deleted successfully' });
    },
    { required: true, module: 'production' }
  );
}

