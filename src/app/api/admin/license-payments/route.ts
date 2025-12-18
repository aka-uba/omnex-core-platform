// License Payments API Route - Admin
// GET /api/admin/license-payments - List license payments
// POST /api/admin/license-payments - Create license payment

import { NextRequest } from 'next/server';
import { withoutTenant } from '@/lib/api/withTenant';
import { successResponse, errorResponse } from '@/lib/api/errorHandler';
import type { ApiResponse } from '@/lib/api/errorHandler';
import { corePrisma } from '@/lib/corePrisma';
import { Prisma } from '@prisma/core-client';

// GET /api/admin/license-payments - List license payments
export async function GET(request: NextRequest) {
  return withoutTenant<ApiResponse<unknown[]>>(
    async () => {
      const searchParams = request.nextUrl.searchParams;

      const page = parseInt(searchParams.get('page') || '1', 10) || 1;
      const pageSize = parseInt(searchParams.get('pageSize') || '10', 10) || 10;
      const status = searchParams.get('status') || undefined;
      const licenseId = searchParams.get('licenseId') || undefined;

      const where: Prisma.LicensePaymentWhereInput = {
        ...(status && { status }),
        ...(licenseId && { licenseId }),
      };

      const [payments] = await Promise.all([
        corePrisma.licensePayment.findMany({
          where,
          skip: (page - 1) * pageSize,
          take: pageSize,
          orderBy: { createdAt: 'desc' },
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
        }),
        corePrisma.licensePayment.count({ where }),
      ]);

      return successResponse(
        payments.map((payment) => ({
          ...payment,
          amount: payment.amount.toNumber(),
          paymentDate: payment.paymentDate.toISOString(),
          dueDate: payment.dueDate?.toISOString(),
          approvedAt: payment.approvedAt?.toISOString(),
          rejectedAt: payment.rejectedAt?.toISOString(),
          createdAt: payment.createdAt.toISOString(),
          updatedAt: payment.updatedAt.toISOString(),
        }))
      );
    },
    'license'
  );
}

// POST /api/admin/license-payments - Create license payment
export async function POST(request: NextRequest) {
  return withoutTenant<ApiResponse<{ payment: unknown }>>(
    async () => {
      const body = await request.json();

      const {
        licenseId,
        amount,
        currency,
        paymentMethod,
        invoiceNumber,
        invoiceUrl,
        paymentDate,
        dueDate,
        receiptUrl,
        notes,
        transactionId,
      } = body;

      // Validate required fields
      if (!licenseId || !amount || !paymentMethod) {
        return errorResponse('Validation Error', 'licenseId, amount, and paymentMethod are required', 400);
      }

      // Check if license exists
      const license = await corePrisma.tenantLicense.findUnique({
        where: { id: licenseId },
      });

      if (!license) {
        return errorResponse('Not Found', 'License not found', 404);
      }

      const payment = await corePrisma.licensePayment.create({
        data: {
          licenseId,
          amount,
          currency: currency || 'TRY',
          paymentMethod,
          invoiceNumber,
          invoiceUrl,
          paymentDate: paymentDate ? new Date(paymentDate) : new Date(),
          dueDate: dueDate ? new Date(dueDate) : null,
          receiptUrl,
          notes,
          transactionId,
          status: 'pending',
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
          createdAt: payment.createdAt.toISOString(),
          updatedAt: payment.updatedAt.toISOString(),
        },
      });
    },
    'license'
  );
}
