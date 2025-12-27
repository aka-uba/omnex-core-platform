import { NextRequest } from 'next/server';
import { withTenant } from '@/lib/api/withTenant';
import { successResponse, errorResponse } from '@/lib/api/errorHandler';
import type { ApiResponse } from '@/lib/api/errorHandler';
import { tenantUpdateSchema } from '@/modules/real-estate/schemas/tenant.schema';
import { getTenantFromRequest } from '@/lib/api/tenantContext';
import { Prisma } from '@prisma/tenant-client';

interface RouteParams {
  params: Promise<{
    id: string;
  }>;
}

// GET /api/real-estate/tenants/[id] - Get tenant by ID
export async function GET(request: NextRequest, { params }: RouteParams) {
  return withTenant<ApiResponse<{ tenant: unknown }>>(
    request,
    async (tenantPrisma) => {
      const { id } = await params;

      // Get tenant context
      const tenantContext = await getTenantFromRequest(request);
      if (!tenantContext) {
        return errorResponse('Tenant context required', 'Tenant context could not be determined', 400);
      }

      // Get tenant - support both UUID and tenantNumber
      // Try UUID first, then tenantNumber
      const tenant = await tenantPrisma.tenant.findFirst({
        where: {
          OR: [
            { id },
            { tenantNumber: id },
          ],
        },
        include: {
          contracts: {
            select: {
              id: true,
              contractNumber: true,
              type: true,
              status: true,
              startDate: true,
              endDate: true,
              rentAmount: true,
              apartment: {
                select: {
                  id: true,
                  unitNumber: true,
                  area: true,
                  floor: true,
                  roomCount: true,
                  status: true,
                  coldRent: true,
                  additionalCosts: true,
                  heatingCosts: true,
                  deposit: true,
                  images: true,
                  coverImage: true,
                  property: {
                    select: {
                      id: true,
                      name: true,
                      address: true,
                    },
                  },
                },
              },
            },
            take: 10,
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
            },
          },
        },
      });

      if (!tenant) {
        return errorResponse('Not found', 'Tenant not found', 404);
      }

      // Ensure tenant belongs to tenant context
      if (tenant.tenantId !== tenantContext.id) {
        return errorResponse('Forbidden', 'Tenant belongs to different tenant', 403);
      }

      return successResponse({
        tenant: {
          ...tenant,
          createdAt: tenant.createdAt.toISOString(),
          updatedAt: tenant.updatedAt.toISOString(),
          moveInDate: tenant.moveInDate?.toISOString() || null,
          moveOutDate: tenant.moveOutDate?.toISOString() || null,
          analysis: tenant.analysis || null,
        },
      });
    },
    { required: true, module: 'real-estate' }
  );
}

// PATCH /api/real-estate/tenants/[id] - Update tenant
export async function PATCH(request: NextRequest, { params }: RouteParams) {
  return withTenant<ApiResponse<{ tenant: unknown }>>(
    request,
    async (tenantPrisma) => {
      const { id } = await params;
      const body = await request.json();

      // Validate request body (partial update)
      const validatedData = tenantUpdateSchema.parse(body);

      // Get tenant context
      const tenantContext = await getTenantFromRequest(request);
      if (!tenantContext) {
        return errorResponse('Tenant context required', 'Tenant context could not be determined', 400);
      }

      // Check if tenant exists
      const existingTenant = await tenantPrisma.tenant.findUnique({
        where: { id },
      });

      if (!existingTenant) {
        return errorResponse('Not found', 'Tenant not found', 404);
      }

      // Ensure tenant belongs to tenant context
      if (existingTenant.tenantId !== tenantContext.id) {
        return errorResponse('Forbidden', 'Tenant belongs to different tenant', 403);
      }

      // Check if tenant number is unique (if changed)
      if (validatedData.tenantNumber && validatedData.tenantNumber !== existingTenant.tenantNumber) {
        const existingTenantWithNumber = await tenantPrisma.tenant.findFirst({
          where: {
            tenantId: tenantContext.id,
            tenantNumber: validatedData.tenantNumber,
            id: { not: id },
          },
        });

        if (existingTenantWithNumber) {
          return errorResponse('Validation error', 'Tenant number already exists', 409);
        }
      }

      // Prepare update data
      const updateData: Prisma.TenantUpdateInput = {};
      if (validatedData.userId !== undefined) updateData.userId = validatedData.userId || null;
      if (validatedData.contactId !== undefined) updateData.contactId = validatedData.contactId || null;
      if (validatedData.tenantNumber !== undefined) updateData.tenantNumber = validatedData.tenantNumber || null;
      if (validatedData.moveInDate !== undefined) updateData.moveInDate = validatedData.moveInDate || null;
      if (validatedData.moveOutDate !== undefined) updateData.moveOutDate = validatedData.moveOutDate || null;
      if (validatedData.paymentScore !== undefined) updateData.paymentScore = validatedData.paymentScore;
      if (validatedData.contactScore !== undefined) updateData.contactScore = validatedData.contactScore;
      if (validatedData.maintenanceScore !== undefined) updateData.maintenanceScore = validatedData.maintenanceScore;
      if (validatedData.overallScore !== undefined) updateData.overallScore = validatedData.overallScore;
      if (validatedData.notes !== undefined) updateData.notes = validatedData.notes || null;
      if (validatedData.analysis !== undefined) {
        updateData.analysis = validatedData.analysis ? (validatedData.analysis as Prisma.InputJsonValue) : Prisma.JsonNull;
      }
      if (validatedData.isActive !== undefined) updateData.isActive = validatedData.isActive;
      if (validatedData.images !== undefined) updateData.images = validatedData.images;
      if (validatedData.documents !== undefined) updateData.documents = validatedData.documents;
      if (validatedData.coverImage !== undefined) updateData.coverImage = validatedData.coverImage || null;

      // Update tenant
      const updatedTenant = await tenantPrisma.tenant.update({
        where: { id },
        data: updateData,
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
        tenant: {
          ...updatedTenant,
          createdAt: updatedTenant.createdAt.toISOString(),
          updatedAt: updatedTenant.updatedAt.toISOString(),
          moveInDate: updatedTenant.moveInDate?.toISOString() || null,
          moveOutDate: updatedTenant.moveOutDate?.toISOString() || null,
          analysis: updatedTenant.analysis || null,
        },
      });
    },
    { required: true, module: 'real-estate' }
  );
}

