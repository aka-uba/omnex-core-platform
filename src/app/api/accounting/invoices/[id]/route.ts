import { NextRequest } from 'next/server';
import { withTenant } from '@/lib/api/withTenant';
import { successResponse, errorResponse } from '@/lib/api/errorHandler';
import type { ApiResponse } from '@/lib/api/errorHandler';
import { invoiceUpdateSchema } from '@/modules/accounting/schemas/subscription.schema';
import { getTenantFromRequest } from '@/lib/api/tenantContext';
import { Prisma } from '@prisma/tenant-client';
import { getAuditContext, logUpdate, logDelete } from '@/lib/api/auditHelper';

interface RouteParams {
  params: Promise<{
    id: string;
  }>;
}

// GET /api/accounting/invoices/[id] - Get invoice by ID
export async function GET(request: NextRequest, { params }: RouteParams) {
  return withTenant<ApiResponse<{ invoice: unknown }>>(
    request,
    async (tenantPrisma) => {
      const { id } = await params;

      // Get tenant context
      const tenantContext = await getTenantFromRequest(request);
      if (!tenantContext) {
        return errorResponse('Tenant context required', 'Tenant context could not be determined', 400);
      }

      // Get invoice
      const invoice = await tenantPrisma.invoice.findFirst({
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
          payments: {
            orderBy: { paymentDate: 'desc' },
          },
        },
      });

      if (!invoice) {
        return errorResponse('Not found', 'Invoice not found', 404);
      }

      return successResponse({
        invoice: {
          ...invoice,
          subtotal: Number(invoice.subtotal),
          taxRate: invoice.taxRate ? Number(invoice.taxRate) : null,
          taxAmount: invoice.taxAmount ? Number(invoice.taxAmount) : null,
          totalAmount: Number(invoice.totalAmount),
          invoiceDate: invoice.invoiceDate.toISOString(),
          dueDate: invoice.dueDate.toISOString(),
          paidDate: invoice.paidDate?.toISOString() || null,
          createdAt: invoice.createdAt.toISOString(),
          updatedAt: invoice.updatedAt.toISOString(),
          payments: invoice.payments.map(payment => ({
            ...payment,
            amount: Number(payment.amount),
            paymentDate: payment.paymentDate.toISOString(),
            createdAt: payment.createdAt.toISOString(),
            updatedAt: payment.updatedAt.toISOString(),
          })),
        },
      });
    },
    { required: true, module: 'accounting' }
  );
}

// PATCH /api/accounting/invoices/[id] - Update invoice
export async function PATCH(request: NextRequest, { params }: RouteParams) {
  return withTenant<ApiResponse<{ invoice: unknown }>>(
    request,
    async (tenantPrisma) => {
      const { id } = await params;
      const body = await request.json();

      // Validate request body
      const validatedData = invoiceUpdateSchema.parse(body);

      // Get tenant context
      const tenantContext = await getTenantFromRequest(request);
      if (!tenantContext) {
        return errorResponse('Tenant context required', 'Tenant context could not be determined', 400);
      }

      // Check if invoice exists
      const existingInvoice = await tenantPrisma.invoice.findFirst({
        where: {
          id,
          tenantId: tenantContext.id,
        },
      });

      if (!existingInvoice) {
        return errorResponse('Not found', 'Invoice not found', 404);
      }

      // Check if invoice number is unique (if being updated)
      if (validatedData.invoiceNumber && validatedData.invoiceNumber !== existingInvoice.invoiceNumber) {
        const codeExists = await tenantPrisma.invoice.findFirst({
          where: {
            tenantId: tenantContext.id,
            invoiceNumber: validatedData.invoiceNumber,
            id: { not: id },
          },
        });

        if (codeExists) {
          return errorResponse('Validation error', 'Invoice number already exists', 409);
        }
      }

      // Update invoice
      const updatedInvoice = await tenantPrisma.invoice.update({
        where: { id },
        data: {
          ...(validatedData.subscriptionId !== undefined && { subscriptionId: validatedData.subscriptionId }),
          ...(validatedData.invoiceNumber && { invoiceNumber: validatedData.invoiceNumber }),
          ...(validatedData.invoiceDate && { invoiceDate: new Date(validatedData.invoiceDate) }),
          ...(validatedData.dueDate && { dueDate: new Date(validatedData.dueDate) }),
          ...(validatedData.customerId !== undefined && { customerId: validatedData.customerId }),
          ...(validatedData.supplierId !== undefined && { supplierId: validatedData.supplierId }),
          ...(validatedData.subtotal !== undefined && { subtotal: validatedData.subtotal }),
          ...(validatedData.taxRate !== undefined && { taxRate: validatedData.taxRate }),
          ...(validatedData.taxAmount !== undefined && { taxAmount: validatedData.taxAmount }),
          ...(validatedData.totalAmount !== undefined && { totalAmount: validatedData.totalAmount }),
          ...(validatedData.currency && { currency: validatedData.currency }),
          ...(validatedData.status && { status: validatedData.status }),
          ...(validatedData.paidDate !== undefined && { paidDate: validatedData.paidDate ? new Date(validatedData.paidDate) : null }),
          ...(validatedData.paymentMethod !== undefined && { paymentMethod: validatedData.paymentMethod }),
          ...(validatedData.paymentNotes !== undefined && { paymentNotes: validatedData.paymentNotes }),
          ...(validatedData.description !== undefined && { description: validatedData.description }),
          ...(validatedData.items !== undefined && { items: validatedData.items ? (validatedData.items as Prisma.InputJsonValue) : Prisma.JsonNull }),
          ...(validatedData.documents !== undefined && { documents: validatedData.documents }),
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
          _count: {
            select: {
              payments: true,
            },
          },
        },
      });

      // Log audit event
      const auditContext = await getAuditContext(request);
      logUpdate(tenantContext, auditContext, 'Invoice', id, existingInvoice, updatedInvoice, existingInvoice.companyId || undefined);

      return successResponse({
        invoice: {
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
        },
      });
    },
    { required: true, module: 'accounting' }
  );
}

// DELETE /api/accounting/invoices/[id] - Delete invoice
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

      // Check if invoice exists
      const existingInvoice = await tenantPrisma.invoice.findFirst({
        where: {
          id,
          tenantId: tenantContext.id,
        },
      });

      if (!existingInvoice) {
        return errorResponse('Not found', 'Invoice not found', 404);
      }

      // Log audit event
      const auditContext = await getAuditContext(request);
      logDelete(tenantContext, auditContext, 'Invoice', id, existingInvoice.companyId || undefined, {
        invoiceNumber: existingInvoice.invoiceNumber,
        status: existingInvoice.status,
      });

      // Check if invoice is paid
      if (existingInvoice.status === 'paid') {
        // Soft delete instead
        await tenantPrisma.invoice.update({
          where: { id },
          data: { isActive: false },
        });
        return successResponse({ message: 'Invoice deactivated (cannot delete paid invoices)' });
      }

      // Hard delete
      await tenantPrisma.invoice.delete({
        where: { id },
      });

      return successResponse({ message: 'Invoice deleted successfully' });
    },
    { required: true, module: 'accounting' }
  );
}

