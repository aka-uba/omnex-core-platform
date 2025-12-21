import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type {
  SideCostReconciliation,
  ReconciliationCreate,
  ReconciliationUpdate,
} from '@/modules/real-estate/types/property-expense';

const API_BASE = '/api/real-estate/reconciliation';

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
      const response = await fetch(`${API_BASE}?${queryParams.toString()}`);
      if (!response.ok) {
        throw new Error('Failed to fetch reconciliations');
      }
      const data = await response.json();
      return data.data as ReconciliationsResponse;
    },
  });
}

export function useReconciliation(id: string | undefined) {
  return useQuery({
    queryKey: ['reconciliation', id],
    queryFn: async () => {
      if (!id) return null;
      const response = await fetch(`${API_BASE}/${id}`);
      if (!response.ok) {
        throw new Error('Failed to fetch reconciliation');
      }
      const data = await response.json();
      return data.data.reconciliation as SideCostReconciliation & {
        expenses: unknown[];
        categoryTotals: Record<string, number>;
      };
    },
    enabled: !!id,
  });
}

export function useCreateReconciliation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: ReconciliationCreate) => {
      const response = await fetch(API_BASE, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to create reconciliation');
      }
      const result = await response.json();
      return result.data.reconciliation as SideCostReconciliation & {
        totalDebt: number;
        totalCredit: number;
      };
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
      const response = await fetch(`${API_BASE}/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to update reconciliation');
      }
      const result = await response.json();
      return result.data.reconciliation as SideCostReconciliation;
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
      const response = await fetch(`${API_BASE}/${id}`, {
        method: 'DELETE',
      });
      if (!response.ok) {
        throw new Error('Failed to delete reconciliation');
      }
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
      const response = await fetch(`${API_BASE}/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'finalized' }),
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to finalize reconciliation');
      }
      const result = await response.json();
      return result.data.reconciliation as SideCostReconciliation;
    },
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: ['reconciliations'] });
      queryClient.invalidateQueries({ queryKey: ['reconciliation', id] });
    },
  });
}
