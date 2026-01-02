import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { Tenant, TenantCreateInput, TenantUpdateInput, TenantListParams } from '@/modules/real-estate/types/tenant';
import { fetchWithAuth } from '@/lib/api/fetchWithAuth';

const API_BASE = '/api/real-estate/tenants';

// Fetch tenants list
export function useTenants(params?: TenantListParams) {
  return useQuery({
    queryKey: ['tenants', params],
    queryFn: async () => {
      const searchParams = new URLSearchParams();
      if (params?.page) searchParams.set('page', params.page.toString());
      if (params?.pageSize) searchParams.set('pageSize', params.pageSize.toString());
      if (params?.search) searchParams.set('search', params.search);
      if (params?.isActive !== undefined) searchParams.set('isActive', params.isActive.toString());

      const response = await fetchWithAuth(`${API_BASE}?${searchParams.toString()}`);
      if (!response.ok) {
        throw new Error('Failed to fetch tenants');
      }
      const data = await response.json();
      return data.data as { tenants: Tenant[]; total: number; page: number; pageSize: number };
    },
  });
}

// Fetch single tenant
export function useTenant(id: string) {
  return useQuery({
    queryKey: ['tenant', id],
    queryFn: async () => {
      const response = await fetchWithAuth(`${API_BASE}/${id}`);
      if (!response.ok) {
        throw new Error('Failed to fetch tenant');
      }
      const data = await response.json();
      return data.data.tenant as Tenant;
    },
    enabled: !!id,
  });
}

// Create tenant
export function useCreateTenant() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: TenantCreateInput) => {
      const response = await fetchWithAuth(API_BASE, {
        method: 'POST',
        body: JSON.stringify(input),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to create tenant');
      }

      const data = await response.json();
      return data.data.tenant as Tenant;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tenants'] });
    },
  });
}

// Update tenant
export function useUpdateTenant() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, input }: { id: string; input: TenantUpdateInput }) => {
      const response = await fetchWithAuth(`${API_BASE}/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(input),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to update tenant');
      }

      const data = await response.json();
      return data.data.tenant as Tenant;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['tenants'] });
      queryClient.invalidateQueries({ queryKey: ['tenant', variables.id] });
    },
  });
}

// Delete tenant
export function useDeleteTenant() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const response = await fetchWithAuth(`${API_BASE}/${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to delete tenant');
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tenants'] });
    },
  });
}

// Tenant Analytics Types
export interface TenantAnalytics {
  paymentScore: number;
  contactScore: number;
  maintenanceScore: number;
  overallScore: number;
  paymentHistory: {
    total: number;
    paid: number;
    pending: number;
    overdue: number;
    onTimeRate: number;
  };
  contractHistory: {
    total: number;
    active: number;
    expired: number;
    terminated: number;
  };
  appointmentHistory: {
    total: number;
    completed: number;
    noShow: number;
    cancelled: number;
  };
  maintenanceHistory: {
    total: number;
    minor: number;
    major: number;
    critical: number;
  };
}

// Fetch tenant analytics
export function useTenantAnalytics(id: string) {
  return useQuery({
    queryKey: ['tenant-analytics', id],
    queryFn: async () => {
      const response = await fetchWithAuth(`${API_BASE}/${id}/analytics`);
      if (!response.ok) {
        throw new Error('Failed to fetch tenant analytics');
      }
      const data = await response.json();
      return data.data.analytics as TenantAnalytics;
    },
    enabled: !!id,
  });
}

// Recalculate tenant analytics
export function useRecalculateTenantAnalytics() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const response = await fetchWithAuth(`${API_BASE}/${id}/analytics`, {
        method: 'POST',
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to recalculate analytics');
      }

      const data = await response.json();
      return data.data.analytics as TenantAnalytics;
    },
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: ['tenant-analytics', id] });
      queryClient.invalidateQueries({ queryKey: ['tenant', id] });
      queryClient.invalidateQueries({ queryKey: ['tenants'] });
    },
  });
}

