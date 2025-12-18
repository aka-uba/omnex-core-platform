// License Payment Approve API Route - Admin
// POST /api/admin/license-payments/[id]/approve - Approve a payment

import { NextRequest } from 'next/server';
import { withoutTenant } from '@/lib/api/withTenant';
import { successResponse, errorResponse } from '@/lib/api/errorHandler';
import type { ApiResponse } from '@/lib/api/errorHandler';
import { corePrisma } from '@/lib/corePrisma';

interface RouteParams {
  params: Promise<{ id: string }>;
}

// POST /api/admin/license-payments/[id]/approve
export async function POST(request: NextRequest, { params }: RouteParams) {
  return withoutTenant<ApiResponse<{ payment: unknown }>>(
    async () => {
      const { id } = await params;

      // Check if payment exists
      const existingPayment = await corePrisma.licensePayment.findUnique({
        where: { id },
      });

      if (!existingPayment) {
        return errorResponse('Not Found', 'Payment not found', 404);
      }

      if (existingPayment.status !== 'pending') {
        return errorResponse('Conflict', 'Payment is not pending', 409);
      }

      // Approve the payment
      const payment = await corePrisma.licensePayment.update({
        where: { id },
        data: {
          status: 'approved',
          approvedAt: new Date(),
        },
        include: {
          license: {
            include: {
              tenant: {
                select: {
                  id: true,
                  name: true,
                  slug: true,
                },
              },
              package: {
                select: {
                  name: true,
                },
              },
            },
          },
        },
      });

      // Update the license payment status
      await corePrisma.tenantLicense.update({
        where: { id: payment.licenseId },
        data: {
          paymentStatus: 'paid',
          lastPaymentDate: new Date(),
        },
      });

      return successResponse({
        payment: {
          ...payment,
          amount: payment.amount.toNumber(),
          paymentDate: payment.paymentDate.toISOString(),
          dueDate: payment.dueDate?.toISOString(),
          approvedAt: payment.approvedAt?.toISOString(),
          createdAt: payment.createdAt.toISOString(),
          updatedAt: payment.updatedAt.toISOString(),
        },
      });
    },
    'license'
  );
}
