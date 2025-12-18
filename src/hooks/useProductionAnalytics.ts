'use client';

import { useQuery } from '@tanstack/react-query';

const API_BASE = '/api/production/analytics';

export interface ProductionAnalytics {
  summary: {
    totalProducts: number;
    totalOrders: number;
    activeOrders: number;
    completedOrders: number;
    totalStockValue: number;
  };
  ordersByStatus: Array<{ status: string; count: number }>;
  ordersByMonth: Array<{ month: string; count: number; completed: number }>;
  lowStockProducts: number;
}

export function useProductionAnalytics(params?: { dateFrom?: string; dateTo?: string }) {
  return useQuery<ProductionAnalytics>({
    queryKey: ['production-analytics', params],
    queryFn: async () => {
      const searchParams = new URLSearchParams();
      if (params?.dateFrom) searchParams.append('dateFrom', params.dateFrom);
      if (params?.dateTo) searchParams.append('dateTo', params.dateTo);

      const response = await fetch(`${API_BASE}?${searchParams.toString()}`);
      if (!response.ok) throw new Error('Failed to fetch production analytics');
      const data = await response.json();
      return data.data;
    },
  });
}








