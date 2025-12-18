import { NextRequest } from 'next/server';
import { withTenant } from '@/lib/api/withTenant';
import { successResponse, errorResponse } from '@/lib/api/errorHandler';
import type { ApiResponse } from '@/lib/api/errorHandler';
import { getTenantFromRequest } from '@/lib/api/tenantContext';
import { realEstateStaffSchema } from '@/modules/real-estate/schemas/staff.schema';
import { Prisma } from '@prisma/tenant-client';
import { z } from 'zod';

// GET /api/real-estate/staff/[id] - Get single staff
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return withTenant<ApiResponse<{ staff: unknown }>>(
    request,
    async (tenantPrisma) => {
      const { id } = await params;

      // Get tenant context
      const tenantContext = await getTenantFromRequest(request);
      if (!tenantContext) {
        return errorResponse('Tenant context required', 'Tenant context could not be determined', 400);
      }

      // Get staff
      const staff = await tenantPrisma.realEstateStaff.findUnique({
        where: { id },
        include: {
          properties: {
            include: {
              property: {
                select: {
                  id: true,
                  name: true,
                  type: true,
                },
              },
            },
          },
        },
      });

      if (!staff) {
        return errorResponse('Staff not found', 'Real estate staff not found', 404);
      }

      // Check tenant access
      if (staff.tenantId !== tenantContext.id) {
        return errorResponse('Forbidden', 'Access denied', 403);
      }

      return successResponse({ staff });
    }
  );
}

// PATCH /api/real-estate/staff/[id] - Update staff
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return withTenant<ApiResponse<{ staff: unknown }>>(
    request,
    async (tenantPrisma) => {
      try {
        const { id } = await params;
        const body = await request.json();

        // Get tenant context
        const tenantContext = await getTenantFromRequest(request);
        if (!tenantContext) {
          return errorResponse('Tenant context required', 'Tenant context could not be determined', 400);
        }

        // Get existing staff
        const existing = await tenantPrisma.realEstateStaff.findUnique({
          where: { id },
        });

        if (!existing) {
          return errorResponse('Staff not found', 'Real estate staff not found', 404);
        }

        // Check tenant access
        if (existing.tenantId !== tenantContext.id) {
          return errorResponse('Forbidden', 'Access denied', 403);
        }

        // Validate input (partial)
        const validatedData = realEstateStaffSchema.partial().parse(body);

        // Calculate assignedUnits if apartmentIds changed
        const apartmentIds = validatedData.apartmentIds !== undefined ? validatedData.apartmentIds : existing.apartmentIds;
        const assignedUnits = apartmentIds.length;

        // Update staff
        const staff = await tenantPrisma.realEstateStaff.update({
          where: { id },
          data: {
            ...(validatedData.userId !== undefined && { userId: validatedData.userId || null }),
            ...(validatedData.name && { name: validatedData.name }),
            ...(validatedData.email !== undefined && { email: validatedData.email || null }),
            ...(validatedData.phone !== undefined && { phone: validatedData.phone || null }),
            ...(validatedData.staffType && { staffType: validatedData.staffType }),
            ...(validatedData.role && { role: validatedData.role }),
            ...(validatedData.permissions !== undefined && { permissions: validatedData.permissions as any || null }),
            ...(validatedData.propertyIds !== undefined && { propertyIds: validatedData.propertyIds }),
            ...(validatedData.apartmentIds !== undefined && { apartmentIds: validatedData.apartmentIds }),
            ...(validatedData.notes !== undefined && { notes: validatedData.notes || null }),
            ...(validatedData.profileImage !== undefined && { profileImage: validatedData.profileImage || null }),
            ...(body.isActive !== undefined && { isActive: body.isActive }),
            assignedUnits,
            ...(body.collectionRate !== undefined && {
              collectionRate: body.collectionRate ? new Prisma.Decimal(body.collectionRate) : null,
            }),
            ...(body.averageVacancyDays !== undefined && {
              averageVacancyDays: body.averageVacancyDays ? new Prisma.Decimal(body.averageVacancyDays) : null,
            }),
            ...(body.customerSatisfaction !== undefined && {
              customerSatisfaction: body.customerSatisfaction ? new Prisma.Decimal(body.customerSatisfaction) : null,
            }),
          },
        });

        return successResponse({ staff });
      } catch (error) {
        if (error instanceof z.ZodError) {
          const firstError = error.issues[0];
          return errorResponse('Validation error', firstError?.message || 'Invalid input', 400);
        }
        console.error('Error updating staff:', error);
        return errorResponse(
          'Failed to update staff',
          error instanceof Error ? error.message : 'Unknown error',
          500
        );
      }
    }
  );
}

// DELETE /api/real-estate/staff/[id] - Delete staff
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

      // Get existing staff
      const existing = await tenantPrisma.realEstateStaff.findUnique({
        where: { id },
      });

      if (!existing) {
        return errorResponse('Staff not found', 'Real estate staff not found', 404);
      }

      // Check tenant access
      if (existing.tenantId !== tenantContext.id) {
        return errorResponse('Forbidden', 'Access denied', 403);
      }

      // Delete staff
      await tenantPrisma.realEstateStaff.delete({
        where: { id },
      });

      return successResponse({ success: true });
    }
  );
}

