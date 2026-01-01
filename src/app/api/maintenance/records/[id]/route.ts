import { NextRequest } from 'next/server';
import { withTenant } from '@/lib/api/withTenant';
import { successResponse, errorResponse } from '@/lib/api/errorHandler';
import type { ApiResponse } from '@/lib/api/errorHandler';
import { maintenanceRecordUpdateSchema } from '@/modules/maintenance/schemas/maintenance.schema';
import { getTenantFromRequest } from '@/lib/api/tenantContext';
import { getAuditContext, logUpdate, logDelete } from '@/lib/api/auditHelper';

interface RouteParams {
  params: Promise<{ id: string }>;
}

// GET /api/maintenance/records/[id] - Get maintenance record
export async function GET(request: NextRequest, { params }: RouteParams) {
  return withTenant<ApiResponse<{ record: unknown }>>(
    request,
    async (tenantPrisma) => {
      const { id } = await params;

      // Get tenant context
      const tenantContext = await getTenantFromRequest(request);
      if (!tenantContext) {
        return errorResponse('Tenant context required', 'Tenant context could not be determined', 400);
      }

      // Get maintenance record
      const record = await tenantPrisma.maintenanceRecord.findUnique({
        where: { id },
        include: {
          location: {
            select: {
              id: true,
              name: true,
            },
          },
          equipment: {
            select: {
              id: true,
              name: true,
              code: true,
            },
          },
        },
      });

      if (!record) {
        return errorResponse('Not found', 'Maintenance record not found', 404);
      }

      // Note: withTenant already provides tenant isolation via per-tenant database

      return successResponse({
        record: {
          ...record,
          estimatedCost: record.estimatedCost ? Number(record.estimatedCost) : null,
          actualCost: record.actualCost ? Number(record.actualCost) : null,
          scheduledDate: record.scheduledDate.toISOString(),
          startDate: record.startDate?.toISOString() || null,
          endDate: record.endDate?.toISOString() || null,
          createdAt: record.createdAt.toISOString(),
          updatedAt: record.updatedAt.toISOString(),
        },
      });
    },
    { required: true, module: 'maintenance' }
  );
}

// PATCH /api/maintenance/records/[id] - Update maintenance record
export async function PATCH(request: NextRequest, { params }: RouteParams) {
  return withTenant<ApiResponse<{ record: unknown }>>(
    request,
    async (tenantPrisma) => {
      const { id } = await params;
      const body = await request.json();

      // Validate request body
      const validatedData = maintenanceRecordUpdateSchema.parse(body);

      // Get tenant context
      const tenantContext = await getTenantFromRequest(request);
      if (!tenantContext) {
        return errorResponse('Tenant context required', 'Tenant context could not be determined', 400);
      }

      // Check if record exists
      const existingRecord = await tenantPrisma.maintenanceRecord.findUnique({
        where: { id },
      });

      if (!existingRecord) {
        return errorResponse('Not found', 'Maintenance record not found', 404);
      }

      // Note: withTenant already provides tenant isolation via per-tenant database
      // Verify location if provided
      if (validatedData.locationId) {
        const location = await tenantPrisma.location.findUnique({
          where: { id: validatedData.locationId },
          select: { id: true, tenantId: true },
        });

        if (!location || location.tenantId !== tenantContext.id) {
          return errorResponse('Validation error', 'Location not found', 404);
        }
      }

      // Verify equipment if provided
      if (validatedData.equipmentId) {
        const equipment = await tenantPrisma.equipment.findUnique({
          where: { id: validatedData.equipmentId },
          select: { id: true, tenantId: true },
        });

        if (!equipment || equipment.tenantId !== tenantContext.id) {
          return errorResponse('Validation error', 'Equipment not found', 404);
        }
      }

      // Get old record for comparison
      const oldRecord = await tenantPrisma.maintenanceRecord.findUnique({
        where: { id },
        select: {
          status: true,
          scheduledDate: true,
          assignedTo: true,
        },
      });

      // Update maintenance record
      const updateData: Record<string, unknown> = {};

      if (validatedData.locationId !== undefined) updateData.locationId = validatedData.locationId;
      if (validatedData.equipmentId !== undefined) updateData.equipmentId = validatedData.equipmentId;
      if (validatedData.type !== undefined) updateData.type = validatedData.type;
      if (validatedData.title !== undefined) updateData.title = validatedData.title;
      if (validatedData.description !== undefined) updateData.description = validatedData.description;
      if (validatedData.status !== undefined) updateData.status = validatedData.status;
      if (validatedData.scheduledDate !== undefined) updateData.scheduledDate = new Date(validatedData.scheduledDate);
      if (validatedData.startDate !== undefined) updateData.startDate = validatedData.startDate ? new Date(validatedData.startDate) : null;
      if (validatedData.endDate !== undefined) updateData.endDate = validatedData.endDate ? new Date(validatedData.endDate) : null;
      if (validatedData.assignedTo !== undefined) updateData.assignedTo = validatedData.assignedTo;
      if (validatedData.performedBy !== undefined) updateData.performedBy = validatedData.performedBy;
      if (validatedData.estimatedCost !== undefined) updateData.estimatedCost = validatedData.estimatedCost;
      if (validatedData.actualCost !== undefined) updateData.actualCost = validatedData.actualCost;
      if (validatedData.notes !== undefined) updateData.notes = validatedData.notes;
      if (validatedData.documents !== undefined) updateData.documents = validatedData.documents;
      if (validatedData.isActive !== undefined) updateData.isActive = validatedData.isActive;

      const updatedRecord = await tenantPrisma.maintenanceRecord.update({
        where: { id },
        data: updateData,
        include: {
          location: {
            select: {
              id: true,
              name: true,
            },
          },
          equipment: {
            select: {
              id: true,
              name: true,
              code: true,
            },
          },
        },
      });

      // Send notification (non-blocking)
      try {
        const userId = request.headers.get('x-user-id') || undefined;
        const { notifyMaintenanceUpdated } = await import('@/modules/maintenance/services/maintenanceNotificationService');
        
        // Determine what changed
        const changes: Record<string, unknown> = {};
        if (oldRecord && validatedData.status !== undefined && oldRecord.status !== validatedData.status) {
          changes.status = { from: oldRecord.status, to: validatedData.status };
        }
        if (oldRecord && validatedData.assignedTo !== undefined && oldRecord.assignedTo !== validatedData.assignedTo) {
          changes.assignedTo = { from: oldRecord.assignedTo, to: validatedData.assignedTo };
        }
        if (oldRecord && validatedData.scheduledDate !== undefined) {
          const oldDate = oldRecord.scheduledDate.toISOString();
          const newDate = new Date(validatedData.scheduledDate).toISOString();
          if (oldDate !== newDate) {
            changes.scheduledDate = { from: oldDate, to: newDate };
          }
        }

        await notifyMaintenanceUpdated(
          {
            ...updatedRecord,
            estimatedCost: updatedRecord.estimatedCost ? Number(updatedRecord.estimatedCost) : null,
            actualCost: updatedRecord.actualCost ? Number(updatedRecord.actualCost) : null,
            scheduledDate: updatedRecord.scheduledDate,
            startDate: updatedRecord.startDate || null,
            endDate: updatedRecord.endDate || null,
            createdAt: updatedRecord.createdAt,
            updatedAt: updatedRecord.updatedAt,
          } as any,
          userId,
          Object.keys(changes).length > 0 ? changes : undefined
        );
      } catch (notificationError) {
        // Log but don't fail the request
        console.error('Error sending maintenance updated notification:', notificationError);
      }

      // Log audit event
      const auditContext = await getAuditContext(request);
      logUpdate(tenantContext, auditContext, 'MaintenanceRecord', id, existingRecord, updatedRecord, existingRecord.companyId || undefined);

      return successResponse({
        record: {
          ...updatedRecord,
          estimatedCost: updatedRecord.estimatedCost ? Number(updatedRecord.estimatedCost) : null,
          actualCost: updatedRecord.actualCost ? Number(updatedRecord.actualCost) : null,
          scheduledDate: updatedRecord.scheduledDate.toISOString(),
          startDate: updatedRecord.startDate?.toISOString() || null,
          endDate: updatedRecord.endDate?.toISOString() || null,
          createdAt: updatedRecord.createdAt.toISOString(),
          updatedAt: updatedRecord.updatedAt.toISOString(),
        },
      });
    },
    { required: true, module: 'maintenance' }
  );
}

// DELETE /api/maintenance/records/[id] - Delete maintenance record
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

      // Check if record exists
      const existingRecord = await tenantPrisma.maintenanceRecord.findUnique({
        where: { id },
      });

      if (!existingRecord) {
        return errorResponse('Not found', 'Maintenance record not found', 404);
      }

      // Log audit event
      const auditContext = await getAuditContext(request);
      logDelete(tenantContext, auditContext, 'MaintenanceRecord', id, existingRecord.companyId || undefined, {
        title: existingRecord.title,
        type: existingRecord.type,
      });

      // Note: withTenant already provides tenant isolation via per-tenant database
      // Delete maintenance record
      await tenantPrisma.maintenanceRecord.delete({
        where: { id },
      });

      return successResponse({
        message: 'Maintenance record deleted successfully',
      });
    },
    { required: true, module: 'maintenance' }
  );
}

