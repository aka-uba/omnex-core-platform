'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type { ProductionStep, ProductionStepCreateInput, ProductionStepUpdateInput } from '@/modules/production/types/product';

const API_BASE = '/api/production/steps';

// GET /api/production/steps?orderId=xxx
export function useProductionSteps(orderId?: string, status?: string) {
  return useQuery<{ steps: ProductionStep[]; total: number }>({
    queryKey: ['production-steps', orderId, status],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (orderId) params.append('orderId', orderId);
      if (status) params.append('status', status);
      
      const response = await fetch(`${API_BASE}?${params.toString()}`);
      if (!response.ok) throw new Error('Failed to fetch production steps');
      const data = await response.json();
      return data.data;
    },
    enabled: !!orderId,
  });
}

// GET /api/production/steps/[id]
export function useProductionStep(id: string) {
  return useQuery<{ step: ProductionStep }>({
    queryKey: ['production-step', id],
    queryFn: async () => {
      const response = await fetch(`${API_BASE}/${id}`);
      if (!response.ok) throw new Error('Failed to fetch production step');
      const data = await response.json();
      return data.data;
    },
    enabled: !!id,
  });
}

// POST /api/production/steps
export function useCreateProductionStep() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (input: ProductionStepCreateInput) => {
      const response = await fetch(API_BASE, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(input),
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error?.message || 'Failed to create production step');
      }
      const data = await response.json();
      return data.data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['production-steps', variables.orderId] });
      queryClient.invalidateQueries({ queryKey: ['production-order', variables.orderId] });
    },
  });
}

// PATCH /api/production/steps/[id]
export function useUpdateProductionStep() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: ProductionStepUpdateInput }) => {
      const response = await fetch(`${API_BASE}/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error?.message || 'Failed to update production step');
      }
      const result = await response.json();
      return result.data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['production-step', data.step.id] });
      queryClient.invalidateQueries({ queryKey: ['production-steps', data.step.orderId] });
      queryClient.invalidateQueries({ queryKey: ['production-order', data.step.orderId] });
    },
  });
}

// DELETE /api/production/steps/[id]
export function useDeleteProductionStep() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (id: string) => {
      const response = await fetch(`${API_BASE}/${id}`, {
        method: 'DELETE',
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error?.message || 'Failed to delete production step');
      }
      const data = await response.json();
      return data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['production-steps'] });
    },
  });
}








