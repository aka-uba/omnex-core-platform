import { useRef } from 'react';
import { Table, Checkbox, Group, Text, ActionIcon, Menu, Badge, Tooltip } from '@mantine/core';
import { IconDots, IconDownload, IconEdit, IconTrash, IconShare, IconFileText, IconEye, IconPencil } from '@tabler/icons-react';
import { FileItem, SortField, SortOrder } from '../types/file';
import { FileIcon } from './shared/FileIcon';
import { useTranslation } from '@/lib/i18n/client';
import classes from '../FileManagerPage.module.css';

interface FileListProps {
    files: FileItem[];
    selectedItems: string[];
    onSelect: (id: string) => void;
    onSelectAll: () => void;
    onOpen: (file: FileItem) => void;
    onRename: (file: FileItem) => void;
    onDelete: (file: FileItem) => void;
    onDownload: (file: FileItem) => void;
    onShare?: (file: FileItem) => void;
    sortField: SortField;
    sortOrder: SortOrder;
    onSort: (field: SortField) => void;
    onContextMenu?: (file: FileItem, event: React.MouseEvent) => void;
}

export function FileList({
    files,
    selectedItems,
    onSelect,
    onSelectAll,
    onOpen,
    onRename,
    onDelete,
    onDownload,
    onShare,
    sortField,
    sortOrder,
    onSort,
    onContextMenu,
}: FileListProps) {
    const { t } = useTranslation('modules/file-manager');
    const clickTimersRef = useRef<Map<string, NodeJS.Timeout>>(new Map());

    const handleShare = (file: FileItem) => {
        if (onShare) {
            onShare(file);
        } else {
            // Default share behavior
            if (navigator.share) {
                navigator.share({
                    title: file.name,
                    text: `Sharing ${file.name}`,
                });
            }
        }
    };

    const formatFileSize = (bytes?: number) => {
        if (!bytes) return '-';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
    };

    const formatDate = (date: Date | string | undefined) => {
        if (!date) return '-';
        
        try {
            const dateObj = date instanceof Date ? date : new Date(date);
            
            // Check if date is valid
            if (isNaN(dateObj.getTime())) {
                return '-';
            }
            
            return new Intl.DateTimeFormat('tr-TR', {
                year: 'numeric',
                month: 'short',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
            }).format(dateObj);
        } catch (error) {
            console.error('Error formatting date:', error, date);
            return '-';
        }
    };

    return (
        <Table highlightOnHover {...(classes.fileTable ? { className: classes.fileTable } : {})}>
            <Table.Thead>
                <Table.Tr>
                    <Table.Th style={{ width: 40 }}>
                        <Checkbox
                            checked={selectedItems.length === files.length && files.length > 0}
                            indeterminate={selectedItems.length > 0 && selectedItems.length < files.length}
                            onChange={onSelectAll}
                        />
                    </Table.Th>
                    <Table.Th onClick={() => onSort('name')} style={{ cursor: 'pointer' }}>
                        {t('table.name')} {sortField === 'name' && (sortOrder === 'asc' ? '↑' : '↓')}
                    </Table.Th>
                    <Table.Th onClick={() => onSort('size')} style={{ cursor: 'pointer' }}>
                        {t('table.size')} {sortField === 'size' && (sortOrder === 'asc' ? '↑' : '↓')}
                    </Table.Th>
                    <Table.Th onClick={() => onSort('type')} style={{ cursor: 'pointer' }}>
                        {t('table.type')} {sortField === 'type' && (sortOrder === 'asc' ? '↑' : '↓')}
                    </Table.Th>
                    <Table.Th onClick={() => onSort('modifiedAt')} style={{ cursor: 'pointer' }}>
                        {t('table.modified')} {sortField === 'modifiedAt' && (sortOrder === 'asc' ? '↑' : '↓')}
                    </Table.Th>
                    <Table.Th style={{ width: 120 }}>{t('table.permissions') || 'İzinler'}</Table.Th>
                    <Table.Th style={{ width: 200 }}>{t('table.actions')}</Table.Th>
                </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
                {files.length === 0 ? (
                    <Table.Tr>
                        <Table.Td colSpan={7} style={{ textAlign: 'center', padding: '2rem' }}>
                            <Text size="sm" c="dimmed">{t('empty.noFiles')}</Text>
                        </Table.Td>
                    </Table.Tr>
                ) : (
                    files.map((file) => (
                    <Table.Tr
                        key={file.id}
                        {...(classes.fileRow ? { className: classes.fileRow } : {})}
                        onClick={(e) => {
                            // Single click: toggle checkbox selection
                            const timer = clickTimersRef.current.get(file.id);
                            if (timer) {
                                clearTimeout(timer);
                                clickTimersRef.current.delete(file.id);
                            } else {
                                const newTimer = setTimeout(() => {
                                    onSelect(file.id);
                                    clickTimersRef.current.delete(file.id);
                                }, 200);
                                clickTimersRef.current.set(file.id, newTimer);
                            }
                        }}
                        onDoubleClick={(e) => {
                            // Clear timer on double click
                            const timer = clickTimersRef.current.get(file.id);
                            if (timer) {
                                clearTimeout(timer);
                                clickTimersRef.current.delete(file.id);
                            }
                            e.preventDefault();
                            if (file.type === 'file') {
                                onOpen(file);
                            } else {
                                // For folders, navigate
                                onOpen(file);
                            }
                        }}
                        onContextMenu={(e) => {
                            if (onContextMenu) {
                                e.preventDefault();
                                onContextMenu(file, e);
                            }
                        }}
                    >
                        <Table.Td onClick={(e) => e.stopPropagation()}>
                            <Checkbox
                                checked={selectedItems.includes(file.id)}
                                onChange={() => onSelect(file.id)}
                                onClick={(e) => e.stopPropagation()}
                            />
                        </Table.Td>
                        <Table.Td>
                            <Group gap="xs">
                                <FileIcon fileName={file.name} {...(file.mimeType ? { mimeType: file.mimeType } : {})} type={file.type} size={20} />
                                <Text 
                                    size="sm"
                                    style={{ cursor: 'default' }}
                                >
                                    {file.name}
                                </Text>
                            </Group>
                        </Table.Td>
                        <Table.Td>
                            <Text size="sm">{formatFileSize(file.size)}</Text>
                        </Table.Td>
                        <Table.Td>
                            <Text size="sm">{file.type === 'folder' ? t('type.folder') : file.extension?.toUpperCase() || '-'}</Text>
                        </Table.Td>
                        <Table.Td>
                            <Text size="sm">{formatDate(file.modifiedAt)}</Text>
                        </Table.Td>
                        <Table.Td>
                            <Group gap={4}>
                                <Tooltip label={file.permissions?.canRead !== false ? t('permissions.canRead') || 'Okuma izni var' : t('permissions.noRead') || 'Okuma izni yok'}>
                                    <Badge
                                        size="xs"
                                        variant="light"
                                        color={file.permissions?.canRead !== false ? 'green' : 'gray'}
                                        leftSection={<IconEye size={10} />}
                                    >
                                        R
                                    </Badge>
                                </Tooltip>
                                <Tooltip label={file.permissions?.canWrite !== false ? t('permissions.canWrite') || 'Yazma izni var' : t('permissions.noWrite') || 'Yazma izni yok'}>
                                    <Badge
                                        size="xs"
                                        variant="light"
                                        color={file.permissions?.canWrite !== false ? 'blue' : 'gray'}
                                        leftSection={<IconPencil size={10} />}
                                    >
                                        W
                                    </Badge>
                                </Tooltip>
                            </Group>
                        </Table.Td>
                        <Table.Td>
                            <Group gap="xs" onClick={(e) => e.stopPropagation()}>
                                <Menu position="bottom-end" withinPortal>
                                    <Menu.Target>
                                        <ActionIcon variant="subtle" size="sm">
                                            <IconDots size={16} />
                                        </ActionIcon>
                                    </Menu.Target>
                                    <Menu.Dropdown>
                                        {file.type === 'file' && (
                                            <Menu.Item leftSection={<IconFileText size={16} />} onClick={() => onOpen(file)}>
                                                {t('actions.preview')}
                                            </Menu.Item>
                                        )}
                                        <Menu.Item leftSection={<IconEdit size={16} />} onClick={() => onRename(file)}>
                                            {t('actions.rename')}
                                        </Menu.Item>
                                        {file.type === 'file' && (
                                            <Menu.Item leftSection={<IconDownload size={16} />} onClick={() => onDownload(file)}>
                                                {t('actions.download')}
                                            </Menu.Item>
                                        )}
                                        {onShare && (
                                            <Menu.Item leftSection={<IconShare size={16} />} onClick={() => handleShare(file)}>
                                                {t('actions.share')}
                                            </Menu.Item>
                                        )}
                                        <Menu.Item leftSection={<IconTrash size={16} />} color="red" onClick={() => onDelete(file)}>
                                            {t('actions.delete')}
                                        </Menu.Item>
                                    </Menu.Dropdown>
                                </Menu>
                            </Group>
                        </Table.Td>
                    </Table.Tr>
                    ))
                )}
            </Table.Tbody>
        </Table>
    );
}
