import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { fetchApi } from '@/lib/api/fetchApi';
import type {
  PropertyExpense,
  PropertyExpenseCreate,
  PropertyExpenseUpdate,
} from '@/modules/real-estate/types/property-expense';

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
      const response = await fetchApi<PropertyExpensesResponse>(
        `/api/real-estate/property-expenses?${queryParams.toString()}`
      );
      return response;
    },
  });
}

export function usePropertyExpense(id: string | undefined) {
  return useQuery({
    queryKey: ['property-expense', id],
    queryFn: async () => {
      if (!id) return null;
      const response = await fetchApi<{ expense: PropertyExpense }>(
        `/api/real-estate/property-expenses/${id}`
      );
      return response.expense;
    },
    enabled: !!id,
  });
}

export function useCreatePropertyExpense() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: PropertyExpenseCreate) => {
      const response = await fetchApi<{ expense: PropertyExpense }>(
        '/api/real-estate/property-expenses',
        {
          method: 'POST',
          body: JSON.stringify(data),
        }
      );
      return response.expense;
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
      const response = await fetchApi<{ expense: PropertyExpense }>(
        `/api/real-estate/property-expenses/${id}`,
        {
          method: 'PUT',
          body: JSON.stringify(data),
        }
      );
      return response.expense;
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
      await fetchApi(`/api/real-estate/property-expenses/${id}`, {
        method: 'DELETE',
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['property-expenses'] });
    },
  });
}
