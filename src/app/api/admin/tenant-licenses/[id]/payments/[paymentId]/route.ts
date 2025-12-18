// License Service API Route - Admin
// PATCH /api/admin/tenant-licenses/[id]/payments/[paymentId] - Update payment status
// DELETE /api/admin/tenant-licenses/[id]/payments/[paymentId] - Delete payment

import { NextRequest } from 'next/server';
import { withoutTenant } from '@/lib/api/withTenant';
import { successResponse, errorResponse } from '@/lib/api/errorHandler';
import type { ApiResponse } from '@/lib/api/errorHandler';
import { corePrisma } from '@/lib/corePrisma';
import { licensePaymentUpdateSchema } from '@/modules/license/schemas/license.schema';

// PATCH /api/admin/tenant-licenses/[id]/payments/[paymentId] - Update payment status
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; paymentId: string }> }
) {
  return withoutTenant<ApiResponse<{ payment: unknown }>>(
    async () => {
      const { id, paymentId } = await params;
      const body = await request.json();
      
      // Validate input
      const validatedData = licensePaymentUpdateSchema.parse(body);

      // Check if payment exists and belongs to license
      const existing = await corePrisma.licensePayment.findFirst({
        where: {
          id: paymentId,
          licenseId: id,
        },
      });

      if (!existing) {
        return errorResponse('Not Found', 'Payment not found', 404);
      }

      // Update payment
      const payment = await corePrisma.licensePayment.update({
        where: { id: paymentId },
        data: {
          ...(validatedData.status !== undefined && { status: validatedData.status }),
          ...(validatedData.approvedBy !== undefined && { approvedBy: validatedData.approvedBy }),
          ...(validatedData.approvedAt !== undefined && { approvedAt: validatedData.approvedAt ? new Date(validatedData.approvedAt) : null }),
          ...(validatedData.notes !== undefined && { notes: validatedData.notes }),
        },
      });

      // If payment is approved, update license payment status
      if (validatedData.status === 'approved' && existing.status !== 'approved') {
        await corePrisma.tenantLicense.update({
          where: { id },
          data: {
            paymentStatus: 'paid',
            lastPaymentDate: new Date(),
          },
        });
      }

      return successResponse({
        payment: {
          ...payment,
          amount: payment.amount.toNumber(),
          approvedAt: payment.approvedAt?.toISOString(),
          paymentDate: payment.paymentDate.toISOString(),
          createdAt: payment.createdAt.toISOString(),
          updatedAt: payment.updatedAt.toISOString(),
        },
      });
    },
    'license'
  );
}

// DELETE /api/admin/tenant-licenses/[id]/payments/[paymentId] - Delete payment
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; paymentId: string }> }
) {
  return withoutTenant<ApiResponse<{ success: boolean }>>(
    async () => {
      const { id, paymentId } = await params;
      // Check if payment exists and belongs to license
      const existing = await corePrisma.licensePayment.findFirst({
        where: {
          id: paymentId,
          licenseId: id,
        },
      });

      if (!existing) {
        return errorResponse('Not Found', 'Payment not found', 404);
      }

      // Delete payment
      await corePrisma.licensePayment.delete({
        where: { id: paymentId },
      });

      return successResponse({ success: true });
    },
    'license'
  );
}

