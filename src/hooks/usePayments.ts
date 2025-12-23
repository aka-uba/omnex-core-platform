import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { Payment, PaymentCreateInput, PaymentUpdateInput, PaymentListParams } from '@/modules/real-estate/types/payment';

const API_BASE = '/api/real-estate/payments';

// Fetch payments list
export function usePayments(params?: PaymentListParams) {
  return useQuery({
    queryKey: ['payments', params],
    queryFn: async () => {
      const searchParams = new URLSearchParams();
      if (params?.page) searchParams.set('page', params.page.toString());
      if (params?.pageSize) searchParams.set('pageSize', params.pageSize.toString());
      if (params?.apartmentId) searchParams.set('apartmentId', params.apartmentId);
      if (params?.contractId) searchParams.set('contractId', params.contractId);
      if (params?.type) searchParams.set('type', params.type);
      if (params?.status) searchParams.set('status', params.status);
      if (params?.dueDateFrom) searchParams.set('dueDateFrom', params.dueDateFrom.toISOString());
      if (params?.dueDateTo) searchParams.set('dueDateTo', params.dueDateTo.toISOString());

      const response = await fetch(`${API_BASE}?${searchParams.toString()}`);
      if (!response.ok) {
        throw new Error('Failed to fetch payments');
      }
      const data = await response.json();
      return data.data as { payments: Payment[]; total: number; page: number; pageSize: number };
    },
  });
}

// Fetch single payment
export function usePayment(id: string) {
  return useQuery({
    queryKey: ['payment', id],
    queryFn: async () => {
      const response = await fetch(`${API_BASE}/${id}`);
      if (!response.ok) {
        throw new Error('Failed to fetch payment');
      }
      const data = await response.json();
      return data.data.payment as Payment;
    },
    enabled: !!id,
  });
}

// Create payment
export function useCreatePayment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: PaymentCreateInput) => {
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
      return data.data.payment as Payment;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payments'] });
    },
  });
}

// Update payment
export function useUpdatePayment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, input }: { id: string; input: PaymentUpdateInput }) => {
      const response = await fetch(`${API_BASE}/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(input),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to update payment');
      }

      const data = await response.json();
      return data.data.payment as Payment;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['payments'] });
      queryClient.invalidateQueries({ queryKey: ['payment', variables.id] });
    },
  });
}

// Delete payment
export function useDeletePayment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const response = await fetch(`${API_BASE}/${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to delete payment');
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payments'] });
    },
  });
}

// Mark payment as paid
export function useMarkPaymentAsPaid() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, paidDate, paymentMethod, receiptNumber }: { id: string; paidDate?: Date; paymentMethod?: string; receiptNumber?: string }) => {
      const response = await fetch(`${API_BASE}/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: 'paid',
          paidDate: paidDate || new Date(),
          paymentMethod,
          receiptNumber,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to mark payment as paid');
      }

      const data = await response.json();
      return data.data.payment as Payment;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['payments'] });
      queryClient.invalidateQueries({ queryKey: ['payment', variables.id] });
    },
  });
}

// Get overdue payments
export function useOverduePayments() {
  return useQuery({
    queryKey: ['payments', 'overdue'],
    queryFn: async () => {
      const response = await fetch(`${API_BASE}/overdue`);
      if (!response.ok) {
        throw new Error('Failed to fetch overdue payments');
      }
      const data = await response.json();
      return data.data.payments as Payment[];
    },
  });
}

// Get payment analytics
export function usePaymentAnalytics(params?: { companyId?: string; dateFrom?: string; dateTo?: string }) {
  return useQuery({
    queryKey: ['payments', 'analytics', params],
    queryFn: async () => {
      const searchParams = new URLSearchParams();
      if (params?.companyId) searchParams.set('companyId', params.companyId);
      if (params?.dateFrom) searchParams.set('dateFrom', params.dateFrom);
      if (params?.dateTo) searchParams.set('dateTo', params.dateTo);

      const response = await fetch(`${API_BASE}/analytics?${searchParams.toString()}`);
      if (!response.ok) {
        throw new Error('Failed to fetch payment analytics');
      }
      const data = await response.json();
      return data.data as {
        summary: {
          totalPayments: number;
          totalAmount: number;
          paidAmount: number;
          pendingAmount: number;
          overdueAmount: number;
          collectionRate: number;
          averagePaymentAmount: number;
        };
        byStatus: {
          paid: { count: number; amount: number };
          pending: { count: number; amount: number };
          overdue: { count: number; amount: number };
          cancelled: { count: number; amount: number };
        };
        byType: {
          rent: { count: number; amount: number };
          deposit: { count: number; amount: number };
          fee: { count: number; amount: number };
          maintenance: { count: number; amount: number };
          utility: { count: number; amount: number };
        };
        monthlyTrend: Array<{
          month: string;
          total: number;
          paid: number;
          pending: number;
          overdue: number;
        }>;
        upcomingPayments: Array<{
          id: string;
          apartmentUnitNumber: string;
          propertyName: string;
          propertyAddress: string;
          tenantName: string;
          amount: number;
          dueDate: string;
          daysUntilDue: number;
          isProjected?: boolean;
          contractId?: string;
        }>;
        overduePayments: Array<{
          id: string;
          apartmentUnitNumber: string;
          propertyName: string;
          propertyAddress: string;
          tenantName: string;
          amount: number;
          dueDate: string;
          daysOverdue: number;
          isProjected?: boolean;
          contractId?: string;
        }>;
      };
    },
  });
}

