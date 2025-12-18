import { NextRequest } from 'next/server';
import { withTenant } from '@/lib/api/withTenant';
import { successResponse, errorResponse } from '@/lib/api/errorHandler';
import type { ApiResponse } from '@/lib/api/errorHandler';
import { getTenantFromRequest } from '@/lib/api/tenantContext';
import dayjs from 'dayjs';

// GET /api/real-estate/payments/overdue - Get overdue payments
export async function GET(request: NextRequest) {
  return withTenant<ApiResponse<{ payments: unknown[] }>>(
    request,
    async (tenantPrisma) => {
      // Get tenant context
      const tenantContext = await getTenantFromRequest(request);
      if (!tenantContext) {
        return errorResponse('Tenant context required', 'Tenant context could not be determined', 400);
      }

      const today = dayjs().startOf('day').toDate();

      // Find overdue payments (status is pending and dueDate is before today)
      // Build where clause with tenant isolation (defense-in-depth)
      const overduePayments = await tenantPrisma.payment.findMany({
        where: {
          tenantId: tenantContext.id,
          status: 'pending',
          dueDate: {
            lt: today,
          },
        },
        include: {
          apartment: {
            select: {
              id: true,
              unitNumber: true,
              property: {
                select: {
                  id: true,
                  name: true,
                },
              },
            },
          },
          contract: {
            select: {
              id: true,
              contractNumber: true,
            },
          },
        },
        orderBy: { dueDate: 'asc' },
      });

      // Update status to overdue for payments that are past due
      for (const payment of overduePayments) {
        if (payment.status === 'pending') {
          await tenantPrisma.payment.update({
            where: { id: payment.id },
            data: { status: 'overdue' },
          });
        }
      }

      // Fetch updated payments with tenant isolation (defense-in-depth)
      const updatedPayments = await tenantPrisma.payment.findMany({
        where: {
          tenantId: tenantContext.id,
          status: 'overdue',
          dueDate: {
            lt: today,
          },
        },
        include: {
          apartment: {
            select: {
              id: true,
              unitNumber: true,
              property: {
                select: {
                  id: true,
                  name: true,
                },
              },
            },
          },
          contract: {
            select: {
              id: true,
              contractNumber: true,
            },
          },
        },
        orderBy: { dueDate: 'asc' },
      });

      return successResponse({
        payments: updatedPayments.map(payment => ({
          ...payment,
          createdAt: payment.createdAt.toISOString(),
          updatedAt: payment.updatedAt.toISOString(),
          dueDate: payment.dueDate.toISOString(),
          paidDate: payment.paidDate?.toISOString() || null,
          extraCharges: payment.extraCharges || null,
        })),
      });
    },
    { required: true, module: 'real-estate' }
  );
}








