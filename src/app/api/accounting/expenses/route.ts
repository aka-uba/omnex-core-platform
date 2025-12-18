import { NextRequest } from 'next/server';
import { withTenant } from '@/lib/api/withTenant';
import { successResponse, errorResponse } from '@/lib/api/errorHandler';
import type { ApiResponse } from '@/lib/api/errorHandler';
import { expenseCreateSchema } from '@/modules/accounting/schemas/subscription.schema';
import { getTenantFromRequest } from '@/lib/api/tenantContext';
import { Prisma } from '@prisma/tenant-client';
// GET /api/accounting/expenses - List expenses
export async function GET(request: NextRequest) {
  return withTenant<ApiResponse<{ expenses: unknown[]; total: number; page: number; pageSize: number }>>(
    request,
    async (tenantPrisma) => {
      const searchParams = request.nextUrl.searchParams;
      
      // Parse query parameters
      const page = parseInt(searchParams.get('page') || '1', 10) || 1;
      const pageSize = parseInt(searchParams.get('pageSize') || '10', 10) || 10;
      const search = searchParams.get('search') || undefined;
      const category = searchParams.get('category') || undefined;
      const type = searchParams.get('type') || undefined;
      const locationId = searchParams.get('locationId') || undefined;
      const subscriptionId = searchParams.get('subscriptionId') || undefined;
      const assignedUserId = searchParams.get('assignedUserId') || undefined;
      const status = searchParams.get('status') || undefined;
      const startDate = searchParams.get('startDate') || undefined;
      const endDate = searchParams.get('endDate') || undefined;
      const isActive = searchParams.get('isActive') === 'true' ? true : searchParams.get('isActive') === 'false' ? false : undefined;
      const companyId = searchParams.get('companyId') || undefined;

      // Get tenant context
      const tenantContext = await getTenantFromRequest(request);
      if (!tenantContext) {
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
      const where: Prisma.ExpenseWhereInput = {
        tenantId: tenantContext.id,
        ...(finalCompanyId && { companyId: finalCompanyId }),
        ...(search && {
          OR: [
            { name: { contains: search, mode: 'insensitive' } },
            { description: { contains: search, mode: 'insensitive' } },
          ],
        }),
        ...(category && { category }),
        ...(type && { type }),
        ...(locationId && { locationId }),
        ...(subscriptionId && { subscriptionId }),
        ...(assignedUserId && { assignedUserId }),
        ...(status && { status }),
        ...(startDate && endDate && {
          expenseDate: {
            gte: new Date(startDate),
            lte: new Date(endDate),
          },
        }),
        ...(startDate && !endDate && {
          expenseDate: {
            gte: new Date(startDate),
          },
        }),
        ...(endDate && !startDate && {
          expenseDate: {
            lte: new Date(endDate),
          },
        }),
        ...(isActive !== undefined && { isActive }),
      };

      // Get total count
      const total = await tenantPrisma.expense.count({ where });

      // Get paginated expenses
      const expenses = await tenantPrisma.expense.findMany({
        where,
        skip: (page - 1) * pageSize,
        take: pageSize,
        orderBy: { expenseDate: 'desc' },
        include: {
          subscription: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      });

      return successResponse({
        expenses: expenses.map(expense => ({
          ...expense,
          amount: Number(expense.amount),
          expenseDate: expense.expenseDate.toISOString(),
          approvedAt: expense.approvedAt?.toISOString() || null,
          createdAt: expense.createdAt.toISOString(),
          updatedAt: expense.updatedAt.toISOString(),
        })),
        total,
        page,
        pageSize,
      });
    },
    { required: true, module: 'accounting' }
  );
}

// POST /api/accounting/expenses - Create expense
export async function POST(request: NextRequest) {
  return withTenant<ApiResponse<{ expense: unknown }>>(
    request,
    async (tenantPrisma) => {
      const body = await request.json();

      // Validate request body
      const validatedData = expenseCreateSchema.parse(body);

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

      // Create expense
      const newExpense = await tenantPrisma.expense.create({
        data: {
          tenantId: tenantContext.id,
          companyId: companyId,
          locationId: validatedData.locationId || null,
          subscriptionId: validatedData.subscriptionId || null,
          name: validatedData.name,
          category: validatedData.category,
          type: validatedData.type,
          amount: validatedData.amount,
          currency: validatedData.currency || 'TRY',
          expenseDate: new Date(validatedData.expenseDate),
          assignedUserId: validatedData.assignedUserId || null,
          description: validatedData.description || null,
          receiptUrl: validatedData.receiptUrl || null,
          status: 'pending',
          isActive: true,
        },
        include: {
          subscription: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      });

      return successResponse({
        expense: {
          ...newExpense,
          amount: Number(newExpense.amount),
          expenseDate: newExpense.expenseDate.toISOString(),
          approvedAt: newExpense.approvedAt?.toISOString() || null,
          createdAt: newExpense.createdAt.toISOString(),
          updatedAt: newExpense.updatedAt.toISOString(),
        },
      });
    },
    { required: true, module: 'accounting' }
  );
}








