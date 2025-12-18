/**
 * React Query hooks for Tenant Licenses
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type { TenantLicense, TenantLicenseCreateInput, TenantLicenseUpdateInput, TenantLicenseListParams } from '@/modules/license/types/license';
import type { ApiResponse } from '@/lib/api/errorHandler';

// GET /api/admin/tenant-licenses - List tenant licenses
export function useTenantLicenses(params?: TenantLicenseListParams) {
  return useQuery({
    queryKey: ['tenantLicenses', params],
    queryFn: async () => {
      const searchParams = new URLSearchParams();
      if (params?.page) searchParams.set('page', params.page.toString());
      if (params?.pageSize) searchParams.set('pageSize', params.pageSize.toString());
      if (params?.tenantId) searchParams.set('tenantId', params.tenantId);
      if (params?.packageId) searchParams.set('packageId', params.packageId);
      if (params?.status) searchParams.set('status', params.status);
      if (params?.paymentStatus) searchParams.set('paymentStatus', params.paymentStatus);

      const response = await fetch(`/api/admin/tenant-licenses?${searchParams.toString()}`);
      if (!response.ok) throw new Error('Failed to fetch tenant licenses');
      const data: ApiResponse<{ licenses: TenantLicense[]; total: number; page: number; pageSize: number }> = await response.json();
      if (!data.success) throw new Error(data.message || 'Failed to fetch tenant licenses');
      return data.data!;
    },
  });
}

// GET /api/admin/tenant-licenses/[id] - Get tenant license
export function useTenantLicense(id: string | null) {
  return useQuery({
    queryKey: ['tenantLicense', id],
    queryFn: async () => {
      if (!id) return null;
      const response = await fetch(`/api/admin/tenant-licenses/${id}`);
      if (!response.ok) throw new Error('Failed to fetch tenant license');
      const data: ApiResponse<{ license: TenantLicense }> = await response.json();
      if (!data.success) throw new Error(data.message || 'Failed to fetch tenant license');
      return data.data!.license;
    },
    enabled: !!id,
  });
}

// GET /api/settings/license - Get current tenant license
export function useCurrentLicense() {
  return useQuery({
    queryKey: ['currentLicense'],
    queryFn: async () => {
      const response = await fetch('/api/settings/license');
      if (!response.ok) throw new Error('Failed to fetch current license');
      const data: ApiResponse<{ license: TenantLicense | null }> = await response.json();
      if (!data.success) throw new Error(data.message || 'Failed to fetch current license');
      return data.data!.license;
    },
  });
}

// POST /api/admin/tenant-licenses - Create tenant license
export function useCreateTenantLicense() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: TenantLicenseCreateInput) => {
      const response = await fetch('/api/admin/tenant-licenses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(input),
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to create tenant license');
      }
      const data: ApiResponse<{ license: TenantLicense }> = await response.json();
      if (!data.success) throw new Error(data.message || 'Failed to fetch tenant license');
      return data.data!.license;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tenantLicenses'] });
      queryClient.invalidateQueries({ queryKey: ['currentLicense'] });
    },
  });
}

// PATCH /api/admin/tenant-licenses/[id] - Update tenant license
export function useUpdateTenantLicense() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, input }: { id: string; input: TenantLicenseUpdateInput }) => {
      const response = await fetch(`/api/admin/tenant-licenses/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(input),
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to update tenant license');
      }
      const data: ApiResponse<{ license: TenantLicense }> = await response.json();
      if (!data.success) throw new Error(data.message || 'Failed to fetch tenant license');
      return data.data!.license;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['tenantLicenses'] });
      queryClient.invalidateQueries({ queryKey: ['tenantLicense', variables.id] });
      queryClient.invalidateQueries({ queryKey: ['currentLicense'] });
    },
  });
}

// DELETE /api/admin/tenant-licenses/[id] - Delete tenant license
export function useDeleteTenantLicense() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const response = await fetch(`/api/admin/tenant-licenses/${id}`, {
        method: 'DELETE',
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to delete tenant license');
      }
      const data: ApiResponse<{ success: boolean }> = await response.json();
      if (!data.success) throw new Error(data.message || 'Failed to delete tenant license');
      return data.data!;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tenantLicenses'] });
      queryClient.invalidateQueries({ queryKey: ['currentLicense'] });
    },
  });
}

