// License Service API Route - Admin
// GET /api/admin/tenant-licenses/[id]/payments - List license payments
// POST /api/admin/tenant-licenses/[id]/payments - Create license payment

import { NextRequest } from 'next/server';
import { withoutTenant } from '@/lib/api/withTenant';
import { successResponse, errorResponse } from '@/lib/api/errorHandler';
import type { ApiResponse } from '@/lib/api/errorHandler';
import { corePrisma } from '@/lib/corePrisma';
import { licensePaymentCreateSchema } from '@/modules/license/schemas/license.schema';

// GET /api/admin/tenant-licenses/[id]/payments - List license payments
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return withoutTenant<ApiResponse<{ payments: unknown[]; total: number; page: number; pageSize: number }>>(
    async () => {
      const { id } = await params;
      const searchParams = request.nextUrl.searchParams;
      const page = parseInt(searchParams.get('page') || '1', 10) || 1;
      const pageSize = parseInt(searchParams.get('pageSize') || '10', 10) || 10;

      // Check if license exists
      const license = await corePrisma.tenantLicense.findUnique({
        where: { id },
      });

      if (!license) {
        return errorResponse('Not Found', 'Tenant license not found', 404);
      }

      // Get payments
      const [payments, total] = await Promise.all([
        corePrisma.licensePayment.findMany({
          where: { licenseId: id },
          skip: (page - 1) * pageSize,
          take: pageSize,
          orderBy: { createdAt: 'desc' },
        }),
        corePrisma.licensePayment.count({
          where: { licenseId: id },
        }),
      ]);

      return successResponse({
        payments: payments.map(payment => ({
          ...payment,
          amount: payment.amount.toNumber(),
          approvedAt: payment.approvedAt?.toISOString(),
          paymentDate: payment.paymentDate.toISOString(),
          createdAt: payment.createdAt.toISOString(),
          updatedAt: payment.updatedAt.toISOString(),
        })),
        total,
        page,
        pageSize,
      });
    },
    'license'
  );
}

// POST /api/admin/tenant-licenses/[id]/payments - Create license payment
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return withoutTenant<ApiResponse<{ payment: unknown }>>(
    async () => {
      const { id } = await params;
      const body = await request.json();
      
      // Validate input
      const validatedData = licensePaymentCreateSchema.parse({
        ...body,
        licenseId: id,
      });

      // Check if license exists
      const license = await corePrisma.tenantLicense.findUnique({
        where: { id },
      });

      if (!license) {
        return errorResponse('Not Found', 'Tenant license not found', 404);
      }

      // Create payment
      const payment = await corePrisma.licensePayment.create({
        data: {
          licenseId: id,
          amount: validatedData.amount,
          currency: validatedData.currency,
          paymentMethod: validatedData.paymentMethod,
          paymentDate: new Date(validatedData.paymentDate),
          ...(validatedData.receiptUrl !== null && validatedData.receiptUrl !== undefined ? { receiptUrl: validatedData.receiptUrl } : {}),
          ...(validatedData.notes !== null && validatedData.notes !== undefined ? { notes: validatedData.notes } : {}),
        },
      });

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

