// Form Builder Hook
// FAZ 0.5: Dinamik Form Builder

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { FormConfig, FormConfigData } from '@/lib/form-builder/types';

/**
 * Hook to get form configs
 */
export function useFormConfigs(module?: string, entityType?: string) {
  return useQuery<FormConfig[]>({
    queryKey: ['form-configs', module, entityType],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (module) params.append('module', module);
      if (entityType) params.append('entityType', entityType);

      const response = await fetch(`/api/forms?${params.toString()}`);
      if (!response.ok) {
        throw new Error('Failed to fetch form configs');
      }

      const result = await response.json();
      return result.data?.forms || [];
    },
  });
}

/**
 * Hook to get form config by ID
 */
export function useFormConfig(formId: string) {
  return useQuery<FormConfig>({
    queryKey: ['form-config', formId],
    queryFn: async () => {
      const response = await fetch(`/api/forms/${formId}`);
      if (!response.ok) {
        throw new Error('Failed to fetch form config');
      }

      const result = await response.json();
      return result.data?.form;
    },
    enabled: !!formId,
  });
}

/**
 * Hook to get form config by entity
 */
export function useFormConfigByEntity(module: string, entityType: string) {
  return useQuery<FormConfig | null>({
    queryKey: ['form-config-entity', module, entityType],
    queryFn: async () => {
      const params = new URLSearchParams({ module, entityType });
      const response = await fetch(`/api/forms/entity?${params.toString()}`);
      if (!response.ok) {
        throw new Error('Failed to fetch form config');
      }

      const result = await response.json();
      return result.data?.form || null;
    },
    enabled: !!module && !!entityType,
  });
}

/**
 * Hook to create form config
 */
export function useCreateFormConfig() {
  const queryClient = useQueryClient();

  return useMutation<FormConfig, Error, FormConfigData>({
    mutationFn: async (data) => {
      const response = await fetch('/api/forms', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to create form config');
      }

      const result = await response.json();
      return result.data?.form;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['form-configs'] });
    },
  });
}

/**
 * Hook to update form config
 */
export function useUpdateFormConfig() {
  const queryClient = useQueryClient();

  return useMutation<FormConfig, Error, { formId: string; data: Partial<FormConfigData> }>({
    mutationFn: async ({ formId, data }) => {
      const response = await fetch(`/api/forms/${formId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to update form config');
      }

      const result = await response.json();
      return result.data?.form;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['form-configs'] });
      queryClient.invalidateQueries({ queryKey: ['form-config', variables.formId] });
    },
  });
}

/**
 * Hook to delete form config
 */
export function useDeleteFormConfig() {
  const queryClient = useQueryClient();

  return useMutation<void, Error, string>({
    mutationFn: async (formId) => {
      const response = await fetch(`/api/forms/${formId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to delete form config');
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['form-configs'] });
    },
  });
}









