import { NextRequest } from 'next/server';
import { withTenant } from '@/lib/api/withTenant';
import { successResponse, errorResponse } from '@/lib/api/errorHandler';
import type { ApiResponse } from '@/lib/api/errorHandler';
import { getTenantFromRequest } from '@/lib/api/tenantContext';
import { realEstateMaintenanceRecordUpdateSchema } from '@/modules/real-estate/schemas/maintenance-record.schema';
import { Prisma } from '@prisma/tenant-client';

// GET /api/real-estate/maintenance/[id] - Get single maintenance record
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return withTenant<ApiResponse<{ record: unknown }>>(
    request,
    async (tenantPrisma) => {
      const { id } = await params;

      // Get tenant context
      const tenantContext = await getTenantFromRequest(request);
      if (!tenantContext) {
        return errorResponse('Tenant context required', 'Tenant context could not be determined', 400);
      }

      // Get record
      const record = await tenantPrisma.realEstateMaintenanceRecord.findUnique({
        where: { id },
        include: {
          apartment: {
            select: {
              id: true,
              unitNumber: true,
              property: {
                select: {
                  id: true,
                  name: true,
                },
              },
            },
          },
        },
      });

      if (!record) {
        return errorResponse('Record not found', 'Maintenance record not found', 404);
      }

      // Note: withTenant already provides tenant isolation via per-tenant database

      return successResponse({ record });
    }
  );
}

// PATCH /api/real-estate/maintenance/[id] - Update maintenance record
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return withTenant<ApiResponse<{ record: unknown }>>(
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

        // Get existing record
        const existing = await tenantPrisma.realEstateMaintenanceRecord.findUnique({
          where: { id },
        });

        if (!existing) {
          return errorResponse('Record not found', 'Maintenance record not found', 404);
        }

        // Validate input
        const validationResult = realEstateMaintenanceRecordUpdateSchema.safeParse(body);
        if (!validationResult.success) {
          const firstError = validationResult.error.issues[0];
          return errorResponse('Validation error', firstError?.message || 'Invalid input', 400);
        }
        const validatedData = validationResult.data;

        // Update record
        const record = await tenantPrisma.realEstateMaintenanceRecord.update({
          where: { id },
          data: {
            ...(validatedData.apartmentId && { apartmentId: validatedData.apartmentId }),
            ...(validatedData.type && { type: validatedData.type }),
            ...(validatedData.title && { title: validatedData.title }),
            ...(validatedData.description !== undefined && { description: validatedData.description || null }),
            ...(validatedData.status && { status: validatedData.status }),
            ...(validatedData.scheduledDate && { scheduledDate: new Date(validatedData.scheduledDate) }),
            ...(validatedData.startDate !== undefined && {
              startDate: validatedData.startDate ? new Date(validatedData.startDate) : null,
            }),
            ...(validatedData.endDate !== undefined && {
              endDate: validatedData.endDate ? new Date(validatedData.endDate) : null,
            }),
            ...(validatedData.assignedStaffId !== undefined && { assignedStaffId: validatedData.assignedStaffId || null }),
            ...(validatedData.performedByStaffId !== undefined && {
              performedByStaffId: validatedData.performedByStaffId || null,
            }),
            ...(validatedData.estimatedCost !== undefined && {
              estimatedCost: validatedData.estimatedCost ? new Prisma.Decimal(validatedData.estimatedCost) : null,
            }),
            ...(validatedData.actualCost !== undefined && {
              actualCost: validatedData.actualCost ? new Prisma.Decimal(validatedData.actualCost) : null,
            }),
            ...(validatedData.documents !== undefined && { documents: validatedData.documents || [] }),
            ...(validatedData.photos !== undefined && { photos: validatedData.photos || [] }),
            ...(validatedData.notes !== undefined && { notes: validatedData.notes || null }),
          },
        });

        return successResponse({ record });
      } catch (error) {
        return errorResponse(
          'Failed to update maintenance record',
          error instanceof Error ? error.message : 'Unknown error',
          500
        );
      }
    }
  );
}

// DELETE /api/real-estate/maintenance/[id] - Delete maintenance record
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

      // Get existing record
      const existing = await tenantPrisma.realEstateMaintenanceRecord.findUnique({
        where: { id },
      });

      if (!existing) {
        return errorResponse('Record not found', 'Maintenance record not found', 404);
      }

      // Note: withTenant already provides tenant isolation via per-tenant database

      // Delete record
      await tenantPrisma.realEstateMaintenanceRecord.delete({
        where: { id },
      });

      return successResponse({ success: true });
    }
  );
}








