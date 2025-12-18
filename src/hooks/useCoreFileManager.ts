// Core File Manager Hook
// FAZ 0.1: Merkezi Dosya Yönetim Sistemi
// React hook for file management operations

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { CoreFile, FileShare } from '@/lib/core-file-manager/types';
import { authenticatedFetch } from '@/lib/api/authenticatedFetch';

interface UseCoreFileManagerOptions {
  tenantId: string;
  module: string;
  entityType?: string;
  entityId?: string;
  userId: string;
  enabled?: boolean;
}

interface UploadFileOptions {
  file: File;
  title?: string;
  description?: string;
  tags?: string[];
  permissions?: {
    read: string[];
    write: string[];
    delete: string[];
    share: string[];
    isPublic: boolean;
  };
}

interface ShareFileOptions {
  sharedWith: string;
  permission: 'view' | 'download' | 'edit';
  expiresAt?: Date;
  accessCode?: string;
}

/**
 * Core File Manager Hook
 * Provides file management operations for any module
 */
export function useCoreFileManager(options: UseCoreFileManagerOptions) {
  const { tenantId, module, entityType, entityId, userId, enabled = true } = options;
  const queryClient = useQueryClient();

  // Build query key
  const queryKey = ['core-files', tenantId, module, entityType, entityId];

  // Get files list
  const { data: files, isLoading, error } = useQuery<CoreFile[]>({
    queryKey,
    queryFn: async () => {
      const params = new URLSearchParams({
        module,
        ...(entityType && { entityType }),
        ...(entityId && { entityId }),
      });

      const response = await authenticatedFetch(`/api/core-files?${params.toString()}`);
      if (!response.ok) {
        throw new Error('Failed to fetch files');
      }

      const result = await response.json();
      return result.data?.files || [];
    },
    enabled,
  });

  // Upload file mutation
  const uploadFile = useMutation<CoreFile, Error, UploadFileOptions>({
    mutationFn: async (uploadOptions) => {
      const formData = new FormData();
      formData.append('file', uploadOptions.file);
      formData.append('module', module);
      if (entityType) formData.append('entityType', entityType);
      if (entityId) formData.append('entityId', entityId);
      if (uploadOptions.title) formData.append('title', uploadOptions.title);
      if (uploadOptions.description) formData.append('description', uploadOptions.description);
      if (uploadOptions.tags) formData.append('tags', uploadOptions.tags.join(','));

      const headers: HeadersInit = {};
      if (options.userId) {
        headers['x-user-id'] = options.userId;
      }

      const response = await authenticatedFetch('/api/core-files', {
        method: 'POST',
        headers,
        body: formData,
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to upload file');
      }

      const result = await response.json();
      return result.data?.file;
    },
    onSuccess: () => {
      // Invalidate and refetch files list
      queryClient.invalidateQueries({ queryKey });
    },
  });

  // Delete file mutation
  const deleteFile = useMutation<void, Error, string>({
    mutationFn: async (fileId: string) => {
      const response = await authenticatedFetch(`/api/core-files/${fileId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to delete file');
      }
    },
    onSuccess: () => {
      // Invalidate and refetch files list
      queryClient.invalidateQueries({ queryKey });
    },
  });

  // Share file mutation
  const shareFile = useMutation<FileShare, Error, { fileId: string; options: ShareFileOptions }>({
    mutationFn: async ({ fileId, options }) => {
      const response = await authenticatedFetch(`/api/core-files/${fileId}/share`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          sharedWith: options.sharedWith,
          permission: options.permission,
          expiresAt: options.expiresAt?.toISOString(),
          accessCode: options.accessCode,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to share file');
      }

      const result = await response.json();
      return result.data?.share;
    },
  });

  // Download file
  const downloadFile = async (fileId: string, filename?: string) => {
    try {
      const headers: HeadersInit = {};
      if (userId) {
        headers['x-user-id'] = userId;
      }

      const response = await authenticatedFetch(`/api/core-files/${fileId}/download`, {
        headers,
      });
      if (!response.ok) {
        throw new Error('Failed to download file');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename || 'download';
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      throw error;
    }
  };

  return {
    files: files || [],
    isLoading,
    error,
    uploadFile: uploadFile.mutateAsync,
    deleteFile: deleteFile.mutateAsync,
    shareFile: shareFile.mutateAsync,
    downloadFile,
    isUploading: uploadFile.isPending,
    isDeleting: deleteFile.isPending,
    isSharing: shareFile.isPending,
  };
}









