import { NextRequest } from 'next/server';
import { withTenant } from '@/lib/api/withTenant';
import { successResponse, errorResponse } from '@/lib/api/errorHandler';
import type { ApiResponse } from '@/lib/api/errorHandler';
import { bomItemUpdateSchema } from '@/modules/production/schemas/product.schema';
import { getTenantFromRequest } from '@/lib/api/tenantContext';

interface RouteParams {
  params: Promise<{
    id: string;
  }>;
}

// GET /api/production/bom/[id] - Get BOM item by ID
export async function GET(request: NextRequest, { params }: RouteParams) {
  return withTenant<ApiResponse<{ bomItem: unknown }>>(
    request,
    async (tenantPrisma) => {
      const { id } = await params;

      // Get tenant context
      const tenantContext = await getTenantFromRequest(request);
      if (!tenantContext) {
        return errorResponse('Tenant context required', 'Tenant context could not be determined', 400);
      }

      // Get BOM item
      const bomItem = await tenantPrisma.bOMItem.findFirst({
        where: {
          id,
          tenantId: tenantContext.id,
        },
        include: {
          product: {
            select: {
              id: true,
              name: true,
              code: true,
              unit: true,
            },
          },
          component: {
            select: {
              id: true,
              name: true,
              code: true,
              unit: true,
            },
          },
        },
      });

      if (!bomItem) {
        return errorResponse('Not found', 'BOM item not found', 404);
      }

      return successResponse({
        bomItem: {
          ...bomItem,
          quantity: Number(bomItem.quantity),
          wasteRate: Number(bomItem.wasteRate),
        },
      });
    },
    { required: true, module: 'production' }
  );
}

// PATCH /api/production/bom/[id] - Update BOM item
export async function PATCH(request: NextRequest, { params }: RouteParams) {
  return withTenant<ApiResponse<{ bomItem: unknown }>>(
    request,
    async (tenantPrisma) => {
      const { id } = await params;
      const body = await request.json();

      // Validate request body
      const validatedData = bomItemUpdateSchema.parse(body);

      // Get tenant context
      const tenantContext = await getTenantFromRequest(request);
      if (!tenantContext) {
        return errorResponse('Tenant context required', 'Tenant context could not be determined', 400);
      }

      // Check if BOM item exists
      const existing = await tenantPrisma.bOMItem.findFirst({
        where: {
          id,
          tenantId: tenantContext.id,
        },
      });

      if (!existing) {
        return errorResponse('Not found', 'BOM item not found', 404);
      }

      // Update BOM item
      const bomItem = await tenantPrisma.bOMItem.update({
        where: { id },
        data: {
          ...(validatedData.bomId && { bomId: validatedData.bomId }),
          ...(validatedData.productId && { productId: validatedData.productId }),
          ...(validatedData.componentId !== undefined && { componentId: validatedData.componentId || null }),
          ...(validatedData.quantity !== undefined && { quantity: validatedData.quantity }),
          ...(validatedData.unit && { unit: validatedData.unit }),
          ...(validatedData.wasteRate !== undefined && { wasteRate: validatedData.wasteRate }),
          ...(validatedData.order !== undefined && { order: validatedData.order }),
        },
        include: {
          product: {
            select: {
              id: true,
              name: true,
              code: true,
              unit: true,
            },
          },
          component: {
            select: {
              id: true,
              name: true,
              code: true,
              unit: true,
            },
          },
        },
      });

      return successResponse({
        bomItem: {
          ...bomItem,
          quantity: Number(bomItem.quantity),
          wasteRate: Number(bomItem.wasteRate),
        },
      });
    },
    { required: true, module: 'production' }
  );
}

// DELETE /api/production/bom/[id] - Delete BOM item
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

      // Check if BOM item exists
      const existing = await tenantPrisma.bOMItem.findFirst({
        where: {
          id,
          tenantId: tenantContext.id,
        },
      });

      if (!existing) {
        return errorResponse('Not found', 'BOM item not found', 404);
      }

      // Delete BOM item
      await tenantPrisma.bOMItem.delete({
        where: { id },
      });

      return successResponse({ success: true });
    },
    { required: true, module: 'production' }
  );
}








