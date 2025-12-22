import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

const API_BASE = '/api/real-estate/usage-rights';

// Types
export interface UsageRight {
  id: string;
  tenantId: string;
  companyId: string | null;
  name: string;
  nameEn: string | null;
  nameTr: string | null;
  category: string;
  sortOrder: number;
  icon: string | null;
  description: string | null;
  descriptionEn: string | null;
  descriptionTr: string | null;
  isDefaultActive: boolean;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface UsageRightCreateInput {
  name: string;
  nameEn?: string | null;
  nameTr?: string | null;
  category: string;
  sortOrder?: number;
  icon?: string | null;
  description?: string | null;
  descriptionEn?: string | null;
  descriptionTr?: string | null;
  isDefaultActive?: boolean;
  isActive?: boolean;
}

export interface UsageRightUpdateInput extends Partial<UsageRightCreateInput> {}

export interface UsageRightListParams {
  category?: string;
  isActive?: boolean;
}

// Category options
export const USAGE_RIGHT_CATEGORIES = [
  { value: 'parking', labelKey: 'usageRights.categories.parking' },
  { value: 'heating', labelKey: 'usageRights.categories.heating' },
  { value: 'security', labelKey: 'usageRights.categories.security' },
  { value: 'technology', labelKey: 'usageRights.categories.technology' },
  { value: 'bathroom', labelKey: 'usageRights.categories.bathroom' },
  { value: 'outdoor', labelKey: 'usageRights.categories.outdoor' },
  { value: 'storage', labelKey: 'usageRights.categories.storage' },
  { value: 'accessibility', labelKey: 'usageRights.categories.accessibility' },
  { value: 'flooring', labelKey: 'usageRights.categories.flooring' },
  { value: 'energy', labelKey: 'usageRights.categories.energy' },
] as const;

// Fetch usage rights list
export function useUsageRights(params?: UsageRightListParams) {
  return useQuery({
    queryKey: ['usageRights', params],
    queryFn: async () => {
      const searchParams = new URLSearchParams();
      if (params?.category) searchParams.set('category', params.category);
      if (params?.isActive !== undefined) searchParams.set('isActive', params.isActive.toString());

      const response = await fetch(`${API_BASE}?${searchParams.toString()}`);
      if (!response.ok) {
        throw new Error('Failed to fetch usage rights');
      }
      const data = await response.json();
      return data.data as { usageRights: UsageRight[]; total: number };
    },
  });
}

// Fetch single usage right
export function useUsageRight(id: string) {
  return useQuery({
    queryKey: ['usageRight', id],
    queryFn: async () => {
      const response = await fetch(`${API_BASE}/${id}`);
      if (!response.ok) {
        throw new Error('Failed to fetch usage right');
      }
      const data = await response.json();
      return data.data.usageRight as UsageRight;
    },
    enabled: !!id,
  });
}

// Create usage right
export function useCreateUsageRight() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: UsageRightCreateInput) => {
      const response = await fetch(API_BASE, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(input),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to create usage right');
      }

      const data = await response.json();
      return data.data.usageRight as UsageRight;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['usageRights'] });
    },
  });
}

// Update usage right
export function useUpdateUsageRight() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, input }: { id: string; input: UsageRightUpdateInput }) => {
      const response = await fetch(`${API_BASE}/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(input),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to update usage right');
      }

      const data = await response.json();
      return data.data.usageRight as UsageRight;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['usageRights'] });
      queryClient.invalidateQueries({ queryKey: ['usageRight', variables.id] });
    },
  });
}

// Delete usage right
export function useDeleteUsageRight() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const response = await fetch(`${API_BASE}/${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to delete usage right');
      }

      return true;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['usageRights'] });
    },
  });
}

// Seed default usage rights
export function useSeedUsageRights() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      const response = await fetch(API_BASE, {
        method: 'PUT',
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to seed usage rights');
      }

      const data = await response.json();
      return data.data as { created: number; skipped: number };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['usageRights'] });
    },
  });
}
