import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

const API_BASE = '/api/accounting/cash-transactions';

// Unified transaction type from aggregated sources
export interface UnifiedTransaction {
  id: string;
  source: 'payment' | 'expense' | 'invoice' | 'property_expense' | 'manual';
  type: 'income' | 'expense';
  category: string;
  amount: number;
  currency: string;
  transactionDate: string;
  paymentMethod: string | null;
  description: string | null;
  reference: string | null;
  status: string;
  relatedEntity?: {
    type: string;
    id: string;
    name?: string;
  };
}

// Legacy type for backwards compatibility
export interface CashTransaction {
  id: string;
  tenantId: string;
  companyId: string;
  type: 'income' | 'expense';
  category: string;
  amount: number;
  currency: string;
  transactionDate: string;
  paymentMethod: string;
  paymentId?: string | null;
  expenseId?: string | null;
  invoiceId?: string | null;
  description?: string | null;
  reference?: string | null;
  notes?: string | null;
  status: 'pending' | 'completed' | 'cancelled';
  createdBy?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CashTransactionCreateInput {
  type: 'income' | 'expense';
  category: string;
  amount: number;
  currency?: string;
  transactionDate: string;
  paymentMethod: string;
  paymentId?: string | null;
  expenseId?: string | null;
  invoiceId?: string | null;
  description?: string | null;
  reference?: string | null;
  notes?: string | null;
  status?: 'pending' | 'completed' | 'cancelled';
}

export interface CashTransactionUpdateInput {
  type?: 'income' | 'expense';
  category?: string;
  amount?: number;
  currency?: string;
  transactionDate?: string;
  paymentMethod?: string;
  paymentId?: string | null;
  expenseId?: string | null;
  invoiceId?: string | null;
  description?: string | null;
  reference?: string | null;
  notes?: string | null;
  status?: 'pending' | 'completed' | 'cancelled';
}

export interface CashTransactionListParams {
  page?: number;
  pageSize?: number;
  search?: string;
  type?: 'income' | 'expense';
  category?: string;
  source?: 'payment' | 'expense' | 'invoice' | 'property_expense' | 'manual';
  paymentMethod?: string;
  status?: string;
  startDate?: Date;
  endDate?: Date;
  companyId?: string;
}

export interface CashTransactionSummary {
  totalIncome: number;
  totalExpense: number;
  balance: number;
  byCategory: Record<string, { income: number; expense: number }>;
  bySource: Record<string, { income: number; expense: number; count: number }>;
}

export function useCashTransactions(params?: CashTransactionListParams) {
  return useQuery({
    queryKey: ['cashTransactions', params],
    queryFn: async () => {
      const searchParams = new URLSearchParams();
      if (params?.page) searchParams.set('page', params.page.toString());
      if (params?.pageSize) searchParams.set('pageSize', params.pageSize.toString());
      if (params?.search) searchParams.set('search', params.search);
      if (params?.type) searchParams.set('type', params.type);
      if (params?.category) searchParams.set('category', params.category);
      if (params?.source) searchParams.set('source', params.source);
      if (params?.paymentMethod) searchParams.set('paymentMethod', params.paymentMethod);
      if (params?.status) searchParams.set('status', params.status);
      if (params?.startDate) searchParams.set('startDate', params.startDate.toISOString());
      if (params?.endDate) searchParams.set('endDate', params.endDate.toISOString());
      if (params?.companyId) searchParams.set('companyId', params.companyId);

      const response = await fetch(`${API_BASE}?${searchParams.toString()}`);
      if (!response.ok) {
        throw new Error('Failed to fetch cash transactions');
      }
      const data = await response.json();
      return data.data as {
        transactions: UnifiedTransaction[];
        total: number;
        page: number;
        pageSize: number;
        summary: CashTransactionSummary;
      };
    },
  });
}

export function useCashTransaction(id: string) {
  return useQuery({
    queryKey: ['cashTransaction', id],
    queryFn: async () => {
      const response = await fetch(`${API_BASE}/${id}`);
      if (!response.ok) {
        throw new Error('Failed to fetch cash transaction');
      }
      const data = await response.json();
      return data.data.transaction as CashTransaction;
    },
    enabled: !!id,
  });
}

export function useCreateCashTransaction() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: CashTransactionCreateInput) => {
      const response = await fetch(API_BASE, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(input),
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to create cash transaction');
      }
      const data = await response.json();
      return data.data.transaction as CashTransaction;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cashTransactions'] });
    },
  });
}

export function useUpdateCashTransaction() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...input }: CashTransactionUpdateInput & { id: string }) => {
      const response = await fetch(`${API_BASE}/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(input),
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to update cash transaction');
      }
      const data = await response.json();
      return data.data.transaction as CashTransaction;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['cashTransactions'] });
      queryClient.invalidateQueries({ queryKey: ['cashTransaction', variables.id] });
    },
  });
}

export function useDeleteCashTransaction() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const response = await fetch(`${API_BASE}/${id}`, {
        method: 'DELETE',
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to delete cash transaction');
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cashTransactions'] });
    },
  });
}
