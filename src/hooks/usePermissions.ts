'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type { Permission, PermissionListResponse, PermissionQueryParams, PermissionFormData } from '@/lib/schemas/permission';

const API_BASE = '/api/permissions';

// Fetch permissions list
export function usePermissions(params?: PermissionQueryParams) {
  return useQuery<PermissionListResponse>({
    queryKey: ['permissions', params],
    queryFn: async () => {
      const searchParams = new URLSearchParams();
      if (params?.page) searchParams.set('page', params.page.toString());
      if (params?.pageSize) searchParams.set('pageSize', params.pageSize.toString());
      if (params?.search) searchParams.set('search', params.search);
      if (params?.category) searchParams.set('category', params.category);
      if (params?.module) searchParams.set('module', params.module);

      const response = await fetch(`${API_BASE}?${searchParams.toString()}`);
      if (!response.ok) throw new Error('Failed to fetch permissions');
      return response.json();
    },
  });
}

// Fetch single permission
export function usePermission(permissionId: string) {
  return useQuery<Permission>({
    queryKey: ['permission', permissionId],
    queryFn: async () => {
      const response = await fetch(`${API_BASE}/${permissionId}`);
      if (!response.ok) throw new Error('Failed to fetch permission');
      return response.json();
    },
    enabled: !!permissionId,
  });
}

// Create permission
export function useCreatePermission() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: PermissionFormData) => {
      const response = await fetch(API_BASE, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to create permission');
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['permissions'] });
    },
  });
}

// Update permission
export function useUpdatePermission() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ permissionId, data }: { permissionId: string; data: Partial<PermissionFormData> }) => {
      const response = await fetch(`${API_BASE}/${permissionId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to update permission');
      }

      return response.json();
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['permissions'] });
      queryClient.invalidateQueries({ queryKey: ['permission', variables.permissionId] });
    },
  });
}

// Delete permission
export function useDeletePermission() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (permissionId: string) => {
      const response = await fetch(`${API_BASE}/${permissionId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to delete permission');
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['permissions'] });
    },
  });
}




