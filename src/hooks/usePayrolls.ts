import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { Payroll, PayrollCreateInput, PayrollUpdateInput, PayrollListParams } from '@/modules/hr/types/hr';

const API_BASE = '/api/hr/payrolls';

export function usePayrolls(params?: PayrollListParams) {
  return useQuery({
    queryKey: ['hr-payrolls', params],
    queryFn: async () => {
      const searchParams = new URLSearchParams();
      if (params?.page) searchParams.set('page', params.page.toString());
      if (params?.pageSize) searchParams.set('pageSize', params.pageSize.toString());
      if (params?.search) searchParams.set('search', params.search);
      if (params?.employeeId) searchParams.set('employeeId', params.employeeId);
      if (params?.period) searchParams.set('period', params.period);
      if (params?.status) searchParams.set('status', params.status);
      if (params?.payDateFrom) searchParams.set('payDateFrom', params.payDateFrom.toISOString());
      if (params?.payDateTo) searchParams.set('payDateTo', params.payDateTo.toISOString());

      const response = await fetch(`${API_BASE}?${searchParams.toString()}`);
      if (!response.ok) {
        throw new Error('Failed to fetch payrolls');
      }
      const data = await response.json();
      return data.data as { payrolls: Payroll[]; total: number; page: number; pageSize: number };
    },
  });
}

export function usePayroll(id: string) {
  return useQuery({
    queryKey: ['hr-payroll', id],
    queryFn: async () => {
      const response = await fetch(`${API_BASE}/${id}`);
      if (!response.ok) {
        throw new Error('Failed to fetch payroll');
      }
      const data = await response.json();
      return data.data.payroll as Payroll;
    },
    enabled: !!id,
  });
}

export function useCreatePayroll() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: PayrollCreateInput) => {
      const response = await fetch(API_BASE, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...input,
          payDate: input.payDate instanceof Date ? input.payDate.toISOString() : input.payDate,
        }),
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to create payroll');
      }
      const data = await response.json();
      return data.data.payroll as Payroll;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['hr-payrolls'] });
    },
  });
}

export function useUpdatePayroll() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...input }: PayrollUpdateInput & { id: string }) => {
      const response = await fetch(`${API_BASE}/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...input,
          payDate: input.payDate instanceof Date ? input.payDate.toISOString() : input.payDate,
        }),
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to update payroll');
      }
      const data = await response.json();
      return data.data.payroll as Payroll;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['hr-payrolls'] });
      queryClient.invalidateQueries({ queryKey: ['hr-payroll', variables.id] });
    },
  });
}

export function useDeletePayroll() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const response = await fetch(`${API_BASE}/${id}`, {
        method: 'DELETE',
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to delete payroll');
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['hr-payrolls'] });
    },
  });
}







