import { Modal, Button, Group, Stack, Text, ScrollArea } from '@mantine/core';
import { useState, useEffect } from 'react';
import { DirectoryTree } from '../DirectoryTree'; // Correct relative path
import { showToast } from '@/modules/notifications/components/ToastNotification';
import { useTranslation } from '@/lib/i18n/client';

interface DirectoryNode {
    id: string;
    name: string;
    path: string;
    type: 'tenant' | 'module' | 'folder';
    children?: DirectoryNode[];
}

interface MoveCopyModalProps {
    opened: boolean;
    onClose: () => void;
    onConfirm: (destinationPath: string) => Promise<void>;
    loading: boolean;
    action: 'move' | 'copy';
    itemName: string;
    currentPath: string; // To avoid moving into itself or same folder
}

export function MoveCopyModal({ opened, onClose, onConfirm, loading, action, itemName, currentPath }: MoveCopyModalProps) {
    const { t } = useTranslation('modules/file-manager');
    const [tree, setTree] = useState<DirectoryNode[]>([]);
    const [selectedDest, setSelectedDest] = useState<string | null>(null);
    const [loadingTree, setLoadingTree] = useState(false);

    useEffect(() => {
        if (opened) {
            loadTree();
            setSelectedDest(null);
        }
    }, [opened]);

    const loadTree = async () => {
        setLoadingTree(true);
        try {
            // We want to show the whole tree to select destination
            // Ideally we should filter out the current folder if it's a move action on a folder
            // But for now let's just load the full tree
            const response = await fetch('/api/file-manager/tree?tenant=all');
            const data = await response.json();
            if (data.success) {
                setTree(data.data);
            }
        } catch (error) {
            showToast({
                type: 'error',
                title: t('messages.error'),
                message: t('messages.failedToLoadTree'),
            });
        } finally {
            setLoadingTree(false);
        }
    };

    const handleConfirm = () => {
        if (selectedDest) {
            onConfirm(selectedDest);
        }
    };

    return (
        <Modal opened={opened} onClose={onClose} title={action === 'move' ? t('move.modalTitle') : t('copy.modalTitle')} size="lg" centered>
            <Stack>
                <Text>{action === 'move' ? t('move.selectDestination') : t('copy.selectDestination')} <b>{itemName}</b>:</Text>

                <ScrollArea h={300} type="always" offsetScrollbars>
                    {loadingTree ? (
                        <Text size="sm" c="dimmed">{action === 'move' ? t('move.loadingFolders') : t('copy.loadingFolders')}</Text>
                    ) : (
                        <DirectoryTree
                            nodes={tree}
                            onSelect={(path: string) => setSelectedDest(path)}
                            selectedPath={selectedDest || ''}
                        />
                    )}
                </ScrollArea>

                <Group justify="flex-end">
                    <Button variant="default" onClick={onClose}>{t('form.cancel')}</Button>
                    <Button
                        onClick={handleConfirm}
                        loading={loading}
                        disabled={!selectedDest}
                    >
                        {action === 'move' ? t('move.button') : t('copy.button')}
                    </Button>
                </Group>
            </Stack>
        </Modal>
    );
}
