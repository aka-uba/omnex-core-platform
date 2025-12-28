/**
 * Hook for fetching export templates
 */

import { useQuery } from '@tanstack/react-query';

export interface ExportTemplateOption {
  id: string;
  name: string;
  type: 'header' | 'footer' | 'full';
  isDefault: boolean;
  companyId: string | null;
  locationId: string | null;
}

interface UseExportTemplatesOptions {
  type?: 'header' | 'footer' | 'full';
  enabled?: boolean;
}

export function useExportTemplates(options: UseExportTemplatesOptions = {}) {
  const { type, enabled = true } = options;

  return useQuery<ExportTemplateOption[]>({
    queryKey: ['export-templates', type],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (type) params.append('type', type);

      const response = await fetch(`/api/export-templates?${params.toString()}`);
      if (!response.ok) {
        throw new Error('Failed to fetch export templates');
      }

      const result = await response.json();
      // API returns { data: templates[] } directly
      return result.data || [];
    },
    enabled,
  });
}

export function useDefaultExportTemplate(type?: 'header' | 'footer' | 'full') {
  return useQuery<ExportTemplateOption | null>({
    queryKey: ['export-templates', 'default', type],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (type) params.append('type', type);

      const response = await fetch(`/api/export-templates/default?${params.toString()}`);
      if (!response.ok) {
        if (response.status === 404) return null;
        throw new Error('Failed to fetch default export template');
      }

      const result = await response.json();
      // API returns { data: template } directly
      return result.data || null;
    },
  });
}
