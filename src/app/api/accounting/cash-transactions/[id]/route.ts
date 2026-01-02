import { NextRequest } from 'next/server';
import { withTenant } from '@/lib/api/withTenant';
import { successResponse, errorResponse } from '@/lib/api/errorHandler';
import type { ApiResponse } from '@/lib/api/errorHandler';
import { getTenantFromRequest } from '@/lib/api/tenantContext';
import { getAuditContext, logUpdate, logDelete } from '@/lib/api/auditHelper';
import { z } from 'zod';

interface RouteParams {
  params: Promise<{
    id: string;
  }>;
}

// Validation schema for update
const cashTransactionUpdateSchema = z.object({
  type: z.enum(['income', 'expense']).optional(),
  category: z.string().min(1).optional(),
  amount: z.number().positive().optional(),
  currency: z.string().optional(),
  transactionDate: z.string().optional(),
  paymentMethod: z.string().min(1).optional(),
  paymentId: z.string().optional().nullable(),
  expenseId: z.string().optional().nullable(),
  invoiceId: z.string().optional().nullable(),
  description: z.string().optional().nullable(),
  reference: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
  status: z.enum(['pending', 'completed', 'cancelled']).optional(),
  createdBy: z.string().optional().nullable(),
});

// GET /api/accounting/cash-transactions/[id] - Get cash transaction by ID
export async function GET(request: NextRequest, { params }: RouteParams) {
  return withTenant<ApiResponse<{ transaction: unknown }>>(
    request,
    async (tenantPrisma) => {
      const { id } = await params;

      // Get tenant context
      const tenantContext = await getTenantFromRequest(request);
      if (!tenantContext) {
        return errorResponse('Tenant context required', 'Tenant context could not be determined', 400);
      }

      // Get transaction
      const transaction = await tenantPrisma.cashTransaction.findFirst({
        where: {
          id,
          tenantId: tenantContext.id,
        },
      });

      if (!transaction) {
        return errorResponse('Not found', 'Cash transaction not found', 404);
      }

      return successResponse({
        transaction: {
          ...transaction,
          amount: Number(transaction.amount),
          transactionDate: transaction.transactionDate.toISOString(),
          createdAt: transaction.createdAt.toISOString(),
          updatedAt: transaction.updatedAt.toISOString(),
        },
      });
    },
    { required: true, module: 'accounting' }
  );
}

// PATCH /api/accounting/cash-transactions/[id] - Update cash transaction
export async function PATCH(request: NextRequest, { params }: RouteParams) {
  return withTenant<ApiResponse<{ transaction: unknown }>>(
    request,
    async (tenantPrisma) => {
      const { id } = await params;
      const body = await request.json();

      // Validate request body
      const validatedData = cashTransactionUpdateSchema.parse(body);

      // Get tenant context
      const tenantContext = await getTenantFromRequest(request);
      if (!tenantContext) {
        return errorResponse('Tenant context required', 'Tenant context could not be determined', 400);
      }

      // Check if transaction exists
      const existingTransaction = await tenantPrisma.cashTransaction.findFirst({
        where: {
          id,
          tenantId: tenantContext.id,
        },
      });

      if (!existingTransaction) {
        return errorResponse('Not found', 'Cash transaction not found', 404);
      }

      // Update transaction
      const updatedTransaction = await tenantPrisma.cashTransaction.update({
        where: { id },
        data: {
          ...(validatedData.type && { type: validatedData.type }),
          ...(validatedData.category && { category: validatedData.category }),
          ...(validatedData.amount !== undefined && { amount: validatedData.amount }),
          ...(validatedData.currency && { currency: validatedData.currency }),
          ...(validatedData.transactionDate && { transactionDate: new Date(validatedData.transactionDate) }),
          ...(validatedData.paymentMethod && { paymentMethod: validatedData.paymentMethod }),
          ...(validatedData.paymentId !== undefined && { paymentId: validatedData.paymentId }),
          ...(validatedData.expenseId !== undefined && { expenseId: validatedData.expenseId }),
          ...(validatedData.invoiceId !== undefined && { invoiceId: validatedData.invoiceId }),
          ...(validatedData.description !== undefined && { description: validatedData.description }),
          ...(validatedData.reference !== undefined && { reference: validatedData.reference }),
          ...(validatedData.notes !== undefined && { notes: validatedData.notes }),
          ...(validatedData.status && { status: validatedData.status }),
          ...(validatedData.createdBy !== undefined && { createdBy: validatedData.createdBy }),
        },
      });

      // Log audit event
      const auditContext = await getAuditContext(request);
      logUpdate(tenantContext, auditContext, 'CashTransaction', id, existingTransaction, updatedTransaction, existingTransaction.companyId);

      return successResponse({
        transaction: {
          ...updatedTransaction,
          amount: Number(updatedTransaction.amount),
          transactionDate: updatedTransaction.transactionDate.toISOString(),
          createdAt: updatedTransaction.createdAt.toISOString(),
          updatedAt: updatedTransaction.updatedAt.toISOString(),
        },
      });
    },
    { required: true, module: 'accounting' }
  );
}

// DELETE /api/accounting/cash-transactions/[id] - Delete cash transaction
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

      // Check if transaction exists
      const existingTransaction = await tenantPrisma.cashTransaction.findFirst({
        where: {
          id,
          tenantId: tenantContext.id,
        },
      });

      if (!existingTransaction) {
        return errorResponse('Not found', 'Cash transaction not found', 404);
      }

      // Hard delete
      await tenantPrisma.cashTransaction.delete({
        where: { id },
      });

      // Log audit event
      const auditContext = await getAuditContext(request);
      logDelete(tenantContext, auditContext, 'CashTransaction', id, existingTransaction.companyId, {
        type: existingTransaction.type,
        category: existingTransaction.category,
        amount: Number(existingTransaction.amount),
      });

      return successResponse({ message: 'Cash transaction deleted successfully' });
    },
    { required: true, module: 'accounting' }
  );
}
