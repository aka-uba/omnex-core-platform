import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { Employee, EmployeeCreateInput, EmployeeUpdateInput, EmployeeListParams } from '@/modules/hr/types/hr';

const API_BASE = '/api/hr/employees';

export function useEmployees(params?: EmployeeListParams) {
  return useQuery({
    queryKey: ['hr-employees', params],
    queryFn: async () => {
      const searchParams = new URLSearchParams();
      if (params?.page) searchParams.set('page', params.page.toString());
      if (params?.pageSize) searchParams.set('pageSize', params.pageSize.toString());
      if (params?.search) searchParams.set('search', params.search);
      if (params?.department) searchParams.set('department', params.department);
      if (params?.position) searchParams.set('position', params.position);
      if (params?.workType) searchParams.set('workType', params.workType);
      if (params?.isActive !== undefined) searchParams.set('isActive', params.isActive.toString());
      if (params?.managerId) searchParams.set('managerId', params.managerId);

      const response = await fetch(`${API_BASE}?${searchParams.toString()}`);
      if (!response.ok) {
        throw new Error('Failed to fetch employees');
      }
      const data = await response.json();
      return data.data as { employees: Employee[]; total: number; page: number; pageSize: number };
    },
  });
}

export function useEmployee(id: string) {
  return useQuery({
    queryKey: ['hr-employee', id],
    queryFn: async () => {
      const response = await fetch(`${API_BASE}/${id}`);
      if (!response.ok) {
        throw new Error('Failed to fetch employee');
      }
      const data = await response.json();
      return data.data.employee as Employee;
    },
    enabled: !!id,
  });
}

export function useCreateEmployee() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: EmployeeCreateInput) => {
      const response = await fetch(API_BASE, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...input,
          hireDate: input.hireDate instanceof Date ? input.hireDate.toISOString() : input.hireDate,
        }),
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to create employee');
      }
      const data = await response.json();
      return data.data.employee as Employee;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['hr-employees'] });
    },
  });
}

export function useUpdateEmployee() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...input }: EmployeeUpdateInput & { id: string }) => {
      const response = await fetch(`${API_BASE}/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...input,
          hireDate: input.hireDate instanceof Date ? input.hireDate.toISOString() : input.hireDate,
        }),
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to update employee');
      }
      const data = await response.json();
      return data.data.employee as Employee;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['hr-employees'] });
      queryClient.invalidateQueries({ queryKey: ['hr-employee', variables.id] });
    },
  });
}

export function useDeleteEmployee() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const response = await fetch(`${API_BASE}/${id}`, {
        method: 'DELETE',
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to delete employee');
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['hr-employees'] });
    },
  });
}







