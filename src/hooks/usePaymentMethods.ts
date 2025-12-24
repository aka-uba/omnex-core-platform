'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

export interface PaymentMethodConfig {
  id: string;
  tenantId: string;
  companyId: string;
  name: string;
  code: string;
  description?: string | null;
  icon?: string | null;
  bankName?: string | null;
  accountHolder?: string | null;
  iban?: string | null;
  swiftCode?: string | null;
  branchCode?: string | null;
  accountNumber?: string | null;
  isDefault: boolean;
  sortOrder: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

interface PaymentMethodsResponse {
  paymentMethods: PaymentMethodConfig[];
}

interface UsePaymentMethodsParams {
  companyId?: string;
  activeOnly?: boolean;
}

// Fetch payment methods
export function usePaymentMethods(params: UsePaymentMethodsParams = {}) {
  const { companyId, activeOnly = false } = params;

  return useQuery<PaymentMethodsResponse>({
    queryKey: ['payment-methods', companyId, activeOnly],
    queryFn: async () => {
      const searchParams = new URLSearchParams();
      if (companyId) searchParams.set('companyId', companyId);
      if (activeOnly) searchParams.set('activeOnly', 'true');

      const response = await fetch(`/api/accounting/payment-methods?${searchParams}`);
      if (!response.ok) {
        throw new Error('Failed to fetch payment methods');
      }
      return response.json();
    },
  });
}

// Fetch single payment method
export function usePaymentMethod(id: string) {
  return useQuery<{ paymentMethod: PaymentMethodConfig }>({
    queryKey: ['payment-method', id],
    queryFn: async () => {
      const response = await fetch(`/api/accounting/payment-methods/${id}`);
      if (!response.ok) {
        throw new Error('Failed to fetch payment method');
      }
      return response.json();
    },
    enabled: !!id,
  });
}

// Create payment method
export function useCreatePaymentMethod() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: Partial<PaymentMethodConfig>) => {
      const response = await fetch('/api/accounting/payment-methods', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to create payment method');
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payment-methods'] });
    },
  });
}

// Update payment method
export function useUpdatePaymentMethod() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<PaymentMethodConfig> }) => {
      const response = await fetch(`/api/accounting/payment-methods/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to update payment method');
      }

      return response.json();
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['payment-methods'] });
      queryClient.invalidateQueries({ queryKey: ['payment-method', variables.id] });
    },
  });
}

// Delete payment method
export function useDeletePaymentMethod() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const response = await fetch(`/api/accounting/payment-methods/${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to delete payment method');
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payment-methods'] });
    },
  });
}

// Default payment method codes
export const DEFAULT_PAYMENT_METHOD_CODES = [
  { code: 'cash', name: 'Nakit', icon: 'IconCash' },
  { code: 'bank_transfer', name: 'Banka Havalesi', icon: 'IconBuildingBank' },
  { code: 'card', name: 'Kredi/Banka Kartı', icon: 'IconCreditCard' },
  { code: 'check', name: 'Çek', icon: 'IconReceipt' },
  { code: 'auto_debit', name: 'Otomatik Ödeme', icon: 'IconRepeat' },
  { code: 'other', name: 'Diğer', icon: 'IconDots' },
];
