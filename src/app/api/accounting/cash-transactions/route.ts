import { NextRequest } from 'next/server';
import { withTenant } from '@/lib/api/withTenant';
import { successResponse, errorResponse } from '@/lib/api/errorHandler';
import type { ApiResponse } from '@/lib/api/errorHandler';
import { getTenantFromRequest } from '@/lib/api/tenantContext';
import { Prisma } from '@prisma/tenant-client';
import { z } from 'zod';

// Validation schemas
const cashTransactionCreateSchema = z.object({
  type: z.enum(['income', 'expense']),
  category: z.string().min(1),
  amount: z.number().positive(),
  currency: z.string().default('TRY'),
  transactionDate: z.string(),
  paymentMethod: z.string().min(1),
  paymentId: z.string().optional().nullable(),
  expenseId: z.string().optional().nullable(),
  invoiceId: z.string().optional().nullable(),
  description: z.string().optional().nullable(),
  reference: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
  status: z.enum(['pending', 'completed', 'cancelled']).default('completed'),
});

// GET /api/accounting/cash-transactions - List cash transactions
export async function GET(request: NextRequest) {
  return withTenant<ApiResponse<{ transactions: unknown[]; total: number; page: number; pageSize: number; summary: { totalIncome: number; totalExpense: number; balance: number } }>>(
    request,
    async (tenantPrisma) => {
      const searchParams = request.nextUrl.searchParams;

      // Parse query parameters
      const page = parseInt(searchParams.get('page') || '1', 10) || 1;
      const pageSize = parseInt(searchParams.get('pageSize') || '10', 10) || 10;
      const search = searchParams.get('search') || undefined;
      const type = searchParams.get('type') || undefined;
      const category = searchParams.get('category') || undefined;
      const paymentMethod = searchParams.get('paymentMethod') || undefined;
      const status = searchParams.get('status') || undefined;
      const startDate = searchParams.get('startDate') || undefined;
      const endDate = searchParams.get('endDate') || undefined;
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
      const where: Prisma.CashTransactionWhereInput = {
        tenantId: tenantContext.id,
        ...(finalCompanyId && { companyId: finalCompanyId }),
        ...(search && {
          OR: [
            { description: { contains: search, mode: 'insensitive' } },
            { reference: { contains: search, mode: 'insensitive' } },
            { notes: { contains: search, mode: 'insensitive' } },
          ],
        }),
        ...(type && { type }),
        ...(category && { category }),
        ...(paymentMethod && { paymentMethod }),
        ...(status && { status }),
        ...(startDate && endDate && {
          transactionDate: {
            gte: new Date(startDate),
            lte: new Date(endDate),
          },
        }),
        ...(startDate && !endDate && {
          transactionDate: {
            gte: new Date(startDate),
          },
        }),
        ...(endDate && !startDate && {
          transactionDate: {
            lte: new Date(endDate),
          },
        }),
      };

      // Get total count
      const total = await tenantPrisma.cashTransaction.count({ where });

      // Get paginated transactions
      const transactions = await tenantPrisma.cashTransaction.findMany({
        where,
        skip: (page - 1) * pageSize,
        take: pageSize,
        orderBy: { transactionDate: 'desc' },
      });

      // Calculate summary for the filtered results (without pagination)
      const allTransactions = await tenantPrisma.cashTransaction.findMany({
        where,
        select: {
          type: true,
          amount: true,
        },
      });

      let totalIncome = 0;
      let totalExpense = 0;
      allTransactions.forEach(t => {
        const amount = Number(t.amount);
        if (t.type === 'income') {
          totalIncome += amount;
        } else {
          totalExpense += amount;
        }
      });

      return successResponse({
        transactions: transactions.map(transaction => ({
          ...transaction,
          amount: Number(transaction.amount),
          transactionDate: transaction.transactionDate.toISOString(),
          createdAt: transaction.createdAt.toISOString(),
          updatedAt: transaction.updatedAt.toISOString(),
        })),
        total,
        page,
        pageSize,
        summary: {
          totalIncome,
          totalExpense,
          balance: totalIncome - totalExpense,
        },
      });
    },
    { required: true, module: 'accounting' }
  );
}

// POST /api/accounting/cash-transactions - Create cash transaction
export async function POST(request: NextRequest) {
  return withTenant<ApiResponse<{ transaction: unknown }>>(
    request,
    async (tenantPrisma) => {
      const body = await request.json();

      // Validate request body
      const validatedData = cashTransactionCreateSchema.parse(body);

      // Get tenant context
      const tenantContext = await getTenantFromRequest(request);
      if (!tenantContext) {
        return errorResponse('Tenant context required', 'Tenant context could not be determined', 400);
      }

      // Get companyId from body or first company
      let companyId = body.companyId;
      if (!companyId) {
        const firstCompany = await tenantPrisma.company.findFirst({
          select: { id: true },
          orderBy: { createdAt: 'asc' },
        });

        if (!firstCompany) {
          return errorResponse('Validation error', 'No company found for tenant', 404);
        }
        companyId = firstCompany.id;
      }

      // Create cash transaction
      const newTransaction = await tenantPrisma.cashTransaction.create({
        data: {
          tenantId: tenantContext.id,
          companyId: companyId,
          type: validatedData.type,
          category: validatedData.category,
          amount: validatedData.amount,
          currency: validatedData.currency,
          transactionDate: new Date(validatedData.transactionDate),
          paymentMethod: validatedData.paymentMethod,
          paymentId: validatedData.paymentId || null,
          expenseId: validatedData.expenseId || null,
          invoiceId: validatedData.invoiceId || null,
          description: validatedData.description || null,
          reference: validatedData.reference || null,
          notes: validatedData.notes || null,
          status: validatedData.status,
        },
      });

      return successResponse({
        transaction: {
          ...newTransaction,
          amount: Number(newTransaction.amount),
          transactionDate: newTransaction.transactionDate.toISOString(),
          createdAt: newTransaction.createdAt.toISOString(),
          updatedAt: newTransaction.updatedAt.toISOString(),
        },
      });
    },
    { required: true, module: 'accounting' }
  );
}
