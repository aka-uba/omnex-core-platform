import { NextRequest } from 'next/server';
import { withTenant } from '@/lib/api/withTenant';
import { successResponse, errorResponse } from '@/lib/api/errorHandler';
import type { ApiResponse } from '@/lib/api/errorHandler';
import { tenantCreateSchema } from '@/modules/real-estate/schemas/tenant.schema';
import { getTenantFromRequest } from '@/lib/api/tenantContext';
import { Prisma } from '@prisma/tenant-client';
import { getAuditContext, logCreate } from '@/lib/api/auditHelper';

// GET /api/real-estate/tenants - List tenants
export async function GET(request: NextRequest) {
  return withTenant<ApiResponse<{ tenants: unknown[]; total: number; page: number; pageSize: number }>>(
    request,
    async (tenantPrisma) => {
      const searchParams = request.nextUrl.searchParams;
      
      // Parse query parameters
      const page = parseInt(searchParams.get('page') || '1', 10) || 1;
      const pageSize = parseInt(searchParams.get('pageSize') || '10', 10) || 10;
      const search = searchParams.get('search') || undefined;
      const userId = searchParams.get('userId') || undefined;
      const contactId = searchParams.get('contactId') || undefined;
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
      const where: Prisma.TenantWhereInput = {
        tenantId: tenantContext.id,
        ...(finalCompanyId && { companyId: finalCompanyId }),
        ...(search && {
          OR: [
            { tenantNumber: { contains: search, mode: 'insensitive' } },
          ],
        }),
        ...(userId && { userId }),
        ...(contactId && { contactId }),
        ...(isActive !== undefined && { isActive }),
      };

      // Get total count
      const total = await tenantPrisma.tenant.count({ where });

      // Get paginated tenants
      const tenants = await tenantPrisma.tenant.findMany({
        where,
        skip: (page - 1) * pageSize,
        take: pageSize,
        orderBy: { createdAt: 'desc' },
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

      return successResponse({
        tenants: tenants.map(tenant => ({
          ...tenant,
          createdAt: tenant.createdAt.toISOString(),
          updatedAt: tenant.updatedAt.toISOString(),
          moveInDate: tenant.moveInDate?.toISOString() || null,
          moveOutDate: tenant.moveOutDate?.toISOString() || null,
          analysis: tenant.analysis || null,
        })),
        total,
        page,
        pageSize,
      });
    },
    { required: true, module: 'real-estate' }
  );
}

// POST /api/real-estate/tenants - Create tenant
export async function POST(request: NextRequest) {
  return withTenant<ApiResponse<{ tenant: unknown }>>(
    request,
    async (tenantPrisma) => {
      const body = await request.json();

      // Validate request body
      const validatedData = tenantCreateSchema.parse(body);

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

      // Check if tenant number is unique (if provided)
      if (validatedData.tenantNumber) {
        const existingTenant = await tenantPrisma.tenant.findFirst({
          where: {
            tenantId: tenantContext.id,
            tenantNumber: validatedData.tenantNumber,
          },
        });

        if (existingTenant) {
          return errorResponse('Validation error', 'Tenant number already exists', 409);
        }
      }

      // Create tenant
      const newTenant = await tenantPrisma.tenant.create({
        data: {
          tenantId: tenantContext.id,
          companyId: companyId,
          userId: validatedData.userId || null,
          contactId: validatedData.contactId || null,
          tenantNumber: validatedData.tenantNumber || null,
          moveInDate: validatedData.moveInDate || null,
          moveOutDate: validatedData.moveOutDate || null,
          paymentScore: validatedData.paymentScore || 100,
          contactScore: validatedData.contactScore || 100,
          maintenanceScore: validatedData.maintenanceScore || 100,
          overallScore: validatedData.overallScore || 100,
          notes: validatedData.notes || null,
          analysis: validatedData.analysis ? (validatedData.analysis as Prisma.InputJsonValue) : Prisma.JsonNull,
          isActive: true,
        },
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

      // Log audit event
      const auditContext = await getAuditContext(request);
      logCreate(
        tenantContext,
        auditContext,
        'Tenant',
        newTenant.id,
        companyId,
        { tenantNumber: newTenant.tenantNumber }
      );

      return successResponse({
        tenant: {
          ...newTenant,
          createdAt: newTenant.createdAt.toISOString(),
          updatedAt: newTenant.updatedAt.toISOString(),
          moveInDate: newTenant.moveInDate?.toISOString() || null,
          moveOutDate: newTenant.moveOutDate?.toISOString() || null,
          analysis: newTenant.analysis || null,
        },
      });
    },
    { required: true, module: 'real-estate' }
  );
}

