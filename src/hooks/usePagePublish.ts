/**
 * Web Builder - Page Publishing Hooks (FAZ 3)
 */

import { useMutation, useQueryClient } from '@tanstack/react-query';

interface PublishPageParams {
  pageId: string;
  status: 'draft' | 'published' | 'archived';
}

// Publish/Update page status
export function usePublishPage() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ pageId, status }: PublishPageParams) => {
      const response = await fetch(`/api/web-builder/pages/${pageId}/publish`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error?.message || 'Failed to publish page');
      }

      const result = await response.json();
      return result.data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['web-builder-pages'] });
      queryClient.invalidateQueries({ queryKey: ['web-builder-page', variables.pageId] });
    },
  });
}

// Unpublish page
export function useUnpublishPage() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (pageId: string) => {
      const response = await fetch(`/api/web-builder/pages/${pageId}/publish`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error?.message || 'Failed to unpublish page');
      }

      const result = await response.json();
      return result.data;
    },
    onSuccess: (_, pageId) => {
      queryClient.invalidateQueries({ queryKey: ['web-builder-pages'] });
      queryClient.invalidateQueries({ queryKey: ['web-builder-page', pageId] });
    },
  });
}







