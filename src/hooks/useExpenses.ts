import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { Expense, ExpenseCreateInput, ExpenseUpdateInput, ExpenseListParams } from '@/modules/accounting/types/subscription';

const API_BASE = '/api/accounting/expenses';

export function useExpenses(params?: ExpenseListParams) {
  return useQuery({
    queryKey: ['expenses', params],
    queryFn: async () => {
      const searchParams = new URLSearchParams();
      if (params?.page) searchParams.set('page', params.page.toString());
      if (params?.pageSize) searchParams.set('pageSize', params.pageSize.toString());
      if (params?.search) searchParams.set('search', params.search);
      if (params?.category) searchParams.set('category', params.category);
      if (params?.type) searchParams.set('type', params.type);
      if (params?.locationId) searchParams.set('locationId', params.locationId);
      if (params?.subscriptionId) searchParams.set('subscriptionId', params.subscriptionId);
      if (params?.assignedUserId) searchParams.set('assignedUserId', params.assignedUserId);
      if (params?.status) searchParams.set('status', params.status);
      if (params?.startDate) searchParams.set('startDate', params.startDate.toISOString());
      if (params?.endDate) searchParams.set('endDate', params.endDate.toISOString());
      if (params?.isActive !== undefined) searchParams.set('isActive', params.isActive.toString());

      const response = await fetch(`${API_BASE}?${searchParams.toString()}`);
      if (!response.ok) {
        throw new Error('Failed to fetch expenses');
      }
      const data = await response.json();
      return data.data as { expenses: Expense[]; total: number; page: number; pageSize: number };
    },
  });
}

export function useExpense(id: string) {
  return useQuery({
    queryKey: ['expense', id],
    queryFn: async () => {
      const response = await fetch(`${API_BASE}/${id}`);
      if (!response.ok) {
        throw new Error('Failed to fetch expense');
      }
      const data = await response.json();
      return data.data.expense as Expense;
    },
    enabled: !!id,
  });
}

export function useCreateExpense() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: ExpenseCreateInput) => {
      const response = await fetch(API_BASE, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(input),
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to create expense');
      }
      const data = await response.json();
      return data.data.expense as Expense;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['expenses'] });
    },
  });
}

export function useUpdateExpense() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...input }: ExpenseUpdateInput & { id: string }) => {
      const response = await fetch(`${API_BASE}/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(input),
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to update expense');
      }
      const data = await response.json();
      return data.data.expense as Expense;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['expenses'] });
      queryClient.invalidateQueries({ queryKey: ['expense', variables.id] });
    },
  });
}

export function useDeleteExpense() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const response = await fetch(`${API_BASE}/${id}`, {
        method: 'DELETE',
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to delete expense');
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['expenses'] });
    },
  });
}








