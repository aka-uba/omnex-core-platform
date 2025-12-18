// License Payment Reject API Route - Admin
// POST /api/admin/license-payments/[id]/reject - Reject a payment

import { NextRequest } from 'next/server';
import { withoutTenant } from '@/lib/api/withTenant';
import { successResponse, errorResponse } from '@/lib/api/errorHandler';
import type { ApiResponse } from '@/lib/api/errorHandler';
import { corePrisma } from '@/lib/corePrisma';

interface RouteParams {
  params: Promise<{ id: string }>;
}

// POST /api/admin/license-payments/[id]/reject
export async function POST(request: NextRequest, { params }: RouteParams) {
  return withoutTenant<ApiResponse<{ payment: unknown }>>(
    async () => {
      const { id } = await params;
      const body = await request.json();
      const { reason } = body;

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

      // Reject the payment
      const payment = await corePrisma.licensePayment.update({
        where: { id },
        data: {
          status: 'rejected',
          rejectedAt: new Date(),
          rejectionReason: reason || null,
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

      return successResponse({
        payment: {
          ...payment,
          amount: payment.amount.toNumber(),
          paymentDate: payment.paymentDate.toISOString(),
          dueDate: payment.dueDate?.toISOString(),
          rejectedAt: payment.rejectedAt?.toISOString(),
          createdAt: payment.createdAt.toISOString(),
          updatedAt: payment.updatedAt.toISOString(),
        },
      });
    },
    'license'
  );
}
