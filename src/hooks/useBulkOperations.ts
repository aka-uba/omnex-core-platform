import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type {
  BulkOperation,
  BulkOperationCreateInput,
  BulkOperationUpdateInput,
  BulkOperationListParams,
} from '@/modules/real-estate/types/bulk-operation';

const API_BASE = '/api/real-estate/bulk-operations';

// Fetch bulk operations list
export function useBulkOperations(params?: BulkOperationListParams) {
  return useQuery({
    queryKey: ['bulkOperations', params],
    queryFn: async () => {
      const searchParams = new URLSearchParams();
      if (params?.page) searchParams.set('page', params.page.toString());
      if (params?.pageSize) searchParams.set('pageSize', params.pageSize.toString());
      if (params?.search) searchParams.set('search', params.search);
      if (params?.type) searchParams.set('type', params.type);
      if (params?.status) searchParams.set('status', params.status);
      if (params?.createdBy) searchParams.set('createdBy', params.createdBy);
      if (params?.dateFrom) searchParams.set('dateFrom', params.dateFrom.toISOString());
      if (params?.dateTo) searchParams.set('dateTo', params.dateTo.toISOString());

      const response = await fetch(`${API_BASE}?${searchParams.toString()}`);
      if (!response.ok) {
        throw new Error('Failed to fetch bulk operations');
      }
      const data = await response.json();
      return data.data as {
        operations: BulkOperation[];
        total: number;
        page: number;
        pageSize: number;
      };
    },
  });
}

// Fetch single bulk operation
export function useBulkOperation(id: string) {
  return useQuery({
    queryKey: ['bulkOperation', id],
    queryFn: async () => {
      const response = await fetch(`${API_BASE}/${id}`);
      if (!response.ok) {
        throw new Error('Failed to fetch bulk operation');
      }
      const data = await response.json();
      return data.data.operation as BulkOperation;
    },
    enabled: !!id,
  });
}

// Create and execute bulk operation
export function useCreateBulkOperation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: BulkOperationCreateInput) => {
      const response = await fetch(API_BASE, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(input),
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error?.message || 'Failed to create bulk operation');
      }
      const data = await response.json();
      return data.data as { operation: BulkOperation; executed: boolean };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bulkOperations'] });
    },
  });
}

// Update bulk operation
export function useUpdateBulkOperation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, input }: { id: string; input: BulkOperationUpdateInput }) => {
      const response = await fetch(`${API_BASE}/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(input),
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error?.message || 'Failed to update bulk operation');
      }
      const data = await response.json();
      return data.data.operation as BulkOperation;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['bulkOperations'] });
      queryClient.invalidateQueries({ queryKey: ['bulkOperation', variables.id] });
    },
  });
}

// Delete bulk operation
export function useDeleteBulkOperation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const response = await fetch(`${API_BASE}/${id}`, {
        method: 'DELETE',
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error?.message || 'Failed to delete bulk operation');
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bulkOperations'] });
    },
  });
}








