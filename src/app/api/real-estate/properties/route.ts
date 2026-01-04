import { NextRequest } from 'next/server';
import { withTenant } from '@/lib/api/withTenant';
import { successResponse, errorResponse } from '@/lib/api/errorHandler';
import type { ApiResponse } from '@/lib/api/errorHandler';
import { propertyCreateSchema } from '@/modules/real-estate/schemas/property.schema';
import { getTenantFromRequest } from '@/lib/api/tenantContext';
import { Prisma } from '@prisma/tenant-client';
import { getAuditContext, logCreate } from '@/lib/api/auditHelper';

// GET /api/real-estate/properties - List properties
export async function GET(request: NextRequest) {
  return withTenant<ApiResponse<{ properties: unknown[]; total: number; page: number; pageSize: number }>>(
    request,
    async (tenantPrisma) => {
      const searchParams = request.nextUrl.searchParams;
      
      // Parse query parameters
      const page = parseInt(searchParams.get('page') || '1', 10) || 1;
      const pageSize = parseInt(searchParams.get('pageSize') || '10', 10) || 10;
      const search = searchParams.get('search') || undefined;
      const type = searchParams.get('type') || undefined;
      const city = searchParams.get('city') || undefined;
      const district = searchParams.get('district') || undefined;
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

      // Build where clause
      // Build where clause with tenant and company isolation (defense-in-depth)
      const where: Prisma.PropertyWhereInput = {
        tenantId: tenantContext.id,
        ...(finalCompanyId && { companyId: finalCompanyId }),
        ...(search && {
          OR: [
            { name: { contains: search, mode: 'insensitive' } },
            { code: { contains: search, mode: 'insensitive' } },
            { address: { contains: search, mode: 'insensitive' } },
          ],
        }),
        ...(type && { type }),
        ...(city && { city }),
        ...(district && { district }),
        ...(isActive !== undefined && { isActive }),
      };

      // Get total count
      const total = await tenantPrisma.property.count({ where });

      // Get paginated properties
      const properties = await tenantPrisma.property.findMany({
        where,
        skip: (page - 1) * pageSize,
        take: pageSize,
        orderBy: { createdAt: 'desc' },
        include: {
          _count: {
            select: {
              apartments: true,
              staff: true,
            },
          },
        },
      });

      return successResponse({
        properties: properties.map(property => ({
          ...property,
          createdAt: property.createdAt.toISOString(),
          updatedAt: property.updatedAt.toISOString(),
          metadata: property.metadata || {},
        })),
        total,
        page,
        pageSize,
      });
    },
    { required: true, module: 'real-estate' }
  );
}

// POST /api/real-estate/properties - Create property
export async function POST(request: NextRequest) {
  return withTenant<ApiResponse<{ property: unknown }>>(
    request,
    async (tenantPrisma) => {
      const body = await request.json();

      // Validate request body
      const validatedData = propertyCreateSchema.parse(body);

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

      // Check if code is unique (if provided)
      if (validatedData.code) {
        const existingProperty = await tenantPrisma.property.findFirst({
          where: {
            tenantId: tenantContext.id,
            code: validatedData.code,
          },
        });

        if (existingProperty) {
          return errorResponse('Validation error', 'Property code already exists', 409);
        }
      }

      // Create property
      const newProperty = await tenantPrisma.property.create({
        data: {
          tenantId: tenantContext.id,
          companyId: companyId,
          name: validatedData.name,
          type: validatedData.type,
          code: validatedData.code || null,
          propertyNumber: validatedData.propertyNumber || null,
          address: validatedData.address,
          city: validatedData.city,
          district: validatedData.district || null,
          neighborhood: validatedData.neighborhood || null,
          street: validatedData.street || null,
          buildingNo: validatedData.buildingNo || null,
          postalCode: validatedData.postalCode || null,
          country: validatedData.country || 'TR',
          latitude: validatedData.latitude || null,
          longitude: validatedData.longitude || null,
          totalUnits: validatedData.totalUnits || 0,
          managerId: validatedData.managerId || null,
          managerUserId: validatedData.managerUserId || null,
          monthlyFee: validatedData.monthlyFee || null,
          paymentDay: validatedData.paymentDay || null,
          // Building details
          constructionYear: validatedData.constructionYear || null,
          lastRenovationDate: validatedData.lastRenovationDate || null,
          landArea: validatedData.landArea || null,
          floorCount: validatedData.floorCount || null,
          livingArea: validatedData.livingArea || null,
          // Financial details
          purchaseDate: validatedData.purchaseDate || null,
          purchasePrice: validatedData.purchasePrice || null,
          isPaidOff: validatedData.isPaidOff ?? undefined,
          financingStartDate: validatedData.financingStartDate || null,
          financingEndDate: validatedData.financingEndDate || null,
          monthlyFinancingRate: validatedData.monthlyFinancingRate || null,
          numberOfInstallments: validatedData.numberOfInstallments || null,
          financingPaymentDay: validatedData.financingPaymentDay || null,
          description: validatedData.description || null,
          images: validatedData.images || [],
          coverImage: validatedData.coverImage || null,
          documents: validatedData.documents || [],
          metadata: validatedData.metadata ? (validatedData.metadata as Prisma.InputJsonValue) : {},
          isActive: true,
        },
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
      logCreate(
        tenantContext,
        auditContext,
        'Property',
        newProperty.id,
        companyId,
        { name: newProperty.name, code: newProperty.code, type: newProperty.type }
      );

      return successResponse({
        property: {
          ...newProperty,
          createdAt: newProperty.createdAt.toISOString(),
          updatedAt: newProperty.updatedAt.toISOString(),
          metadata: newProperty.metadata || {},
        },
      });
    },
    { required: true, module: 'real-estate' }
  );
}

