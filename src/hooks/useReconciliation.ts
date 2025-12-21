import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { fetchApi } from '@/lib/api/fetchApi';
import type {
  SideCostReconciliation,
  ReconciliationCreate,
  ReconciliationUpdate,
} from '@/modules/real-estate/types/property-expense';

interface ReconciliationsResponse {
  reconciliations: SideCostReconciliation[];
  total: number;
  page: number;
  pageSize: number;
}

interface UseReconciliationsParams {
  propertyId?: string;
  year?: number;
  status?: string;
  page?: number;
  pageSize?: number;
}

export function useReconciliations(params: UseReconciliationsParams = {}) {
  const queryParams = new URLSearchParams();

  if (params.propertyId) queryParams.set('propertyId', params.propertyId);
  if (params.year) queryParams.set('year', String(params.year));
  if (params.status) queryParams.set('status', params.status);
  if (params.page) queryParams.set('page', String(params.page));
  if (params.pageSize) queryParams.set('pageSize', String(params.pageSize));

  return useQuery({
    queryKey: ['reconciliations', params],
    queryFn: async () => {
      const response = await fetchApi<ReconciliationsResponse>(
        `/api/real-estate/reconciliation?${queryParams.toString()}`
      );
      return response;
    },
  });
}

export function useReconciliation(id: string | undefined) {
  return useQuery({
    queryKey: ['reconciliation', id],
    queryFn: async () => {
      if (!id) return null;
      const response = await fetchApi<{
        reconciliation: SideCostReconciliation & {
          expenses: unknown[];
          categoryTotals: Record<string, number>;
        };
      }>(`/api/real-estate/reconciliation/${id}`);
      return response.reconciliation;
    },
    enabled: !!id,
  });
}

export function useCreateReconciliation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: ReconciliationCreate) => {
      const response = await fetchApi<{
        reconciliation: SideCostReconciliation & {
          totalDebt: number;
          totalCredit: number;
        };
      }>('/api/real-estate/reconciliation', {
        method: 'POST',
        body: JSON.stringify(data),
      });
      return response.reconciliation;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reconciliations'] });
    },
  });
}

export function useUpdateReconciliation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: ReconciliationUpdate }) => {
      const response = await fetchApi<{ reconciliation: SideCostReconciliation }>(
        `/api/real-estate/reconciliation/${id}`,
        {
          method: 'PUT',
          body: JSON.stringify(data),
        }
      );
      return response.reconciliation;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['reconciliations'] });
      queryClient.invalidateQueries({ queryKey: ['reconciliation', variables.id] });
    },
  });
}

export function useDeleteReconciliation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      await fetchApi(`/api/real-estate/reconciliation/${id}`, {
        method: 'DELETE',
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reconciliations'] });
    },
  });
}

// Finalize reconciliation
export function useFinalizeReconciliation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const response = await fetchApi<{ reconciliation: SideCostReconciliation }>(
        `/api/real-estate/reconciliation/${id}`,
        {
          method: 'PUT',
          body: JSON.stringify({ status: 'finalized' }),
        }
      );
      return response.reconciliation;
    },
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: ['reconciliations'] });
      queryClient.invalidateQueries({ queryKey: ['reconciliation', id] });
    },
  });
}
