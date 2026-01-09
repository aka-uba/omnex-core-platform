import { NextRequest } from 'next/server';
import { withTenant } from '@/lib/api/withTenant';
import { successResponse, errorResponse } from '@/lib/api/errorHandler';
import type { ApiResponse } from '@/lib/api/errorHandler';
import { apartmentCreateSchema } from '@/modules/real-estate/schemas/apartment.schema';
import { getTenantFromRequest } from '@/lib/api/tenantContext';
import { Prisma } from '@prisma/tenant-client';
import { getAuditContext, logCreate } from '@/lib/api/auditHelper';

// GET /api/real-estate/apartments - List apartments
export async function GET(request: NextRequest) {
  return withTenant<ApiResponse<{ apartments: unknown[]; total: number; page: number; pageSize: number }>>(
    request,
    async (tenantPrisma) => {
      const searchParams = request.nextUrl.searchParams;
      
      // Parse query parameters
      const page = parseInt(searchParams.get('page') || '1', 10) || 1;
      const pageSize = parseInt(searchParams.get('pageSize') || '10', 10) || 10;
      const search = searchParams.get('search') || undefined;
      const propertyId = searchParams.get('propertyId') || undefined;
      const status = searchParams.get('status') || undefined;
      const isActive = searchParams.get('isActive') === 'true' ? true : searchParams.get('isActive') === 'false' ? false : undefined;
      const companyId = searchParams.get('companyId') || undefined;

      // Get tenant context (withTenant already ensures tenant exists)
      const tenantContext = await getTenantFromRequest(request);
      if (!tenantContext) {
        // This should not happen if withTenant is working correctly
        return errorResponse('Tenant context required', 'Tenant context could not be determined', 400);
      }

      // Get companyId from query or use first company
      let finalCompanyId = companyId;
      if (!finalCompanyId) {
        const firstCompany = await tenantPrisma.company.findFirst({
          select: { id: true },
          orderBy: { createdAt: 'asc' },
        });
        finalCompanyId = firstCompany?.id;
      }

      // Build where clause with tenant and company isolation (defense-in-depth)
      const where: Prisma.ApartmentWhereInput = {
        tenantId: tenantContext.id,
        ...(finalCompanyId && { companyId: finalCompanyId }),
        ...(search && {
          OR: [
            { unitNumber: { contains: search, mode: 'insensitive' } },
            { block: { contains: search, mode: 'insensitive' } },
          ],
        }),
        ...(propertyId && { propertyId }),
        ...(status && { status }),
        ...(isActive !== undefined && { isActive }),
      };

      // Get total count
      const total = await tenantPrisma.apartment.count({ where });

      // Get paginated apartments
      const apartments = await tenantPrisma.apartment.findMany({
        where,
        skip: (page - 1) * pageSize,
        take: pageSize,
        orderBy: { createdAt: 'desc' },
        include: {
          property: {
            select: {
              id: true,
              name: true,
              type: true,
              address: true,
              postalCode: true,
              city: true,
              latitude: true,
              longitude: true,
            },
          },
          contracts: {
            where: { status: 'active' },
            take: 1,
            orderBy: { createdAt: 'desc' },
            select: {
              id: true,
              tenantRecord: {
                select: {
                  id: true,
                  tenantNumber: true,
                  firstName: true,
                  lastName: true,
                },
              },
            },
          },
          // Direct apartment assignments (via apartmentId)
          tenants: {
            take: 5,
            orderBy: { createdAt: 'desc' },
            select: {
              id: true,
              tenantNumber: true,
              firstName: true,
              lastName: true,
            },
          },
          payments: {
            take: 1,
            orderBy: { dueDate: 'desc' },
            select: {
              id: true,
              type: true,
              amount: true,
              status: true,
              dueDate: true,
              paidDate: true,
            },
          },
          _count: {
            select: {
              contracts: true,
              payments: true,
              appointments: true,
            },
          },
        },
      });

      return successResponse({
        apartments: apartments.map(apartment => ({
          ...apartment,
          createdAt: apartment.createdAt.toISOString(),
          updatedAt: apartment.updatedAt.toISOString(),
          deliveryDate: apartment.deliveryDate?.toISOString() || null,
          metadata: apartment.metadata || {},
          inventory: apartment.inventory || null,
          keys: apartment.keys || null,
        })),
        total,
        page,
        pageSize,
      });
    },
    { required: true, module: 'real-estate' }
  );
}

// POST /api/real-estate/apartments - Create apartment
export async function POST(request: NextRequest) {
  return withTenant<ApiResponse<{ apartment: unknown }>>(
    request,
    async (tenantPrisma) => {
      const body = await request.json();

      // Validate request body
      const validatedData = apartmentCreateSchema.parse(body);

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

      const companyId = firstCompany.id;

      // Check if property exists
      const property = await tenantPrisma.property.findUnique({
        where: { id: validatedData.propertyId },
      });

      if (!property) {
        return errorResponse('Validation error', 'Property not found', 404);
      }

      // Ensure property belongs to tenant
      if (property.tenantId !== tenantContext.id) {
        return errorResponse('Validation error', 'Property belongs to different tenant', 403);
      }

      // Check if unit number is unique within property
      const existingApartment = await tenantPrisma.apartment.findFirst({
        where: {
          propertyId: validatedData.propertyId,
          unitNumber: validatedData.unitNumber,
        },
      });

      if (existingApartment) {
        return errorResponse('Validation error', 'Unit number already exists in this property', 409);
      }

      // Get audit context before create
      const auditContext = await getAuditContext(request);

      // Create apartment
      const newApartment = await tenantPrisma.apartment.create({
        data: {
          tenantId: tenantContext.id,
          companyId: companyId,
          propertyId: validatedData.propertyId,
          unitNumber: validatedData.unitNumber,
          floor: validatedData.floor || null,
          block: validatedData.block || null,
          area: validatedData.area,
          roomCount: validatedData.roomCount,
          livingRoom: validatedData.livingRoom ?? true,
          bathroomCount: validatedData.bathroomCount ?? 1,
          balcony: validatedData.balcony ?? false,
          apartmentType: validatedData.apartmentType || null,
          bedroomCount: validatedData.bedroomCount ?? null,
          basementSize: validatedData.basementSize ?? null,
          lastRenovationDate: validatedData.lastRenovationDate || null,
          internetSpeed: validatedData.internetSpeed || null,
          heatingSystems: validatedData.heatingSystems ? (validatedData.heatingSystems as Prisma.InputJsonValue) : Prisma.JsonNull,
          coldRent: validatedData.coldRent ?? null,
          heatingCosts: validatedData.heatingCosts ?? null,
          additionalCosts: validatedData.additionalCosts ?? null,
          deposit: validatedData.deposit ?? null,
          usageRights: validatedData.usageRights ? (validatedData.usageRights as Prisma.InputJsonValue) : Prisma.JsonNull,
          ownerId: validatedData.ownerId || null,
          ownerType: validatedData.ownerType || null,
          ownershipType: validatedData.ownershipType || null,
          status: validatedData.status || 'empty',
          deliveryDate: validatedData.deliveryDate || null,
          rentPrice: validatedData.rentPrice || null,
          salePrice: validatedData.salePrice || null,
          inventory: validatedData.inventory ? (validatedData.inventory as Prisma.InputJsonValue) : Prisma.JsonNull,
          keys: validatedData.keys ? (validatedData.keys as Prisma.InputJsonValue) : Prisma.JsonNull,
          description: validatedData.description || null,
          images: validatedData.images || [],
          coverImage: validatedData.coverImage || null,
          documents: validatedData.documents || [],
          metadata: validatedData.metadata ? (validatedData.metadata as Prisma.InputJsonValue) : {},
          qrCode: validatedData.qrCode || null,
          isActive: true,
        },
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
      logCreate(tenantContext, auditContext, 'Apartment', newApartment.id, companyId, {
        unitNumber: newApartment.unitNumber,
        propertyId: newApartment.propertyId,
        status: newApartment.status,
      });

      return successResponse({
        apartment: {
          ...newApartment,
          createdAt: newApartment.createdAt.toISOString(),
          updatedAt: newApartment.updatedAt.toISOString(),
          deliveryDate: newApartment.deliveryDate?.toISOString() || null,
          metadata: newApartment.metadata || {},
          inventory: newApartment.inventory || null,
          keys: newApartment.keys || null,
        },
      });
    },
    { required: true, module: 'real-estate' }
  );
}

