import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type {
  AgreementReport,
  AgreementReportCreateInput,
  AgreementReportUpdateInput,
  AgreementReportListParams,
} from '@/modules/real-estate/types/agreement-report';

const API_BASE = '/api/real-estate/agreement-reports';

// Fetch agreement reports list
export function useAgreementReports(params?: AgreementReportListParams) {
  return useQuery({
    queryKey: ['agreementReports', params],
    queryFn: async () => {
      const searchParams = new URLSearchParams();
      if (params?.page) searchParams.set('page', params.page.toString());
      if (params?.pageSize) searchParams.set('pageSize', params.pageSize.toString());
      if (params?.search) searchParams.set('search', params.search);
      if (params?.type) searchParams.set('type', params.type);
      if (params?.status) searchParams.set('status', params.status);
      if (params?.agreementStatus) searchParams.set('agreementStatus', params.agreementStatus);
      if (params?.apartmentId) searchParams.set('apartmentId', params.apartmentId);
      if (params?.contractId) searchParams.set('contractId', params.contractId);
      if (params?.appointmentId) searchParams.set('appointmentId', params.appointmentId);

      const response = await fetch(`${API_BASE}?${searchParams.toString()}`);
      if (!response.ok) {
        throw new Error('Failed to fetch agreement reports');
      }
      const data = await response.json();
      return data.data as { reports: AgreementReport[]; total: number; page: number; pageSize: number };
    },
  });
}

// Fetch single agreement report
export function useAgreementReport(id: string) {
  return useQuery({
    queryKey: ['agreementReport', id],
    queryFn: async () => {
      const response = await fetch(`${API_BASE}/${id}`);
      if (!response.ok) {
        throw new Error('Failed to fetch agreement report');
      }
      const data = await response.json();
      return data.data.report as AgreementReport;
    },
    enabled: !!id,
  });
}

// Create agreement report
export function useCreateAgreementReport() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: AgreementReportCreateInput) => {
      const response = await fetch(API_BASE, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(input),
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error?.message || 'Failed to create agreement report');
      }
      const data = await response.json();
      return data.data.report as AgreementReport;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['agreementReports'] });
    },
  });
}

// Update agreement report
export function useUpdateAgreementReport() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, input }: { id: string; input: AgreementReportUpdateInput }) => {
      const response = await fetch(`${API_BASE}/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(input),
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error?.message || 'Failed to update agreement report');
      }
      const data = await response.json();
      return data.data.report as AgreementReport;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['agreementReports'] });
      queryClient.invalidateQueries({ queryKey: ['agreementReport', variables.id] });
    },
  });
}

// Delete agreement report
export function useDeleteAgreementReport() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const response = await fetch(`${API_BASE}/${id}`, {
        method: 'DELETE',
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error?.message || 'Failed to delete agreement report');
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['agreementReports'] });
    },
  });
}








