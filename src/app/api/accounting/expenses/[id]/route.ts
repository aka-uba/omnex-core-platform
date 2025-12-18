import { NextRequest } from 'next/server';
import { withTenant } from '@/lib/api/withTenant';
import { successResponse, errorResponse } from '@/lib/api/errorHandler';
import type { ApiResponse } from '@/lib/api/errorHandler';
import { expenseUpdateSchema } from '@/modules/accounting/schemas/subscription.schema';
import { getTenantFromRequest } from '@/lib/api/tenantContext';
interface RouteParams {
  params: Promise<{
    id: string;
  }>;
}

// GET /api/accounting/expenses/[id] - Get expense by ID
export async function GET(request: NextRequest, { params }: RouteParams) {
  return withTenant<ApiResponse<{ expense: unknown }>>(
    request,
    async (tenantPrisma) => {
      const { id } = await params;

      // Get tenant context
      const tenantContext = await getTenantFromRequest(request);
      if (!tenantContext) {
        return errorResponse('Tenant context required', 'Tenant context could not be determined', 400);
      }

      // Get expense
      const expense = await tenantPrisma.expense.findFirst({
        where: {
          id,
          tenantId: tenantContext.id,
        },
        include: {
          subscription: {
            select: {
              id: true,
              name: true,
              type: true,
            },
          },
        },
      });

      if (!expense) {
        return errorResponse('Not found', 'Expense not found', 404);
      }

      return successResponse({
        expense: {
          ...expense,
          amount: Number(expense.amount),
          expenseDate: expense.expenseDate.toISOString(),
          approvedAt: expense.approvedAt?.toISOString() || null,
          createdAt: expense.createdAt.toISOString(),
          updatedAt: expense.updatedAt.toISOString(),
        },
      });
    },
    { required: true, module: 'accounting' }
  );
}

// PATCH /api/accounting/expenses/[id] - Update expense
export async function PATCH(request: NextRequest, { params }: RouteParams) {
  return withTenant<ApiResponse<{ expense: unknown }>>(
    request,
    async (tenantPrisma) => {
      const { id } = await params;
      const body = await request.json();

      // Validate request body
      const validatedData = expenseUpdateSchema.parse(body);

      // Get tenant context
      const tenantContext = await getTenantFromRequest(request);
      if (!tenantContext) {
        return errorResponse('Tenant context required', 'Tenant context could not be determined', 400);
      }

      // Check if expense exists
      const existingExpense = await tenantPrisma.expense.findFirst({
        where: {
          id,
          tenantId: tenantContext.id,
        },
      });

      if (!existingExpense) {
        return errorResponse('Not found', 'Expense not found', 404);
      }

      // Update expense
      const updatedExpense = await tenantPrisma.expense.update({
        where: { id },
        data: {
          ...(validatedData.locationId !== undefined && { locationId: validatedData.locationId }),
          ...(validatedData.subscriptionId !== undefined && { subscriptionId: validatedData.subscriptionId }),
          ...(validatedData.name && { name: validatedData.name }),
          ...(validatedData.category && { category: validatedData.category }),
          ...(validatedData.type && { type: validatedData.type }),
          ...(validatedData.amount !== undefined && { amount: validatedData.amount }),
          ...(validatedData.currency && { currency: validatedData.currency }),
          ...(validatedData.expenseDate && { expenseDate: new Date(validatedData.expenseDate) }),
          ...(validatedData.assignedUserId !== undefined && { assignedUserId: validatedData.assignedUserId }),
          ...(validatedData.status && { status: validatedData.status }),
          ...(validatedData.approvedBy && { approvedBy: validatedData.approvedBy }),
          ...(validatedData.approvedAt && { approvedAt: new Date(validatedData.approvedAt) }),
          ...(validatedData.description !== undefined && { description: validatedData.description }),
          ...(validatedData.receiptUrl !== undefined && { receiptUrl: validatedData.receiptUrl }),
          ...(validatedData.isActive !== undefined && { isActive: validatedData.isActive }),
        },
        include: {
          subscription: {
            select: {
              id: true,
              name: true,
              type: true,
            },
          },
        },
      });

      return successResponse({
        expense: {
          ...updatedExpense,
          amount: Number(updatedExpense.amount),
          expenseDate: updatedExpense.expenseDate.toISOString(),
          approvedAt: updatedExpense.approvedAt?.toISOString() || null,
          createdAt: updatedExpense.createdAt.toISOString(),
          updatedAt: updatedExpense.updatedAt.toISOString(),
        },
      });
    },
    { required: true, module: 'accounting' }
  );
}

// DELETE /api/accounting/expenses/[id] - Delete expense
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

      // Check if expense exists
      const existingExpense = await tenantPrisma.expense.findFirst({
        where: {
          id,
          tenantId: tenantContext.id,
        },
      });

      if (!existingExpense) {
        return errorResponse('Not found', 'Expense not found', 404);
      }

      // Check if expense is approved
      if (existingExpense.status === 'approved') {
        // Soft delete instead
        await tenantPrisma.expense.update({
          where: { id },
          data: { isActive: false },
        });
        return successResponse({ message: 'Expense deactivated (cannot delete approved expenses)' });
      }

      // Hard delete
      await tenantPrisma.expense.delete({
        where: { id },
      });

      return successResponse({ message: 'Expense deleted successfully' });
    },
    { required: true, module: 'accounting' }
  );
}








