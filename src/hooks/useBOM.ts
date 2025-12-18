'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type { BOMItem, BOMItemCreateInput, BOMItemUpdateInput } from '@/modules/production/types/product';

const API_BASE = '/api/production/bom';

// GET /api/production/bom?bomId=xxx or ?productId=xxx
export function useBOMItems(bomId?: string, productId?: string) {
  return useQuery<{ bomItems: BOMItem[]; total: number }>({
    queryKey: ['bom-items', bomId, productId],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (bomId) params.append('bomId', bomId);
      if (productId) params.append('productId', productId);
      
      const response = await fetch(`${API_BASE}?${params.toString()}`);
      if (!response.ok) throw new Error('Failed to fetch BOM items');
      const data = await response.json();
      return data.data;
    },
    enabled: !!(bomId || productId),
  });
}

// GET /api/production/bom/[id]
export function useBOMItem(id: string) {
  return useQuery<{ bomItem: BOMItem }>({
    queryKey: ['bom-item', id],
    queryFn: async () => {
      const response = await fetch(`${API_BASE}/${id}`);
      if (!response.ok) throw new Error('Failed to fetch BOM item');
      const data = await response.json();
      return data.data;
    },
    enabled: !!id,
  });
}

// POST /api/production/bom
export function useCreateBOMItem() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (input: BOMItemCreateInput) => {
      const response = await fetch(API_BASE, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(input),
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error?.message || 'Failed to create BOM item');
      }
      const data = await response.json();
      return data.data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['bom-items', variables.bomId] });
      queryClient.invalidateQueries({ queryKey: ['bom-items', variables.productId] });
    },
  });
}

// PATCH /api/production/bom/[id]
export function useUpdateBOMItem() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: BOMItemUpdateInput }) => {
      const response = await fetch(`${API_BASE}/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error?.message || 'Failed to update BOM item');
      }
      const result = await response.json();
      return result.data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['bom-item', data.bomItem.id] });
      queryClient.invalidateQueries({ queryKey: ['bom-items', data.bomItem.bomId] });
      queryClient.invalidateQueries({ queryKey: ['bom-items', data.bomItem.productId] });
    },
  });
}

// DELETE /api/production/bom/[id]
export function useDeleteBOMItem() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (id: string) => {
      const response = await fetch(`${API_BASE}/${id}`, {
        method: 'DELETE',
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error?.message || 'Failed to delete BOM item');
      }
      const data = await response.json();
      return data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bom-items'] });
    },
  });
}








