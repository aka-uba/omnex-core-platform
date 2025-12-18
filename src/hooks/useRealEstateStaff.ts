import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type {
  RealEstateStaff,
  RealEstateStaffCreateInput,
  RealEstateStaffUpdateInput,
  RealEstateStaffListParams,
} from '@/modules/real-estate/types/staff';

const API_BASE = '/api/real-estate/staff';

// Fetch real estate staff list
export function useRealEstateStaff(params?: RealEstateStaffListParams) {
  return useQuery({
    queryKey: ['realEstateStaff', params],
    queryFn: async () => {
      const searchParams = new URLSearchParams();
      if (params?.page) searchParams.set('page', params.page.toString());
      if (params?.pageSize) searchParams.set('pageSize', params.pageSize.toString());
      if (params?.search) searchParams.set('search', params.search);
      if (params?.staffType) searchParams.set('staffType', params.staffType);
      if (params?.role) searchParams.set('role', params.role);
      if (params?.isActive !== undefined) searchParams.set('isActive', params.isActive.toString());

      const response = await fetch(`${API_BASE}?${searchParams.toString()}`);
      if (!response.ok) {
        throw new Error('Failed to fetch real estate staff');
      }
      const data = await response.json();
      return data.data as { staff: RealEstateStaff[]; total: number; page: number; pageSize: number };
    },
  });
}

// Fetch single real estate staff
export function useRealEstateStaffMember(id: string) {
  return useQuery({
    queryKey: ['realEstateStaff', id],
    queryFn: async () => {
      const response = await fetch(`${API_BASE}/${id}`);
      if (!response.ok) {
        throw new Error('Failed to fetch real estate staff');
      }
      const data = await response.json();
      return data.data.staff as RealEstateStaff;
    },
    enabled: !!id,
  });
}

// Fetch staff performance metrics
export function useStaffPerformance(id: string, params?: { dateFrom?: string; dateTo?: string }) {
  return useQuery({
    queryKey: ['realEstateStaff', id, 'performance', params],
    queryFn: async () => {
      const searchParams = new URLSearchParams();
      if (params?.dateFrom) searchParams.set('dateFrom', params.dateFrom);
      if (params?.dateTo) searchParams.set('dateTo', params.dateTo);

      const response = await fetch(`${API_BASE}/${id}/performance?${searchParams.toString()}`);
      if (!response.ok) {
        throw new Error('Failed to fetch staff performance');
      }
      const data = await response.json();
      return data.data.performance as {
        assignedUnits: number;
        collectionRate: number;
        averageVacancyDays: number | null;
        customerSatisfaction: number | null;
        totalContracts: number;
        totalMaintenance: number;
        completedMaintenance: number;
        maintenanceCompletionRate: number;
        totalDue: number;
        totalPaid: number;
        emptyApartments: number;
        byStatus: {
          paid: { count: number; amount: number };
          pending: { count: number; amount: number };
          overdue: { count: number; amount: number };
        };
        monthlyTrend: Array<{
          month: string;
          collectionRate: number;
          maintenanceCompletionRate: number;
          totalDue: number;
          totalPaid: number;
          completedMaintenance: number;
          totalMaintenance: number;
        }>;
      };
    },
    enabled: !!id,
  });
}

// Create real estate staff
export function useCreateRealEstateStaff() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: RealEstateStaffCreateInput) => {
      const response = await fetch(API_BASE, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(input),
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error?.message || 'Failed to create real estate staff');
      }
      const data = await response.json();
      return data.data.staff as RealEstateStaff;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['realEstateStaff'] });
    },
  });
}

// Update real estate staff
export function useUpdateRealEstateStaff() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, input }: { id: string; input: RealEstateStaffUpdateInput }) => {
      const response = await fetch(`${API_BASE}/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(input),
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error?.message || 'Failed to update real estate staff');
      }
      const data = await response.json();
      return data.data.staff as RealEstateStaff;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['realEstateStaff'] });
      queryClient.invalidateQueries({ queryKey: ['realEstateStaff', variables.id] });
      queryClient.invalidateQueries({ queryKey: ['realEstateStaff', variables.id, 'performance'] });
    },
  });
}

// Delete real estate staff
export function useDeleteRealEstateStaff() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const response = await fetch(`${API_BASE}/${id}`, {
        method: 'DELETE',
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error?.message || 'Failed to delete real estate staff');
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['realEstateStaff'] });
    },
  });
}








