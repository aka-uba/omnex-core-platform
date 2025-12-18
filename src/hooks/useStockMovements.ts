import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { StockMovement, StockMovementCreateInput, StockMovementListParams } from '@/modules/production/types/product';

const API_BASE = '/api/production/stock/movements';

// Fetch stock movements list
export function useStockMovements(params?: StockMovementListParams) {
  return useQuery({
    queryKey: ['stockMovements', params],
    queryFn: async () => {
      const searchParams = new URLSearchParams();
      if (params?.page) searchParams.set('page', params.page.toString());
      if (params?.pageSize) searchParams.set('pageSize', params.pageSize.toString());
      if (params?.productId) searchParams.set('productId', params.productId);
      if (params?.locationId) searchParams.set('locationId', params.locationId);
      if (params?.type) searchParams.set('type', params.type);
      if (params?.referenceType) searchParams.set('referenceType', params.referenceType);
      if (params?.referenceId) searchParams.set('referenceId', params.referenceId);
      if (params?.startDate) searchParams.set('startDate', params.startDate.toISOString());
      if (params?.endDate) searchParams.set('endDate', params.endDate.toISOString());

      const response = await fetch(`${API_BASE}?${searchParams.toString()}`);
      if (!response.ok) {
        throw new Error('Failed to fetch stock movements');
      }
      const data = await response.json();
      return data.data as { movements: StockMovement[]; total: number; page: number; pageSize: number };
    },
  });
}

// Create stock movement
export function useCreateStockMovement() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: StockMovementCreateInput) => {
      const response = await fetch(API_BASE, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(input),
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to create stock movement');
      }
      const data = await response.json();
      return data.data.movement as StockMovement;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['stockMovements'] });
      queryClient.invalidateQueries({ queryKey: ['products'] }); // Update product stock
    },
  });
}








