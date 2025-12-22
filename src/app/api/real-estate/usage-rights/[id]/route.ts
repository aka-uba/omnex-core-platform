import { NextRequest } from 'next/server';
import { withTenant } from '@/lib/api/withTenant';
import { successResponse, errorResponse } from '@/lib/api/errorHandler';
import type { ApiResponse } from '@/lib/api/errorHandler';
import { getTenantFromRequest } from '@/lib/api/tenantContext';
import { z } from 'zod';

// Schema for updating usage rights
const usageRightUpdateSchema = z.object({
  name: z.string().min(1, 'Name is required').optional(),
  nameEn: z.string().optional().nullable(),
  nameTr: z.string().optional().nullable(),
  category: z.string().min(1, 'Category is required').optional(),
  sortOrder: z.number().int().optional(),
  icon: z.string().optional().nullable(),
  description: z.string().optional().nullable(),
  descriptionEn: z.string().optional().nullable(),
  descriptionTr: z.string().optional().nullable(),
  isDefaultActive: z.boolean().optional(),
  isActive: z.boolean().optional(),
});

// GET /api/real-estate/usage-rights/[id] - Get single usage right
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return withTenant<ApiResponse<{ usageRight: unknown }>>(
    request,
    async (tenantPrisma) => {
      const { id } = await params;

      // Get tenant context
      const tenantContext = await getTenantFromRequest(request);
      if (!tenantContext) {
        return errorResponse('Tenant context required', 'Tenant context could not be determined', 400);
      }

      // Get usage right
      const usageRight = await tenantPrisma.usageRight.findFirst({
        where: {
          id,
          tenantId: tenantContext.id,
        },
      });

      if (!usageRight) {
        return errorResponse('Not found', 'Usage right not found', 404);
      }

      return successResponse({
        usageRight: {
          ...usageRight,
          createdAt: usageRight.createdAt.toISOString(),
          updatedAt: usageRight.updatedAt.toISOString(),
        },
      });
    },
    { required: true, module: 'real-estate' }
  );
}

// PATCH /api/real-estate/usage-rights/[id] - Update usage right
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return withTenant<ApiResponse<{ usageRight: unknown }>>(
    request,
    async (tenantPrisma) => {
      const { id } = await params;
      const body = await request.json();

      // Validate request body
      const validatedData = usageRightUpdateSchema.parse(body);

      // Get tenant context
      const tenantContext = await getTenantFromRequest(request);
      if (!tenantContext) {
        return errorResponse('Tenant context required', 'Tenant context could not be determined', 400);
      }

      // Check if usage right exists
      const existingUsageRight = await tenantPrisma.usageRight.findFirst({
        where: {
          id,
          tenantId: tenantContext.id,
        },
      });

      if (!existingUsageRight) {
        return errorResponse('Not found', 'Usage right not found', 404);
      }

      // If name is being changed, check uniqueness
      if (validatedData.name && validatedData.name !== existingUsageRight.name) {
        const duplicateCheck = await tenantPrisma.usageRight.findFirst({
          where: {
            tenantId: tenantContext.id,
            name: validatedData.name,
            id: { not: id },
          },
        });

        if (duplicateCheck) {
          return errorResponse('Validation error', 'Usage right with this name already exists', 409);
        }
      }

      // Update usage right
      const updatedUsageRight = await tenantPrisma.usageRight.update({
        where: { id },
        data: {
          ...(validatedData.name !== undefined && { name: validatedData.name }),
          ...(validatedData.nameEn !== undefined && { nameEn: validatedData.nameEn }),
          ...(validatedData.nameTr !== undefined && { nameTr: validatedData.nameTr }),
          ...(validatedData.category !== undefined && { category: validatedData.category }),
          ...(validatedData.sortOrder !== undefined && { sortOrder: validatedData.sortOrder }),
          ...(validatedData.icon !== undefined && { icon: validatedData.icon }),
          ...(validatedData.description !== undefined && { description: validatedData.description }),
          ...(validatedData.descriptionEn !== undefined && { descriptionEn: validatedData.descriptionEn }),
          ...(validatedData.descriptionTr !== undefined && { descriptionTr: validatedData.descriptionTr }),
          ...(validatedData.isDefaultActive !== undefined && { isDefaultActive: validatedData.isDefaultActive }),
          ...(validatedData.isActive !== undefined && { isActive: validatedData.isActive }),
        },
      });

      return successResponse({
        usageRight: {
          ...updatedUsageRight,
          createdAt: updatedUsageRight.createdAt.toISOString(),
          updatedAt: updatedUsageRight.updatedAt.toISOString(),
        },
      });
    },
    { required: true, module: 'real-estate' }
  );
}

// DELETE /api/real-estate/usage-rights/[id] - Delete usage right
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

      // Check if usage right exists
      const existingUsageRight = await tenantPrisma.usageRight.findFirst({
        where: {
          id,
          tenantId: tenantContext.id,
        },
      });

      if (!existingUsageRight) {
        return errorResponse('Not found', 'Usage right not found', 404);
      }

      // Delete usage right
      await tenantPrisma.usageRight.delete({
        where: { id },
      });

      return successResponse({
        success: true,
      });
    },
    { required: true, module: 'real-estate' }
  );
}
