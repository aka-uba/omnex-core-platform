import { NextRequest } from 'next/server';
import { withTenant } from '@/lib/api/withTenant';
import { successResponse, errorResponse } from '@/lib/api/errorHandler';
import type { ApiResponse } from '@/lib/api/errorHandler';
import { propertyExpenseUpdateSchema } from '@/modules/real-estate/schemas/property-expense.schema';
import { getTenantFromRequest } from '@/lib/api/tenantContext';

interface RouteParams {
  params: Promise<{ id: string }>;
}

// GET /api/real-estate/property-expenses/[id] - Get single expense
export async function GET(request: NextRequest, { params }: RouteParams) {
  const { id } = await params;

  return withTenant<ApiResponse<{ expense: unknown }>>(
    request,
    async (tenantPrisma) => {
      const tenantContext = await getTenantFromRequest(request);
      if (!tenantContext) {
        return errorResponse('Tenant context required', 'Tenant context could not be determined', 400);
      }

      const expense = await tenantPrisma.propertyExpense.findFirst({
        where: {
          id,
          tenantId: tenantContext.id,
        },
        include: {
          property: {
            select: {
              id: true,
              name: true,
              apartments: {
                select: {
                  id: true,
                  unitNumber: true,
                  area: true,
                },
              },
            },
          },
        },
      });

      if (!expense) {
        return errorResponse('Expense not found', 'The specified expense does not exist', 404);
      }

      return successResponse({
        expense: {
          ...expense,
          amount: Number(expense.amount),
          expenseDate: expense.expenseDate.toISOString(),
          distributedAt: expense.distributedAt?.toISOString() || null,
          createdAt: expense.createdAt.toISOString(),
          updatedAt: expense.updatedAt.toISOString(),
        },
      });
    },
    { required: true, module: 'real-estate' }
  );
}

// PUT /api/real-estate/property-expenses/[id] - Update expense
export async function PUT(request: NextRequest, { params }: RouteParams) {
  const { id } = await params;

  return withTenant<ApiResponse<{ expense: unknown }>>(
    request,
    async (tenantPrisma) => {
      const body = await request.json();

      // Validate input
      const validationResult = propertyExpenseUpdateSchema.safeParse(body);
      if (!validationResult.success) {
        return errorResponse(
          'Validation error',
          validationResult.error.errors.map(e => e.message).join(', '),
          400
        );
      }

      const data = validationResult.data;

      const tenantContext = await getTenantFromRequest(request);
      if (!tenantContext) {
        return errorResponse('Tenant context required', 'Tenant context could not be determined', 400);
      }

      // Check if expense exists
      const existingExpense = await tenantPrisma.propertyExpense.findFirst({
        where: {
          id,
          tenantId: tenantContext.id,
        },
      });

      if (!existingExpense) {
        return errorResponse('Expense not found', 'The specified expense does not exist', 404);
      }

      // Update expense
      const expense = await tenantPrisma.propertyExpense.update({
        where: { id },
        data: {
          ...(data.name && { name: data.name }),
          ...(data.category && { category: data.category }),
          ...(data.amount !== undefined && { amount: data.amount }),
          ...(data.expenseDate && { expenseDate: new Date(data.expenseDate) }),
          ...(data.year && { year: data.year }),
          ...(data.month !== undefined && { month: data.month }),
          ...(data.description !== undefined && { description: data.description }),
          ...(data.receiptUrl !== undefined && { receiptUrl: data.receiptUrl || null }),
          ...(data.invoiceNumber !== undefined && { invoiceNumber: data.invoiceNumber }),
          ...(data.vendorName !== undefined && { vendorName: data.vendorName }),
          ...(data.isActive !== undefined && { isActive: data.isActive }),
          ...(data.isDistributed !== undefined && { isDistributed: data.isDistributed }),
          ...(data.distributionMethod !== undefined && { distributionMethod: data.distributionMethod }),
        },
        include: {
          property: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      });

      return successResponse({
        expense: {
          ...expense,
          amount: Number(expense.amount),
          expenseDate: expense.expenseDate.toISOString(),
          distributedAt: expense.distributedAt?.toISOString() || null,
          createdAt: expense.createdAt.toISOString(),
          updatedAt: expense.updatedAt.toISOString(),
        },
      });
    },
    { required: true, module: 'real-estate' }
  );
}

// DELETE /api/real-estate/property-expenses/[id] - Soft delete expense
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  const { id } = await params;

  return withTenant<ApiResponse<{ success: boolean }>>(
    request,
    async (tenantPrisma) => {
      const tenantContext = await getTenantFromRequest(request);
      if (!tenantContext) {
        return errorResponse('Tenant context required', 'Tenant context could not be determined', 400);
      }

      // Check if expense exists
      const existingExpense = await tenantPrisma.propertyExpense.findFirst({
        where: {
          id,
          tenantId: tenantContext.id,
        },
      });

      if (!existingExpense) {
        return errorResponse('Expense not found', 'The specified expense does not exist', 404);
      }

      // Soft delete
      await tenantPrisma.propertyExpense.update({
        where: { id },
        data: { isActive: false },
      });

      return successResponse({ success: true });
    },
    { required: true, module: 'real-estate' }
  );
}
