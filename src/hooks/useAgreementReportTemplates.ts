import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type {
  AgreementReportTemplate,
  AgreementReportTemplateCreateInput,
  AgreementReportTemplateUpdateInput,
  AgreementReportTemplateListParams,
} from '@/modules/real-estate/types/agreement-report-template';

const API_BASE = '/api/real-estate/agreement-report-templates';

// Fetch agreement report templates list
export function useAgreementReportTemplates(params?: AgreementReportTemplateListParams) {
  return useQuery({
    queryKey: ['agreementReportTemplates', params],
    queryFn: async () => {
      const searchParams = new URLSearchParams();
      if (params?.page) searchParams.set('page', params.page.toString());
      if (params?.pageSize) searchParams.set('pageSize', params.pageSize.toString());
      if (params?.search) searchParams.set('search', params.search);
      if (params?.category) searchParams.set('category', params.category);
      if (params?.isActive !== undefined) searchParams.set('isActive', params.isActive.toString());

      const response = await fetch(`${API_BASE}?${searchParams.toString()}`);
      if (!response.ok) {
        throw new Error('Failed to fetch agreement report templates');
      }
      const data = await response.json();
      return data.data as {
        templates: AgreementReportTemplate[];
        total: number;
        page: number;
        pageSize: number;
      };
    },
  });
}

// Fetch single agreement report template
export function useAgreementReportTemplate(id: string) {
  return useQuery({
    queryKey: ['agreementReportTemplate', id],
    queryFn: async () => {
      const response = await fetch(`${API_BASE}/${id}`);
      if (!response.ok) {
        throw new Error('Failed to fetch agreement report template');
      }
      const data = await response.json();
      return data.data.template as AgreementReportTemplate;
    },
    enabled: !!id,
  });
}

// Create agreement report template
export function useCreateAgreementReportTemplate() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: AgreementReportTemplateCreateInput) => {
      const response = await fetch(API_BASE, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(input),
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error?.message || 'Failed to create agreement report template');
      }
      const data = await response.json();
      return data.data.template as AgreementReportTemplate;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['agreementReportTemplates'] });
    },
  });
}

// Update agreement report template
export function useUpdateAgreementReportTemplate() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, input }: { id: string; input: AgreementReportTemplateUpdateInput }) => {
      const response = await fetch(`${API_BASE}/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(input),
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error?.message || 'Failed to update agreement report template');
      }
      const data = await response.json();
      return data.data.template as AgreementReportTemplate;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['agreementReportTemplates'] });
      queryClient.invalidateQueries({ queryKey: ['agreementReportTemplate', variables.id] });
    },
  });
}

// Delete agreement report template
export function useDeleteAgreementReportTemplate() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const response = await fetch(`${API_BASE}/${id}`, {
        method: 'DELETE',
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error?.message || 'Failed to delete agreement report template');
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['agreementReportTemplates'] });
    },
  });
}








