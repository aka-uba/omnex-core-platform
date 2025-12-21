import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type {
  PropertyExpense,
  PropertyExpenseCreate,
  PropertyExpenseUpdate,
} from '@/modules/real-estate/types/property-expense';

const API_BASE = '/api/real-estate/property-expenses';

interface PropertyExpensesResponse {
  expenses: PropertyExpense[];
  total: number;
  page: number;
  pageSize: number;
}

interface UsePropertyExpensesParams {
  propertyId?: string;
  year?: number;
  month?: number;
  category?: string;
  isDistributed?: boolean;
  page?: number;
  pageSize?: number;
}

export function usePropertyExpenses(params: UsePropertyExpensesParams = {}) {
  const queryParams = new URLSearchParams();

  if (params.propertyId) queryParams.set('propertyId', params.propertyId);
  if (params.year) queryParams.set('year', String(params.year));
  if (params.month) queryParams.set('month', String(params.month));
  if (params.category) queryParams.set('category', params.category);
  if (params.isDistributed !== undefined) queryParams.set('isDistributed', String(params.isDistributed));
  if (params.page) queryParams.set('page', String(params.page));
  if (params.pageSize) queryParams.set('pageSize', String(params.pageSize));

  return useQuery({
    queryKey: ['property-expenses', params],
    queryFn: async () => {
      const response = await fetch(`${API_BASE}?${queryParams.toString()}`);
      if (!response.ok) {
        throw new Error('Failed to fetch property expenses');
      }
      const data = await response.json();
      return data.data as PropertyExpensesResponse;
    },
  });
}

export function usePropertyExpense(id: string | undefined) {
  return useQuery({
    queryKey: ['property-expense', id],
    queryFn: async () => {
      if (!id) return null;
      const response = await fetch(`${API_BASE}/${id}`);
      if (!response.ok) {
        throw new Error('Failed to fetch property expense');
      }
      const data = await response.json();
      return data.data.expense as PropertyExpense;
    },
    enabled: !!id,
  });
}

export function useCreatePropertyExpense() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: PropertyExpenseCreate) => {
      const response = await fetch(API_BASE, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to create property expense');
      }
      const result = await response.json();
      return result.data.expense as PropertyExpense;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['property-expenses'] });
    },
  });
}

export function useUpdatePropertyExpense() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: PropertyExpenseUpdate }) => {
      const response = await fetch(`${API_BASE}/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to update property expense');
      }
      const result = await response.json();
      return result.data.expense as PropertyExpense;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['property-expenses'] });
      queryClient.invalidateQueries({ queryKey: ['property-expense', variables.id] });
    },
  });
}

export function useDeletePropertyExpense() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const response = await fetch(`${API_BASE}/${id}`, {
        method: 'DELETE',
      });
      if (!response.ok) {
        throw new Error('Failed to delete property expense');
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['property-expenses'] });
    },
  });
}
