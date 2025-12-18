import { NextRequest } from 'next/server';
import { withTenant } from '@/lib/api/withTenant';
import { successResponse, errorResponse } from '@/lib/api/errorHandler';
import type { ApiResponse } from '@/lib/api/errorHandler';
import { payrollUpdateSchema } from '@/modules/hr/schemas/hr.schema';
import { getTenantFromRequest } from '@/lib/api/tenantContext';

interface RouteParams {
  params: Promise<{ id: string }>;
}

// GET /api/hr/payrolls/[id] - Get payroll
export async function GET(request: NextRequest, { params }: RouteParams) {
  return withTenant<ApiResponse<{ payroll: unknown }>>(
    request,
    async (tenantPrisma) => {
      const { id } = await params;

      // Get tenant context
      const tenantContext = await getTenantFromRequest(request);
      if (!tenantContext) {
        return errorResponse('Tenant context required', 'Tenant context could not be determined', 400);
      }

      // Get payroll
      const payroll = await tenantPrisma.payroll.findUnique({
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

      if (!payroll || payroll.tenantId !== tenantContext.id) {
        return errorResponse('Not found', 'Payroll not found', 404);
      }

      return successResponse({
        payroll: {
          ...payroll,
          grossSalary: Number(payroll.grossSalary),
          deductions: Number(payroll.deductions),
          netSalary: Number(payroll.netSalary),
          taxDeduction: payroll.taxDeduction ? Number(payroll.taxDeduction) : null,
          sgkDeduction: payroll.sgkDeduction ? Number(payroll.sgkDeduction) : null,
          otherDeductions: payroll.otherDeductions ? Number(payroll.otherDeductions) : null,
          bonuses: Number(payroll.bonuses),
          overtime: Number(payroll.overtime),
          payDate: payroll.payDate.toISOString(),
          createdAt: payroll.createdAt.toISOString(),
          updatedAt: payroll.updatedAt.toISOString(),
        },
      });
    },
    { required: true, module: 'hr' }
  );
}

// PATCH /api/hr/payrolls/[id] - Update payroll
export async function PATCH(request: NextRequest, { params }: RouteParams) {
  return withTenant<ApiResponse<{ payroll: unknown }>>(
    request,
    async (tenantPrisma) => {
      const { id } = await params;
      const body = await request.json();

      // Validate request body
      const validatedData = payrollUpdateSchema.parse(body);

      // Get tenant context
      const tenantContext = await getTenantFromRequest(request);
      if (!tenantContext) {
        return errorResponse('Tenant context required', 'Tenant context could not be determined', 400);
      }

      // Check if payroll exists
      const existingPayroll = await tenantPrisma.payroll.findUnique({
        where: { id },
        select: { id: true, tenantId: true },
      });

      if (!existingPayroll || existingPayroll.tenantId !== tenantContext.id) {
        return errorResponse('Not found', 'Payroll not found', 404);
      }

      // Update payroll
      const updateData: Record<string, unknown> = {};

      if (validatedData.employeeId !== undefined) updateData.employeeId = validatedData.employeeId;
      if (validatedData.period !== undefined) updateData.period = validatedData.period;
      if (validatedData.payDate !== undefined) updateData.payDate = new Date(validatedData.payDate);
      if (validatedData.grossSalary !== undefined) updateData.grossSalary = validatedData.grossSalary;
      if (validatedData.deductions !== undefined) updateData.deductions = validatedData.deductions;
      if (validatedData.netSalary !== undefined) updateData.netSalary = validatedData.netSalary;
      if (validatedData.taxDeduction !== undefined) updateData.taxDeduction = validatedData.taxDeduction;
      if (validatedData.sgkDeduction !== undefined) updateData.sgkDeduction = validatedData.sgkDeduction;
      if (validatedData.otherDeductions !== undefined) updateData.otherDeductions = validatedData.otherDeductions;
      if (validatedData.bonuses !== undefined) updateData.bonuses = validatedData.bonuses;
      if (validatedData.overtime !== undefined) updateData.overtime = validatedData.overtime;
      if (validatedData.status !== undefined) updateData.status = validatedData.status;
      if (validatedData.notes !== undefined) updateData.notes = validatedData.notes;

      const updatedPayroll = await tenantPrisma.payroll.update({
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

      return successResponse({
        payroll: {
          ...updatedPayroll,
          grossSalary: Number(updatedPayroll.grossSalary),
          deductions: Number(updatedPayroll.deductions),
          netSalary: Number(updatedPayroll.netSalary),
          taxDeduction: updatedPayroll.taxDeduction ? Number(updatedPayroll.taxDeduction) : null,
          sgkDeduction: updatedPayroll.sgkDeduction ? Number(updatedPayroll.sgkDeduction) : null,
          otherDeductions: updatedPayroll.otherDeductions ? Number(updatedPayroll.otherDeductions) : null,
          bonuses: Number(updatedPayroll.bonuses),
          overtime: Number(updatedPayroll.overtime),
          payDate: updatedPayroll.payDate.toISOString(),
          createdAt: updatedPayroll.createdAt.toISOString(),
          updatedAt: updatedPayroll.updatedAt.toISOString(),
        },
      });
    },
    { required: true, module: 'hr' }
  );
}

// DELETE /api/hr/payrolls/[id] - Delete payroll
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

      // Check if payroll exists
      const existingPayroll = await tenantPrisma.payroll.findUnique({
        where: { id },
        select: { id: true, tenantId: true },
      });

      if (!existingPayroll || existingPayroll.tenantId !== tenantContext.id) {
        return errorResponse('Not found', 'Payroll not found', 404);
      }

      // Delete payroll
      await tenantPrisma.payroll.delete({
        where: { id },
      });

      return successResponse({
        message: 'Payroll deleted successfully',
      });
    },
    { required: true, module: 'hr' }
  );
}







