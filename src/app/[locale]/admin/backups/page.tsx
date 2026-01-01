'use client';

import React, { useState, useEffect } from 'react';
import {
    Container,
    Paper,
    Table,
    Group,
    Button,
    Text,
    Box,
    Badge,
    ActionIcon,
    Card,
    Grid,
    Modal,
    Alert,
    Select,
    Skeleton,
    Stack,
} from '@mantine/core';
import {
    IconDatabase,
    IconDownload,
    IconTrash,
    IconRefresh,
    IconHistory,
    IconAlertTriangle,
    IconPlus,
    IconAlertCircle
} from '@tabler/icons-react';
import { useDisclosure } from '@mantine/hooks';
import { showToast } from '@/modules/notifications/components/ToastNotification';
import { CentralPageHeader } from '@/components/headers/CentralPageHeader';
import { useParams } from 'next/navigation';
import { useTranslation } from '@/lib/i18n/client';
import { authenticatedFetchJSON, authenticatedPost, authenticatedDelete, authenticatedFetch } from '@/lib/api/authenticatedFetch';

interface Backup {
    id: string;
    fileName: string;
    fileSize: string;
    status: string;
    type: string;
    createdAt: string;
    tenant: {
        name: string;
        slug: string;
    };
}

interface TenantInfo {
    id: string;
    name: string;
    slug: string;
    dbName: string;
    status: string;
}

export default function BackupManagementPage() {
    const params = useParams();
    const locale = (params?.locale as string) || 'tr';
    const { t } = useTranslation('modules/backups');
    const [backups, setBackups] = useState<Backup[]>([]);
    const [loading, setLoading] = useState(false);
    const [tenants, setTenants] = useState<TenantInfo[]>([]);
    const [tenantsLoading, setTenantsLoading] = useState(false);
    const [selectedTenant, setSelectedTenant] = useState<string | null>(null);
    const [creatingBackup, setCreatingBackup] = useState(false);

    // Restore Modal
    const [restoreModalOpen, { open: openRestore, close: closeRestore }] = useDisclosure(false);
    const [selectedBackup, setSelectedBackup] = useState<Backup | null>(null);
    const [restoring, setRestoring] = useState(false);

    // Delete Confirmation Modal
    const [deleteModalOpen, { open: openDelete, close: closeDelete }] = useDisclosure(false);
    const [backupToDelete, setBackupToDelete] = useState<Backup | null>(null);
    const [deleting, setDeleting] = useState(false);

    const [error, setError] = useState<string | null>(null);

    // Tenant listesini yükle
    const fetchTenants = async () => {
        setTenantsLoading(true);
        try {
            const data = await authenticatedFetchJSON('/api/tenants?pageSize=100');
            if (data.success && data.data?.tenants) {
                setTenants(data.data.tenants);
            }
        } catch (err) {
            console.error('Failed to fetch tenants:', err);
        } finally {
            setTenantsLoading(false);
        }
    };

    const fetchBackups = async () => {
        setLoading(true);
        setError(null);
        try {
            const params = selectedTenant ? `?tenantId=${selectedTenant}` : '';
            const data = await authenticatedFetchJSON(`/api/admin/backups${params}`);
            if (data.success) {
                setBackups(data.data?.backups || []);
            } else {
                setError(data.error?.message || t('notifications.loadError'));
            }
        } catch (err) {
            setError(t('notifications.loadErrorDetail'));
            showToast({ type: 'error', title: t('notifications.error'), message: t('notifications.loadError') });
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchTenants();
    }, []);

    useEffect(() => {
        fetchBackups();
    }, [selectedTenant]);

    const handleCreateBackup = async () => {
        if (!selectedTenant) {
            showToast({ type: 'warning', title: t('notifications.warning'), message: t('notifications.selectTenantFirst') });
            return;
        }

        setCreatingBackup(true);
        try {
            const data = await authenticatedPost('/api/admin/backups', { tenantId: selectedTenant });

            if (data.success) {
                showToast({
                    type: 'success',
                    title: t('notifications.success'),
                    message: t('notifications.backupStarted'),
                    duration: 3000,
                });
                setTimeout(() => {
                    fetchBackups();
                }, 2000);
            } else {
                if (data.error?.code === 'INTERNAL_ERROR' && data.error?.message?.includes('BigInt')) {
                    showToast({
                        type: 'info',
                        title: t('notifications.info'),
                        message: t('notifications.backupStartedIgnored'),
                        duration: 3000,
                    });
                    setTimeout(() => {
                        fetchBackups();
                    }, 2000);
                } else {
                    throw new Error(data.error?.message || data.error || t('notifications.backupFailed'));
                }
            }
        } catch (err: any) {
            if (err.message?.includes('BigInt') || err.message?.includes('serialize')) {
                showToast({
                    type: 'info',
                    title: t('notifications.info'),
                    message: t('notifications.backupStartedRefresh'),
                    duration: 3000,
                });
                setTimeout(() => {
                    fetchBackups();
                }, 2000);
            } else {
                showToast({ type: 'error', title: t('notifications.error'), message: err.message || t('notifications.backupFailed') });
            }
        } finally {
            setCreatingBackup(false);
        }
    };

    const handleDeleteClick = (backup: Backup) => {
        setBackupToDelete(backup);
        openDelete();
    };

    const handleDelete = async () => {
        if (!backupToDelete) return;

        setDeleting(true);
        try {
            const data = await authenticatedDelete(`/api/admin/backups/${backupToDelete.id}`);
            if (data.success) {
                showToast({ type: 'success', title: t('notifications.success'), message: t('notifications.backupDeleted') });
                closeDelete();
                setBackupToDelete(null);
                fetchBackups();
            } else {
                throw new Error(data.error?.message || t('notifications.backupDeleteFailed'));
            }
        } catch (err: any) {
            showToast({ type: 'error', title: t('notifications.error'), message: err.message || t('notifications.backupDeleteFailed') });
        } finally {
            setDeleting(false);
        }
    };

    const handleRestore = async () => {
        if (!selectedBackup) return;
        setRestoring(true);

        try {
            const data = await authenticatedPost(`/api/admin/backups/${selectedBackup.id}/restore`, {});

            if (data.success) {
                showToast({
                    type: 'success',
                    title: t('notifications.success'),
                    message: t('notifications.restoreSuccess'),
                    duration: 5000
                });
                closeRestore();
                fetchBackups();
            } else {
                throw new Error(data.error?.message || t('notifications.restoreFailed'));
            }
        } catch (err) {
            showToast({
                type: 'error',
                title: t('notifications.error'),
                message: err instanceof Error ? err.message : t('notifications.restoreFailed')
            });
        } finally {
            setRestoring(false);
        }
    };

    const formatSize = (bytes: string) => {
        const b = parseInt(bytes);
        if (b === 0) return '0 B';
        const k = 1024;
        const sizes = ['B', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(b) / Math.log(k));
        return parseFloat((b / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    };

    return (
        <Container py="xl">
            <CentralPageHeader
                title="title"
                description="description"
                namespace="modules/backups"
                icon={<IconDatabase size={32} />}
                breadcrumbs={[
                    { label: 'navigation.dashboard', href: `/${locale}/dashboard`, namespace: 'global' },
                    { label: 'title', namespace: 'modules/backups' },
                ]}
                actions={[
                    {
                        label: 'actions.view',
                        icon: <IconRefresh size={18} />,
                        onClick: fetchBackups,
                        variant: 'default',
                    },
                ]}
            />

            {error && (
                <Alert icon={<IconAlertCircle size={16} />} title={t('notifications.error')} color="red" mb="md">
                    {error}
                </Alert>
            )}

            <Grid mb="lg">
                <Grid.Col span={12}>
                    <Card withBorder padding="lg">
                        <Group justify="space-between" mb="md">
                            <Group>
                                <IconDatabase size={24} />
                                <Text fw={500}>{t('database.title')}</Text>
                            </Group>
                            <Button
                                leftSection={<IconPlus size={16} />}
                                onClick={handleCreateBackup}
                                loading={creatingBackup}
                                disabled={!selectedTenant}
                            >
                                {t('backups.create')}
                            </Button>
                        </Group>

                        <Alert icon={<IconAlertTriangle size={16} />} color="blue" mb="md">
                            {t('database.backupInfo')}
                        </Alert>

                        <Select
                            label={t('form.selectTenant')}
                            placeholder={t('form.selectTenantPlaceholder')}
                            data={tenants.map(tenant => ({ value: tenant.id, label: `${tenant.name} (${tenant.slug})` }))}
                            value={selectedTenant}
                            onChange={setSelectedTenant}
                            searchable
                            clearable
                            disabled={tenantsLoading}
                            nothingFoundMessage={t('form.tenantNotFound')}
                        />
                    </Card>
                </Grid.Col>
            </Grid>

            <Paper withBorder>
                {loading ? (
                    <Stack gap="md" p="md">
                        {/* Table Header */}
                        <Group>
                            <Skeleton height={20} width={100} />
                            <Skeleton height={20} width={120} />
                            <Skeleton height={20} width={80} />
                            <Skeleton height={20} width={80} />
                            <Skeleton height={20} width={100} />
                            <Skeleton height={20} width={150} />
                            <Skeleton height={20} width={100} />
                        </Group>

                        {/* Table Rows */}
                        {[1, 2, 3, 4, 5].map((i) => (
                            <Group key={i} gap="md">
                                <Skeleton height={40} width="15%" />
                                <Skeleton height={40} width="20%" />
                                <Skeleton height={40} width="10%" />
                                <Skeleton height={40} width="10%" />
                                <Skeleton height={40} width="10%" />
                                <Skeleton height={40} width="15%" />
                                <Skeleton height={40} width="20%" />
                            </Group>
                        ))}
                    </Stack>
                ) : (
                    <Table striped highlightOnHover>
                        <Table.Thead>
                            <Table.Tr>
                                <Table.Th>{t('table.tenant')}</Table.Th>
                                <Table.Th>{t('table.fileName')}</Table.Th>
                                <Table.Th>{t('table.fileSize')}</Table.Th>
                                <Table.Th>{t('table.type')}</Table.Th>
                                <Table.Th>{t('table.status')}</Table.Th>
                                <Table.Th>{t('table.createdAt')}</Table.Th>
                                <Table.Th>{t('table.actions')}</Table.Th>
                            </Table.Tr>
                        </Table.Thead>
                        <Table.Tbody>
                            {backups.map((backup) => (
                                <Table.Tr key={backup.id}>
                                    <Table.Td>{backup.tenant.name}</Table.Td>
                                    <Table.Td><Code>{backup.fileName}</Code></Table.Td>
                                    <Table.Td>{formatSize(backup.fileSize)}</Table.Td>
                                    <Table.Td>{backup.type}</Table.Td>
                                    <Table.Td>
                                        <Badge color={backup.status === 'COMPLETED' ? 'green' : 'orange'}>
                                            {backup.status}
                                        </Badge>
                                    </Table.Td>
                                    <Table.Td>{new Date(backup.createdAt).toLocaleString()}</Table.Td>
                                    <Table.Td>
                                        <Group gap="xs">
                                            <ActionIcon
                                                variant="light"
                                                color="blue"
                                                onClick={async () => {
                                                    try {
                                                        const response = await authenticatedFetch(`/api/admin/backups/${backup.id}/download`);
                                                        if (!response.ok) {
                                                            const errorData = await response.json().catch(() => ({}));
                                                            throw new Error(errorData.error?.message || errorData.message || `Download failed: ${response.status}`);
                                                        }
                                                        const blob = await response.blob();
                                                        const url = window.URL.createObjectURL(blob);
                                                        const a = document.createElement('a');
                                                        a.href = url;
                                                        a.download = backup.fileName;
                                                        document.body.appendChild(a);
                                                        a.click();
                                                        window.URL.revokeObjectURL(url);
                                                        document.body.removeChild(a);
                                                        showToast({
                                                            type: 'success',
                                                            title: t('notifications.success'),
                                                            message: t('notifications.backupDownloaded'),
                                                        });
                                                    } catch (err: any) {
                                                        console.error('Download error:', err);
                                                        showToast({
                                                            type: 'error',
                                                            title: t('notifications.error'),
                                                            message: err.message || t('notifications.downloadFailed'),
                                                        });
                                                    }
                                                }}
                                                title={t('backups.download')}
                                            >
                                                <IconDownload size={16} />
                                            </ActionIcon>
                                            <ActionIcon
                                                variant="light"
                                                color="orange"
                                                onClick={() => {
                                                    setSelectedBackup(backup);
                                                    openRestore();
                                                }}
                                                title={t('backups.restore')}
                                            >
                                                <IconHistory size={16} />
                                            </ActionIcon>
                                            <ActionIcon
                                                variant="light"
                                                color="red"
                                                onClick={() => handleDeleteClick(backup)}
                                                title={t('backups.delete')}
                                            >
                                                <IconTrash size={16} />
                                            </ActionIcon>
                                        </Group>
                                    </Table.Td>
                                </Table.Tr>
                            ))}
                            {backups.length === 0 && (
                                <Table.Tr>
                                    <Table.Td colSpan={7} align="center">{t('table.noBackups')}</Table.Td>
                                </Table.Tr>
                            )}
                        </Table.Tbody>
                    </Table>
                )}
            </Paper>

            <Modal
                opened={restoreModalOpen}
                onClose={closeRestore}
                title={t('restore.title')}
                color="red"
            >
                <Alert color="red" icon={<IconAlertTriangle />} mb="md">
                    {t('restore.warning')}
                </Alert>

                {selectedBackup && (
                    <Box mb="lg">
                        <Text fw={500}>{t('restore.selectedBackup')}</Text>
                        <Text>{selectedBackup.fileName}</Text>
                        <Text c="dimmed">{t('restore.createdAt')} {new Date(selectedBackup.createdAt).toLocaleString()}</Text>
                    </Box>
                )}

                <Group justify="flex-end">
                    <Button variant="default" onClick={closeRestore}>{t('actions.cancel')}</Button>
                    <Button
                        color="red"
                        onClick={handleRestore}
                        loading={restoring}
                    >
                        {t('backups.restore')}
                    </Button>
                </Group>
            </Modal>

            {/* Delete Confirmation Modal */}
            <Modal
                opened={deleteModalOpen}
                onClose={closeDelete}
                title={t('delete.title')}
                color="red"
            >
                <Alert color="red" icon={<IconAlertTriangle />} mb="md">
                    {t('delete.confirm')}
                </Alert>

                {backupToDelete && (
                    <Box mb="lg">
                        <Text fw={500}>{t('delete.selectedBackup')}</Text>
                        <Text>{backupToDelete.fileName}</Text>
                        <Text c="dimmed">{t('delete.tenant')} {backupToDelete.tenant.name}</Text>
                        <Text c="dimmed">{t('restore.createdAt')} {new Date(backupToDelete.createdAt).toLocaleString()}</Text>
                    </Box>
                )}

                <Group justify="flex-end">
                    <Button variant="default" onClick={closeDelete} disabled={deleting}>
                        {t('actions.cancel')}
                    </Button>
                    <Button
                        color="red"
                        onClick={handleDelete}
                        loading={deleting}
                    >
                        {t('actions.delete')}
                    </Button>
                </Group>
            </Modal>
        </Container>
    );
}

function Code({ children }: { children: React.ReactNode }) {
    return (
        <Box component="span" style={{ fontFamily: 'monospace', background: '#f1f3f5', padding: '2px 4px', borderRadius: 4 }}>
            {children}
        </Box>
    );
}
