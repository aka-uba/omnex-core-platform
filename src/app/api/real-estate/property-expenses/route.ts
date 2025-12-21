import { NextRequest } from 'next/server';
import { withTenant } from '@/lib/api/withTenant';
import { successResponse, errorResponse } from '@/lib/api/errorHandler';
import type { ApiResponse } from '@/lib/api/errorHandler';
import { propertyExpenseCreateSchema } from '@/modules/real-estate/schemas/property-expense.schema';
import { getTenantFromRequest } from '@/lib/api/tenantContext';
import { Prisma } from '@prisma/tenant-client';

// GET /api/real-estate/property-expenses - List property expenses
export async function GET(request: NextRequest) {
  return withTenant<ApiResponse<{ expenses: unknown[]; total: number; page: number; pageSize: number }>>(
    request,
    async (tenantPrisma) => {
      const searchParams = request.nextUrl.searchParams;

      // Parse query parameters
      const page = parseInt(searchParams.get('page') || '1', 10) || 1;
      const pageSize = parseInt(searchParams.get('pageSize') || '50', 10) || 50;
      const propertyId = searchParams.get('propertyId') || undefined;
      const year = searchParams.get('year') ? parseInt(searchParams.get('year')!, 10) : undefined;
      const month = searchParams.get('month') ? parseInt(searchParams.get('month')!, 10) : undefined;
      const category = searchParams.get('category') || undefined;
      const isDistributed = searchParams.get('isDistributed') === 'true' ? true : searchParams.get('isDistributed') === 'false' ? false : undefined;
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
      const where: Prisma.PropertyExpenseWhereInput = {
        tenantId: tenantContext.id,
        isActive: true,
        ...(finalCompanyId && { companyId: finalCompanyId }),
        ...(propertyId && { propertyId }),
        ...(year && { year }),
        ...(month && { month }),
        ...(category && { category }),
        ...(isDistributed !== undefined && { isDistributed }),
      };

      // Get total count
      const total = await tenantPrisma.propertyExpense.count({ where });

      // Get paginated expenses
      const expenses = await tenantPrisma.propertyExpense.findMany({
        where,
        skip: (page - 1) * pageSize,
        take: pageSize,
        orderBy: [{ year: 'desc' }, { month: 'desc' }, { expenseDate: 'desc' }],
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
        expenses: expenses.map(expense => ({
          ...expense,
          amount: Number(expense.amount),
          expenseDate: expense.expenseDate.toISOString(),
          distributedAt: expense.distributedAt?.toISOString() || null,
          createdAt: expense.createdAt.toISOString(),
          updatedAt: expense.updatedAt.toISOString(),
        })),
        total,
        page,
        pageSize,
      });
    },
    { required: true, module: 'real-estate' }
  );
}

// POST /api/real-estate/property-expenses - Create property expense
export async function POST(request: NextRequest) {
  return withTenant<ApiResponse<{ expense: unknown }>>(
    request,
    async (tenantPrisma) => {
      const body = await request.json();

      // Validate input
      const validationResult = propertyExpenseCreateSchema.safeParse(body);
      if (!validationResult.success) {
        return errorResponse(
          'Validation error',
          validationResult.error.errors.map(e => e.message).join(', '),
          400
        );
      }

      const data = validationResult.data;

      // Get tenant context
      const tenantContext = await getTenantFromRequest(request);
      if (!tenantContext) {
        return errorResponse('Tenant context required', 'Tenant context could not be determined', 400);
      }

      // Get company from property
      const property = await tenantPrisma.property.findFirst({
        where: {
          id: data.propertyId,
          tenantId: tenantContext.id,
        },
        select: { companyId: true },
      });

      if (!property) {
        return errorResponse('Property not found', 'The specified property does not exist', 404);
      }

      // Create expense
      const expense = await tenantPrisma.propertyExpense.create({
        data: {
          tenantId: tenantContext.id,
          companyId: property.companyId,
          propertyId: data.propertyId,
          name: data.name,
          category: data.category,
          amount: data.amount,
          expenseDate: new Date(data.expenseDate),
          year: data.year,
          month: data.month,
          description: data.description,
          receiptUrl: data.receiptUrl || null,
          invoiceNumber: data.invoiceNumber,
          vendorName: data.vendorName,
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
          createdAt: expense.createdAt.toISOString(),
          updatedAt: expense.updatedAt.toISOString(),
        },
      });
    },
    { required: true, module: 'real-estate' }
  );
}
