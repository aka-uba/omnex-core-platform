import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { ContractTemplate, ContractTemplateCreateInput, ContractTemplateUpdateInput, ContractTemplateListParams } from '@/modules/real-estate/types/contract-template';

const API_BASE = '/api/real-estate/contract-templates';

// Fetch contract templates list
export function useContractTemplates(params?: ContractTemplateListParams) {
  return useQuery({
    queryKey: ['contract-templates', params],
    queryFn: async () => {
      const searchParams = new URLSearchParams();
      if (params?.page) searchParams.set('page', params.page.toString());
      if (params?.pageSize) searchParams.set('pageSize', params.pageSize.toString());
      if (params?.search) searchParams.set('search', params.search);
      if (params?.type) searchParams.set('type', params.type);
      if (params?.category) searchParams.set('category', params.category);
      if (params?.isActive !== undefined) searchParams.set('isActive', params.isActive.toString());

      const response = await fetch(`${API_BASE}?${searchParams.toString()}`);
      if (!response.ok) {
        throw new Error('Failed to fetch contract templates');
      }
      const data = await response.json();
      return data.data as { templates: ContractTemplate[]; total: number; page: number; pageSize: number };
    },
  });
}

// Fetch single contract template
export function useContractTemplate(id: string) {
  return useQuery({
    queryKey: ['contract-template', id],
    queryFn: async () => {
      const response = await fetch(`${API_BASE}/${id}`);
      if (!response.ok) {
        throw new Error('Failed to fetch contract template');
      }
      const data = await response.json();
      return data.data.template as ContractTemplate;
    },
    enabled: !!id,
  });
}

// Create contract template
export function useCreateContractTemplate() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: ContractTemplateCreateInput) => {
      const response = await fetch(API_BASE, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(input),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to create contract template');
      }

      const data = await response.json();
      return data.data.template as ContractTemplate;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contract-templates'] });
    },
  });
}

// Update contract template
export function useUpdateContractTemplate() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, input }: { id: string; input: ContractTemplateUpdateInput }) => {
      const response = await fetch(`${API_BASE}/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(input),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to update contract template');
      }

      const data = await response.json();
      return data.data.template as ContractTemplate;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['contract-templates'] });
      queryClient.invalidateQueries({ queryKey: ['contract-template', variables.id] });
    },
  });
}

// Delete contract template
export function useDeleteContractTemplate() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const response = await fetch(`${API_BASE}/${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to delete contract template');
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contract-templates'] });
    },
  });
}








