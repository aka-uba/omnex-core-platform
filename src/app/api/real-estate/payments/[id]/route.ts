import { NextRequest } from 'next/server';
import { withTenant } from '@/lib/api/withTenant';
import { successResponse, errorResponse } from '@/lib/api/errorHandler';
import type { ApiResponse } from '@/lib/api/errorHandler';
import { paymentUpdateSchema } from '@/modules/real-estate/schemas/payment.schema';
import { getTenantFromRequest } from '@/lib/api/tenantContext';
import { Prisma } from '@prisma/tenant-client';
import { getAuditContext, logUpdate, logDelete } from '@/lib/api/auditHelper';

interface RouteParams {
  params: Promise<{
    id: string;
  }>;
}

// GET /api/real-estate/payments/[id] - Get payment by ID
export async function GET(request: NextRequest, { params }: RouteParams) {
  return withTenant<ApiResponse<{ payment: unknown }>>(
    request,
    async (tenantPrisma) => {
      const { id } = await params;

      // Get tenant context
      const tenantContext = await getTenantFromRequest(request);
      if (!tenantContext) {
        return errorResponse('Tenant context required', 'Tenant context could not be determined', 400);
      }

      const payment = await tenantPrisma.payment.findUnique({
        where: { id },
        include: {
          apartment: {
            include: {
              property: {
                select: {
                  id: true,
                  name: true,
                  address: true,
                  city: true,
                },
              },
            },
          },
          contract: {
            select: {
              id: true,
              contractNumber: true,
              type: true,
              tenantRecord: {
                select: {
                  id: true,
                  tenantType: true,
                  companyName: true,
                  firstName: true,
                  lastName: true,
                  email: true,
                  phone: true,
                },
              },
            },
          },
        },
      });

      if (!payment) {
        return errorResponse('Not found', 'Payment not found', 404);
      }

      // Note: tenantId validation removed - per-tenant database architecture already provides isolation

      return successResponse({
        payment: {
          ...payment,
          createdAt: payment.createdAt.toISOString(),
          updatedAt: payment.updatedAt.toISOString(),
          dueDate: payment.dueDate.toISOString(),
          paidDate: payment.paidDate?.toISOString() || null,
          extraCharges: payment.extraCharges || null,
        },
      });
    },
    { required: true, module: 'real-estate' }
  );
}

// PATCH /api/real-estate/payments/[id] - Update payment
export async function PATCH(request: NextRequest, { params }: RouteParams) {
  return withTenant<ApiResponse<{ payment: unknown }>>(
    request,
    async (tenantPrisma) => {
      const { id } = await params;
      const body = await request.json();

      // Validate request body (partial update)
      const validatedData = paymentUpdateSchema.parse(body);

      // Get tenant context
      const tenantContext = await getTenantFromRequest(request);
      if (!tenantContext) {
        return errorResponse('Tenant context required', 'Tenant context could not be determined', 400);
      }

      // Check if payment exists
      const existingPayment = await tenantPrisma.payment.findUnique({
        where: { id },
      });

      if (!existingPayment) {
        return errorResponse('Not found', 'Payment not found', 404);
      }

      // Note: tenantId validation removed - per-tenant database architecture already provides isolation

      // Calculate total amount if amount or extraCharges changed
      let totalAmount = Number(existingPayment.totalAmount);
      if (validatedData.amount !== undefined || validatedData.extraCharges !== undefined) {
        const amount = validatedData.amount ?? Number(existingPayment.amount);
        const extraCharges = validatedData.extraCharges ?? existingPayment.extraCharges;
        const extraChargesTotal = extraCharges && Array.isArray(extraCharges)
          ? extraCharges.reduce((sum: number, charge: any) => sum + (Number(charge?.amount) || 0), 0)
          : 0;
        totalAmount = amount + extraChargesTotal;
      }

      // Prepare update data
      const updateData: Prisma.PaymentUpdateInput = {};
      // Note: apartmentId and contractId updates are handled by Prisma relations, not directly
      if (validatedData.type !== undefined) updateData.type = validatedData.type;
      if (validatedData.amount !== undefined) updateData.amount = validatedData.amount;
      if (validatedData.currency !== undefined) updateData.currency = validatedData.currency;
      if (validatedData.dueDate !== undefined) updateData.dueDate = validatedData.dueDate;
      if (validatedData.paidDate !== undefined) updateData.paidDate = validatedData.paidDate || null;
      if (validatedData.status !== undefined) updateData.status = validatedData.status;
      if (validatedData.extraCharges !== undefined) {
        updateData.extraCharges = validatedData.extraCharges ? (validatedData.extraCharges as Prisma.InputJsonValue) : Prisma.JsonNull;
      }
      if (validatedData.amount !== undefined || validatedData.extraCharges !== undefined) {
        updateData.totalAmount = totalAmount;
      }
      if (validatedData.paymentMethod !== undefined) updateData.paymentMethod = validatedData.paymentMethod || null;
      if (validatedData.receiptNumber !== undefined) updateData.receiptNumber = validatedData.receiptNumber || null;
      if (validatedData.notes !== undefined) updateData.notes = validatedData.notes || null;
      if (validatedData.isAutoGenerated !== undefined) updateData.isAutoGenerated = validatedData.isAutoGenerated;
      if (validatedData.reminderSent !== undefined) updateData.reminderSent = validatedData.reminderSent;

      // Update payment
      const updatedPayment = await tenantPrisma.payment.update({
        where: { id },
        data: updateData,
        include: {
          apartment: {
            select: {
              id: true,
              unitNumber: true,
            },
          },
          contract: {
            select: {
              id: true,
              contractNumber: true,
            },
          },
        },
      });

      // Log audit event
      const auditContext = await getAuditContext(request);
      logUpdate(
        tenantContext,
        auditContext,
        'Payment',
        id,
        existingPayment,
        updatedPayment,
        existingPayment.companyId || undefined
      );

      return successResponse({
        payment: {
          ...updatedPayment,
          createdAt: updatedPayment.createdAt.toISOString(),
          updatedAt: updatedPayment.updatedAt.toISOString(),
          dueDate: updatedPayment.dueDate.toISOString(),
          paidDate: updatedPayment.paidDate?.toISOString() || null,
          extraCharges: updatedPayment.extraCharges || null,
        },
      });
    },
    { required: true, module: 'real-estate' }
  );
}

// DELETE /api/real-estate/payments/[id] - Delete payment
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  return withTenant<ApiResponse<void>>(
    request,
    async (tenantPrisma) => {
      const { id } = await params;

      // Get tenant context
      const tenantContext = await getTenantFromRequest(request);
      if (!tenantContext) {
        return errorResponse('Tenant context required', 'Tenant context could not be determined', 400);
      }

      // Check if payment exists
      const existingPayment = await tenantPrisma.payment.findUnique({
        where: { id },
      });

      if (!existingPayment) {
        return errorResponse('Not found', 'Payment not found', 404);
      }

      // Note: tenantId validation removed - per-tenant database architecture already provides isolation

      // Delete payment
      await tenantPrisma.payment.delete({
        where: { id },
      });

      // Log audit event
      const auditContext = await getAuditContext(request);
      logDelete(
        tenantContext,
        auditContext,
        'Payment',
        id,
        existingPayment.companyId || undefined,
        { type: existingPayment.type, amount: existingPayment.amount }
      );

      return successResponse(undefined);
    },
    { required: true, module: 'real-estate' }
  );
}

