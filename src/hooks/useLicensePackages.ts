/**
 * React Query hooks for License Packages
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type { LicensePackage, LicensePackageCreateInput, LicensePackageUpdateInput, LicensePackageListParams } from '@/modules/license/types/license';
import type { ApiResponse } from '@/lib/api/errorHandler';

// GET /api/admin/licenses - List license packages
export function useLicensePackages(params?: LicensePackageListParams) {
  return useQuery({
    queryKey: ['licensePackages', params],
    queryFn: async () => {
      const searchParams = new URLSearchParams();
      if (params?.page) searchParams.set('page', params.page.toString());
      if (params?.pageSize) searchParams.set('pageSize', params.pageSize.toString());
      if (params?.search) searchParams.set('search', params.search);
      if (params?.isActive !== undefined) searchParams.set('isActive', params.isActive.toString());
      if (params?.billingCycle) searchParams.set('billingCycle', params.billingCycle);

      const response = await fetch(`/api/admin/licenses?${searchParams.toString()}`);
      if (!response.ok) throw new Error('Failed to fetch license packages');
      const data: ApiResponse<{ packages: LicensePackage[]; total: number; page: number; pageSize: number }> = await response.json();
      if (!data.success) throw new Error(data.message || 'Failed to fetch license packages');
      return data.data!;
    },
  });
}

// GET /api/admin/licenses/[id] - Get license package
export function useLicensePackage(id: string | null) {
  return useQuery({
    queryKey: ['licensePackage', id],
    queryFn: async () => {
      if (!id) return null;
      const response = await fetch(`/api/admin/licenses/${id}`);
      if (!response.ok) throw new Error('Failed to fetch license package');
      const data: ApiResponse<{ package: LicensePackage }> = await response.json();
      if (!data.success) throw new Error(data.message || 'Failed to fetch license package');
      return data.data!.package;
    },
    enabled: !!id,
  });
}

// POST /api/admin/licenses - Create license package
export function useCreateLicensePackage() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: LicensePackageCreateInput) => {
      const response = await fetch('/api/admin/licenses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(input),
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to create license package');
      }
      const data: ApiResponse<{ package: LicensePackage }> = await response.json();
      if (!data.success) throw new Error(data.message || 'Failed to fetch license package');
      return data.data!.package;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['licensePackages'] });
    },
  });
}

// PATCH /api/admin/licenses/[id] - Update license package
export function useUpdateLicensePackage() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, input }: { id: string; input: LicensePackageUpdateInput }) => {
      const response = await fetch(`/api/admin/licenses/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(input),
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to update license package');
      }
      const data: ApiResponse<{ package: LicensePackage }> = await response.json();
      if (!data.success) throw new Error(data.message || 'Failed to fetch license package');
      return data.data!.package;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['licensePackages'] });
      queryClient.invalidateQueries({ queryKey: ['licensePackage', variables.id] });
    },
  });
}

// DELETE /api/admin/licenses/[id] - Delete license package
export function useDeleteLicensePackage() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const response = await fetch(`/api/admin/licenses/${id}`, {
        method: 'DELETE',
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to delete license package');
      }
      const data: ApiResponse<{ success: boolean }> = await response.json();
      if (!data.success) throw new Error(data.message || 'Failed to delete license package');
      return data.data!;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['licensePackages'] });
    },
  });
}

