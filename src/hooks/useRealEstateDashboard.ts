import { useQuery } from '@tanstack/react-query';

const API_BASE = '/api/real-estate/dashboard';

export interface DashboardStatistics {
  properties: {
    total: number;
    active: number;
    byType: Record<string, number>;
  };
  apartments: {
    total: number;
    occupied: number;
    vacant: number;
    occupancyRate: number;
  };
  tenants: {
    total: number;
    active: number;
    inactive: number;
  };
  contracts: {
    total: number;
    active: number;
    expired: number;
    expiringSoon: number;
    byStatus: Record<string, number>;
  };
  payments: {
    total: number;
    paid: number;
    pending: number;
    overdue: number;
    totalAmount: number;
    paidAmount: number;
    pendingAmount: number;
    overdueAmount: number;
    byStatus: Record<string, { count: number; amount: number }>;
    byType: Record<string, { count: number; amount: number }>;
  };
  appointments: {
    total: number;
    upcoming: number;
    completed: number;
    cancelled: number;
    byStatus: Record<string, number>;
  };
  maintenance: {
    total: number;
    open: number;
    inProgress: number;
    completed: number;
    byType: Record<string, number>;
  };
}

export interface DashboardRevenue {
  total: number;
  thisMonth: number;
  lastMonth: number;
  monthlyTrend: Array<{
    month: string;
    revenue: number;
    expenses: number;
    net: number;
  }>;
}

export interface DashboardActivity {
  id: string;
  type: 'payment' | 'contract' | 'appointment' | 'maintenance' | 'tenant';
  title: string;
  description: string;
  date: string;
  icon: string;
  color: string;
}

export interface DashboardUpcomingPayment {
  id: string;
  tenantName: string;
  apartment: string;
  amount: number;
  currency: string;
  dueDate: string;
  daysUntilDue: number;
}

export interface DashboardExpiringContract {
  id: string;
  contractNumber: string;
  tenantName: string;
  apartment: string;
  endDate: string;
  daysUntilExpiry: number;
}

export interface DashboardData {
  statistics: DashboardStatistics;
  revenue: DashboardRevenue;
  recentActivity: DashboardActivity[];
  upcomingPayments: DashboardUpcomingPayment[];
  expiringContracts: DashboardExpiringContract[];
}

export function useRealEstateDashboard() {
  return useQuery<DashboardData>({
    queryKey: ['real-estate-dashboard'],
    queryFn: async () => {
      const response = await fetch(API_BASE);
      if (!response.ok) {
        throw new Error('Failed to fetch dashboard data');
      }
      const data = await response.json();
      return data.data as DashboardData;
    },
    refetchInterval: 30000, // Refetch every 30 seconds for live data
  });
}

