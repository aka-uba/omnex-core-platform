import { NextRequest } from 'next/server';
import { withTenant } from '@/lib/api/withTenant';
import { successResponse, errorResponse } from '@/lib/api/errorHandler';
import type { ApiResponse } from '@/lib/api/errorHandler';
import { getTenantFromRequest } from '@/lib/api/tenantContext';
import { Prisma } from '@prisma/tenant-client';
import dayjs from 'dayjs';

// GET /api/real-estate/payments/analytics - Get payment analytics
export async function GET(request: NextRequest) {
  return withTenant<ApiResponse<{
    summary: {
      totalPayments: number;
      totalAmount: number;
      paidAmount: number;
      pendingAmount: number;
      overdueAmount: number;
      collectionRate: number; // Tahsilat oranı (%)
      averagePaymentAmount: number;
    };
    byStatus: {
      paid: { count: number; amount: number };
      pending: { count: number; amount: number };
      overdue: { count: number; amount: number };
      cancelled: { count: number; amount: number };
    };
    byType: {
      rent: { count: number; amount: number };
      deposit: { count: number; amount: number };
      fee: { count: number; amount: number };
      maintenance: { count: number; amount: number };
      utility: { count: number; amount: number };
    };
    monthlyTrend: Array<{
      month: string;
      total: number;
      paid: number;
      pending: number;
      overdue: number;
    }>;
    upcomingPayments: Array<{
      id: string;
      apartmentUnitNumber: string;
      amount: number;
      dueDate: string;
      daysUntilDue: number;
    }>;
    overduePayments: Array<{
      id: string;
      apartmentUnitNumber: string;
      amount: number;
      dueDate: string;
      daysOverdue: number;
    }>;
  }>>(
    request,
    async (tenantPrisma) => {
      const searchParams = request.nextUrl.searchParams;
      const companyId = searchParams.get('companyId') || undefined;
      const dateFrom = searchParams.get('dateFrom') || undefined;
      const dateTo = searchParams.get('dateTo') || undefined;

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

      // Build where clause with tenant and company isolation (defense-in-depth)
      const where: Prisma.PaymentWhereInput = {
        tenantId: tenantContext.id,
        ...(finalCompanyId && { companyId: finalCompanyId }),
        ...(dateFrom && { dueDate: { gte: new Date(dateFrom) } }),
        ...(dateTo && { dueDate: { lte: new Date(dateTo) } }),
      };

      // Get all payments
      const payments = await tenantPrisma.payment.findMany({
        where,
        include: {
          apartment: {
            select: {
              id: true,
              unitNumber: true,
            },
          },
        },
        orderBy: { dueDate: 'desc' },
      });

      // Calculate summary
      const totalPayments = payments.length;
      let totalAmount = 0;
      let paidAmount = 0;
      let pendingAmount = 0;
      let overdueAmount = 0;

      payments.forEach((payment) => {
        const amount = Number(payment.totalAmount || payment.amount);
        totalAmount += amount;

        if (payment.status === 'paid') {
          paidAmount += amount;
        } else if (payment.status === 'pending') {
          const isOverdue = dayjs(payment.dueDate).isBefore(dayjs(), 'day');
          if (isOverdue) {
            overdueAmount += amount;
          } else {
            pendingAmount += amount;
          }
        } else if (payment.status === 'overdue') {
          overdueAmount += amount;
        }
      });

      const collectionRate = totalAmount > 0 ? (paidAmount / totalAmount) * 100 : 0;
      const averagePaymentAmount = totalPayments > 0 ? totalAmount / totalPayments : 0;

      // Calculate by status
      const byStatus = {
        paid: { count: 0, amount: 0 },
        pending: { count: 0, amount: 0 },
        overdue: { count: 0, amount: 0 },
        cancelled: { count: 0, amount: 0 },
      };

      payments.forEach((payment) => {
        const amount = Number(payment.totalAmount || payment.amount);
        const status = payment.status as 'paid' | 'pending' | 'overdue' | 'cancelled';
        
        if (byStatus[status]) {
          byStatus[status].count++;
          byStatus[status].amount += amount;
        }
      });

      // Calculate by type
      const byType = {
        rent: { count: 0, amount: 0 },
        deposit: { count: 0, amount: 0 },
        fee: { count: 0, amount: 0 },
        maintenance: { count: 0, amount: 0 },
        utility: { count: 0, amount: 0 },
      };

      payments.forEach((payment) => {
        const amount = Number(payment.totalAmount || payment.amount);
        const type = payment.type as keyof typeof byType;
        
        if (byType[type]) {
          byType[type].count++;
          byType[type].amount += amount;
        }
      });

      // Calculate monthly trend (last 12 months)
      const monthlyTrend: Array<{
        month: string;
        total: number;
        paid: number;
        pending: number;
        overdue: number;
      }> = [];

      for (let i = 11; i >= 0; i--) {
        const monthStart = dayjs().subtract(i, 'month').startOf('month');
        const monthEnd = dayjs().subtract(i, 'month').endOf('month');
        const monthKey = monthStart.format('YYYY-MM');

        const monthPayments = payments.filter((p) => {
          const dueDate = dayjs(p.dueDate);
          return dueDate.isAfter(monthStart.subtract(1, 'day')) && dueDate.isBefore(monthEnd.add(1, 'day'));
        });

        let total = 0;
        let paid = 0;
        let pending = 0;
        let overdue = 0;

        monthPayments.forEach((p) => {
          const amount = Number(p.totalAmount || p.amount);
          total += amount;

          if (p.status === 'paid') {
            paid += amount;
          } else if (p.status === 'pending') {
            const isOverdue = dayjs(p.dueDate).isBefore(dayjs(), 'day');
            if (isOverdue) {
              overdue += amount;
            } else {
              pending += amount;
            }
          } else if (p.status === 'overdue') {
            overdue += amount;
          }
        });

        monthlyTrend.push({
          month: monthKey,
          total,
          paid,
          pending,
          overdue,
        });
      }

      // Get upcoming payments (next 30 days)
      const today = dayjs().startOf('day');
      const next30Days = dayjs().add(30, 'days').endOf('day');

      const upcomingPayments = payments
        .filter((p) => {
          const dueDate = dayjs(p.dueDate);
          return (
            p.status === 'pending' &&
            dueDate.isAfter(today) &&
            dueDate.isBefore(next30Days)
          );
        })
        .map((p) => ({
          id: p.id,
          apartmentUnitNumber: p.apartment?.unitNumber || 'N/A',
          amount: Number(p.totalAmount || p.amount),
          dueDate: p.dueDate.toISOString(),
          daysUntilDue: dayjs(p.dueDate).diff(today, 'day'),
        }))
        .sort((a, b) => a.daysUntilDue - b.daysUntilDue)
        .slice(0, 10);

      // Get overdue payments
      const overduePayments = payments
        .filter((p) => {
          const dueDate = dayjs(p.dueDate);
          return (
            (p.status === 'pending' || p.status === 'overdue') &&
            dueDate.isBefore(today)
          );
        })
        .map((p) => ({
          id: p.id,
          apartmentUnitNumber: p.apartment?.unitNumber || 'N/A',
          amount: Number(p.totalAmount || p.amount),
          dueDate: p.dueDate.toISOString(),
          daysOverdue: today.diff(dayjs(p.dueDate), 'day'),
        }))
        .sort((a, b) => b.daysOverdue - a.daysOverdue)
        .slice(0, 10);

      return successResponse({
        summary: {
          totalPayments,
          totalAmount: Math.round(totalAmount * 100) / 100,
          paidAmount: Math.round(paidAmount * 100) / 100,
          pendingAmount: Math.round(pendingAmount * 100) / 100,
          overdueAmount: Math.round(overdueAmount * 100) / 100,
          collectionRate: Math.round(collectionRate * 100) / 100,
          averagePaymentAmount: Math.round(averagePaymentAmount * 100) / 100,
        },
        byStatus,
        byType,
        monthlyTrend,
        upcomingPayments,
        overduePayments,
      });
    },
    { required: true, module: 'real-estate' }
  );
}








