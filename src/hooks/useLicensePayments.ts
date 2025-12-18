/**
 * React Query hooks for License Payments
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type { LicensePayment, LicensePaymentCreateInput, LicensePaymentUpdateInput, LicensePaymentListParams } from '@/modules/license/types/license';
import type { ApiResponse } from '@/lib/api/errorHandler';

// GET /api/admin/tenant-licenses/[id]/payments - List license payments
export function useLicensePayments(licenseId: string | null, params?: Omit<LicensePaymentListParams, 'licenseId'>) {
  return useQuery({
    queryKey: ['licensePayments', licenseId, params],
    queryFn: async () => {
      if (!licenseId) return null;
      const searchParams = new URLSearchParams();
      if (params?.page) searchParams.set('page', params.page.toString());
      if (params?.pageSize) searchParams.set('pageSize', params.pageSize.toString());
      if (params?.status) searchParams.set('status', params.status);
      if (params?.paymentDateFrom) searchParams.set('paymentDateFrom', params.paymentDateFrom.toString());
      if (params?.paymentDateTo) searchParams.set('paymentDateTo', params.paymentDateTo.toString());

      const response = await fetch(`/api/admin/tenant-licenses/${licenseId}/payments?${searchParams.toString()}`);
      if (!response.ok) throw new Error('Failed to fetch license payments');
      const data: ApiResponse<{ payments: LicensePayment[]; total: number; page: number; pageSize: number }> = await response.json();
      if (!data.success) throw new Error(data.message || 'Failed to fetch license payments');
      return data.data!;
    },
    enabled: !!licenseId,
  });
}

// POST /api/admin/tenant-licenses/[id]/payments - Create license payment
export function useCreateLicensePayment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ licenseId, input }: { licenseId: string; input: Omit<LicensePaymentCreateInput, 'licenseId'> }) => {
      const response = await fetch(`/api/admin/tenant-licenses/${licenseId}/payments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(input),
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to create license payment');
      }
      const data: ApiResponse<{ payment: LicensePayment }> = await response.json();
      if (!data.success) throw new Error(data.message || 'Failed to fetch/create/update license payment');
      return data.data!.payment;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['licensePayments', variables.licenseId] });
      queryClient.invalidateQueries({ queryKey: ['tenantLicense', variables.licenseId] });
      queryClient.invalidateQueries({ queryKey: ['currentLicense'] });
    },
  });
}

// PATCH /api/admin/tenant-licenses/[id]/payments/[paymentId] - Update payment status
export function useUpdateLicensePayment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ licenseId, paymentId, input }: { licenseId: string; paymentId: string; input: LicensePaymentUpdateInput }) => {
      const response = await fetch(`/api/admin/tenant-licenses/${licenseId}/payments/${paymentId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(input),
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to update license payment');
      }
      const data: ApiResponse<{ payment: LicensePayment }> = await response.json();
      if (!data.success) throw new Error(data.message || 'Failed to fetch/create/update license payment');
      return data.data!.payment;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['licensePayments', variables.licenseId] });
      queryClient.invalidateQueries({ queryKey: ['tenantLicense', variables.licenseId] });
      queryClient.invalidateQueries({ queryKey: ['currentLicense'] });
    },
  });
}

// DELETE /api/admin/tenant-licenses/[id]/payments/[paymentId] - Delete payment
export function useDeleteLicensePayment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ licenseId, paymentId }: { licenseId: string; paymentId: string }) => {
      const response = await fetch(`/api/admin/tenant-licenses/${licenseId}/payments/${paymentId}`, {
        method: 'DELETE',
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to delete license payment');
      }
      const data: ApiResponse<{ success: boolean }> = await response.json();
      if (!data.success) throw new Error(data.message || 'Failed to delete license payment');
      return data.data!;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['licensePayments', variables.licenseId] });
      queryClient.invalidateQueries({ queryKey: ['tenantLicense', variables.licenseId] });
      queryClient.invalidateQueries({ queryKey: ['currentLicense'] });
    },
  });
}

