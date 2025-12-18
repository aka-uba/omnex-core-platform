import { NextRequest } from 'next/server';
import { withTenant } from '@/lib/api/withTenant';
import { successResponse, errorResponse } from '@/lib/api/errorHandler';
import type { ApiResponse } from '@/lib/api/errorHandler';
import { getTenantFromRequest } from '@/lib/api/tenantContext';
import { Prisma } from '@prisma/tenant-client';
import dayjs from 'dayjs';

// GET /api/accounting/analytics - Get accounting analytics
export async function GET(request: NextRequest) {
  return withTenant<ApiResponse<{
    summary: {
      totalSubscriptions: number;
      activeSubscriptions: number;
      totalInvoices: number;
      paidInvoices: number;
      totalRevenue: number;
      totalExpenses: number;
      netProfit: number;
    };
    subscriptionsByStatus: Array<{ status: string; count: number }>;
    invoicesByStatus: Array<{ status: string; count: number }>;
    revenueByMonth: Array<{ month: string; revenue: number; expenses: number }>;
    expensesByCategory: Array<{ category: string; amount: number }>;
  }>>(
    request,
    async (tenantPrisma) => {
      const searchParams = request.nextUrl.searchParams;
      const dateFrom = searchParams.get('dateFrom');
      const dateTo = searchParams.get('dateTo');

      // Get tenant context
      const tenantContext = await getTenantFromRequest(request);
      if (!tenantContext) {
        return errorResponse('Tenant context required', 'Tenant context could not be determined', 400);
      }

      // Build date filter
      const whereDate: Prisma.InvoiceWhereInput = {};
      if (dateFrom || dateTo) {
        whereDate.createdAt = {};
        if (dateFrom) {
          whereDate.createdAt.gte = new Date(dateFrom);
        }
        if (dateTo) {
          whereDate.createdAt.lte = new Date(dateTo);
        }
      }

      // Get summary
      const [
        totalSubscriptions,
        activeSubscriptions,
        totalInvoices,
        paidInvoices,
        subscriptionsByStatus,
        invoicesByStatus,
        payments,
        expenses,
      ] = await Promise.all([
        // Total subscriptions
        tenantPrisma.subscription.count({
          where: {
            tenantId: tenantContext.id,
            isActive: true,
          },
        }),
        // Active subscriptions
        tenantPrisma.subscription.count({
          where: {
            tenantId: tenantContext.id,
            status: 'active',
            isActive: true,
          },
        }),
        // Total invoices
        tenantPrisma.invoice.count({
          where: {
            tenantId: tenantContext.id,
            ...whereDate,
          },
        }),
        // Paid invoices
        tenantPrisma.invoice.count({
          where: {
            tenantId: tenantContext.id,
            status: 'paid',
            ...whereDate,
          },
        }),
        // Subscriptions by status
        tenantPrisma.subscription.groupBy({
          by: ['status'],
          where: {
            tenantId: tenantContext.id,
            isActive: true,
          },
          _count: true,
        }),
        // Invoices by status
        tenantPrisma.invoice.groupBy({
          by: ['status'],
          where: {
            tenantId: tenantContext.id,
            ...whereDate,
          },
          _count: true,
        }),
        // Payments (last 12 months)
        tenantPrisma.accountingPayment.findMany({
          where: {
            tenantId: tenantContext.id,
            createdAt: {
              gte: dayjs().subtract(12, 'months').toDate(),
            },
          },
          select: {
            createdAt: true,
            amount: true,
          },
        }),
        // Expenses (last 12 months)
        tenantPrisma.expense.findMany({
          where: {
            tenantId: tenantContext.id,
            expenseDate: {
              gte: dayjs().subtract(12, 'months').toDate(),
            },
            status: 'approved',
          },
          select: {
            expenseDate: true,
            amount: true,
            category: true,
          },
        }),
      ]);

      // Calculate totals
      const totalRevenue = payments.reduce((sum, p) => sum + Number(p.amount), 0);
      const totalExpenses = expenses.reduce((sum, e) => sum + Number(e.amount), 0);
      const netProfit = totalRevenue - totalExpenses;

      // Process revenue by month
      const monthlyData: Record<string, { revenue: number; expenses: number }> = {};
      payments.forEach((payment) => {
        const month = dayjs(payment.createdAt).format('YYYY-MM');
        if (!monthlyData[month]) {
          monthlyData[month] = { revenue: 0, expenses: 0 };
        }
        monthlyData[month].revenue += Number(payment.amount);
      });

      expenses.forEach((expense) => {
        const month = dayjs(expense.expenseDate).format('YYYY-MM');
        if (!monthlyData[month]) {
          monthlyData[month] = { revenue: 0, expenses: 0 };
        }
        monthlyData[month].expenses += Number(expense.amount);
      });

      const revenueByMonth = Object.entries(monthlyData)
        .map(([month, data]) => ({
          month,
          revenue: data.revenue,
          expenses: data.expenses,
        }))
        .sort((a, b) => a.month.localeCompare(b.month));

      // Process expenses by category
      const categoryData: Record<string, number> = {};
      expenses.forEach((expense) => {
        const category = expense.category || 'Other';
        if (!categoryData[category]) {
          categoryData[category] = 0;
        }
        categoryData[category] += Number(expense.amount);
      });

      const expensesByCategory = Object.entries(categoryData)
        .map(([category, amount]) => ({
          category,
          amount,
        }))
        .sort((a, b) => b.amount - a.amount);

      return successResponse({
        summary: {
          totalSubscriptions,
          activeSubscriptions,
          totalInvoices,
          paidInvoices,
          totalRevenue,
          totalExpenses,
          netProfit,
        },
        subscriptionsByStatus: subscriptionsByStatus.map((item) => ({
          status: item.status,
          count: item._count,
        })),
        invoicesByStatus: invoicesByStatus.map((item) => ({
          status: item.status,
          count: item._count,
        })),
        revenueByMonth,
        expensesByCategory,
      });
    },
    { required: true, module: 'accounting' }
  );
}








