import { NextRequest } from 'next/server';
import { withTenant } from '@/lib/api/withTenant';
import { successResponse, errorResponse } from '@/lib/api/errorHandler';
import type { ApiResponse } from '@/lib/api/errorHandler';
import { employeeUpdateSchema } from '@/modules/hr/schemas/hr.schema';
import { getTenantFromRequest } from '@/lib/api/tenantContext';
import { getAuditContext, logUpdate, logDelete } from '@/lib/api/auditHelper';

interface RouteParams {
  params: Promise<{ id: string }>;
}

// GET /api/hr/employees/[id] - Get employee
export async function GET(request: NextRequest, { params }: RouteParams) {
  return withTenant<ApiResponse<{ employee: unknown }>>(
    request,
    async (tenantPrisma) => {
      const { id } = await params;

      // Get tenant context
      const tenantContext = await getTenantFromRequest(request);
      if (!tenantContext) {
        return errorResponse('Tenant context required', 'Tenant context could not be determined', 400);
      }

      // Get employee
      const employee = await tenantPrisma.employee.findUnique({
        where: { id },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              phone: true,
            },
          },
          manager: {
            select: {
              id: true,
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

      if (!employee || employee.tenantId !== tenantContext.id) {
        return errorResponse('Not found', 'Employee not found', 404);
      }

      return successResponse({
        employee: {
          ...employee,
          salary: employee.salary ? Number(employee.salary) : null,
          hireDate: employee.hireDate.toISOString(),
          createdAt: employee.createdAt.toISOString(),
          updatedAt: employee.updatedAt.toISOString(),
        },
      });
    },
    { required: true, module: 'hr' }
  );
}

// PATCH /api/hr/employees/[id] - Update employee
export async function PATCH(request: NextRequest, { params }: RouteParams) {
  return withTenant<ApiResponse<{ employee: unknown }>>(
    request,
    async (tenantPrisma) => {
      const { id } = await params;
      const body = await request.json();

      // Validate request body
      const validatedData = employeeUpdateSchema.parse(body);

      // Get tenant context
      const tenantContext = await getTenantFromRequest(request);
      if (!tenantContext) {
        return errorResponse('Tenant context required', 'Tenant context could not be determined', 400);
      }

      // Check if employee exists
      const existingEmployee = await tenantPrisma.employee.findUnique({
        where: { id },
      });

      if (!existingEmployee || existingEmployee.tenantId !== tenantContext.id) {
        return errorResponse('Not found', 'Employee not found', 404);
      }

      // Verify manager if provided
      if (validatedData.managerId) {
        const manager = await tenantPrisma.employee.findUnique({
          where: { id: validatedData.managerId },
          select: { id: true, tenantId: true },
        });

        if (!manager || manager.tenantId !== tenantContext.id) {
          return errorResponse('Validation error', 'Manager not found', 404);
        }
      }

      // Update employee
      const updateData: Record<string, unknown> = {};

      if (validatedData.employeeNumber !== undefined) updateData.employeeNumber = validatedData.employeeNumber;
      if (validatedData.department !== undefined) updateData.department = validatedData.department;
      if (validatedData.position !== undefined) updateData.position = validatedData.position;
      if (validatedData.hireDate !== undefined) updateData.hireDate = new Date(validatedData.hireDate);
      if (validatedData.managerId !== undefined) updateData.managerId = validatedData.managerId;
      if (validatedData.salary !== undefined) updateData.salary = validatedData.salary;
      if (validatedData.salaryGroup !== undefined) updateData.salaryGroup = validatedData.salaryGroup;
      if (validatedData.currency !== undefined) updateData.currency = validatedData.currency;
      if (validatedData.workType !== undefined) updateData.workType = validatedData.workType;
      if (validatedData.metadata !== undefined) updateData.metadata = validatedData.metadata;
      if (validatedData.isActive !== undefined) updateData.isActive = validatedData.isActive;

      const updatedEmployee = await tenantPrisma.employee.update({
        where: { id },
        data: updateData,
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              phone: true,
            },
          },
          manager: {
            select: {
              id: true,
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
      logUpdate(tenantContext, auditContext, 'Employee', id, existingEmployee, updatedEmployee, existingEmployee.companyId || undefined);

      return successResponse({
        employee: {
          ...updatedEmployee,
          salary: updatedEmployee.salary ? Number(updatedEmployee.salary) : null,
          hireDate: updatedEmployee.hireDate.toISOString(),
          createdAt: updatedEmployee.createdAt.toISOString(),
          updatedAt: updatedEmployee.updatedAt.toISOString(),
        },
      });
    },
    { required: true, module: 'hr' }
  );
}

// DELETE /api/hr/employees/[id] - Delete employee
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

      // Check if employee exists
      const existingEmployee = await tenantPrisma.employee.findUnique({
        where: { id },
      });

      if (!existingEmployee || existingEmployee.tenantId !== tenantContext.id) {
        return errorResponse('Not found', 'Employee not found', 404);
      }

      // Log audit event
      const auditContext = await getAuditContext(request);
      logDelete(tenantContext, auditContext, 'Employee', id, existingEmployee.companyId || undefined, {
        employeeNumber: existingEmployee.employeeNumber,
      });

      // Delete employee
      await tenantPrisma.employee.delete({
        where: { id },
      });

      return successResponse({
        message: 'Employee deleted successfully',
      });
    },
    { required: true, module: 'hr' }
  );
}







