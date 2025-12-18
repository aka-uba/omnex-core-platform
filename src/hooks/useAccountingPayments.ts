import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { AccountingPayment, AccountingPaymentCreateInput, AccountingPaymentListParams } from '@/modules/accounting/types/subscription';

const API_BASE = '/api/accounting/payments';

export function useAccountingPayments(params?: AccountingPaymentListParams) {
  return useQuery({
    queryKey: ['accountingPayments', params],
    queryFn: async () => {
      const searchParams = new URLSearchParams();
      if (params?.page) searchParams.set('page', params.page.toString());
      if (params?.pageSize) searchParams.set('pageSize', params.pageSize.toString());
      if (params?.subscriptionId) searchParams.set('subscriptionId', params.subscriptionId);
      if (params?.invoiceId) searchParams.set('invoiceId', params.invoiceId);
      if (params?.status) searchParams.set('status', params.status);
      if (params?.paymentMethod) searchParams.set('paymentMethod', params.paymentMethod);
      if (params?.startDate) searchParams.set('startDate', params.startDate.toISOString());
      if (params?.endDate) searchParams.set('endDate', params.endDate.toISOString());

      const response = await fetch(`${API_BASE}?${searchParams.toString()}`);
      if (!response.ok) {
        throw new Error('Failed to fetch payments');
      }
      const data = await response.json();
      return data.data as { payments: AccountingPayment[]; total: number; page: number; pageSize: number };
    },
  });
}

export function useCreateAccountingPayment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: AccountingPaymentCreateInput) => {
      const response = await fetch(API_BASE, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(input),
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to create payment');
      }
      const data = await response.json();
      return data.data.payment as AccountingPayment;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['accountingPayments'] });
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
    },
  });
}








