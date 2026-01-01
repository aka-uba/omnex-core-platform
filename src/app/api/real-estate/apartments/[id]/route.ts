import { NextRequest } from 'next/server';
import { withTenant } from '@/lib/api/withTenant';
import { successResponse, errorResponse } from '@/lib/api/errorHandler';
import type { ApiResponse } from '@/lib/api/errorHandler';
import { apartmentUpdateSchema } from '@/modules/real-estate/schemas/apartment.schema';
import { getTenantFromRequest } from '@/lib/api/tenantContext';
import { Prisma } from '@prisma/tenant-client';
import { getAuditContext, logUpdate, logDelete } from '@/lib/api/auditHelper';

interface RouteParams {
  params: Promise<{
    id: string;
  }>;
}

// GET /api/real-estate/apartments/[id] - Get apartment by ID
export async function GET(request: NextRequest, { params }: RouteParams) {
  return withTenant<ApiResponse<{ apartment: unknown }>>(
    request,
    async (tenantPrisma) => {
      const { id } = await params;

      // Get tenant context
      const tenantContext = await getTenantFromRequest(request);
      if (!tenantContext) {
        return errorResponse('Tenant context required', 'Tenant context could not be determined', 400);
      }

      const apartment = await tenantPrisma.apartment.findUnique({
        where: { id },
        include: {
          property: {
            select: {
              id: true,
              name: true,
              type: true,
              address: true,
              city: true,
            },
          },
          contracts: {
            select: {
              id: true,
              contractNumber: true,
              type: true,
              status: true,
              startDate: true,
              endDate: true,
            },
            take: 5,
            orderBy: { createdAt: 'desc' },
          },
          payments: {
            select: {
              id: true,
              type: true,
              amount: true,
              status: true,
              dueDate: true,
              paidDate: true,
            },
            take: 10,
            orderBy: { dueDate: 'desc' },
          },
          _count: {
            select: {
              contracts: true,
              payments: true,
              appointments: true,
              maintenance: true,
            },
          },
        },
      });

      if (!apartment) {
        return errorResponse('Not found', 'Apartment not found', 404);
      }

      // Ensure apartment belongs to tenant
      if (apartment.tenantId !== tenantContext.id) {
        return errorResponse('Forbidden', 'Apartment belongs to different tenant', 403);
      }

      return successResponse({
        apartment: {
          ...apartment,
          createdAt: apartment.createdAt.toISOString(),
          updatedAt: apartment.updatedAt.toISOString(),
          deliveryDate: apartment.deliveryDate?.toISOString() || null,
          metadata: apartment.metadata || {},
          inventory: apartment.inventory || null,
          keys: apartment.keys || null,
        },
      });
    },
    { required: true, module: 'real-estate' }
  );
}

// PATCH /api/real-estate/apartments/[id] - Update apartment
export async function PATCH(request: NextRequest, { params }: RouteParams) {
  return withTenant<ApiResponse<{ apartment: unknown }>>(
    request,
    async (tenantPrisma) => {
      const { id } = await params;
      const body = await request.json();

      // Validate request body (partial update)
      const validatedData = apartmentUpdateSchema.parse(body);

      // Get tenant context
      const tenantContext = await getTenantFromRequest(request);
      if (!tenantContext) {
        return errorResponse('Tenant context required', 'Tenant context could not be determined', 400);
      }

      // Check if apartment exists
      const existingApartment = await tenantPrisma.apartment.findUnique({
        where: { id },
      });

      if (!existingApartment) {
        return errorResponse('Not found', 'Apartment not found', 404);
      }

      // Ensure apartment belongs to tenant
      if (existingApartment.tenantId !== tenantContext.id) {
        return errorResponse('Forbidden', 'Apartment belongs to different tenant', 403);
      }

      // Check if unit number is unique (if changed)
      if (validatedData.unitNumber && validatedData.unitNumber !== existingApartment.unitNumber) {
        const existingUnit = await tenantPrisma.apartment.findFirst({
          where: {
            propertyId: existingApartment.propertyId,
            unitNumber: validatedData.unitNumber,
            id: { not: id },
          },
        });

        if (existingUnit) {
          return errorResponse('Validation error', 'Unit number already exists in this property', 409);
        }
      }

      // Prepare update data
      const updateData: Prisma.ApartmentUpdateInput = {};
      if (validatedData.unitNumber !== undefined) updateData.unitNumber = validatedData.unitNumber;
      if (validatedData.floor !== undefined) updateData.floor = validatedData.floor || null;
      if (validatedData.block !== undefined) updateData.block = validatedData.block || null;
      if (validatedData.area !== undefined) updateData.area = validatedData.area;
      if (validatedData.roomCount !== undefined) updateData.roomCount = validatedData.roomCount;
      if (validatedData.livingRoom !== undefined) updateData.livingRoom = validatedData.livingRoom;
      if (validatedData.bathroomCount !== undefined) updateData.bathroomCount = validatedData.bathroomCount;
      if (validatedData.balcony !== undefined) updateData.balcony = validatedData.balcony;
      if (validatedData.ownerId !== undefined) updateData.ownerId = validatedData.ownerId || null;
      if (validatedData.ownerType !== undefined) updateData.ownerType = validatedData.ownerType || null;
      if (validatedData.ownershipType !== undefined) updateData.ownershipType = validatedData.ownershipType || null;
      if (validatedData.status !== undefined) updateData.status = validatedData.status;
      if (validatedData.deliveryDate !== undefined) updateData.deliveryDate = validatedData.deliveryDate || null;
      if (validatedData.rentPrice !== undefined) updateData.rentPrice = validatedData.rentPrice || null;
      if (validatedData.salePrice !== undefined) updateData.salePrice = validatedData.salePrice || null;
      if (validatedData.inventory !== undefined) {
        updateData.inventory = validatedData.inventory ? (validatedData.inventory as Prisma.InputJsonValue) : Prisma.JsonNull;
      }
      if (validatedData.keys !== undefined) {
        updateData.keys = validatedData.keys ? (validatedData.keys as Prisma.InputJsonValue) : Prisma.JsonNull;
      }
      if (validatedData.description !== undefined) updateData.description = validatedData.description || null;
      if (validatedData.images !== undefined) updateData.images = validatedData.images;
      if (validatedData.documents !== undefined) updateData.documents = validatedData.documents;
      if (validatedData.metadata !== undefined) {
        updateData.metadata = validatedData.metadata ? (validatedData.metadata as Prisma.InputJsonValue) : {};
      }
      if (validatedData.qrCode !== undefined) updateData.qrCode = validatedData.qrCode || null;
      if (validatedData.isActive !== undefined) updateData.isActive = validatedData.isActive;

      // Get audit context before update
      const auditContext = await getAuditContext(request);

      // Update apartment
      const updatedApartment = await tenantPrisma.apartment.update({
        where: { id },
        data: updateData,
        include: {
          property: {
            select: {
              id: true,
              name: true,
              type: true,
            },
          },
        },
      });

      // Log audit event (fire and forget)
      logUpdate(
        tenantContext,
        auditContext,
        'Apartment',
        id,
        existingApartment,
        updatedApartment,
        existingApartment.companyId
      );

      return successResponse({
        apartment: {
          ...updatedApartment,
          createdAt: updatedApartment.createdAt.toISOString(),
          updatedAt: updatedApartment.updatedAt.toISOString(),
          deliveryDate: updatedApartment.deliveryDate?.toISOString() || null,
          metadata: updatedApartment.metadata || {},
          inventory: updatedApartment.inventory || null,
          keys: updatedApartment.keys || null,
        },
      });
    },
    { required: true, module: 'real-estate' }
  );
}

// DELETE /api/real-estate/apartments/[id] - Delete apartment
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

      // Check if apartment exists
      const existingApartment = await tenantPrisma.apartment.findUnique({
        where: { id },
        include: {
          _count: {
            select: {
              contracts: true,
              payments: true,
              appointments: true,
            },
          },
        },
      });

      if (!existingApartment) {
        return errorResponse('Not found', 'Apartment not found', 404);
      }

      // Ensure apartment belongs to tenant
      if (existingApartment.tenantId !== tenantContext.id) {
        return errorResponse('Forbidden', 'Apartment belongs to different tenant', 403);
      }

      // Check if apartment has contracts
      if (existingApartment._count.contracts > 0) {
        return errorResponse('Validation error', 'Cannot delete apartment with contracts', 400);
      }

      // Get audit context before delete
      const auditContext = await getAuditContext(request);

      // Delete apartment
      await tenantPrisma.apartment.delete({
        where: { id },
      });

      // Log audit event (fire and forget)
      logDelete(tenantContext, auditContext, 'Apartment', id, existingApartment.companyId, {
        unitNumber: existingApartment.unitNumber,
        propertyId: existingApartment.propertyId,
      });

      return successResponse({
        message: 'Apartment deleted successfully',
      });
    },
    { required: true, module: 'real-estate' }
  );
}

