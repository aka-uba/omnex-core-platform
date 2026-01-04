import { NextRequest } from 'next/server';
import { withTenant } from '@/lib/api/withTenant';
import { successResponse, errorResponse } from '@/lib/api/errorHandler';
import type { ApiResponse } from '@/lib/api/errorHandler';
import { propertyUpdateSchema } from '@/modules/real-estate/schemas/property.schema';
import { getTenantFromRequest } from '@/lib/api/tenantContext';
import { Prisma } from '@prisma/tenant-client';
import { getAuditContext, logUpdate, logDelete } from '@/lib/api/auditHelper';

interface RouteParams {
  params: Promise<{
    id: string;
  }>;
}

// GET /api/real-estate/properties/[id] - Get property by ID
export async function GET(request: NextRequest, { params }: RouteParams) {
  return withTenant<ApiResponse<{ property: unknown }>>(
    request,
    async (tenantPrisma) => {
      const { id } = await params;

      // Get tenant context
      const tenantContext = await getTenantFromRequest(request);
      if (!tenantContext) {
        return errorResponse('Tenant context required', 'Tenant context could not be determined', 400);
      }

      const property = await tenantPrisma.property.findUnique({
        where: { id },
        include: {
          apartments: {
            select: {
              id: true,
              unitNumber: true,
              floor: true,
              block: true,
              area: true,
              roomCount: true,
              status: true,
              isActive: true,
              images: true,
              coverImage: true,
              // Yan gider alanları
              coldRent: true,
              additionalCosts: true,
              heatingCosts: true,
              deposit: true,
              contracts: {
                where: {
                  status: 'active',
                },
                select: {
                  id: true,
                  rentAmount: true,
                  paymentDay: true,
                  tenantRecord: {
                    select: {
                      id: true,
                      firstName: true,
                      lastName: true,
                      email: true,
                      phone: true,
                      mobile: true,
                    },
                  },
                  payments: {
                    where: {
                      status: 'pending',
                    },
                    select: {
                      id: true,
                      dueDate: true,
                    },
                    orderBy: {
                      dueDate: 'asc',
                    },
                    take: 1,
                  },
                },
                orderBy: {
                  startDate: 'desc',
                },
                take: 1,
              },
            },
            take: 10,
            orderBy: { unitNumber: 'asc' },
          },
          staff: {
            include: {
              staff: {
                select: {
                  id: true,
                  name: true,
                  email: true,
                  role: true,
                },
              },
            },
          },
          _count: {
            select: {
              apartments: true,
              staff: true,
            },
          },
        },
      });

      if (!property) {
        return errorResponse('Not found', 'Property not found', 404);
      }

      // Ensure property belongs to tenant
      if (property.tenantId !== tenantContext.id) {
        return errorResponse('Forbidden', 'Property belongs to different tenant', 403);
      }

      return successResponse({
        property: {
          ...property,
          createdAt: property.createdAt.toISOString(),
          updatedAt: property.updatedAt.toISOString(),
          metadata: property.metadata || {},
        },
      });
    },
    { required: true, module: 'real-estate' }
  );
}

// PATCH /api/real-estate/properties/[id] - Update property
export async function PATCH(request: NextRequest, { params }: RouteParams) {
  return withTenant<ApiResponse<{ property: unknown }>>(
    request,
    async (tenantPrisma) => {
      const { id } = await params;
      const body = await request.json();

      // Validate request body (partial update)
      const validatedData = propertyUpdateSchema.parse(body);

      // Get tenant context
      const tenantContext = await getTenantFromRequest(request);
      if (!tenantContext) {
        return errorResponse('Tenant context required', 'Tenant context could not be determined', 400);
      }

      // Check if property exists
      const existingProperty = await tenantPrisma.property.findUnique({
        where: { id },
      });

      if (!existingProperty) {
        return errorResponse('Not found', 'Property not found', 404);
      }

      // Ensure property belongs to tenant
      if (existingProperty.tenantId !== tenantContext.id) {
        return errorResponse('Forbidden', 'Property belongs to different tenant', 403);
      }

      // Check if code is unique (if provided and different)
      if (validatedData.code && validatedData.code !== existingProperty.code) {
        const existingPropertyWithCode = await tenantPrisma.property.findFirst({
          where: {
            tenantId: tenantContext.id,
            code: validatedData.code,
            id: { not: id },
          },
        });

        if (existingPropertyWithCode) {
          return errorResponse('Validation error', 'Property code already exists', 409);
        }
      }

      // Prepare update data
      const updateData: Prisma.PropertyUpdateInput = {};

      // Basic info
      if (validatedData.name !== undefined) updateData.name = validatedData.name;
      if (validatedData.type !== undefined) updateData.type = validatedData.type;
      if (validatedData.code !== undefined) updateData.code = validatedData.code || null;
      if (validatedData.propertyNumber !== undefined) updateData.propertyNumber = validatedData.propertyNumber || null;

      // Address
      if (validatedData.address !== undefined) updateData.address = validatedData.address;
      if (validatedData.city !== undefined) updateData.city = validatedData.city;
      if (validatedData.district !== undefined) updateData.district = validatedData.district || null;
      if (validatedData.neighborhood !== undefined) updateData.neighborhood = validatedData.neighborhood || null;
      if (validatedData.street !== undefined) updateData.street = validatedData.street || null;
      if (validatedData.buildingNo !== undefined) updateData.buildingNo = validatedData.buildingNo || null;
      if (validatedData.postalCode !== undefined) updateData.postalCode = validatedData.postalCode || null;
      if (validatedData.country !== undefined) updateData.country = validatedData.country;
      if (validatedData.latitude !== undefined) updateData.latitude = validatedData.latitude || null;
      if (validatedData.longitude !== undefined) updateData.longitude = validatedData.longitude || null;

      // Management
      if (validatedData.totalUnits !== undefined) updateData.totalUnits = validatedData.totalUnits ?? undefined;
      if (validatedData.managerId !== undefined) updateData.managerId = validatedData.managerId || null;
      if (validatedData.managerUserId !== undefined) updateData.managerUserId = validatedData.managerUserId || null;
      if (validatedData.monthlyFee !== undefined) updateData.monthlyFee = validatedData.monthlyFee || null;
      if (validatedData.paymentDay !== undefined) updateData.paymentDay = validatedData.paymentDay || null;

      // Building details
      if (validatedData.constructionYear !== undefined) updateData.constructionYear = validatedData.constructionYear || null;
      if (validatedData.lastRenovationDate !== undefined) updateData.lastRenovationDate = validatedData.lastRenovationDate || null;
      if (validatedData.landArea !== undefined) updateData.landArea = validatedData.landArea || null;
      if (validatedData.floorCount !== undefined) updateData.floorCount = validatedData.floorCount || null;
      if (validatedData.livingArea !== undefined) updateData.livingArea = validatedData.livingArea || null;

      // Financial details
      if (validatedData.purchaseDate !== undefined) updateData.purchaseDate = validatedData.purchaseDate || null;
      if (validatedData.purchasePrice !== undefined) updateData.purchasePrice = validatedData.purchasePrice || null;
      if (validatedData.isPaidOff !== undefined) updateData.isPaidOff = validatedData.isPaidOff ?? undefined;
      if (validatedData.financingStartDate !== undefined) updateData.financingStartDate = validatedData.financingStartDate || null;
      if (validatedData.financingEndDate !== undefined) updateData.financingEndDate = validatedData.financingEndDate || null;
      if (validatedData.monthlyFinancingRate !== undefined) updateData.monthlyFinancingRate = validatedData.monthlyFinancingRate || null;
      if (validatedData.numberOfInstallments !== undefined) updateData.numberOfInstallments = validatedData.numberOfInstallments || null;
      if (validatedData.financingPaymentDay !== undefined) updateData.financingPaymentDay = validatedData.financingPaymentDay || null;

      // Media and other
      if (validatedData.description !== undefined) updateData.description = validatedData.description || null;
      if (validatedData.images !== undefined) updateData.images = validatedData.images;
      if (validatedData.coverImage !== undefined) updateData.coverImage = validatedData.coverImage || null;
      if (validatedData.documents !== undefined) updateData.documents = validatedData.documents;
      if (validatedData.metadata !== undefined) {
        updateData.metadata = validatedData.metadata ? (validatedData.metadata as Prisma.InputJsonValue) : {};
      }
      if (validatedData.isActive !== undefined) updateData.isActive = validatedData.isActive;

      // Update property
      const updatedProperty = await tenantPrisma.property.update({
        where: { id },
        data: updateData,
        include: {
          _count: {
            select: {
              apartments: true,
              staff: true,
            },
          },
        },
      });

      // Log audit event
      const auditContext = await getAuditContext(request);
      logUpdate(
        tenantContext,
        auditContext,
        'Property',
        id,
        existingProperty,
        updatedProperty,
        existingProperty.companyId || undefined
      );

      return successResponse({
        property: {
          ...updatedProperty,
          createdAt: updatedProperty.createdAt.toISOString(),
          updatedAt: updatedProperty.updatedAt.toISOString(),
          metadata: updatedProperty.metadata || {},
        },
      });
    },
    { required: true, module: 'real-estate' }
  );
}

// DELETE /api/real-estate/properties/[id] - Delete property
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

      // Check if property exists
      const existingProperty = await tenantPrisma.property.findUnique({
        where: { id },
        include: {
          _count: {
            select: {
              apartments: true,
              staff: true,
            },
          },
        },
      });

      if (!existingProperty) {
        return errorResponse('Not found', 'Property not found', 404);
      }

      // Ensure property belongs to tenant
      if (existingProperty.tenantId !== tenantContext.id) {
        return errorResponse('Forbidden', 'Property belongs to different tenant', 403);
      }

      // Check if property has apartments
      if (existingProperty._count.apartments > 0) {
        return errorResponse('Validation error', 'Cannot delete property with apartments', 400);
      }

      // Delete property
      await tenantPrisma.property.delete({
        where: { id },
      });

      // Log audit event
      const auditContext = await getAuditContext(request);
      logDelete(
        tenantContext,
        auditContext,
        'Property',
        id,
        existingProperty.companyId || undefined,
        { name: existingProperty.name, code: existingProperty.code }
      );

      return successResponse({
        message: 'Property deleted successfully',
      });
    },
    { required: true, module: 'real-estate' }
  );
}

