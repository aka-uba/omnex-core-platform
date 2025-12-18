'use client';

import { useState, useEffect } from 'react';
import { Container, Grid, Paper, Text, Group, Select, Stack, Box, Menu, ActionIcon, Skeleton, Tooltip, TextInput, SegmentedControl } from '@mantine/core';
import { IconRefresh, IconFilter, IconFolderPlus, IconUpload, IconPencil, IconTrash, IconCopy, IconDownload, IconShare, IconFolder, IconCut, IconClipboardCheck, IconArrowsMove, IconSearch, IconLayoutGrid, IconList, IconFileZip, IconWifi, IconWifiOff, IconFileText } from '@tabler/icons-react';
import { DirectoryTree } from '../components/DirectoryTree';
import { FileBreadcrumbs } from '../components/FileBreadcrumbs';
import { FileGrid } from '@/modules/file-manager/components/FileGrid';
import { FileList } from '@/modules/file-manager/components/FileList';
import { FilePreviewModal } from '@/modules/file-manager/components/FilePreviewModal';
import { showToast } from '@/modules/notifications/components/ToastNotification';
import { CreateFolderModal } from '../components/modals/CreateFolderModal';
import { RenameModal } from '../components/modals/RenameModal';
import { DeleteConfirmModal } from '../components/modals/DeleteConfirmModal';
import { MoveCopyModal } from '../components/modals/MoveCopyModal';
import { ShareModal } from '../components/modals/ShareModal';
import { ShareServerModal } from '@/modules/file-manager/components/shared/ShareServerModal';
import { useTranslation } from '@/lib/i18n/client';
import { CentralPageHeader } from '@/components/headers/CentralPageHeader';
import { DataTableSkeleton } from '@/components/tables/DataTableSkeleton';
import { useParams } from 'next/navigation';

interface DirectoryNode {
    id: string;
    name: string;
    path: string;
    type: 'tenant' | 'module' | 'folder';
    children?: DirectoryNode[];
}

import type { FileItem } from '@/modules/file-manager/types/file';

export default function FileManagerDashboard() {
    const params = useParams();
    const locale = (params?.locale as string) || 'tr';
    const { t } = useTranslation('modules/file-manager');
    const [mounted, setMounted] = useState(false);
    const [selectedTenant, setSelectedTenant] = useState<string | null>('all');
    const [selectedModule, setSelectedModule] = useState<string | null>('all');
    const [currentPath, setCurrentPath] = useState('/');
    const [directoryTree, setDirectoryTree] = useState<DirectoryNode[]>([]);
    const [files, setFiles] = useState<FileItem[]>([]);
    const [loading, setLoading] = useState(false);
    const [actionLoading, setActionLoading] = useState(false);
    const [treeLoading, setTreeLoading] = useState(false);

    // Modals state
    const [createFolderOpen, setCreateFolderOpen] = useState(false);
    const [renameOpen, setRenameOpen] = useState(false);
    const [deleteOpen, setDeleteOpen] = useState(false);
    const [moveCopyOpen, setMoveCopyOpen] = useState(false);
    const [shareOpen, setShareOpen] = useState(false);

    const [selectedItem, setSelectedItem] = useState<FileItem | null>(null);
    const [selectedItems, setSelectedItems] = useState<string[]>([]);
    const [moveCopyAction, setMoveCopyAction] = useState<'move' | 'copy'>('copy');
    const [clipboardItem, setClipboardItem] = useState<FileItem | null>(null);
    const [clipboardAction, setClipboardAction] = useState<'cut' | 'copy' | null>(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [viewMode, setViewMode] = useState<'grid' | 'list'>('list');
    const [contextMenu, setContextMenu] = useState<{ x: number; y: number; file: FileItem } | null>(null);
    const [shareServerModalOpen, setShareServerModalOpen] = useState(false);
    const [serverStatus, setServerStatus] = useState<{ isRunning: boolean; url?: string }>({ isRunning: false });
    const [previewFile, setPreviewFile] = useState<FileItem | null>(null);
    const [previewOpened, setPreviewOpened] = useState(false);

    // Mock data - replace with API calls
    const tenants = [
        { value: 'all', label: t('dashboard.allTenants') },
        { value: 'omnexcore', label: 'OmnexCore' },
        { value: 'acme', label: 'ACME Corp' },
    ];

    const modules = [
        { value: 'all', label: t('dashboard.allModules') },
        { value: 'accounting', label: t('dashboard.modules.accounting') },
        { value: 'hr', label: t('dashboard.modules.hr') },
        { value: 'maintenance', label: t('dashboard.modules.maintenance') },
        { value: 'production', label: t('dashboard.modules.production') },
        { value: 'real-estate', label: t('dashboard.modules.realEstate') },
        { value: 'documents', label: t('dashboard.modules.documents') },
    ];

    useEffect(() => {
        setMounted(true);
        // Check server status on mount
        checkServerStatus();
        // Check server status periodically
        const interval = setInterval(checkServerStatus, 2000);
        return () => clearInterval(interval);
    }, []);

    const checkServerStatus = async () => {
        try {
            const response = await fetch('/api/file-manager/share/status');
            if (response.ok) {
                const data = await response.json();
                setServerStatus({ 
                    isRunning: data.isRunning || false, 
                    ...(data.url ? { url: data.url } : {})
                });
            } else {
                setServerStatus({ isRunning: false });
            }
        } catch (error) {
            setServerStatus({ isRunning: false });
        }
    };

    useEffect(() => {
        if (mounted) {
            loadDirectoryTree();
        }
    }, [mounted, selectedTenant, selectedModule]);

    useEffect(() => {
        if (mounted) {
            loadFiles();
        }
    }, [mounted, currentPath]);

    // Filter files based on search query
    // Note: API already filters by currentPath, so we only need to filter by search query
    const filteredFiles = files.filter(file => 
        file.name.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const loadDirectoryTree = async () => {
        setTreeLoading(true);
        try {
            const params = new URLSearchParams();
            if (selectedTenant && selectedTenant !== 'all') {
                params.append('tenant', selectedTenant);
            }

            const response = await fetch(`/api/file-manager/tree?${params.toString()}`);
            const data = await response.json();

            if (data.success) {
                setDirectoryTree(data.data);
            }
        } catch (error) {
            console.error('Failed to load directory tree:', error);
            showToast({
                type: 'error',
                title: t('messages.error'),
                message: t('messages.failedToLoadTree'),
            });
        } finally {
            setTreeLoading(false);
        }
    };

    const loadFiles = async () => {
        if (!currentPath) return;

        setLoading(true);
        try {
            const path = currentPath;
            if (path === '/') {
                setLoading(false);
                return;
            }

            const response = await fetch(`/api/file-manager/files?path=${encodeURIComponent(path)}`);
            const data = await response.json();

            if (data.success) {
                setFiles(data.data);
                } else {
                    setFiles([]);
                    if (data.error !== 'Directory not found') {
                        showToast({
                            type: 'error',
                            title: t('messages.error'),
                            message: data.error,
                        });
                    }
                }
        } catch (error: any) {
            showToast({
                type: 'error',
                title: t('messages.error'),
                message: error.message || t('messages.failedToLoadFiles'),
            });
            setFiles([]);
        } finally {
            setLoading(false);
        }
    };

    const handlePathSelect = (path: string) => {
        setCurrentPath(path);
    };

    const getBreadcrumbs = () => {
        if (!currentPath || currentPath === '/') return [];

        const displayPath = currentPath.replace('/storage/tenants', '').replace('\\storage\\tenants', '');
        const parts = displayPath.split('/').filter(Boolean);

        let accumulatedPath = '/storage/tenants';

        return parts.map((part, index) => {
            accumulatedPath += '/' + part;
            return {
                label: part,
                path: accumulatedPath,
            };
        });
    };

    // Unused function - commented out
    // const formatFileSize = (bytes?: number) => {
    //     if (!bytes) return '-';
    //     const kb = bytes / 1024;
    //     if (kb < 1024) return `${kb.toFixed(2)} KB`;
    //     const mb = kb / 1024;
    //     return `${mb.toFixed(2)} MB`;
    // };

    // Actions
    const handleCreateFolder = async (folderName: string) => {
        setActionLoading(true);
        try {
            const response = await fetch('/api/file-manager/create-folder', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ path: currentPath, folderName }),
            });
            const data = await response.json();
            if (data.success) {
                showToast({ type: 'success', title: t('messages.success'), message: t('messages.folderCreated') });
                loadFiles();
                loadDirectoryTree(); // Refresh tree as well
            } else {
                throw new Error(data.error);
            }
        } catch (error: any) {
            showToast({ type: 'error', title: t('messages.error'), message: error.message });
        } finally {
            setActionLoading(false);
        }
    };

    const handleRename = async (newName: string) => {
        if (!selectedItem) return;
        setActionLoading(true);
        try {
            const response = await fetch('/api/file-manager/rename', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ path: selectedItem.path, newName }),
            });
            const data = await response.json();
            if (data.success) {
                showToast({ type: 'success', title: t('messages.success'), message: t('messages.itemRenamed') });
                loadFiles();
                loadDirectoryTree();
            } else {
                throw new Error(data.error);
            }
        } catch (error: any) {
            showToast({ type: 'error', title: t('messages.error'), message: error.message });
        } finally {
            setActionLoading(false);
        }
    };

    const handleDelete = async () => {
        if (!selectedItem) return;
        setActionLoading(true);
        try {
            const response = await fetch(`/api/file-manager/delete?path=${encodeURIComponent(selectedItem.path)}`, {
                method: 'DELETE',
            });
            const data = await response.json();
            if (data.success) {
                showToast({ type: 'success', title: t('messages.success'), message: t('messages.itemDeleted') });
                loadFiles();
                loadDirectoryTree();
                setDeleteOpen(false);
            } else {
                throw new Error(data.error);
            }
        } catch (error: any) {
            showToast({ type: 'error', title: t('messages.error'), message: error.message });
        } finally {
            setActionLoading(false);
        }
    };

    const handleMoveCopy = async (item: FileItem, destinationPath: string, action: 'move' | 'copy') => {
        setActionLoading(true);
        try {
            const endpoint = action === 'move' ? '/api/file-manager/move' : '/api/file-manager/copy';
            const response = await fetch(endpoint, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ sourcePath: item.path, destinationPath }),
            });
            const data = await response.json();
            if (data.success) {
                showToast({ type: 'success', title: t('messages.success'), message: action === 'move' ? t('messages.itemMoved') : t('messages.itemCopied') });
                loadFiles();
                loadDirectoryTree();
                setMoveCopyOpen(false);
                setSelectedItem(null);
            } else {
                throw new Error(data.error);
            }
        } catch (error: any) {
            showToast({ type: 'error', title: t('messages.error'), message: error.message });
        } finally {
            setActionLoading(false);
        }
    };

    const handleMoveCopyFromModal = async (destinationPath: string) => {
        if (!selectedItem) return;
        await handleMoveCopy(selectedItem, destinationPath, moveCopyAction);
    };

    const handleDownload = (item: FileItem) => {
        if (item.type === 'folder') return;
        const link = document.createElement('a');
        link.href = `/api/file-manager/download?path=${encodeURIComponent(item.path)}`;
        link.download = item.name;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const handleDownloadAsZip = async (items: FileItem[]) => {
        try {
            setActionLoading(true);
            const response = await fetch('/api/file-manager/download-zip', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    paths: items.map(item => item.path),
                    filename: items.length === 1 ? `${items[0]?.name || 'file'}.zip` : `files-${new Date().getTime()}.zip`
                }),
            });

            if (!response.ok) {
                throw new Error(t('errors.zip.indirme.basarisiz'));
            }

            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = items.length === 1 ? `${items[0]?.name || 'file'}.zip` : `files-${new Date().getTime()}.zip`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            window.URL.revokeObjectURL(url);

            showToast({
                type: 'success',
                title: t('messages.success'),
                message: t('actions.downloadAsZip'),
            });
        } catch (error: any) {
            showToast({
                type: 'error',
                title: t('messages.error'),
                message: error.message || t('messages.failedToDownload'),
            });
        } finally {
            setActionLoading(false);
        }
    };

    const handleUpload = async (file: File) => {
        if (!currentPath || currentPath === '/') return;

        const formData = new FormData();
        formData.append('file', file);
        formData.append('path', currentPath);

        try {
            const response = await fetch('/api/file-manager/upload', {
                method: 'POST',
                body: formData,
            });
            const data = await response.json();

            if (data.success) {
                showToast({ type: 'success', title: t('messages.success'), message: t('messages.fileUploaded') });
                loadFiles();
            } else {
                throw new Error(data.error);
            }
        } catch (error: any) {
            showToast({ type: 'error', title: t('messages.error'), message: error.message });
        }
    };

    // Unused function - commented out
    // const openActionModal = (item: FileItem, action: 'rename' | 'delete' | 'move' | 'copy' | 'share') => {
    //     setSelectedItem(item);
    //     if (action === 'rename') setRenameOpen(true);
    //     if (action === 'delete') setDeleteOpen(true);
    //     if (action === 'move') { setMoveCopyAction('move'); setMoveCopyOpen(true); }
    //     if (action === 'copy') { setMoveCopyAction('copy'); setMoveCopyOpen(true); }
    //     if (action === 'share') setShareOpen(true);
    // };

    return (
        <Container size="xl" pt="xl">
            <CentralPageHeader
                title={t('dashboard.title')}
                description={t('dashboard.description')}
                namespace="modules/file-manager"
                icon={mounted ? <IconFolder size={32} /> : null}
                breadcrumbs={[
                    { label: 'navigation.dashboard', href: `/${locale}/dashboard`, namespace: 'global' },
                    { label: 'menu.label', href: `/${locale}/modules/file-manager`, namespace: 'modules/file-manager' },
                    { label: 'dashboard.title', namespace: 'modules/file-manager' },
                ]}
                actions={[
                    {
                        label: t('toolbar.newFolder'),
                        icon: mounted ? <IconFolderPlus size={18} /> : null,
                        onClick: () => setCreateFolderOpen(true),
                        variant: 'light',
                    },
                    {
                        label: t('toolbar.upload'),
                        icon: mounted ? <IconUpload size={18} /> : null,
                        onClick: () => {
                            const input = document.createElement('input');
                            input.type = 'file';
                            input.accept = '*/*';
                            input.onchange = (e) => {
                                const file = (e.target as HTMLInputElement).files?.[0];
                                if (file) handleUpload(file);
                            };
                            input.click();
                        },
                        variant: 'filled',
                    },
                    {
                        label: t('toolbar.refresh'),
                        icon: mounted ? <IconRefresh size={18} /> : null,
                        onClick: () => {
                            loadFiles();
                            loadDirectoryTree();
                        },
                        variant: 'light',
                    },
                ]}
            />

            <Paper p="md" withBorder mt="md">
                <Group gap="md">
                    <Select
                        label={t('dashboard.tenant')}
                        placeholder={t('dashboard.tenant')}
                        data={tenants}
                        value={selectedTenant}
                        onChange={setSelectedTenant}
                        leftSection={<IconFilter size={16} />}
                        style={{ flex: 1 }}
                    />
                    <Select
                        label={t('dashboard.module')}
                        placeholder={t('dashboard.module')}
                        data={modules}
                        value={selectedModule}
                        onChange={setSelectedModule}
                        leftSection={<IconFilter size={16} />}
                        style={{ flex: 1 }}
                    />
                </Group>
            </Paper>

            <Grid mt="md">
                <Grid.Col span={{ base: 12, md: 3 }}>
                    <Paper p="md" withBorder style={{ height: '600px', overflowY: 'auto' }}>
                        <Text fw={600} size="sm" mb="md">
                            {t('dashboard.folders')}
                        </Text>
                        {treeLoading ? (
                            <Stack gap="xs">
                                {Array.from({ length: 8 }).map((_, i) => (
                                    <Skeleton key={i} height={24} radius="sm" />
                                ))}
                            </Stack>
                        ) : (
                            <DirectoryTree
                                nodes={directoryTree}
                                onSelect={handlePathSelect}
                                selectedPath={currentPath}
                            />
                        )}
                    </Paper>
                </Grid.Col>

                <Grid.Col span={{ base: 12, md: 9 }}>
                    <Paper p="md" withBorder>
                        <Box mb="md">
                            <FileBreadcrumbs items={getBreadcrumbs()} onNavigate={handlePathSelect} />
                        </Box>

                        {/* Toolbar */}
                        <Group gap="xs" mb="md" wrap="nowrap" justify="space-between">
                            <Group gap="xs" wrap="nowrap" style={{ flex: 1 }}>
                                {/* Search */}
                                <TextInput
                                    placeholder={t('toolbar.search')}
                                    leftSection={<IconSearch size={16} />}
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.currentTarget.value)}
                                    style={{ flex: 1, maxWidth: 300 }}
                                />
                                
                                {/* View Mode Toggle */}
                                <SegmentedControl
                                    value={viewMode}
                                    onChange={(value) => setViewMode(value as 'grid' | 'list')}
                                    data={[
                                        { label: mounted ? <IconLayoutGrid size={16} /> : null, value: 'grid' },
                                        { label: mounted ? <IconList size={16} /> : null, value: 'list' },
                                    ]}
                                />
                            </Group>
                            
                            <Group gap={4}>
                                <Tooltip label={t('actions.cut')}>
                                    <ActionIcon
                                        variant="subtle"
                                        onClick={() => {
                                            if (selectedItem) {
                                                setClipboardItem(selectedItem);
                                                setClipboardAction('cut');
                                                showToast({
                                                    type: 'success',
                                                    title: t('messages.success'),
                                                    message: t('actions.cut'),
                                                });
                                            }
                                        }}
                                        disabled={!selectedItem}
                                    >
                                        <IconCut size={16} />
                                    </ActionIcon>
                                </Tooltip>
                                <Tooltip label={t('copy.title')}>
                                    <ActionIcon
                                        variant="subtle"
                                        onClick={() => {
                                            if (selectedItem) {
                                                setClipboardItem(selectedItem);
                                                setClipboardAction('copy');
                                                showToast({
                                                    type: 'success',
                                                    title: t('messages.success'),
                                                    message: t('copy.title'),
                                                });
                                            }
                                        }}
                                        disabled={!selectedItem}
                                    >
                                        <IconCopy size={16} />
                                    </ActionIcon>
                                </Tooltip>
                                <Tooltip label={t('actions.paste')}>
                                    <ActionIcon
                                        variant="subtle"
                                        onClick={() => {
                                            if (clipboardItem && clipboardAction) {
                                                if (clipboardAction === 'cut') {
                                                    handleMoveCopy(clipboardItem, currentPath, 'move');
                                                } else {
                                                    handleMoveCopy(clipboardItem, currentPath, 'copy');
                                                }
                                                setClipboardItem(null);
                                                setClipboardAction(null);
                                            }
                                        }}
                                        disabled={!clipboardItem || !clipboardAction}
                                    >
                                        <IconClipboardCheck size={16} />
                                    </ActionIcon>
                                </Tooltip>
                            </Group>
                            
                            <Group gap={4}>
                                {selectedItem && selectedItem.type === 'file' && (
                                    <Tooltip label={t('actions.preview')}>
                                        <ActionIcon
                                            variant="subtle"
                                            onClick={() => {
                                                if (selectedItem && selectedItem.type === 'file') {
                                                    setPreviewFile(selectedItem);
                                                    setPreviewOpened(true);
                                                }
                                            }}
                                            disabled={!selectedItem || (selectedItem.type as string) === 'folder'}
                                        >
                                            <IconFileText size={16} />
                                        </ActionIcon>
                                    </Tooltip>
                                )}
                                <Tooltip label={t('actions.rename')}>
                                    <ActionIcon
                                        variant="subtle"
                                        onClick={() => {
                                            if (selectedItem) {
                                                setRenameOpen(true);
                                            }
                                        }}
                                        disabled={!selectedItem}
                                    >
                                        <IconPencil size={16} />
                                    </ActionIcon>
                                </Tooltip>
                                <Tooltip label={t('move.title')}>
                                    <ActionIcon
                                        variant="subtle"
                                        onClick={() => {
                                            if (selectedItem) {
                                                setMoveCopyAction('move');
                                                setMoveCopyOpen(true);
                                            }
                                        }}
                                        disabled={!selectedItem}
                                    >
                                        <IconArrowsMove size={16} />
                                    </ActionIcon>
                                </Tooltip>
                                <Menu shadow="md" width={200} position="bottom-start">
                                    <Menu.Target>
                                        <Tooltip label={t('actions.download')}>
                                            <ActionIcon
                                                variant="subtle"
                                                disabled={!selectedItem && selectedItems.length === 0}
                                            >
                                                <IconDownload size={16} />
                                            </ActionIcon>
                                        </Tooltip>
                                    </Menu.Target>
                                    <Menu.Dropdown>
                                        <Menu.Item 
                                            leftSection={<IconDownload size={14} />}
                                            onClick={() => {
                                                if (selectedItem && selectedItem.type === 'file') {
                                                    handleDownload(selectedItem);
                                                } else if (selectedItems.length > 0) {
                                                    const filesToDownload = filteredFiles.filter(f => 
                                                        selectedItems.includes(f.id) && f.type === 'file'
                                                    );
                                                    filesToDownload.forEach(file => handleDownload(file));
                                                }
                                            }}
                                            disabled={(!selectedItem || (selectedItem.type as string) === 'folder') && selectedItems.length === 0}
                                        >
                                            {t('actions.download')}
                                        </Menu.Item>
                                        <Menu.Item 
                                            leftSection={<IconFileZip size={14} />}
                                            onClick={() => {
                                                if (selectedItem) {
                                                    handleDownloadAsZip([selectedItem]);
                                                } else if (selectedItems.length > 0) {
                                                    const itemsToZip = filteredFiles.filter(f => 
                                                        selectedItems.includes(f.id)
                                                    );
                                                    if (itemsToZip.length > 0) {
                                                        handleDownloadAsZip(itemsToZip);
                                                    }
                                                } else if (currentPath && currentPath !== '/') {
                                                    // Download current directory
                                                    const dirItems = filteredFiles.filter(f => f.path.startsWith(currentPath));
                                                    if (dirItems.length > 0) {
                                                        handleDownloadAsZip(dirItems);
                                                    }
                                                }
                                            }}
                                            disabled={!selectedItem && selectedItems.length === 0 && (!currentPath || currentPath === '/')}
                                        >
                                            {t('actions.downloadAsZip')}
                                        </Menu.Item>
                                    </Menu.Dropdown>
                                </Menu>
                                <Tooltip label={t('actions.share')}>
                                    <ActionIcon
                                        variant="subtle"
                                        onClick={() => {
                                            if (selectedItem) {
                                                setShareOpen(true);
                                            }
                                        }}
                                        disabled={!selectedItem}
                                    >
                                        <IconShare size={16} />
                                    </ActionIcon>
                                </Tooltip>
                                <Tooltip label={serverStatus.isRunning ? (t('shareServer.stop')) : (t('shareServer.start'))}>
                                    <ActionIcon
                                        variant="subtle"
                                        color={serverStatus.isRunning ? 'red' : 'green'}
                                        onClick={() => {
                                            setShareServerModalOpen(true);
                                        }}
                                    >
                                        {serverStatus.isRunning ? <IconWifiOff size={16} /> : <IconWifi size={16} />}
                                    </ActionIcon>
                                </Tooltip>
                                <Tooltip label={t('actions.delete')}>
                                    <ActionIcon
                                        variant="subtle"
                                        color="red"
                                        onClick={() => {
                                            if (selectedItem) {
                                                setDeleteOpen(true);
                                            }
                                        }}
                                        disabled={!selectedItem}
                                    >
                                        <IconTrash size={16} />
                                    </ActionIcon>
                                </Tooltip>
                            </Group>
                        </Group>

                        {loading ? (
                            <DataTableSkeleton columns={5} rows={8} />
                        ) : viewMode === 'grid' ? (
                            <FileGrid
                                files={filteredFiles}
                                selectedItems={selectedItems}
                                onSelect={(id) => {
                                    setSelectedItems(prev => 
                                        prev.includes(id) 
                                            ? prev.filter(item => item !== id)
                                            : [...prev, id]
                                    );
                                    const file = filteredFiles.find(f => f.id === id);
                                    if (file) setSelectedItem(file);
                                }}
                                onOpen={(file) => {
                                    if (file.type === 'folder') {
                                        setCurrentPath(file.path);
                                    } else {
                                        // Open preview modal for files
                                        setPreviewFile(file);
                                        setPreviewOpened(true);
                                    }
                                }}
                                onRename={(file) => {
                                    setSelectedItem(file);
                                    setRenameOpen(true);
                                }}
                                onDelete={(file) => {
                                    setSelectedItem(file);
                                    setDeleteOpen(true);
                                }}
                                onDownload={handleDownload}
                                onShare={(file) => {
                                    setSelectedItem(file);
                                    setShareOpen(true);
                                }}
                            />
                        ) : (
                            <FileList
                                files={filteredFiles}
                                selectedItems={selectedItems}
                                onSelect={(id) => {
                                    setSelectedItems(prev => 
                                        prev.includes(id) 
                                            ? prev.filter(item => item !== id)
                                            : [...prev, id]
                                    );
                                    const file = filteredFiles.find(f => f.id === id);
                                    if (file) setSelectedItem(file);
                                }}
                                onSelectAll={() => {
                                    if (selectedItems.length === filteredFiles.length) {
                                        setSelectedItems([]);
                                        setSelectedItem(null);
                                    } else {
                                        setSelectedItems(filteredFiles.map(f => f.id));
                                        if (filteredFiles.length === 1) {
                                            setSelectedItem(filteredFiles[0] ?? null);
                                        }
                                    }
                                }}
                                onOpen={(file) => {
                                    if (file.type === 'folder') {
                                        setCurrentPath(file.path);
                                    } else {
                                        // Open preview modal for files
                                        setPreviewFile(file);
                                        setPreviewOpened(true);
                                    }
                                }}
                                onRename={(file) => {
                                    setSelectedItem(file);
                                    setRenameOpen(true);
                                }}
                                onDelete={(file) => {
                                    setSelectedItem(file);
                                    setDeleteOpen(true);
                                }}
                                onDownload={handleDownload}
                                onShare={(file) => {
                                    setSelectedItem(file);
                                    setShareOpen(true);
                                }}
                                sortField="modifiedAt"
                                sortOrder="desc"
                                onSort={(field) => {
                                    // Simple sort implementation
                                    [...filteredFiles].sort((a, b) => {
                                        if (field === 'name') {
                                            return a.name.localeCompare(b.name);
                                        } else if (field === 'size') {
                                            return (a.size || 0) - (b.size || 0);
                                        } else if (field === 'modifiedAt') {
                                            return new Date(a.modifiedAt).getTime() - new Date(b.modifiedAt).getTime();
                                        }
                                        return 0;
                                    });
                                    // Note: This is a simplified sort, you might want to use state for sort order
                                }}
                                onContextMenu={(file, event) => {
                                    event.preventDefault();
                                    setSelectedItem(file);
                                    setContextMenu({ x: event.clientX, y: event.clientY, file });
                                }}
                            />
                        )}
                    </Paper>
                </Grid.Col>
            </Grid>

            <CreateFolderModal
                opened={createFolderOpen}
                onClose={() => setCreateFolderOpen(false)}
                onSubmit={handleCreateFolder}
                loading={actionLoading}
            />

            <RenameModal
                opened={renameOpen}
                onClose={() => setRenameOpen(false)}
                onSubmit={handleRename}
                loading={actionLoading}
                currentName={selectedItem?.name || ''}
            />

            <DeleteConfirmModal
                opened={deleteOpen}
                onClose={() => setDeleteOpen(false)}
                onConfirm={handleDelete}
                loading={actionLoading}
                itemName={selectedItem?.name || ''}
            />

            <MoveCopyModal
                opened={moveCopyOpen}
                onClose={() => setMoveCopyOpen(false)}
                onConfirm={handleMoveCopyFromModal}
                loading={actionLoading}
                action={moveCopyAction}
                itemName={selectedItem?.name || ''}
                currentPath={currentPath}
            />

            <ShareModal
                opened={shareOpen}
                onClose={() => setShareOpen(false)}
                itemName={selectedItem?.name || ''}
                itemPath={selectedItem?.path || ''}
            />

            {/* Context Menu */}
            {contextMenu && (() => {
                // Smart positioning - adjust based on screen edges
                const menuWidth = 200;
                const menuHeight = 350; // Realistic menu height
                const padding = 10;

                let left = contextMenu.x;
                let top = contextMenu.y;

                // Check if menu would go off right edge
                if (left + menuWidth > window.innerWidth - padding) {
                    left = window.innerWidth - menuWidth - padding;
                }

                // Check if menu would go off bottom edge - only adjust if it goes off screen
                if (top + menuHeight > window.innerHeight - padding) {
                    // Try to show above the click point
                    const aboveTop = contextMenu.y - menuHeight;
                    if (aboveTop >= padding) {
                        top = aboveTop;
                    } else {
                        // If can't show above, show at maximum visible position
                        top = window.innerHeight - menuHeight - padding;
                    }
                }

                // Check if menu would go off left edge
                if (left < padding) {
                    left = padding;
                }

                // Check if menu would go off top edge
                if (top < padding) {
                    top = padding;
                }
                
                return (
                    <Menu
                        shadow="md"
                        width={menuWidth}
                        opened={!!contextMenu}
                        onChange={() => {}}
                    >
                        <Menu.Dropdown
                            style={{
                                position: 'fixed',
                                left: left,
                                top: top,
                                zIndex: 1000,
                            }}
                            onClick={(e) => e.stopPropagation()}
                        >
                        {contextMenu.file.type === 'file' && (
                            <Menu.Item 
                                leftSection={<IconFileText size={14} />} 
                                onClick={() => {
                                    setPreviewFile(contextMenu.file);
                                    setPreviewOpened(true);
                                    setContextMenu(null);
                                }}
                            >
                                {t('actions.preview')}
                            </Menu.Item>
                        )}
                        <Menu.Item 
                            leftSection={<IconPencil size={14} />} 
                            onClick={() => {
                                setSelectedItem(contextMenu.file);
                                setRenameOpen(true);
                                setContextMenu(null);
                            }}
                        >
                            {t('actions.rename')}
                        </Menu.Item>
                        <Menu.Item 
                            leftSection={<IconCut size={14} />} 
                            onClick={() => {
                                setClipboardItem(contextMenu.file);
                                setClipboardAction('cut');
                                setContextMenu(null);
                            }}
                        >
                            {t('actions.cut')}
                        </Menu.Item>
                        <Menu.Item 
                            leftSection={<IconCopy size={14} />} 
                            onClick={() => {
                                setClipboardItem(contextMenu.file);
                                setClipboardAction('copy');
                                setContextMenu(null);
                            }}
                        >
                            {t('copy.title')}
                        </Menu.Item>
                        <Menu.Item 
                            leftSection={<IconClipboardCheck size={14} />} 
                            onClick={() => {
                                if (clipboardItem && clipboardAction) {
                                    if (clipboardAction === 'cut') {
                                        handleMoveCopy(clipboardItem, currentPath, 'move');
                                    } else {
                                        handleMoveCopy(clipboardItem, currentPath, 'copy');
                                    }
                                    setClipboardItem(null);
                                    setClipboardAction(null);
                                }
                                setContextMenu(null);
                            }}
                            disabled={!clipboardItem || !clipboardAction}
                        >
                            {t('actions.paste')}
                        </Menu.Item>
                        <Menu.Divider />
                        <Menu.Item 
                            leftSection={<IconArrowsMove size={14} />} 
                            onClick={() => {
                                setSelectedItem(contextMenu.file);
                                setMoveCopyAction('move');
                                setMoveCopyOpen(true);
                                setContextMenu(null);
                            }}
                        >
                            {t('move.title')}
                        </Menu.Item>
                        {contextMenu.file.type === 'file' && (
                            <>
                                <Menu.Item 
                                    leftSection={<IconDownload size={14} />} 
                                    onClick={() => {
                                        handleDownload(contextMenu.file);
                                        setContextMenu(null);
                                    }}
                                >
                                    {t('actions.download')}
                                </Menu.Item>
                                <Menu.Item 
                                    leftSection={<IconFileZip size={14} />} 
                                    onClick={() => {
                                        handleDownloadAsZip([contextMenu.file]);
                                        setContextMenu(null);
                                    }}
                                >
                                    {t('actions.downloadAsZip')}
                                </Menu.Item>
                            </>
                        )}
                        <Menu.Item 
                            leftSection={<IconShare size={14} />} 
                            onClick={() => {
                                setSelectedItem(contextMenu.file);
                                setShareOpen(true);
                                setContextMenu(null);
                            }}
                        >
                            {t('actions.share')}
                        </Menu.Item>
                        <Menu.Divider />
                        <Menu.Item 
                            color="red" 
                            leftSection={<IconTrash size={14} />} 
                            onClick={() => {
                                setSelectedItem(contextMenu.file);
                                setDeleteOpen(true);
                                setContextMenu(null);
                            }}
                        >
                            {t('actions.delete')}
                        </Menu.Item>
                        </Menu.Dropdown>
                    </Menu>
                );
            })()}

            {/* Click outside to close context menu */}
            {contextMenu && (
                <Box
                    style={{
                        position: 'fixed',
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        zIndex: 999,
                    }}
                    onClick={() => setContextMenu(null)}
                />
            )}

            {/* Share Server Modal */}
            <ShareServerModal
                opened={shareServerModalOpen}
                onClose={() => {
                    // Check server status when modal closes to update dashboard
                    checkServerStatus();
                    setShareServerModalOpen(false);
                }}
                currentPath={selectedItem?.path || currentPath || null}
                onStatusChange={(status) => {
                    setServerStatus(status);
                }}
                expiresInHours={1}
            />

            {/* File Preview Modal */}
            <FilePreviewModal
                opened={previewOpened}
                onClose={() => {
                    setPreviewOpened(false);
                    setPreviewFile(null);
                }}
                file={previewFile}
                onDownload={(file) => {
                    handleDownload(file);
                }}
            />
        </Container>
    );
}
