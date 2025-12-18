// Core File Service Adapter
// FAZ 0.1: File Manager'ı CoreFileService ile entegre etmek için adapter
// Mevcut FileItem yapısını CoreFile ile uyumlu hale getirir

import { CoreFile } from '@/lib/core-file-manager/types';
import { FileItem } from '../types/file';

/**
 * CoreFile'i FileItem'e dönüştür
 */
export function coreFileToFileItem(coreFile: CoreFile): FileItem {
  return {
    id: coreFile.id,
    name: coreFile.originalName,
    type: 'file',
    size: coreFile.size,
    mimeType: coreFile.mimeType,
    extension: coreFile.extension,
    parentId: null, // CoreFileService modül bazlı, klasör yapısı yok
    path: coreFile.path,
    createdAt: coreFile.createdAt,
    modifiedAt: coreFile.updatedAt,
    createdBy: coreFile.createdBy,
    modifiedBy: coreFile.updatedBy,
    isShared: false, // TODO: FileShare kontrolü eklenebilir
    permissions: {
      canRead: true, // TODO: permissions'dan kontrol edilmeli
      canWrite: true,
      canDelete: true,
      canShare: true,
    },
  };
}

/**
 * FileItem'i CoreFile upload formatına dönüştür
 */
export function fileItemToUploadOptions(file: File, options?: {
  module?: string;
  entityType?: string;
  entityId?: string;
  title?: string;
  description?: string;
  tags?: string[];
}) {
  return {
    file,
    module: options?.module || 'file-manager',
    entityType: options?.entityType,
    entityId: options?.entityId,
    title: options?.title,
    description: options?.description,
    tags: options?.tags,
  };
}









