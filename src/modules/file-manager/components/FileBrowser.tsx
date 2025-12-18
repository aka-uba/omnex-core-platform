import { useState, useEffect } from 'react';
import { Stack, Breadcrumbs, Anchor, Text, Paper } from '@mantine/core';
import { IconHome, IconChevronRight } from '@tabler/icons-react';
import { FileItem, ViewMode, SortField, SortOrder } from '../types/file';
import { FileGrid } from './FileGrid';
import { FileList } from './FileList';
import { FileToolbar } from './FileToolbar';
import { FilePreviewModal } from './FilePreviewModal';
import { useTranslation } from '@/lib/i18n/client';
import { showToast } from '@/modules/notifications/components/ToastNotification';

interface FileBrowserProps {
    files: FileItem[];
    currentFolderId: string | null;
    onNavigate: (folderId: string | null) => void;
    onUploadClick: () => void;
    onNewFolderClick: () => void;
    onRenameFile: (file: FileItem) => void;
    onDeleteFile: (file: FileItem) => void;
    onShare?: (file: FileItem) => void;
}

export function FileBrowser({
    files,
    currentFolderId,
    onNavigate,
    onUploadClick,
    onNewFolderClick,
    onRenameFile,
    onDeleteFile,
    onShare,
}: FileBrowserProps) {
    const { t } = useTranslation('modules/file-manager');
    const [mounted, setMounted] = useState(false);
    const [viewMode, setViewMode] = useState<ViewMode>('grid');
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedItems, setSelectedItems] = useState<string[]>([]);
    const [sortField, setSortField] = useState<SortField>('modifiedAt');
    const [sortOrder, setSortOrder] = useState<SortOrder>('desc');
    const [previewFile, setPreviewFile] = useState<FileItem | null>(null);
    const [previewOpened, setPreviewOpened] = useState(false);
    const [fileType, setFileType] = useState<string | null>(null);
    const [startDate, setStartDate] = useState<Date | null>(null);
    const [endDate, setEndDate] = useState<Date | null>(null);
    const [tags, setTags] = useState<string[]>([]);
    const [sortBy, setSortBy] = useState<string>('newest');

    useEffect(() => {
        setMounted(true);
    }, []);

    const handleSelect = (id: string) => {
        setSelectedItems((prev) =>
            prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
        );
    };

    const handleSelectAll = () => {
        if (selectedItems.length === files.length) {
            setSelectedItems([]);
        } else {
            setSelectedItems(files.map((f) => f.id));
        }
    };

    const handleOpen = (file: FileItem) => {
        if (file.type === 'folder') {
            onNavigate(file.id);
            setSelectedItems([]);
        } else {
            setPreviewFile(file);
            setPreviewOpened(true);
        }
    };

    const handleDownload = (file: FileItem) => {
        if (file.type === 'folder') {
            showToast({
                type: 'warning',
                title: t('actions.download'),
                message: t('actions.cannotDownloadFolder'),
            });
            return;
        }
        
        // Download file
        const downloadUrl = `/api/file-manager/download?path=${encodeURIComponent(file.path)}`;
        window.open(downloadUrl, '_blank');
        
        showToast({
            type: 'success',
            title: t('actions.download'),
            message: `${t('actions.downloading')} ${file.name}`,
        });
    };

    const handleDeleteSelected = () => {
        selectedItems.forEach((id) => {
            const file = files.find((f) => f.id === id);
            if (file) onDeleteFile(file);
        });
        setSelectedItems([]);
    };

    const handleDownloadSelected = () => {
        showToast({
            type: 'info',
            title: t('actions.download'),
            message: `${t('actions.downloading')} ${selectedItems.length} ${t('actions.files')}`,
        });
    };

    const handleSort = (field: SortField) => {
        if (sortField === field) {
            setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
        } else {
            setSortField(field);
            setSortOrder('asc');
        }
    };

    const handleSortByChange = (value: string) => {
        setSortBy(value);
        switch (value) {
            case 'newest':
                setSortField('modifiedAt');
                setSortOrder('desc');
                break;
            case 'oldest':
                setSortField('modifiedAt');
                setSortOrder('asc');
                break;
            case 'nameAsc':
                setSortField('name');
                setSortOrder('asc');
                break;
            case 'nameDesc':
                setSortField('name');
                setSortOrder('desc');
                break;
            case 'sizeAsc':
                setSortField('size');
                setSortOrder('asc');
                break;
            case 'sizeDesc':
                setSortField('size');
                setSortOrder('desc');
                break;
        }
    };

    // Filter files
    const filteredFiles = files.filter((file) => {
        // Search filter
        if (searchQuery && !file.name.toLowerCase().includes(searchQuery.toLowerCase())) {
            return false;
        }

        // File type filter
        if (fileType) {
            if (fileType === 'image' && !file.mimeType?.startsWith('image/')) return false;
            if (fileType === 'pdf' && file.extension !== 'pdf') return false;
            if (fileType === 'document' && !['doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx'].includes(file.extension || '')) return false;
            if (fileType === 'video' && !file.mimeType?.startsWith('video/')) return false;
            if (fileType === 'archive' && !['zip', 'rar', '7z', 'tar', 'gz'].includes(file.extension || '')) return false;
        }

        // Date range filter
        if (startDate || endDate) {
            const fileDate = file.modifiedAt;
            if (startDate && fileDate < startDate) return false;
            if (endDate) {
                const endDateWithTime = new Date(endDate);
                endDateWithTime.setHours(23, 59, 59, 999);
                if (fileDate > endDateWithTime) return false;
            }
        }

        return true;
    });

    const sortedFiles = [...filteredFiles].sort((a, b) => {
        let comparison = 0;

        // Folders first
        if (a.type === 'folder' && b.type !== 'folder') return -1;
        if (a.type !== 'folder' && b.type === 'folder') return 1;

        switch (sortField) {
            case 'name':
                comparison = a.name.localeCompare(b.name);
                break;
            case 'size':
                comparison = (a.size || 0) - (b.size || 0);
                break;
            case 'type':
                comparison = (a.extension || '').localeCompare(b.extension || '');
                break;
            case 'modifiedAt':
                comparison = a.modifiedAt.getTime() - b.modifiedAt.getTime();
                break;
        }

        return sortOrder === 'asc' ? comparison : -comparison;
    });

    // Build breadcrumbs
    const breadcrumbs = [
        { label: t('breadcrumbs.home'), folderId: null },
        // Add more breadcrumbs based on current path
    ];

    return (
        <Stack gap="md">
            <FileToolbar
                viewMode={viewMode}
                onViewModeChange={setViewMode}
                searchQuery={searchQuery}
                onSearchChange={setSearchQuery}
                onUploadClick={onUploadClick}
                onNewFolderClick={onNewFolderClick}
                selectedCount={selectedItems.length}
                onDeleteSelected={handleDeleteSelected}
                onDownloadSelected={handleDownloadSelected}
                sortBy={sortBy}
                onSortByChange={handleSortByChange}
                fileType={fileType}
                onFileTypeChange={setFileType}
                startDate={startDate}
                endDate={endDate}
                onStartDateChange={setStartDate}
                onEndDateChange={setEndDate}
                tags={tags}
                onTagsChange={setTags}
            />

            <Paper p="md" radius="md" withBorder>
                <Breadcrumbs separator={mounted ? <IconChevronRight size={14} /> : <span style={{ width: 14, height: 14, display: 'inline-block' }} />} mb="md">
                    {breadcrumbs.map((crumb, index) => (
                        <Anchor
                            key={index}
                            onClick={() => onNavigate(crumb.folderId)}
                            style={{ cursor: 'pointer' }}
                        >
                            {index === 0 && (mounted ? <IconHome size={16} style={{ marginRight: 4 }} /> : <span style={{ width: 16, height: 16, display: 'inline-block', marginRight: 4 }} />)}
                            {crumb.label}
                        </Anchor>
                    ))}
                </Breadcrumbs>

                {sortedFiles.length === 0 ? (
                    <Text c="dimmed" ta="center" py="xl">
                        {searchQuery ? t('empty.noResults') : t('empty.noFiles')}
                    </Text>
                ) : viewMode === 'grid' ? (
                    <FileGrid
                        files={sortedFiles}
                        selectedItems={selectedItems}
                        onSelect={handleSelect}
                        onOpen={handleOpen}
                        onRename={onRenameFile}
                        onDelete={onDeleteFile}
                        onDownload={handleDownload}
                        {...(onShare ? { onShare } : {})}
                    />
                ) : (
                    <FileList
                        files={sortedFiles}
                        selectedItems={selectedItems}
                        onSelect={handleSelect}
                        onSelectAll={handleSelectAll}
                        onOpen={handleOpen}
                        onRename={onRenameFile}
                        onDelete={onDeleteFile}
                        onDownload={handleDownload}
                        {...(onShare ? { onShare } : {})}
                        sortField={sortField}
                        sortOrder={sortOrder}
                        onSort={handleSort}
                    />
                )}
            </Paper>

            <FilePreviewModal
                opened={previewOpened}
                onClose={() => {
                    setPreviewOpened(false);
                    setPreviewFile(null);
                }}
                file={previewFile}
                onDownload={handleDownload}
            />
        </Stack>
    );
}
