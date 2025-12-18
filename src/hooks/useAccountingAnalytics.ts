'use client';

import { useQuery } from '@tanstack/react-query';

const API_BASE = '/api/accounting/analytics';

export interface AccountingAnalytics {
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
}

export function useAccountingAnalytics(params?: { dateFrom?: string; dateTo?: string }) {
  return useQuery<AccountingAnalytics>({
    queryKey: ['accounting-analytics', params],
    queryFn: async () => {
      const searchParams = new URLSearchParams();
      if (params?.dateFrom) searchParams.append('dateFrom', params.dateFrom);
      if (params?.dateTo) searchParams.append('dateTo', params.dateTo);

      const response = await fetch(`${API_BASE}?${searchParams.toString()}`);
      if (!response.ok) throw new Error('Failed to fetch accounting analytics');
      const data = await response.json();
      return data.data;
    },
  });
}








