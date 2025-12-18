// AI Templates Hook
// FAZ 0.2: Merkezi AI Servisi

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { PromptTemplate, AIResponse } from '@/lib/core-ai/types';

/**
 * Hook to get AI templates
 */
export function useAITemplates(module?: string) {
  return useQuery<PromptTemplate[]>({
    queryKey: ['ai-templates', module],
    queryFn: async () => {
      const params = module ? `?module=${module}` : '';
      const response = await fetch(`/api/core-ai/templates${params}`);
      if (!response.ok) {
        throw new Error('Failed to fetch templates');
      }

      const result = await response.json();
      return result.data?.templates || [];
    },
  });
}

/**
 * Hook to register a template
 */
export function useRegisterAITemplate() {
  const queryClient = useQueryClient();

  return useMutation<PromptTemplate, Error, PromptTemplate>({
    mutationFn: async (template) => {
      const response = await fetch('/api/core-ai/templates', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(template),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to register template');
      }

      const result = await response.json();
      return result.data?.template;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ai-templates'] });
    },
  });
}

/**
 * Hook to generate with a template
 */
export function useAIGenerateWithTemplate() {
  return useMutation<AIResponse, Error, { templateId: string; variables: Record<string, any> }>({
    mutationFn: async ({ templateId, variables }) => {
      const response = await fetch(`/api/core-ai/templates/${templateId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ variables }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to generate with template');
      }

      const result = await response.json();
      return result.data?.response;
    },
  });
}









