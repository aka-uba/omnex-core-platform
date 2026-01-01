import { NextRequest } from 'next/server';
import { withTenant } from '@/lib/api/withTenant';
import { successResponse, errorResponse } from '@/lib/api/errorHandler';
import type { ApiResponse } from '@/lib/api/errorHandler';
import { leaveUpdateSchema } from '@/modules/hr/schemas/hr.schema';
import { getTenantFromRequest } from '@/lib/api/tenantContext';
import { getAuditContext, logUpdate, logDelete } from '@/lib/api/auditHelper';

interface RouteParams {
  params: Promise<{ id: string }>;
}

// GET /api/hr/leaves/[id] - Get leave
export async function GET(request: NextRequest, { params }: RouteParams) {
  return withTenant<ApiResponse<{ leave: unknown }>>(
    request,
    async (tenantPrisma) => {
      const { id } = await params;

      // Get tenant context
      const tenantContext = await getTenantFromRequest(request);
      if (!tenantContext) {
        return errorResponse('Tenant context required', 'Tenant context could not be determined', 400);
      }

      // Get leave
      const leave = await tenantPrisma.leave.findUnique({
        where: { id },
        include: {
          employee: {
            select: {
              id: true,
              employeeNumber: true,
              user: {
                select: {
                  id: true,
                  name: true,
                  email: true,
                },
              },
            },
          },
        },
      });

      if (!leave || leave.tenantId !== tenantContext.id) {
        return errorResponse('Not found', 'Leave not found', 404);
      }

      return successResponse({
        leave: {
          ...leave,
          startDate: leave.startDate.toISOString(),
          endDate: leave.endDate.toISOString(),
          approvedAt: leave.approvedAt?.toISOString() || null,
          createdAt: leave.createdAt.toISOString(),
          updatedAt: leave.updatedAt.toISOString(),
        },
      });
    },
    { required: true, module: 'hr' }
  );
}

// PATCH /api/hr/leaves/[id] - Update leave
export async function PATCH(request: NextRequest, { params }: RouteParams) {
  return withTenant<ApiResponse<{ leave: unknown }>>(
    request,
    async (tenantPrisma) => {
      const { id } = await params;
      const body = await request.json();

      // Validate request body
      const validatedData = leaveUpdateSchema.parse(body);

      // Get tenant context
      const tenantContext = await getTenantFromRequest(request);
      if (!tenantContext) {
        return errorResponse('Tenant context required', 'Tenant context could not be determined', 400);
      }

      // Check if leave exists
      const existingLeave = await tenantPrisma.leave.findUnique({
        where: { id },
      });

      if (!existingLeave || existingLeave.tenantId !== tenantContext.id) {
        return errorResponse('Not found', 'Leave not found', 404);
      }

      // Update leave
      const updateData: Record<string, unknown> = {};

      if (validatedData.employeeId !== undefined) updateData.employeeId = validatedData.employeeId;
      if (validatedData.type !== undefined) updateData.type = validatedData.type;
      if (validatedData.startDate !== undefined) updateData.startDate = new Date(validatedData.startDate);
      if (validatedData.endDate !== undefined) updateData.endDate = new Date(validatedData.endDate);
      if (validatedData.days !== undefined) updateData.days = validatedData.days;
      if (validatedData.reason !== undefined) updateData.reason = validatedData.reason;
      if (validatedData.status !== undefined) {
        updateData.status = validatedData.status;
        if (validatedData.status === 'approved' && validatedData.approvedBy) {
          updateData.approvedBy = validatedData.approvedBy;
          updateData.approvedAt = new Date();
        } else if (validatedData.status === 'rejected' && validatedData.approvedBy) {
          updateData.approvedBy = validatedData.approvedBy;
          updateData.approvedAt = new Date();
        }
      }

      const updatedLeave = await tenantPrisma.leave.update({
        where: { id },
        data: updateData,
        include: {
          employee: {
            select: {
              id: true,
              employeeNumber: true,
              user: {
                select: {
                  id: true,
                  name: true,
                  email: true,
                },
              },
            },
          },
        },
      });

      // Log audit event
      const auditContext = await getAuditContext(request);
      logUpdate(tenantContext, auditContext, 'Leave', id, existingLeave, updatedLeave, existingLeave.companyId || undefined);

      return successResponse({
        leave: {
          ...updatedLeave,
          startDate: updatedLeave.startDate.toISOString(),
          endDate: updatedLeave.endDate.toISOString(),
          approvedAt: updatedLeave.approvedAt?.toISOString() || null,
          createdAt: updatedLeave.createdAt.toISOString(),
          updatedAt: updatedLeave.updatedAt.toISOString(),
        },
      });
    },
    { required: true, module: 'hr' }
  );
}

// DELETE /api/hr/leaves/[id] - Delete leave
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

      // Check if leave exists
      const existingLeave = await tenantPrisma.leave.findUnique({
        where: { id },
      });

      if (!existingLeave || existingLeave.tenantId !== tenantContext.id) {
        return errorResponse('Not found', 'Leave not found', 404);
      }

      // Log audit event
      const auditContext = await getAuditContext(request);
      logDelete(tenantContext, auditContext, 'Leave', id, existingLeave.companyId || undefined, {
        type: existingLeave.type,
        status: existingLeave.status,
      });

      // Delete leave
      await tenantPrisma.leave.delete({
        where: { id },
      });

      return successResponse({
        message: 'Leave deleted successfully',
      });
    },
    { required: true, module: 'hr' }
  );
}







