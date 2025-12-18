import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { Leave, LeaveCreateInput, LeaveUpdateInput, LeaveListParams } from '@/modules/hr/types/hr';

const API_BASE = '/api/hr/leaves';

export function useLeaves(params?: LeaveListParams) {
  return useQuery({
    queryKey: ['hr-leaves', params],
    queryFn: async () => {
      const searchParams = new URLSearchParams();
      if (params?.page) searchParams.set('page', params.page.toString());
      if (params?.pageSize) searchParams.set('pageSize', params.pageSize.toString());
      if (params?.search) searchParams.set('search', params.search);
      if (params?.employeeId) searchParams.set('employeeId', params.employeeId);
      if (params?.type) searchParams.set('type', params.type);
      if (params?.status) searchParams.set('status', params.status);
      if (params?.startDateFrom) searchParams.set('startDateFrom', params.startDateFrom.toISOString());
      if (params?.startDateTo) searchParams.set('startDateTo', params.startDateTo.toISOString());

      const response = await fetch(`${API_BASE}?${searchParams.toString()}`);
      if (!response.ok) {
        throw new Error('Failed to fetch leaves');
      }
      const data = await response.json();
      return data.data as { leaves: Leave[]; total: number; page: number; pageSize: number };
    },
  });
}

export function useLeave(id: string) {
  return useQuery({
    queryKey: ['hr-leave', id],
    queryFn: async () => {
      const response = await fetch(`${API_BASE}/${id}`);
      if (!response.ok) {
        throw new Error('Failed to fetch leave');
      }
      const data = await response.json();
      return data.data.leave as Leave;
    },
    enabled: !!id,
  });
}

export function useCreateLeave() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: LeaveCreateInput) => {
      const response = await fetch(API_BASE, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...input,
          startDate: input.startDate instanceof Date ? input.startDate.toISOString() : input.startDate,
          endDate: input.endDate instanceof Date ? input.endDate.toISOString() : input.endDate,
        }),
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to create leave');
      }
      const data = await response.json();
      return data.data.leave as Leave;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['hr-leaves'] });
    },
  });
}

export function useUpdateLeave() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...input }: LeaveUpdateInput & { id: string }) => {
      const response = await fetch(`${API_BASE}/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...input,
          startDate: input.startDate instanceof Date ? input.startDate.toISOString() : input.startDate,
          endDate: input.endDate instanceof Date ? input.endDate.toISOString() : input.endDate,
        }),
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to update leave');
      }
      const data = await response.json();
      return data.data.leave as Leave;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['hr-leaves'] });
      queryClient.invalidateQueries({ queryKey: ['hr-leave', variables.id] });
    },
  });
}

export function useDeleteLeave() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const response = await fetch(`${API_BASE}/${id}`, {
        method: 'DELETE',
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to delete leave');
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['hr-leaves'] });
    },
  });
}







