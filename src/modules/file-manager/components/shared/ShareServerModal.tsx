import { useState, useEffect } from 'react';
import { Modal, Button, Group, Stack, Select, TextInput, Text, Paper, ActionIcon, Badge, CopyButton, Tooltip, NumberInput } from '@mantine/core';
import { useForm } from '@mantine/form';
import { useTranslation } from '@/lib/i18n/client';
import { useFolders } from '../../hooks/useFiles';
import { IconFolder, IconWifi, IconWifiOff, IconCopy, IconCheck } from '@tabler/icons-react';
import { showToast } from '@/modules/notifications/components/ToastNotification';

interface ShareServerModalProps {
    opened: boolean;
    onClose: () => void;
    currentFolderId?: string | null;
    currentPath?: string | null;
    onStatusChange?: (status: { isRunning: boolean; url?: string }) => void;
    expiresInHours?: number;
}

interface ServerStatus {
    isRunning: boolean;
    url?: string;
    port?: number;
    folderId?: string | null;
}

export function ShareServerModal({ opened, onClose, currentFolderId, currentPath, onStatusChange, expiresInHours = 1 }: ShareServerModalProps) {
    const { t } = useTranslation('modules/file-manager');
    const { data: folders = [], isLoading: foldersLoading } = useFolders();
    const [serverStatus, setServerStatus] = useState<ServerStatus>({ isRunning: false });
    const [loading, setLoading] = useState(false);

    const form = useForm({
        initialValues: {
            folderId: currentFolderId || '',
            path: currentPath || '',
            expiresInHours: expiresInHours || 1,
        },
    });

    useEffect(() => {
        if (opened) {
            form.setFieldValue('folderId', currentFolderId || '');
            form.setFieldValue('path', currentPath || '');
            // Check server status on open
            checkServerStatus();
            
            // If server is running, check status periodically
            const interval = setInterval(() => {
                checkServerStatus();
            }, 2000);
            
            return () => clearInterval(interval);
        }
        return undefined;
    }, [opened, currentFolderId, currentPath]);

    const checkServerStatus = async () => {
        try {
            const response = await fetch('/api/file-manager/share/status');
            if (response.ok) {
                const data = await response.json();
                const newStatus = {
                    isRunning: data.isRunning || false,
                    url: data.url || undefined,
                    port: data.port || undefined,
                    folderId: data.folderId || null,
                };
                setServerStatus(newStatus);
                if (onStatusChange) {
                    onStatusChange({ 
                        isRunning: newStatus.isRunning, 
                        url: newStatus.url 
                    });
                }
            } else {
                // Server not running
                setServerStatus({ isRunning: false });
                if (onStatusChange) {
                    onStatusChange({ isRunning: false });
                }
            }
        } catch (error) {
            // Server not running
            setServerStatus({ isRunning: false });
            if (onStatusChange) {
                onStatusChange({ isRunning: false });
            }
        }
    };

    const handleStartServer = async () => {
        setLoading(true);
        try {
            const folderId = form.values.folderId === '' ? null : form.values.folderId;
            const path = form.values.path || null;
            const expiresInHours = form.values.expiresInHours || 1;
            
            const response = await fetch('/api/file-manager/share/start', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ 
                    folderId,
                    path,
                    expiresInHours 
                }),
            });

            if (response.ok) {
                const data = await response.json();
                const newStatus = {
                    isRunning: true,
                    url: data.url || undefined,
                    port: data.port || undefined,
                    folderId: folderId || path || null,
                };
                setServerStatus(newStatus);
                if (onStatusChange) {
                    onStatusChange({ isRunning: true, url: data.url || undefined });
                }
                
                // Set auto-stop timer if expiresInHours is set
                if (expiresInHours > 0) {
                    setTimeout(() => {
                        handleStopServer();
                    }, expiresInHours * 60 * 60 * 1000);
                }
                showToast({
                    type: 'success',
                    title: t('shareServer.serverStarted'),
                    message: t('shareServer.serverStartedMessage'),
                });
            } else {
                // Parse error response
                let errorMessage = t('shareServer.startFailed');
                try {
                    const errorData = await response.json();
                    if (errorData.error) {
                        errorMessage = errorData.error;
                    } else if (errorData.details) {
                        errorMessage = errorData.details;
                    }
                } catch (e) {
                    // If response is not JSON, use default message
                }
                
                // If server is already running, refresh status
                if (response.status === 400) {
                    await checkServerStatus();
                }
                
                showToast({
                    type: 'error',
                    title: t('shareServer.error'),
                    message: errorMessage,
                });
            }
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : t('shareServer.startFailed');
            showToast({
                type: 'error',
                title: t('shareServer.error'),
                message: errorMessage,
            });
        } finally {
            setLoading(false);
        }
    };

    const handleStopServer = async () => {
        setLoading(true);
        try {
            const response = await fetch('/api/file-manager/share/stop', {
                method: 'POST',
            });

            if (response.ok) {
                setServerStatus({ isRunning: false });
                if (onStatusChange) {
                    onStatusChange({ isRunning: false });
                }
                showToast({
                    type: 'info',
                    title: t('shareServer.serverStopped'),
                    message: t('shareServer.serverStoppedMessage'),
                });
            } else {
                throw new Error('Failed to stop server');
            }
        } catch (error) {
            showToast({
                type: 'error',
                title: t('shareServer.error'),
                message: t('shareServer.stopFailed'),
            });
        } finally {
            setLoading(false);
        }
    };

    const folderOptions = [
        { value: '', label: t('shareServer.rootFolder') },
        ...folders.map((folder) => ({
            value: folder.id,
            label: folder.path,
        })),
    ];

    const getServerUrl = () => {
        if (!serverStatus.url) return '';
        return serverStatus.url;
    };

    // const handleCopyUrl = async () => { // removed - unused
    //     const url = getServerUrl();
    //     if (url) {
    //         try {
    //             await navigator.clipboard.writeText(url);
    //             showToast({
    //                 type: 'success',
    //                 title: t('shareServer.copied'),
    //                 message: t('shareServer.urlCopied'),
    //             });
    //         } catch (error) {
    //             showToast({
    //                 type: 'error',
    //                 title: t('shareServer.error'),
    //                 message: t('shareServer.copyFailed'),
    //             });
    //         }
    //     }
    // };

    return (
        <Modal 
            opened={opened} 
            onClose={onClose} 
            title={
                <Group gap="xs">
                    <IconWifi size={20} />
                    <Text fw={500}>{t('shareServer.title')}</Text>
                </Group>
            } 
            size="md"
            centered
        >
            <Stack gap="md">
                {!serverStatus.isRunning ? (
                    <>
                        {currentPath && (
                            <TextInput
                                label={t('shareServer.selectFolder')}
                                value={currentPath}
                                readOnly
                                leftSection={<IconFolder size={16} />}
                            />
                        )}
                        {!currentPath && (
                            <Select
                                label={t('shareServer.selectFolder')}
                                placeholder={t('shareServer.selectFolderPlaceholder')}
                                data={folderOptions}
                                leftSection={<IconFolder size={16} />}
                                {...form.getInputProps('folderId')}
                                disabled={foldersLoading}
                                searchable
                                clearable
                            />
                        )}
                        <NumberInput
                            label={t('shareServer.expiresInHours')}
                            placeholder="1"
                            min={0.5}
                            max={24}
                            step={0.5}
                            {...form.getInputProps('expiresInHours')}
                            description={t('shareServer.expiresInHoursDescription')}
                        />
                        <Button
                            leftSection={<IconWifi size={18} />}
                            onClick={handleStartServer}
                            loading={loading}
                            fullWidth
                            size="md"
                            color="green"
                            variant="filled"
                        >
                            {t('shareServer.start')}
                        </Button>
                    </>
                ) : (
                    <>
                        <Paper p="md" withBorder style={{ backgroundColor: 'var(--mantine-color-green-0)' }}>
                            <Stack gap="sm">
                                <Group justify="space-between" align="center">
                                    <Group gap="xs">
                                        <Badge color="green" leftSection={<IconWifi size={14} />}>
                                            {t('shareServer.running')}
                                        </Badge>
                                    </Group>
                                </Group>
                                <Stack gap="xs">
                                    <Text size="sm" fw={500}>{t('shareServer.shareUrl')}</Text>
                                    <Group gap="xs">
                                        <TextInput
                                            value={getServerUrl()}
                                            readOnly
                                            style={{ flex: 1 }}
                                            styles={{
                                                input: {
                                                    fontFamily: 'monospace',
                                                    fontSize: '0.875rem',
                                                },
                                            }}
                                        />
                                        <CopyButton value={getServerUrl()}>
                                            {({ copied, copy }) => (
                                                <Tooltip label={copied ? t('shareServer.copied') : t('shareServer.copy')} withArrow position="right">
                                                    <ActionIcon
                                                        color={copied ? 'teal' : 'gray'}
                                                        variant="light"
                                                        onClick={copy}
                                                        size="lg"
                                                    >
                                                        {copied ? <IconCheck size={18} /> : <IconCopy size={18} />}
                                                    </ActionIcon>
                                                </Tooltip>
                                            )}
                                        </CopyButton>
                                    </Group>
                                    <Text size="xs" c="dimmed">
                                        {t('shareServer.shareUrlDescription')}
                                    </Text>
                                </Stack>
                            </Stack>
                        </Paper>
                        <Button
                            leftSection={<IconWifiOff size={18} />}
                            onClick={handleStopServer}
                            loading={loading}
                            fullWidth
                            size="md"
                            color="red"
                            variant="filled"
                        >
                            {t('shareServer.stop')}
                        </Button>
                    </>
                )}
            </Stack>
        </Modal>
    );
}

