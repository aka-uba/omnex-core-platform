export interface FileItem {
    id: string;
    name: string;
    type: 'file' | 'folder';
    size?: number; // in bytes
    mimeType?: string;
    extension?: string;
    parentId: string | null;
    path: string;
    createdAt: Date;
    modifiedAt: Date;
    createdBy?: string;
    modifiedBy?: string;
    isShared?: boolean;
    permissions?: FilePermissions;
    thumbnailUrl?: string;
}

export interface FilePermissions {
    canRead: boolean;
    canWrite: boolean;
    canDelete: boolean;
    canShare: boolean;
}

export interface FileUploadItem {
    id: string;
    file: File;
    name: string;
    size: number;
    progress: number;
    status: 'pending' | 'uploading' | 'completed' | 'error';
    error?: string;
    uploadedBytes?: number;
    speed?: number; // bytes per second
}

export interface FolderTreeNode {
    id: string;
    name: string;
    parentId: string | null;
    children: FolderTreeNode[];
    isExpanded?: boolean;
    fileCount?: number;
    folderCount?: number;
}

export type ViewMode = 'grid' | 'list';
export type SortField = 'name' | 'size' | 'modifiedAt' | 'type';
export type SortOrder = 'asc' | 'desc';

export interface FileBrowserState {
    currentFolderId: string | null;
    selectedItems: string[];
    viewMode: ViewMode;
    sortField: SortField;
    sortOrder: SortOrder;
    searchQuery: string;
}
