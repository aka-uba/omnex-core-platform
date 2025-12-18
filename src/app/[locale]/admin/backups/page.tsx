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
                setError(data.error?.message || 'Yedekler yüklenemedi');
            }
        } catch (err) {
            setError('Yedekler yüklenirken bir hata oluştu');
            showToast({ type: 'error', title: 'Hata', message: 'Yedekler yüklenemedi' });
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
            showToast({ type: 'warning', title: 'Uyarı', message: 'Önce bir tenant seçin' });
            return;
        }

        setCreatingBackup(true);
        try {
            const data = await authenticatedPost('/api/admin/backups', { tenantId: selectedTenant });

            if (data.success) {
                showToast({ 
                    type: 'success',
                    title: 'Başarılı', 
                    message: 'Yedekleme başlatıldı. Lütfen bekleyin...', 
                    duration: 3000,
                });
                // Wait a bit then refresh the list
                setTimeout(() => {
                    fetchBackups();
                }, 2000);
            } else {
                // Even if response has error, backup might have been created
                // Check if error is just serialization issue
                if (data.error?.code === 'INTERNAL_ERROR' && data.error?.message?.includes('BigInt')) {
                    showToast({ 
                        type: 'info',
                        title: 'Bilgi', 
                        message: 'Yedekleme başlatıldı (yanıt hatası görmezden gelindi)', 
                        duration: 3000,
                    });
                    setTimeout(() => {
                        fetchBackups();
                    }, 2000);
                } else {
                    throw new Error(data.error?.message || data.error || 'Yedekleme başlatılamadı');
                }
            }
        } catch (err: any) {
            // Check if it's a serialization error - backup might still be created
            if (err.message?.includes('BigInt') || err.message?.includes('serialize')) {
                showToast({ 
                    type: 'info',
                    title: 'Bilgi', 
                    message: 'Yedekleme başlatıldı. Liste yenileniyor...', 
                    duration: 3000,
                });
                setTimeout(() => {
                    fetchBackups();
                }, 2000);
            } else {
                showToast({ type: 'error', title: 'Hata', message: err.message || 'Yedekleme başlatılamadı' });
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
                showToast({ type: 'success', title: 'Başarılı', message: 'Yedek silindi' });
                closeDelete();
                setBackupToDelete(null);
                fetchBackups();
            } else {
                throw new Error(data.error?.message || 'Yedek silinemedi');
            }
        } catch (err: any) {
            showToast({ type: 'error', title: 'Hata', message: err.message || 'Yedek silinemedi' });
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
                    title: 'Başarılı',
                    message: 'Veritabanı başarıyla geri yüklendi. Güvenlik yedeği oluşturuldu.',
                    duration: 5000
                });
                closeRestore();
                fetchBackups();
            } else {
                throw new Error(data.error?.message || 'Geri yükleme başarısız');
            }
        } catch (err) {
            showToast({
                type: 'error',
                title: 'Hata',
                message: err instanceof Error ? err.message : 'Geri yükleme başarısız'
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
                <Alert icon={<IconAlertCircle size={16} />} title="Hata" color="red" mb="md">
                    {error}
                </Alert>
            )}

            <Grid mb="lg">
                <Grid.Col span={12}>
                    <Card withBorder padding="lg">
                        <Group justify="space-between" mb="md">
                            <Group>
                                <IconDatabase size={24} />
                                <Text fw={500}>Veritabanı İşlemleri</Text>
                            </Group>
                            <Button
                                leftSection={<IconPlus size={16} />}
                                onClick={handleCreateBackup}
                                loading={creatingBackup}
                                disabled={!selectedTenant}
                            >
                                Yedek Oluştur
                            </Button>
                        </Group>

                        <Alert icon={<IconAlertTriangle size={16} />} color="blue" mb="md">
                            Yedekleme işlemi için bir tenant seçin. Yedekler güvenli bir şekilde saklanır ve istenildiğinde geri yüklenebilir.
                        </Alert>

                        <Select
                            label="Tenant Seçin"
                            placeholder="Tenant seçin..."
                            data={tenants.map(t => ({ value: t.id, label: `${t.name} (${t.slug})` }))}
                            value={selectedTenant}
                            onChange={setSelectedTenant}
                            searchable
                            clearable
                            disabled={tenantsLoading}
                            nothingFoundMessage="Tenant bulunamadı"
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
                                <Table.Th>Tenant</Table.Th>
                                <Table.Th>Dosya Adı</Table.Th>
                                <Table.Th>Boyut</Table.Th>
                                <Table.Th>Tür</Table.Th>
                                <Table.Th>Durum</Table.Th>
                                <Table.Th>Oluşturulma</Table.Th>
                                <Table.Th>İşlemler</Table.Th>
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
                                                            title: 'Başarılı',
                                                            message: 'Yedek indirildi',
                                                        });
                                                    } catch (err: any) {
                                                        console.error('Download error:', err);
                                                        showToast({
                                                            type: 'error',
                                                            title: 'Hata',
                                                            message: err.message || 'İndirme başarısız',
                                                        });
                                                    }
                                                }}
                                                title="İndir"
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
                                                title="Restore"
                                            >
                                                <IconHistory size={16} />
                                            </ActionIcon>
                                            <ActionIcon
                                                variant="light"
                                                color="red"
                                                onClick={() => handleDeleteClick(backup)}
                                                title="Delete"
                                            >
                                                <IconTrash size={16} />
                                            </ActionIcon>
                                        </Group>
                                    </Table.Td>
                                </Table.Tr>
                            ))}
                            {backups.length === 0 && (
                                <Table.Tr>
                                    <Table.Td colSpan={7} align="center">Henüz yedek bulunmuyor</Table.Td>
                                </Table.Tr>
                            )}
                        </Table.Tbody>
                    </Table>
                )}
            </Paper>

            <Modal
                opened={restoreModalOpen}
                onClose={closeRestore}
                title="Veritabanını Geri Yükle"
                color="red"
            >
                <Alert color="red" icon={<IconAlertTriangle />} mb="md">
                    Uyarı: Bu işlem mevcut veritabanını seçili yedekle değiştirecektir.
                    Geri yüklemeden önce otomatik olarak güvenlik yedeği oluşturulacaktır.
                </Alert>

                {selectedBackup && (
                    <Box mb="lg">
                        <Text fw={500}>Seçili Yedek:</Text>
                        <Text>{selectedBackup.fileName}</Text>
                        <Text c="dimmed">Oluşturulma: {new Date(selectedBackup.createdAt).toLocaleString()}</Text>
                    </Box>
                )}

                <Group justify="flex-end">
                    <Button variant="default" onClick={closeRestore}>İptal</Button>
                    <Button
                        color="red"
                        onClick={handleRestore}
                        loading={restoring}
                    >
                        Geri Yükle
                    </Button>
                </Group>
            </Modal>

            {/* Delete Confirmation Modal */}
            <Modal
                opened={deleteModalOpen}
                onClose={closeDelete}
                title="Yedeği Sil"
                color="red"
            >
                <Alert color="red" icon={<IconAlertTriangle />} mb="md">
                    Bu yedeği silmek istediğinizden emin misiniz? Bu işlem geri alınamaz.
                </Alert>

                {backupToDelete && (
                    <Box mb="lg">
                        <Text fw={500}>Silinecek Yedek:</Text>
                        <Text>{backupToDelete.fileName}</Text>
                        <Text c="dimmed">Tenant: {backupToDelete.tenant.name}</Text>
                        <Text c="dimmed">Oluşturulma: {new Date(backupToDelete.createdAt).toLocaleString()}</Text>
                    </Box>
                )}

                <Group justify="flex-end">
                    <Button variant="default" onClick={closeDelete} disabled={deleting}>
                        İptal
                    </Button>
                    <Button
                        color="red"
                        onClick={handleDelete}
                        loading={deleting}
                    >
                        Sil
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
