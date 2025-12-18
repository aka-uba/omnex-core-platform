'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type { Role, RoleListResponse, RoleQueryParams, RoleFormData } from '@/lib/schemas/role';

const API_BASE = '/api/roles';

// Fetch roles list
export function useRoles(params?: RoleQueryParams) {
  return useQuery<RoleListResponse>({
    queryKey: ['roles', params],
    queryFn: async () => {
      const searchParams = new URLSearchParams();
      if (params?.page) searchParams.set('page', params.page.toString());
      if (params?.pageSize) searchParams.set('pageSize', params.pageSize.toString());
      if (params?.search) searchParams.set('search', params.search);
      if (params?.withUsers) searchParams.set('withUsers', 'true');

      const response = await fetch(`${API_BASE}?${searchParams.toString()}`);
      if (!response.ok) throw new Error('Failed to fetch roles');
      
      const result = await response.json();
      
      // Transform API response to match RoleListResponse interface
      if (result.success && result.data) {
        return {
          roles: result.data,
          total: result.total || 0,
          page: result.page || 1,
          pageSize: result.pageSize || 10,
        };
      }
      
      // Fallback if response format is different
      return {
        roles: result.roles || result.data || [],
        total: result.total || 0,
        page: result.page || 1,
        pageSize: result.pageSize || 10,
      };
    },
  });
}

// Fetch single role
export function useRole(roleId: string) {
  return useQuery<Role>({
    queryKey: ['role', roleId],
    queryFn: async () => {
      const response = await fetch(`${API_BASE}/${roleId}`);
      if (!response.ok) throw new Error('Failed to fetch role');
      return response.json();
    },
    enabled: !!roleId,
  });
}

// Create role
export function useCreateRole() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: RoleFormData) => {
      const response = await fetch(API_BASE, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to create role');
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['roles'] });
    },
  });
}

// Update role
export function useUpdateRole() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ roleId, data }: { roleId: string; data: Partial<RoleFormData> }) => {
      const response = await fetch(`${API_BASE}/${roleId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to update role');
      }

      return response.json();
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['roles'] });
      queryClient.invalidateQueries({ queryKey: ['role', variables.roleId] });
    },
  });
}

// Delete role
export function useDeleteRole() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (roleId: string) => {
      const response = await fetch(`${API_BASE}/${roleId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to delete role');
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['roles'] });
    },
  });
}




