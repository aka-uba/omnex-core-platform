import { NextRequest } from 'next/server';
import { withTenant } from '@/lib/api/withTenant';
import { successResponse, errorResponse } from '@/lib/api/errorHandler';
import type { ApiResponse } from '@/lib/api/errorHandler';
import { equipmentUpdateSchema } from '@/lib/schemas/equipment';
import { getTenantFromRequest } from '@/lib/api/tenantContext';
interface RouteParams {
  params: Promise<{
    id: string;
  }>;
}

// GET /api/equipment/[id] - Get equipment by ID
export async function GET(request: NextRequest, { params }: RouteParams) {
  return withTenant<ApiResponse<{ equipment: unknown }>>(
    request,
    async (tenantPrisma) => {
      const { id } = await params;

      const equipment = await tenantPrisma.equipment.findUnique({
        where: { id },
        include: {
          location: {
            select: {
              id: true,
              name: true,
              type: true,
              code: true,
            },
          },
        },
      });

      if (!equipment) {
        return errorResponse('Not found', 'Equipment not found', 404);
      }

      return successResponse({
        equipment: {
          ...equipment,
          createdAt: equipment.createdAt.toISOString(),
          updatedAt: equipment.updatedAt.toISOString(),
          purchaseDate: equipment.purchaseDate?.toISOString() || null,
          warrantyUntil: equipment.warrantyUntil?.toISOString() || null,
          attributes: equipment.attributes || {},
        },
      });
    },
    { required: true, module: 'equipment' }
  );
}

// PATCH /api/equipment/[id] - Update equipment
export async function PATCH(request: NextRequest, { params }: RouteParams) {
  return withTenant<ApiResponse<{ equipment: unknown }>>(
    request,
    async (tenantPrisma) => {
      const { id } = await params;
      const body = await request.json();

      // Validate request body
      const validatedData = equipmentUpdateSchema.parse(body);

      // Get tenant context
      const tenantContext = await getTenantFromRequest(request);
      if (!tenantContext) {
        return errorResponse('Tenant context required', 'Tenant context could not be determined', 400);
      }

      // Get companyId from first company
      const firstCompany = await tenantPrisma.company.findFirst({
        select: { id: true },
        orderBy: { createdAt: 'asc' },
      });

      if (!firstCompany) {
        return errorResponse('Validation error', 'No company found for tenant', 404);
      }

      // Check if equipment exists
      const existingEquipment = await tenantPrisma.equipment.findUnique({
        where: { id },
      });

      if (!existingEquipment) {
        return errorResponse('Not found', 'Equipment not found', 404);
      }

      // Ensure equipment belongs to same company
      if (existingEquipment.companyId !== firstCompany.id) {
        return errorResponse('Forbidden', 'Equipment belongs to different company', 403);
      }

      // Check if location exists (if provided and different)
      if (validatedData.locationId !== undefined && validatedData.locationId !== existingEquipment.locationId) {
        if (validatedData.locationId) {
          const location = await tenantPrisma.location.findUnique({
            where: { id: validatedData.locationId },
          });

          if (!location) {
            return errorResponse('Validation error', 'Location not found', 404);
          }

          // Ensure location belongs to same company
          if (location.companyId !== firstCompany.id) {
            return errorResponse('Validation error', 'Location belongs to different company', 403);
          }
        }
      }

      // Prepare update data
      const updateData: any = {};
      if (validatedData.name) updateData.name = validatedData.name;
      if (validatedData.code !== undefined) updateData.code = validatedData.code || null;
      if (validatedData.category) updateData.category = validatedData.category;
      if (validatedData.type) updateData.type = validatedData.type;
      if (validatedData.brand !== undefined) updateData.brand = validatedData.brand || null;
      if (validatedData.model !== undefined) updateData.model = validatedData.model || null;
      if (validatedData.serialNumber !== undefined) updateData.serialNumber = validatedData.serialNumber || null;
      if (validatedData.locationId !== undefined) updateData.locationId = validatedData.locationId || null;
      // TODO: Fix attributes type issue
      // if (validatedData.attributes !== undefined) {
      //   updateData.attributes = validatedData.attributes ? (validatedData.attributes as Prisma.InputJsonValue) : Prisma.JsonNull;
      // }
      if (validatedData.status) updateData.status = validatedData.status;
      if (validatedData.description !== undefined) updateData.description = validatedData.description || null;
      if (validatedData.purchaseDate !== undefined) {
        updateData.purchaseDate = validatedData.purchaseDate ? new Date(validatedData.purchaseDate as string) : null;
      }
      if (validatedData.warrantyUntil !== undefined) {
        updateData.warrantyUntil = validatedData.warrantyUntil ? new Date(validatedData.warrantyUntil as string) : null;
      }
      if (validatedData.isActive !== undefined) updateData.isActive = validatedData.isActive;

      // Update equipment
      const updatedEquipment = await tenantPrisma.equipment.update({
        where: { id },
        data: updateData as any,
        include: {
          location: {
            select: {
              id: true,
              name: true,
              type: true,
              code: true,
            },
          },
        },
      });

      return successResponse({
        equipment: {
          ...updatedEquipment,
          createdAt: updatedEquipment.createdAt.toISOString(),
          updatedAt: updatedEquipment.updatedAt.toISOString(),
          purchaseDate: updatedEquipment.purchaseDate?.toISOString() || null,
          warrantyUntil: updatedEquipment.warrantyUntil?.toISOString() || null,
          attributes: updatedEquipment.attributes || {},
        },
      });
    },
    { required: true, module: 'equipment' }
  );
}

// DELETE /api/equipment/[id] - Delete equipment
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

      // Get companyId from first company
      const firstCompany = await tenantPrisma.company.findFirst({
        select: { id: true },
        orderBy: { createdAt: 'asc' },
      });

      if (!firstCompany) {
        return errorResponse('Validation error', 'No company found for tenant', 404);
      }

      // Check if equipment exists
      const existingEquipment = await tenantPrisma.equipment.findUnique({
        where: { id },
        include: {
          _count: {
            select: {
              maintenanceRecords: true,
            },
          },
        },
      });

      if (!existingEquipment) {
        return errorResponse('Not found', 'Equipment not found', 404);
      }

      // Ensure equipment belongs to same company
      if (existingEquipment.companyId !== firstCompany.id) {
        return errorResponse('Forbidden', 'Equipment belongs to different company', 403);
      }

      // Check if equipment has maintenance records
      if (existingEquipment._count.maintenanceRecords > 0) {
        return errorResponse('Validation error', 'Cannot delete equipment with maintenance records', 400);
      }

      // Delete equipment
      await tenantPrisma.equipment.delete({
        where: { id },
      });

      return successResponse({
        message: 'Equipment deleted successfully',
      });
    },
    { required: true, module: 'equipment' }
  );
}

