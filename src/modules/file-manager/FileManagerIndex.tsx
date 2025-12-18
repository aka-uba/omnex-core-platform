'use client';

import { useState, useEffect } from 'react';
import { Container } from '@mantine/core';
import { IconUpload, IconFolderPlus, IconWifi, IconFolder } from '@tabler/icons-react';
import { CentralPageHeader } from '@/components/headers/CentralPageHeader';
import { FileBrowser } from './components/FileBrowser';
import { UploadModal } from './components/UploadModal';
import { NewFolderModal } from './components/shared/NewFolderModal';
import { RenameModal } from './components/shared/RenameModal';
import { ShareServerModal } from './components/shared/ShareServerModal';
import { useCreateFolder, useRenameFile, useDeleteFile } from './hooks/useFiles';
import { FileItem } from './types/file';
import { showToast } from '@/modules/notifications/components/ToastNotification';
import { modals } from '@mantine/modals';
import { useTranslation } from '@/lib/i18n/client';

export function FileManagerIndex({ locale }: { locale: string }) {
    const { t } = useTranslation('modules/file-manager');
    const { t: tGlobal } = useTranslation('global');
    const [mounted, setMounted] = useState(false);
    const [currentFolderId, setCurrentFolderId] = useState<string | null>(null);
    const [uploadModalOpened, setUploadModalOpened] = useState(false);
    const [newFolderModalOpened, setNewFolderModalOpened] = useState(false);
    const [shareServerModalOpened, setShareServerModalOpened] = useState(false);
    const [renameModalOpened, setRenameModalOpened] = useState(false);
    const [fileToRename, setFileToRename] = useState<FileItem | null>(null);
    const [serverStatus, setServerStatus] = useState<{ isRunning: boolean }>({ isRunning: false });

    // Prevent hydration mismatch for icons
    useEffect(() => {
        setMounted(true);
    }, []);

    // Check server status periodically
    useEffect(() => {
        const checkServerStatus = async () => {
            try {
                const response = await fetch('/api/file-manager/share/status');
                if (response.ok) {
                    const data = await response.json();
                    setServerStatus(data);
                }
            } catch (error) {
                setServerStatus({ isRunning: false });
            }
        };

        checkServerStatus();
        const interval = setInterval(checkServerStatus, 2000); // Check every 2 seconds

        return () => clearInterval(interval);
    }, []);

    const createFolder = useCreateFolder();
    const renameFile = useRenameFile();
    const deleteFile = useDeleteFile();

    const handleCreateFolder = async (name: string, parentId: string | null) => {
        try {
            await createFolder.mutateAsync({ name, parentId: parentId || currentFolderId });
            showToast({
                type: 'success',
                title: t('newFolder.success'),
                message: t('newFolder.created'),
            });
            setNewFolderModalOpened(false);
        } catch (error) {
            showToast({
                type: 'error',
                title: t('error.title'),
                message: error instanceof Error ? error.message : t('error.createFolder'),
            });
        }
    };

    const handleRenameFile = (file: FileItem) => {
        setFileToRename(file);
        setRenameModalOpened(true);
    };

    const handleRenameSubmit = async (newName: string) => {
        if (!fileToRename) return;

        try {
            await renameFile.mutateAsync({ id: fileToRename.id, newName });
            showToast({
                type: 'success',
                title: t('rename.success'),
                message: t('rename.renamed'),
            });
            setRenameModalOpened(false);
            setFileToRename(null);
        } catch (error) {
            showToast({
                type: 'error',
                title: t('error.title'),
                message: error instanceof Error ? error.message : t('error.rename'),
            });
        }
    };

    const handleDeleteFile = (file: FileItem) => {
        const confirmText = t('delete.confirm').replace('{name}', file.name);
        modals.openConfirmModal({
            title: t('delete.title'),
            children: confirmText,
            labels: { confirm: t('delete.button'), cancel: tGlobal('form.cancel') },
            confirmProps: { color: 'red' },
            centered: true,
            onConfirm: async () => {
                try {
                    await deleteFile.mutateAsync(file.id);
                    showToast({
                        type: 'success',
                        title: t('delete.success'),
                        message: t('delete.deleted'),
                    });
                } catch (error) {
                    showToast({
                        type: 'error',
                        title: t('error.title'),
                        message: error instanceof Error ? error.message : t('error.delete'),
                    });
                }
            },
        });
    };

    const handleShare = (file: FileItem) => {
        if (navigator.share) {
            navigator.share({
                title: file.name,
                text: `${t('share.sharing')} ${file.name}`,
            }).catch(() => {
                // User cancelled or error occurred
            });
        } else {
            // Fallback: copy to clipboard or show share modal
            const shareUrl = `${window.location.origin}/files/${file.id}`;
            navigator.clipboard.writeText(shareUrl).then(() => {
                showToast({
                    type: 'success',
                    title: t('share.success'),
                    message: t('share.copied'),
                });
            }).catch(() => {
                showToast({
                    type: 'error',
                    title: t('share.error'),
                    message: t('share.failed'),
                });
            });
        }
    };

    return (
        <Container size="xl" py="xl">
            <CentralPageHeader
                title="title"
                description="description"
                namespace="modules/file-manager"
                icon={mounted ? <IconFolder size={32} /> : null}
                actions={[
                    {
                        label: t('toolbar.newFolder'),
                        icon: mounted ? <IconFolderPlus size={18} /> : <span style={{ width: 18, height: 18, display: 'inline-block' }} />,
                        onClick: () => setNewFolderModalOpened(true),
                        variant: 'default',
                    },
                    {
                        label: t('toolbar.upload'),
                        icon: mounted ? <IconUpload size={18} /> : <span style={{ width: 18, height: 18, display: 'inline-block' }} />,
                        onClick: () => setUploadModalOpened(true),
                        variant: 'filled',
                    },
                    {
                        label: t('toolbar.webServer'),
                        icon: mounted ? <IconWifi size={18} /> : <span style={{ width: 18, height: 18, display: 'inline-block' }} />,
                        onClick: () => setShareServerModalOpened(true),
                        variant: 'filled',
                        color: serverStatus.isRunning ? 'green' : 'red',
                    },
                ]}
            />

            <FileBrowser
                files={[]}
                currentFolderId={currentFolderId}
                onNavigate={setCurrentFolderId}
                onUploadClick={() => setUploadModalOpened(true)}
                onNewFolderClick={() => setNewFolderModalOpened(true)}
                onRenameFile={handleRenameFile}
                onDeleteFile={handleDeleteFile}
                onShare={handleShare}
            />

            <UploadModal
                opened={uploadModalOpened}
                onClose={() => setUploadModalOpened(false)}
                currentFolderId={currentFolderId}
            />

            <NewFolderModal
                opened={newFolderModalOpened}
                onClose={() => setNewFolderModalOpened(false)}
                onSubmit={handleCreateFolder}
                loading={createFolder.isPending}
                currentFolderId={currentFolderId}
            />

            {fileToRename && (
                <RenameModal
                    opened={renameModalOpened}
                    onClose={() => {
                        setRenameModalOpened(false);
                        setFileToRename(null);
                    }}
                    onSubmit={handleRenameSubmit}
                    currentName={fileToRename.name}
                    loading={renameFile.isPending}
                />
            )}

            <ShareServerModal
                opened={shareServerModalOpened}
                onClose={() => setShareServerModalOpened(false)}
                currentFolderId={currentFolderId}
                onStatusChange={(status) => setServerStatus(status)}
            />
        </Container>
    );
}
