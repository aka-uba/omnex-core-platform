import { useState, useEffect, useRef } from 'react';
import { SimpleGrid, Card, Stack, Text, Checkbox, Group, ActionIcon, Menu } from '@mantine/core';
import { IconDownload, IconEdit, IconTrash, IconShare, IconFileText } from '@tabler/icons-react';
import { FileItem } from '../types/file';
import { FileThumbnail } from './shared/FileThumbnail';
import { useTranslation } from '@/lib/i18n/client';
import classes from '../FileManagerPage.module.css';

interface FileGridProps {
    files: FileItem[];
    selectedItems: string[];
    onSelect: (id: string) => void;
    onOpen: (file: FileItem) => void;
    onRename: (file: FileItem) => void;
    onDelete: (file: FileItem) => void;
    onDownload: (file: FileItem) => void;
    onShare?: (file: FileItem) => void;
}

export function FileGrid({
    files,
    selectedItems,
    onSelect,
    onOpen,
    onRename,
    onDelete,
    onDownload,
    onShare,
}: FileGridProps) {
    const { t } = useTranslation('modules/file-manager');
    const [contextMenu, setContextMenu] = useState<{ x: number; y: number; file: FileItem } | null>(null);
    const clickTimersRef = useRef<Map<string, NodeJS.Timeout>>(new Map());

    const formatFileSize = (bytes?: number) => {
        if (!bytes) return '-';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
    };

    const handleContextMenu = (e: React.MouseEvent, file: FileItem) => {
        e.preventDefault();
        e.stopPropagation();
        setContextMenu({ x: e.clientX, y: e.clientY, file });
    };

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
        setContextMenu(null);
    };

    // Close context menu on outside click
    useEffect(() => {
        const handleClickOutside = () => {
            if (contextMenu) {
                setContextMenu(null);
            }
        };

        if (contextMenu) {
            document.addEventListener('click', handleClickOutside);
            return () => {
                document.removeEventListener('click', handleClickOutside);
            };
        }
        return undefined;
    }, [contextMenu]);

    return (
        <>
            {files.length === 0 ? (
                <Stack align="center" justify="center" h={300}>
                    <Text size="sm" c="dimmed">{t('empty.noFiles')}</Text>
                </Stack>
            ) : (
                <SimpleGrid cols={{ base: 2, sm: 3, md: 4, lg: 5, xl: 6 }} spacing="md">
                    {files.map((file) => (
                    <Card
                        key={file.id}
                        padding="md"
                        radius="md"
                        withBorder
                        {...(classes.fileCard ? { className: classes.fileCard } : {})}
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
                        onContextMenu={(e) => handleContextMenu(e, file)}
                    >
                        <Stack gap="xs" align="center">
                            <div {...(classes.fileCardThumbnail ? { className: classes.fileCardThumbnail } : {})} onClick={(e) => e.stopPropagation()}>
                                <Checkbox
                                    {...(classes.fileCardCheckbox ? { className: classes.fileCardCheckbox } : {})}
                                    checked={selectedItems.includes(file.id)}
                                    onChange={() => onSelect(file.id)}
                                    onClick={(e) => e.stopPropagation()}
                                />
                                <FileThumbnail
                                    fileName={file.name}
                                    {...(file.mimeType ? { mimeType: file.mimeType } : {})}
                                    {...(file.thumbnailUrl ? { thumbnailUrl: file.thumbnailUrl } : {})}
                                    type={file.type}
                                    size={64}
                                />
                            </div>

                            <Text 
                                size="sm" 
                                fw={500} 
                                ta="center" 
                                lineClamp={2} 
                                style={{ 
                                    wordBreak: 'break-word',
                                    cursor: 'default',
                                }}
                            >
                                {file.name}
                            </Text>

                            {file.type === 'file' && (
                                <Text size="xs" c="dimmed">
                                    {formatFileSize(file.size)}
                                </Text>
                            )}

                            <Group gap="xs" justify="center" mt="xs" onClick={(e) => e.stopPropagation()}>
                                {file.type === 'file' && (
                                    <ActionIcon
                                        variant="subtle"
                                        color="blue"
                                        size="sm"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            onOpen(file);
                                        }}
                                        title={t('actions.preview')}
                                    >
                                        <IconFileText size={16} />
                                    </ActionIcon>
                                )}
                                <ActionIcon
                                    variant="subtle"
                                    color="gray"
                                    size="sm"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        onRename(file);
                                    }}
                                    title={t('actions.rename')}
                                >
                                    <IconEdit size={16} />
                                </ActionIcon>
                                {file.type === 'file' && (
                                    <ActionIcon
                                        variant="subtle"
                                        color="green"
                                        size="sm"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            onDownload(file);
                                        }}
                                        title={t('actions.download')}
                                    >
                                        <IconDownload size={16} />
                                    </ActionIcon>
                                )}
                                {onShare && (
                                    <ActionIcon
                                        variant="subtle"
                                        color="violet"
                                        size="sm"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            handleShare(file);
                                        }}
                                        title={t('actions.share')}
                                    >
                                        <IconShare size={16} />
                                    </ActionIcon>
                                )}
                                <ActionIcon
                                    variant="subtle"
                                    color="red"
                                    size="sm"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        onDelete(file);
                                    }}
                                    title={t('actions.delete')}
                                >
                                    <IconTrash size={16} />
                                </ActionIcon>
                            </Group>
                        </Stack>
                    </Card>
                    ))}
                </SimpleGrid>
            )}

            {/* Context Menu */}
            {contextMenu && (
                <Menu
                    opened={true}
                    onClose={() => setContextMenu(null)}
                    position="bottom-start"
                    withinPortal
                    styles={{
                        dropdown: {
                            position: 'fixed',
                            left: `${contextMenu.x}px`,
                            top: `${contextMenu.y}px`,
                            zIndex: 1000,
                        },
                    }}
                >
                    <Menu.Dropdown onClick={(e) => e.stopPropagation()}>
                        {contextMenu.file.type === 'file' && (
                            <Menu.Item leftSection={<IconFileText size={16} />} onClick={() => {
                                onOpen(contextMenu.file);
                                setContextMenu(null);
                            }}>
                                {t('actions.preview')}
                            </Menu.Item>
                        )}
                        <Menu.Item leftSection={<IconEdit size={16} />} onClick={() => {
                            onRename(contextMenu.file);
                            setContextMenu(null);
                        }}>
                            {t('actions.rename')}
                        </Menu.Item>
                        {contextMenu.file.type === 'file' && (
                            <Menu.Item leftSection={<IconDownload size={16} />} onClick={() => {
                                onDownload(contextMenu.file);
                                setContextMenu(null);
                            }}>
                                {t('actions.download')}
                            </Menu.Item>
                        )}
                        {onShare && (
                            <Menu.Item leftSection={<IconShare size={16} />} onClick={() => handleShare(contextMenu.file)}>
                                {t('actions.share')}
                            </Menu.Item>
                        )}
                        <Menu.Item leftSection={<IconTrash size={16} />} color="red" onClick={() => {
                            onDelete(contextMenu.file);
                            setContextMenu(null);
                        }}>
                            {t('actions.delete')}
                        </Menu.Item>
                    </Menu.Dropdown>
                </Menu>
            )}
        </>
    );
}
