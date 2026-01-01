import { NextRequest } from 'next/server';
import { withTenant } from '@/lib/api/withTenant';
import { successResponse, errorResponse } from '@/lib/api/errorHandler';
import type { ApiResponse } from '@/lib/api/errorHandler';
import { accountingPaymentCreateSchema } from '@/modules/accounting/schemas/subscription.schema';
import { getTenantFromRequest } from '@/lib/api/tenantContext';
import { Prisma } from '@prisma/tenant-client';
import { getAuditContext, logCreate } from '@/lib/api/auditHelper';
// GET /api/accounting/payments - List payments
export async function GET(request: NextRequest) {
  return withTenant<ApiResponse<{ payments: unknown[]; total: number; page: number; pageSize: number }>>(
    request,
    async (tenantPrisma) => {
      const searchParams = request.nextUrl.searchParams;
      
      // Parse query parameters
      const page = parseInt(searchParams.get('page') || '1', 10) || 1;
      const pageSize = parseInt(searchParams.get('pageSize') || '10', 10) || 10;
      const subscriptionId = searchParams.get('subscriptionId') || undefined;
      const invoiceId = searchParams.get('invoiceId') || undefined;
      const status = searchParams.get('status') || undefined;
      const paymentMethod = searchParams.get('paymentMethod') || undefined;
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
      const where: Prisma.AccountingPaymentWhereInput = {
        tenantId: tenantContext.id,
        ...(finalCompanyId && { companyId: finalCompanyId }),
        ...(subscriptionId && { subscriptionId }),
        ...(invoiceId && { invoiceId }),
        ...(status && { status }),
        ...(paymentMethod && { paymentMethod }),
        ...(startDate && endDate && {
          paymentDate: {
            gte: new Date(startDate),
            lte: new Date(endDate),
          },
        }),
        ...(startDate && !endDate && {
          paymentDate: {
            gte: new Date(startDate),
          },
        }),
        ...(endDate && !startDate && {
          paymentDate: {
            lte: new Date(endDate),
          },
        }),
      };

      // Get total count
      const total = await tenantPrisma.accountingPayment.count({ where });

      // Get paginated payments
      const payments = await tenantPrisma.accountingPayment.findMany({
        where,
        skip: (page - 1) * pageSize,
        take: pageSize,
        orderBy: { paymentDate: 'desc' },
        include: {
          subscription: {
            select: {
              id: true,
              name: true,
              type: true,
            },
          },
          invoice: {
            select: {
              id: true,
              invoiceNumber: true,
              totalAmount: true,
            },
          },
        },
      });

      return successResponse({
        payments: payments.map(payment => ({
          ...payment,
          amount: Number(payment.amount),
          paymentDate: payment.paymentDate.toISOString(),
          createdAt: payment.createdAt.toISOString(),
          updatedAt: payment.updatedAt.toISOString(),
          invoice: payment.invoice ? {
            ...payment.invoice,
            totalAmount: Number(payment.invoice.totalAmount),
          } : null,
        })),
        total,
        page,
        pageSize,
      });
    },
    { required: true, module: 'accounting' }
  );
}

// POST /api/accounting/payments - Create payment
export async function POST(request: NextRequest) {
  return withTenant<ApiResponse<{ payment: unknown; invoice?: unknown }>>(
    request,
    async (tenantPrisma) => {
      const body = await request.json();

      // Validate request body
      const validatedData = accountingPaymentCreateSchema.parse(body);

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

      // Create payment
      const newPayment = await tenantPrisma.accountingPayment.create({
        data: {
          tenantId: tenantContext.id,
          companyId: companyId,
          subscriptionId: validatedData.subscriptionId || null,
          invoiceId: validatedData.invoiceId || null,
          amount: validatedData.amount,
          currency: validatedData.currency || 'TRY',
          paymentDate: new Date(validatedData.paymentDate),
          paymentMethod: validatedData.paymentMethod,
          paymentReference: validatedData.paymentReference || null,
          status: validatedData.status || 'completed',
          notes: validatedData.notes || null,
          receiptUrl: validatedData.receiptUrl || null,
        },
        include: {
          subscription: {
            select: {
              id: true,
              name: true,
              type: true,
            },
          },
          invoice: {
            select: {
              id: true,
              invoiceNumber: true,
              totalAmount: true,
              status: true,
            },
          },
        },
      });

      // Log audit event
      const auditContext = await getAuditContext(request);
      logCreate(tenantContext, auditContext, 'AccountingPayment', newPayment.id, companyId, {
        amount: newPayment.amount.toString(),
        paymentMethod: newPayment.paymentMethod,
      });

      // Update invoice status if payment is for an invoice
      let updatedInvoice = null;
      if (validatedData.invoiceId && validatedData.status === 'completed') {
        // Get invoice
        const invoice = await tenantPrisma.invoice.findFirst({
          where: { id: validatedData.invoiceId },
        });

        if (invoice) {
          // Calculate total paid amount
          const totalPaid = await tenantPrisma.accountingPayment.aggregate({
            where: {
              invoiceId: validatedData.invoiceId,
              status: 'completed',
            },
            _sum: {
              amount: true,
            },
          });

          const paidAmount = totalPaid._sum.amount ? Number(totalPaid._sum.amount) : 0;
          const invoiceTotal = Number(invoice.totalAmount);

          // Update invoice status
          const newStatus = paidAmount >= invoiceTotal ? 'paid' : invoice.status === 'draft' ? 'sent' : invoice.status;
          
          updatedInvoice = await tenantPrisma.invoice.update({
            where: { id: validatedData.invoiceId },
            data: {
              status: newStatus,
              paidDate: paidAmount >= invoiceTotal ? new Date() : invoice.paidDate,
            },
          });
        }
      }

      return successResponse({
        payment: {
          ...newPayment,
          amount: Number(newPayment.amount),
          paymentDate: newPayment.paymentDate.toISOString(),
          createdAt: newPayment.createdAt.toISOString(),
          updatedAt: newPayment.updatedAt.toISOString(),
          invoice: newPayment.invoice ? {
            ...newPayment.invoice,
            totalAmount: Number(newPayment.invoice.totalAmount),
          } : null,
        },
        invoice: updatedInvoice ? {
          ...updatedInvoice,
          subtotal: Number(updatedInvoice.subtotal),
          taxRate: updatedInvoice.taxRate ? Number(updatedInvoice.taxRate) : null,
          taxAmount: updatedInvoice.taxAmount ? Number(updatedInvoice.taxAmount) : null,
          totalAmount: Number(updatedInvoice.totalAmount),
          invoiceDate: updatedInvoice.invoiceDate.toISOString(),
          dueDate: updatedInvoice.dueDate.toISOString(),
          paidDate: updatedInvoice.paidDate?.toISOString() || null,
          createdAt: updatedInvoice.createdAt.toISOString(),
          updatedAt: updatedInvoice.updatedAt.toISOString(),
        } : null,
      });
    },
    { required: true, module: 'accounting' }
  );
}








