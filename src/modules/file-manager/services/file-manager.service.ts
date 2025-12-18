import { FileItem } from '../types/file';

// Mock data for files and folders
const mockFiles: FileItem[] = [
    {
        id: '1',
        name: 'Documents',
        type: 'folder',
        parentId: null,
        path: '/Documents',
        createdAt: new Date('2024-01-15'),
        modifiedAt: new Date('2024-01-20'),
        permissions: {
            canRead: true,
            canWrite: true,
            canDelete: true,
            canShare: true,
        },
    },
    {
        id: '2',
        name: 'Images',
        type: 'folder',
        parentId: null,
        path: '/Images',
        createdAt: new Date('2024-01-10'),
        modifiedAt: new Date('2024-01-25'),
        permissions: {
            canRead: true,
            canWrite: true,
            canDelete: true,
            canShare: true,
        },
    },
    {
        id: '3',
        name: 'Project Proposal.pdf',
        type: 'file',
        size: 2457600,
        mimeType: 'application/pdf',
        extension: 'pdf',
        parentId: '1',
        path: '/Documents/Project Proposal.pdf',
        createdAt: new Date('2024-01-15'),
        modifiedAt: new Date('2024-01-15'),
        permissions: {
            canRead: true,
            canWrite: true,
            canDelete: true,
            canShare: true,
        },
    },
    {
        id: '4',
        name: 'Meeting Notes.docx',
        type: 'file',
        size: 1024000,
        mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        extension: 'docx',
        parentId: '1',
        path: '/Documents/Meeting Notes.docx',
        createdAt: new Date('2024-01-18'),
        modifiedAt: new Date('2024-01-20'),
        permissions: {
            canRead: true,
            canWrite: true,
            canDelete: true,
            canShare: true,
        },
    },
    {
        id: '5',
        name: 'Screenshot.png',
        type: 'file',
        size: 512000,
        mimeType: 'image/png',
        extension: 'png',
        parentId: '2',
        path: '/Images/Screenshot.png',
        createdAt: new Date('2024-01-20'),
        modifiedAt: new Date('2024-01-20'),
        thumbnailUrl: '/placeholder-image.png',
        permissions: {
            canRead: true,
            canWrite: true,
            canDelete: true,
            canShare: true,
        },
    },
    // Demo files - root directory
    {
        id: 'demo-1',
        name: 'demo.txt',
        type: 'file',
        size: 1024,
        mimeType: 'text/plain',
        extension: 'txt',
        parentId: null,
        path: '/demo.txt',
        createdAt: new Date(),
        modifiedAt: new Date(),
        permissions: {
            canRead: true,
            canWrite: true,
            canDelete: true,
            canShare: true,
        },
    },
    {
        id: 'demo-2',
        name: 'demo.pdf',
        type: 'file',
        size: 2048000,
        mimeType: 'application/pdf',
        extension: 'pdf',
        parentId: null,
        path: '/demo.pdf',
        createdAt: new Date(),
        modifiedAt: new Date(),
        permissions: {
            canRead: true,
            canWrite: true,
            canDelete: true,
            canShare: true,
        },
    },
    {
        id: 'demo-3',
        name: 'demo.jpg',
        type: 'file',
        size: 1536000,
        mimeType: 'image/jpeg',
        extension: 'jpg',
        parentId: null,
        path: '/demo.jpg',
        createdAt: new Date(),
        modifiedAt: new Date(),
        thumbnailUrl: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400&h=300&fit=crop',
        permissions: {
            canRead: true,
            canWrite: true,
            canDelete: true,
            canShare: true,
        },
    },
    {
        id: 'demo-4',
        name: 'demo.png',
        type: 'file',
        size: 1024000,
        mimeType: 'image/png',
        extension: 'png',
        parentId: null,
        path: '/demo.png',
        createdAt: new Date(),
        modifiedAt: new Date(),
        thumbnailUrl: 'https://images.unsplash.com/photo-1518837695005-2083093ee35b?w=400&h=300&fit=crop',
        permissions: {
            canRead: true,
            canWrite: true,
            canDelete: true,
            canShare: true,
        },
    },
    {
        id: 'demo-5',
        name: 'demo.mp4',
        type: 'file',
        size: 10485760,
        mimeType: 'video/mp4',
        extension: 'mp4',
        parentId: null,
        path: '/demo.mp4',
        createdAt: new Date(),
        modifiedAt: new Date(),
        thumbnailUrl: 'https://images.unsplash.com/photo-1533750349088-cd871a92f312?w=400&h=300&fit=crop',
        permissions: {
            canRead: true,
            canWrite: true,
            canDelete: true,
            canShare: true,
        },
    },
    {
        id: 'demo-6',
        name: 'demo.xlsx',
        type: 'file',
        size: 3072000,
        mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        extension: 'xlsx',
        parentId: null,
        path: '/demo.xlsx',
        createdAt: new Date(),
        modifiedAt: new Date(),
        permissions: {
            canRead: true,
            canWrite: true,
            canDelete: true,
            canShare: true,
        },
    },
    {
        id: 'demo-7',
        name: 'demo.docx',
        type: 'file',
        size: 2048000,
        mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        extension: 'docx',
        parentId: null,
        path: '/demo.docx',
        createdAt: new Date(),
        modifiedAt: new Date(),
        permissions: {
            canRead: true,
            canWrite: true,
            canDelete: true,
            canShare: true,
        },
    },
    // More demo files for testing
    {
        id: 'demo-8',
        name: 'Sunum.pptx',
        type: 'file',
        size: 5120000,
        mimeType: 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
        extension: 'pptx',
        parentId: null,
        path: '/Sunum.pptx',
        createdAt: new Date('2024-01-20'),
        modifiedAt: new Date('2024-01-22'),
        permissions: {
            canRead: true,
            canWrite: true,
            canDelete: true,
            canShare: true,
        },
    },
    {
        id: 'demo-9',
        name: 'Rapor.xlsx',
        type: 'file',
        size: 4096000,
        mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        extension: 'xlsx',
        parentId: null,
        path: '/Rapor.xlsx',
        createdAt: new Date('2024-01-18'),
        modifiedAt: new Date('2024-01-21'),
        permissions: {
            canRead: true,
            canWrite: true,
            canDelete: true,
            canShare: true,
        },
    },
    {
        id: 'demo-10',
        name: 'Resim.jpg',
        type: 'file',
        size: 2560000,
        mimeType: 'image/jpeg',
        extension: 'jpg',
        parentId: null,
        path: '/Resim.jpg',
        createdAt: new Date('2024-01-19'),
        modifiedAt: new Date('2024-01-19'),
        thumbnailUrl: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400&h=300&fit=crop',
        permissions: {
            canRead: true,
            canWrite: true,
            canDelete: true,
            canShare: true,
        },
    },
    {
        id: 'demo-11',
        name: 'Video.mp4',
        type: 'file',
        size: 15728640,
        mimeType: 'video/mp4',
        extension: 'mp4',
        parentId: null,
        path: '/Video.mp4',
        createdAt: new Date('2024-01-17'),
        modifiedAt: new Date('2024-01-20'),
        thumbnailUrl: 'https://images.unsplash.com/photo-1533750349088-cd871a92f312?w=400&h=300&fit=crop',
        permissions: {
            canRead: true,
            canWrite: true,
            canDelete: true,
            canShare: true,
        },
    },
    {
        id: 'demo-12',
        name: 'Dokuman.pdf',
        type: 'file',
        size: 3072000,
        mimeType: 'application/pdf',
        extension: 'pdf',
        parentId: null,
        path: '/Dokuman.pdf',
        createdAt: new Date('2024-01-16'),
        modifiedAt: new Date('2024-01-23'),
        permissions: {
            canRead: true,
            canWrite: true,
            canDelete: true,
            canShare: true,
        },
    },
    {
        id: 'demo-13',
        name: 'Notlar.txt',
        type: 'file',
        size: 2048,
        mimeType: 'text/plain',
        extension: 'txt',
        parentId: null,
        path: '/Notlar.txt',
        createdAt: new Date('2024-01-15'),
        modifiedAt: new Date('2024-01-24'),
        permissions: {
            canRead: true,
            canWrite: true,
            canDelete: true,
            canShare: true,
        },
    },
    {
        id: 'demo-14',
        name: 'Logo.png',
        type: 'file',
        size: 512000,
        mimeType: 'image/png',
        extension: 'png',
        parentId: null,
        path: '/Logo.png',
        createdAt: new Date('2024-01-14'),
        modifiedAt: new Date('2024-01-14'),
        thumbnailUrl: 'https://images.unsplash.com/photo-1518837695005-2083093ee35b?w=400&h=300&fit=crop',
        permissions: {
            canRead: true,
            canWrite: true,
            canDelete: true,
            canShare: true,
        },
    },
];

export const fileManagerService = {
    // Get files in a folder
    async getFiles(folderId: string | null): Promise<FileItem[]> {
        await new Promise(resolve => setTimeout(resolve, 300));
        return mockFiles.filter(file => file.parentId === folderId);
    },

    // Get all folders for tree view
    async getFolders(): Promise<FileItem[]> {
        await new Promise(resolve => setTimeout(resolve, 200));
        return mockFiles.filter(file => file.type === 'folder');
    },

    // Get single file/folder
    async getFile(id: string): Promise<FileItem | null> {
        await new Promise(resolve => setTimeout(resolve, 100));
        return mockFiles.find(file => file.id === id) || null;
    },

    // Create folder
    async createFolder(name: string, parentId: string | null): Promise<FileItem> {
        await new Promise(resolve => setTimeout(resolve, 300));
        const newFolder: FileItem = {
            id: Date.now().toString(),
            name,
            type: 'folder',
            parentId,
            path: parentId ? `${mockFiles.find(f => f.id === parentId)?.path}/${name}` : `/${name}`,
            createdAt: new Date(),
            modifiedAt: new Date(),
            permissions: {
                canRead: true,
                canWrite: true,
                canDelete: true,
                canShare: true,
            },
        };
        mockFiles.push(newFolder);
        return newFolder;
    },

    // Upload file
    async uploadFile(file: File, folderId: string | null): Promise<FileItem> {
        await new Promise(resolve => setTimeout(resolve, 1000));
        const extension = file.name.split('.').pop() || '';
        const newFile: FileItem = {
            id: Date.now().toString(),
            name: file.name,
            type: 'file',
            size: file.size,
            mimeType: file.type,
            extension,
            parentId: folderId,
            path: folderId ? `${mockFiles.find(f => f.id === folderId)?.path}/${file.name}` : `/${file.name}`,
            createdAt: new Date(),
            modifiedAt: new Date(),
            permissions: {
                canRead: true,
                canWrite: true,
                canDelete: true,
                canShare: true,
            },
        };
        mockFiles.push(newFile);
        return newFile;
    },

    // Rename file/folder
    async renameFile(id: string, newName: string): Promise<FileItem> {
        await new Promise(resolve => setTimeout(resolve, 300));
        const file = mockFiles.find(f => f.id === id);
        if (!file) throw new Error('File not found');
        file.name = newName;
        file.modifiedAt = new Date();
        return file;
    },

    // Delete file/folder
    async deleteFile(id: string): Promise<void> {
        await new Promise(resolve => setTimeout(resolve, 300));
        const index = mockFiles.findIndex(f => f.id === id);
        if (index !== -1) {
            mockFiles.splice(index, 1);
        }
    },

    // Move file/folder
    async moveFile(id: string, newParentId: string | null): Promise<FileItem> {
        await new Promise(resolve => setTimeout(resolve, 300));
        const file = mockFiles.find(f => f.id === id);
        if (!file) throw new Error('File not found');
        file.parentId = newParentId;
        file.modifiedAt = new Date();
        return file;
    },

    // Search files
    async searchFiles(query: string): Promise<FileItem[]> {
        await new Promise(resolve => setTimeout(resolve, 300));
        return mockFiles.filter(file =>
            file.name.toLowerCase().includes(query.toLowerCase())
        );
    },
};
