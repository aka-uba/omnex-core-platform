// Core File Manager Types
// FAZ 0.1: Merkezi Dosya Yönetim Sistemi

export interface FilePermissions {
  read: string[]; // user/role IDs
  write: string[]; // user/role IDs
  delete: string[]; // user/role IDs
  share: string[]; // user/role IDs
  isPublic: boolean;
  inheritedFrom?: string; // entity permission'dan inherit
}

export interface UploadOptions {
  tenantId: string;
  companyId: string;
  module: string;
  entityType?: string;
  entityId?: string;
  file: File | Buffer;
  userId: string;
  permissions?: FilePermissions;
  metadata?: {
    title?: string;
    description?: string;
    tags?: string[];
    category?: string;
  };
}

export interface BuildPathOptions {
  entityId?: string;
  entityName?: string; // Okunabilir klasör adı için
  tenantId: string;
  module: string;
  entityType?: string;
  filename: string;
}

export interface CoreFile {
  id: string;
  tenantId: string;
  module: string;
  entityType?: string | null;
  entityId?: string | null;
  filename: string;
  originalName: string;
  path: string;
  fullPath: string;
  size: number;
  mimeType: string;
  extension: string;
  title?: string | null;
  description?: string | null;
  tags: string[];
  category?: string | null;
  version: number;
  isLatest: boolean;
  previousVersionId?: string | null;
  permissions: FilePermissions;
  createdBy: string;
  updatedBy: string;
  createdAt: Date;
  updatedAt: Date;
  accessedAt?: Date | null;
}

export interface FileShare {
  id: string;
  fileId: string;
  sharedBy: string;
  sharedWith: string;
  permission: 'view' | 'download' | 'edit';
  expiresAt?: Date | null;
  accessCode?: string | null;
  downloadCount: number;
  createdAt: Date;
}









