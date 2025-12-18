import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { ProductionOrder, ProductionOrderCreateInput, ProductionOrderUpdateInput, ProductionOrderListParams } from '@/modules/production/types/product';

const API_BASE = '/api/production/orders';

// Fetch production orders list
export function useProductionOrders(params?: ProductionOrderListParams) {
  return useQuery({
    queryKey: ['productionOrders', params],
    queryFn: async () => {
      const searchParams = new URLSearchParams();
      if (params?.page) searchParams.set('page', params.page.toString());
      if (params?.pageSize) searchParams.set('pageSize', params.pageSize.toString());
      if (params?.search) searchParams.set('search', params.search);
      if (params?.productId) searchParams.set('productId', params.productId);
      if (params?.locationId) searchParams.set('locationId', params.locationId);
      if (params?.status) searchParams.set('status', params.status);
      if (params?.priority) searchParams.set('priority', params.priority);
      if (params?.isActive !== undefined) searchParams.set('isActive', params.isActive.toString());

      const response = await fetch(`${API_BASE}?${searchParams.toString()}`);
      if (!response.ok) {
        throw new Error('Failed to fetch production orders');
      }
      const data = await response.json();
      return data.data as { orders: ProductionOrder[]; total: number; page: number; pageSize: number };
    },
  });
}

// Fetch single production order
export function useProductionOrder(id: string) {
  return useQuery({
    queryKey: ['productionOrder', id],
    queryFn: async () => {
      const response = await fetch(`${API_BASE}/${id}`);
      if (!response.ok) {
        throw new Error('Failed to fetch production order');
      }
      const data = await response.json();
      return data.data.order as ProductionOrder;
    },
    enabled: !!id,
  });
}

// Create production order
export function useCreateProductionOrder() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: ProductionOrderCreateInput) => {
      const response = await fetch(API_BASE, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(input),
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to create production order');
      }
      const data = await response.json();
      return data.data.order as ProductionOrder;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['productionOrders'] });
    },
  });
}

// Update production order
export function useUpdateProductionOrder() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, input }: { id: string; input: ProductionOrderUpdateInput }) => {
      const response = await fetch(`${API_BASE}/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(input),
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to update production order');
      }
      const data = await response.json();
      return data.data.order as ProductionOrder;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['productionOrders'] });
      queryClient.invalidateQueries({ queryKey: ['productionOrder', variables.id] });
    },
  });
}

// Delete production order
export function useDeleteProductionOrder() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const response = await fetch(`${API_BASE}/${id}`, {
        method: 'DELETE',
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to delete production order');
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['productionOrders'] });
    },
  });
}


