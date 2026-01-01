import { NextRequest } from 'next/server';
import { withTenant } from '@/lib/api/withTenant';
import { successResponse, errorResponse } from '@/lib/api/errorHandler';
import type { ApiResponse } from '@/lib/api/errorHandler';
import { subscriptionUpdateSchema } from '@/modules/accounting/schemas/subscription.schema';
import { getTenantFromRequest } from '@/lib/api/tenantContext';
import { getAuditContext, logUpdate, logDelete } from '@/lib/api/auditHelper';

interface RouteParams {
  params: Promise<{
    id: string;
  }>;
}

// GET /api/accounting/subscriptions/[id] - Get subscription by ID
export async function GET(request: NextRequest, { params }: RouteParams) {
  return withTenant<ApiResponse<{ subscription: unknown }>>(
    request,
    async (tenantPrisma) => {
      const { id } = await params;

      // Get tenant context
      const tenantContext = await getTenantFromRequest(request);
      if (!tenantContext) {
        return errorResponse('Tenant context required', 'Tenant context could not be determined', 400);
      }

      // Get subscription
      const subscription = await tenantPrisma.subscription.findFirst({
        where: {
          id,
          tenantId: tenantContext.id,
        },
        include: {
          invoices: {
            orderBy: { invoiceDate: 'desc' },
            take: 10,
          },
          payments: {
            orderBy: { paymentDate: 'desc' },
            take: 10,
          },
          expenses: {
            orderBy: { expenseDate: 'desc' },
            take: 10,
          },
          _count: {
            select: {
              invoices: true,
              payments: true,
              expenses: true,
            },
          },
        },
      });

      if (!subscription) {
        return errorResponse('Not found', 'Subscription not found', 404);
      }

      return successResponse({
        subscription: {
          ...subscription,
          basePrice: Number(subscription.basePrice),
          commissionRate: subscription.commissionRate ? Number(subscription.commissionRate) : null,
          startDate: subscription.startDate.toISOString(),
          endDate: subscription.endDate?.toISOString() || null,
          renewalDate: subscription.renewalDate?.toISOString() || null,
          createdAt: subscription.createdAt.toISOString(),
          updatedAt: subscription.updatedAt.toISOString(),
          invoices: subscription.invoices.map(invoice => ({
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
          })),
          payments: subscription.payments.map(payment => ({
            ...payment,
            amount: Number(payment.amount),
            paymentDate: payment.paymentDate.toISOString(),
            createdAt: payment.createdAt.toISOString(),
            updatedAt: payment.updatedAt.toISOString(),
          })),
          expenses: subscription.expenses.map(expense => ({
            ...expense,
            amount: Number(expense.amount),
            expenseDate: expense.expenseDate.toISOString(),
            approvedAt: expense.approvedAt?.toISOString() || null,
            createdAt: expense.createdAt.toISOString(),
            updatedAt: expense.updatedAt.toISOString(),
          })),
        },
      });
    },
    { required: true, module: 'accounting' }
  );
}

// PATCH /api/accounting/subscriptions/[id] - Update subscription
export async function PATCH(request: NextRequest, { params }: RouteParams) {
  return withTenant<ApiResponse<{ subscription: unknown }>>(
    request,
    async (tenantPrisma) => {
      const { id } = await params;
      const body = await request.json();

      // Validate request body
      const validatedData = subscriptionUpdateSchema.parse(body);

      // Get tenant context
      const tenantContext = await getTenantFromRequest(request);
      if (!tenantContext) {
        return errorResponse('Tenant context required', 'Tenant context could not be determined', 400);
      }

      // Check if subscription exists
      const existingSubscription = await tenantPrisma.subscription.findFirst({
        where: {
          id,
          tenantId: tenantContext.id,
        },
      });

      if (!existingSubscription) {
        return errorResponse('Not found', 'Subscription not found', 404);
      }

      // Update subscription
      const updatedSubscription = await tenantPrisma.subscription.update({
        where: { id },
        data: {
          ...(validatedData.name && { name: validatedData.name }),
          ...(validatedData.type && { type: validatedData.type }),
          ...(validatedData.status && { status: validatedData.status }),
          ...(validatedData.customerId !== undefined && { customerId: validatedData.customerId }),
          ...(validatedData.supplierId !== undefined && { supplierId: validatedData.supplierId }),
          ...(validatedData.startDate && { startDate: new Date(validatedData.startDate) }),
          ...(validatedData.endDate !== undefined && { endDate: validatedData.endDate ? new Date(validatedData.endDate) : null }),
          ...(validatedData.renewalDate !== undefined && { renewalDate: validatedData.renewalDate ? new Date(validatedData.renewalDate) : null }),
          ...(validatedData.basePrice !== undefined && { basePrice: validatedData.basePrice }),
          ...(validatedData.currency && { currency: validatedData.currency }),
          ...(validatedData.billingCycle && { billingCycle: validatedData.billingCycle }),
          ...(validatedData.commissionRate !== undefined && { commissionRate: validatedData.commissionRate }),
          ...(validatedData.commissionType !== undefined && { commissionType: validatedData.commissionType }),
          ...(validatedData.assignedUserId !== undefined && { assignedUserId: validatedData.assignedUserId }),
          ...(validatedData.description !== undefined && { description: validatedData.description }),
          ...(validatedData.terms !== undefined && { terms: validatedData.terms }),
          ...(validatedData.isActive !== undefined && { isActive: validatedData.isActive }),
        },
        include: {
          _count: {
            select: {
              invoices: true,
              payments: true,
              expenses: true,
            },
          },
        },
      });

      // Log audit event
      const auditContext = await getAuditContext(request);
      logUpdate(tenantContext, auditContext, 'Subscription', id, existingSubscription, updatedSubscription, existingSubscription.companyId || undefined);

      return successResponse({
        subscription: {
          ...updatedSubscription,
          basePrice: Number(updatedSubscription.basePrice),
          commissionRate: updatedSubscription.commissionRate ? Number(updatedSubscription.commissionRate) : null,
          startDate: updatedSubscription.startDate.toISOString(),
          endDate: updatedSubscription.endDate?.toISOString() || null,
          renewalDate: updatedSubscription.renewalDate?.toISOString() || null,
          createdAt: updatedSubscription.createdAt.toISOString(),
          updatedAt: updatedSubscription.updatedAt.toISOString(),
        },
      });
    },
    { required: true, module: 'accounting' }
  );
}

// DELETE /api/accounting/subscriptions/[id] - Delete subscription
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

      // Check if subscription exists
      const existingSubscription = await tenantPrisma.subscription.findFirst({
        where: {
          id,
          tenantId: tenantContext.id,
        },
      });

      if (!existingSubscription) {
        return errorResponse('Not found', 'Subscription not found', 404);
      }

      // Log audit event
      const auditContext = await getAuditContext(request);
      logDelete(tenantContext, auditContext, 'Subscription', id, existingSubscription.companyId || undefined, {
        name: existingSubscription.name,
        type: existingSubscription.type,
      });

      // Check if subscription has invoices or payments
      const hasInvoices = await tenantPrisma.invoice.count({
        where: { subscriptionId: id },
      }) > 0;

      const hasPayments = await tenantPrisma.accountingPayment.count({
        where: { subscriptionId: id },
      }) > 0;

      if (hasInvoices || hasPayments) {
        // Soft delete instead
        await tenantPrisma.subscription.update({
          where: { id },
          data: { isActive: false, status: 'cancelled' },
        });
        return successResponse({ message: 'Subscription deactivated (has invoices or payments)' });
      }

      // Hard delete
      await tenantPrisma.subscription.delete({
        where: { id },
      });

      return successResponse({ message: 'Subscription deleted successfully' });
    },
    { required: true, module: 'accounting' }
  );
}








