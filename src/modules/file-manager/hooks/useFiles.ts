import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { fileManagerService } from '../services/file-manager.service';
import { useCoreFileManager } from '@/hooks/useCoreFileManager';
import { coreFileToFileItem } from '../services/core-file-adapter';
import { useMemo } from 'react';

// TODO: Get tenantId and userId from context/session
const TEMP_TENANT_ID = 'temp-tenant-id';
const TEMP_USER_ID = 'temp-user-id';

/**
 * Enhanced useFiles hook that uses CoreFileService
 * Falls back to mock service if CoreFileService is not available
 */
export function useFiles(folderId: string | null) {
    // Try to use CoreFileService first
    const coreFileManager = useCoreFileManager({
        tenantId: TEMP_TENANT_ID,
        module: 'file-manager',
        ...(folderId ? { entityType: 'folder' as const, entityId: folderId } : {}),
        userId: TEMP_USER_ID, // Disable for now, will enable after migration
    });

    // Fallback to mock service
    const mockQuery = useQuery({
        queryKey: ['files', folderId],
        queryFn: () => fileManagerService.getFiles(folderId),
    });

    // Convert CoreFile[] to FileItem[] if available
    const files = useMemo(() => {
        if (coreFileManager.files.length > 0) {
            return coreFileManager.files.map(coreFileToFileItem);
        }
        return mockQuery.data || [];
    }, [coreFileManager.files, mockQuery.data]);

    return {
        ...mockQuery,
        data: files,
    };
}

export function useFolders() {
    return useQuery({
        queryKey: ['folders'],
        queryFn: () => fileManagerService.getFolders(),
    });
}

export function useFile(id: string) {
    return useQuery({
        queryKey: ['file', id],
        queryFn: () => fileManagerService.getFile(id),
        enabled: !!id,
    });
}

export function useCreateFolder() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ name, parentId }: { name: string; parentId: string | null }) =>
            fileManagerService.createFolder(name, parentId),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['files'] });
            queryClient.invalidateQueries({ queryKey: ['folders'] });
        },
    });
}

export function useUploadFile() {
    const queryClient = useQueryClient();
    
    // Use CoreFileService for upload
    const coreFileManager = useCoreFileManager({
        tenantId: TEMP_TENANT_ID,
        module: 'file-manager',
        userId: TEMP_USER_ID, });

    return useMutation({
        mutationFn: async ({ file, folderId }: { file: File; folderId: string | null }) => {
            // Try CoreFileService first
            if (coreFileManager.uploadFile) {
                try {
                    const uploaded = await coreFileManager.uploadFile({
                        file,
                    });
                    return coreFileToFileItem(uploaded);
                } catch (error) {
                    // Fallback to mock service
                }
            }
            // Fallback to mock service
            return fileManagerService.uploadFile(file, folderId);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['files'] });
        },
    });
}

export function useRenameFile() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ id, newName }: { id: string; newName: string }) =>
            fileManagerService.renameFile(id, newName),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['files'] });
            queryClient.invalidateQueries({ queryKey: ['folders'] });
        },
    });
}

export function useDeleteFile() {
    const queryClient = useQueryClient();
    
    // Use CoreFileService for delete
    const coreFileManager = useCoreFileManager({
        tenantId: TEMP_TENANT_ID,
        module: 'file-manager',
        userId: TEMP_USER_ID, });

    return useMutation({
        mutationFn: async (id: string) => {
            // Try CoreFileService first
            if (coreFileManager.deleteFile) {
                try {
                    await coreFileManager.deleteFile(id);
                    return;
                } catch (error) {
                    // Fallback to mock service
                }
            }
            // Fallback to mock service
            return fileManagerService.deleteFile(id);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['files'] });
            queryClient.invalidateQueries({ queryKey: ['folders'] });
        },
    });
}

export function useMoveFile() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ id, newParentId }: { id: string; newParentId: string | null }) =>
            fileManagerService.moveFile(id, newParentId),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['files'] });
            queryClient.invalidateQueries({ queryKey: ['folders'] });
        },
    });
}

export function useSearchFiles(query: string) {
    return useQuery({
        queryKey: ['files', 'search', query],
        queryFn: () => fileManagerService.searchFiles(query),
        enabled: query.length > 0,
    });
}
