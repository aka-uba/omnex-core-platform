'use client';

import { useState } from 'react';
import {
    Container,
    Stack,
    Text,
    Button,
    Group,
    Alert,
    Card,
    Badge,
    ActionIcon,
    Modal,
    TextInput,
    Checkbox,
    SimpleGrid,
    Progress,
    Tabs,
    Loader,
} from '@mantine/core';
import {
    IconServer,
    IconRefresh,
    IconTrash,
    IconFolder,
    IconFile,
    IconInfoCircle,
} from '@tabler/icons-react';
import { CentralPageHeader } from '@/components/headers/CentralPageHeader';
import { useParams } from 'next/navigation';
import { useTranslation } from '@/lib/i18n/client';
import { showToast } from '@/modules/notifications/components/ToastNotification';
import { useConfirmDialog } from '@/hooks/useConfirmDialog';
import { useDisclosure } from '@mantine/hooks';
import { authenticatedPost, authenticatedFetchJSON } from '@/lib/api/authenticatedFetch';
import { useQuery } from '@tanstack/react-query';
import { DataTable, DataTableColumn } from '@/components/tables/DataTable';

interface CacheDirectory {
    name: string;
    path: string;
    size: number;
    sizeFormatted: string;
    fileCount: number;
    lastModified: string;
}

interface CacheEntry {
    key: string;
    directory: string;
    size: number;
    sizeFormatted: string;
    ttl?: number;
    expiresAt?: string;
    type: 'file' | 'memory' | 'redis' | 'database';
    createdAt?: string;
}

interface CacheListResponse {
    directories: CacheDirectory[];
    entries: CacheEntry[];
    stats: {
        totalSize: number;
        totalSizeFormatted: string;
        totalDirectories: number;
        totalFiles: number;
    };
}

export default function CacheManagementPage() {
    const params = useParams();
    const currentLocale = (params?.locale as string) || 'tr';
    const { t } = useTranslation('global');
    const { confirm, ConfirmDialog } = useConfirmDialog();
    const [loading, setLoading] = useState(false);
    const [selectedKeys, setSelectedKeys] = useState<Set<string>>(new Set());
    const [opened, { open, close }] = useDisclosure(false);
    const [cacheKey, setCacheKey] = useState('');
    const [activeTab, setActiveTab] = useState<string | null>('directories');

    const { data, isLoading, error, refetch } = useQuery<CacheListResponse>({
        queryKey: ['cacheList'],
        queryFn: async () => {
            const result = await authenticatedFetchJSON('/api/admin/optimization/cache/list');
            if (!result.success) {
                throw new Error(result.error || 'Failed to fetch cache list');
            }
            // Ensure we have the expected structure
            const responseData = result.data || {};
            const response = {
                directories: Array.isArray(responseData.directories) ? responseData.directories : [],
                entries: Array.isArray(responseData.entries) ? responseData.entries : [],
                stats: responseData.stats || {
                    totalSize: 0,
                    totalSizeFormatted: '0 Bytes',
                    totalDirectories: 0,
                    totalFiles: 0,
                },
            };
            return response;
        },
    });

    const handleClearAll = async () => {
        const confirmed = await confirm({
            title: t('optimization.cache.clearAllTitle'),
            message: t('optimization.cache.confirmClearAll'),
            confirmLabel: t('optimization.cache.clear'),
            confirmColor: 'red',
        });

        if (!confirmed) return;

        try {
            setLoading(true);
            const result = await authenticatedPost('/api/admin/optimization/cache/clear', {});
            if (result.success) {
                showToast({
                    type: 'success',
                    title: t('notifications.success'),
                    message: t('optimization.cache.cleared'),
                });
                refetch();
                setSelectedKeys(new Set());
            } else {
                throw new Error(result.error || 'Failed to clear cache');
            }
        } catch (error: any) {
            showToast({
                type: 'error',
                title: t('notifications.error'),
                message: error.message || t('optimization.cache.clearError'),
            });
        } finally {
            setLoading(false);
        }
    };

    const handleClearSelected = async () => {
        if (selectedKeys.size === 0) return;

        const confirmed = await confirm({
            title: t('optimization.cache.clearSelectedTitle'),
            message: t('optimization.cache.confirmClearSelected'),
            confirmLabel: t('optimization.cache.clear'),
            confirmColor: 'red',
        });

        if (!confirmed) return;

        try {
            setLoading(true);
            const result = await authenticatedPost('/api/admin/optimization/cache/clear', {
                keys: Array.from(selectedKeys),
            });
            if (result.success) {
                showToast({
                    type: 'success',
                    title: t('notifications.success'),
                    message: t('optimization.cache.selectedCleared'),
                });
                refetch();
                setSelectedKeys(new Set());
            } else {
                throw new Error(result.error || 'Failed to clear selected cache');
            }
        } catch (error: any) {
            showToast({
                type: 'error',
                title: t('notifications.error'),
                message: error.message || t('optimization.cache.clearError'),
            });
        } finally {
            setLoading(false);
        }
    };

    const handleClearKey = async () => {
        if (!cacheKey) return;
        try {
            setLoading(true);
            const result = await authenticatedPost('/api/admin/optimization/cache/clear', { key: cacheKey });
            if (result.success) {
                showToast({
                    type: 'success',
                    title: t('notifications.success'),
                    message: t('optimization.cache.keyCleared'),
                });
                setCacheKey('');
                close();
                refetch();
            } else {
                throw new Error(result.error || 'Failed to clear cache key');
            }
        } catch (error: any) {
            showToast({
                type: 'error',
                title: t('notifications.error'),
                message: error.message || t('optimization.cache.clearError'),
            });
        } finally {
            setLoading(false);
        }
    };

    const handleClearDirectory = async (directoryName: string) => {
        const confirmed = await confirm({
            title: t('optimization.cache.clearDirectoryTitle'),
            message: t('optimization.cache.confirmClearDirectory'),
            confirmLabel: t('optimization.cache.clear'),
            confirmColor: 'red',
        });

        if (!confirmed) return;

        try {
            setLoading(true);
            const result = await authenticatedPost('/api/admin/optimization/cache/clear', { directory: directoryName });
            if (result.success) {
                showToast({
                    type: 'success',
                    title: t('notifications.success'),
                    message: t('optimization.cache.directoryCleared'),
                });
                refetch();
            } else {
                throw new Error(result.error || 'Failed to clear directory');
            }
        } catch (error: any) {
            showToast({
                type: 'error',
                title: t('notifications.error'),
                message: error.message || t('optimization.cache.clearError'),
            });
        } finally {
            setLoading(false);
        }
    };

    const toggleKeySelection = (key: string) => {
        setSelectedKeys((prev) => {
            const newSet = new Set(prev);
            if (newSet.has(key)) {
                newSet.delete(key);
            } else {
                newSet.add(key);
            }
            return newSet;
        });
    };

    const toggleAllKeys = () => {
        if (data?.entries) {
            if (selectedKeys.size === data.entries.length) {
                setSelectedKeys(new Set());
            } else {
                setSelectedKeys(new Set(data.entries.map((e) => e.key)));
            }
        }
    };

    const directoryColumns: DataTableColumn[] = [
        {
            key: 'name',
            label: t('optimization.cache.table.directory'),
            sortable: true,
            render: (value, row: CacheDirectory) => (
                <Group gap="xs">
                    <IconFolder size={18} color="var(--mantine-color-blue-6)" />
                    <Text fw={500}>{value}</Text>
                </Group>
            ),
        },
        {
            key: 'sizeFormatted',
            label: t('optimization.cache.table.size'),
            sortable: true,
            render: (value, row: CacheDirectory) => (
                <Text fw={500}>{value}</Text>
            ),
        },
        {
            key: 'fileCount',
            label: t('optimization.cache.table.files'),
            sortable: true,
            render: (value) => (
                <Badge variant="light" color="blue">{value}</Badge>
            ),
        },
        {
            key: 'lastModified',
            label: t('optimization.cache.table.lastModified'),
            sortable: true,
            render: (value) => (
                <Text c="dimmed">
                    {new Date(value as string).toLocaleString(currentLocale)}
                </Text>
            ),
        },
        {
            key: 'actions',
            label: t('optimization.cache.table.actions'),
            sortable: false,
            render: (value, row: CacheDirectory) => (
                <ActionIcon
                    color="red"
                    variant="subtle"
                    onClick={() => handleClearDirectory(row.name)}
                    loading={loading}
                >
                    <IconTrash size={16} />
                </ActionIcon>
            ),
        },
    ];

    const entryColumns: DataTableColumn[] = [
        {
            key: 'select',
            label: '',
            sortable: false,
            render: (value, row: CacheEntry) => (
                <Checkbox
                    checked={Boolean(selectedKeys.has(row.key))}
                    onChange={() => toggleKeySelection(row.key)}
                />
            ),
        },
        {
            key: 'key',
            label: t('optimization.cache.table.key'),
            sortable: true,
            render: (value, row: CacheEntry) => (
                <Group gap="xs">
                    <IconFile size={16} color="var(--mantine-color-gray-6)" />
                    <Text fw={500}>{value}</Text>
                </Group>
            ),
        },
        {
            key: 'directory',
            label: t('optimization.cache.table.directory'),
            sortable: true,
            render: (value) => (
                <Badge variant="light" color="violet">{value}</Badge>
            ),
        },
        {
            key: 'sizeFormatted',
            label: t('optimization.cache.table.size'),
            sortable: true,
            render: (value) => (
                <Text>{value}</Text>
            ),
        },
        {
            key: 'type',
            label: t('optimization.cache.table.type'),
            sortable: true,
            render: (value) => (
                <Badge variant="light" color="teal">{value}</Badge>
            ),
        },
        {
            key: 'createdAt',
            label: t('optimization.cache.table.createdAt'),
            sortable: true,
            render: (value) => (
                <Text c="dimmed">
                    {value ? new Date(value as string).toLocaleString(currentLocale) : '-'}
                </Text>
            ),
        },
    ];

    return (
        <Container py="xl">
            <CentralPageHeader
                title={t('optimization.cache.title')}
                description={t('optimization.cache.description')}
                namespace="global"
                icon={<IconServer size={32} />}
                breadcrumbs={[
                    { label: 'navigation.dashboard', href: `/${currentLocale}/dashboard`, namespace: 'global' },
                    { label: 'optimization.title', href: `/${currentLocale}/admin/optimization`, namespace: 'global' },
                    { label: 'optimization.cache.title', namespace: 'global' },
                ]}
                actions={[
                    {
                        label: t('optimization.cache.clearAll'),
                        icon: <IconTrash size={18} />,
                        onClick: handleClearAll,
                        variant: 'filled',
                        color: 'red',
                    },
                    {
                        label: t('buttons.refresh'),
                        icon: <IconRefresh size={18} />,
                        onClick: () => refetch(),
                        variant: 'light',
                    },
                ]}
            />

            <Stack gap="lg" mt="xl">
                {/* Statistics */}
                {data?.stats && (
                    <SimpleGrid cols={{ base: 1, sm: 2, md: 4 }} spacing="lg">
                        <Card withBorder padding="md" radius="md">
                            <Stack gap="xs">
                                <Text c="dimmed" fw={500}>
                                    {t('optimization.cache.stats.totalSize')}
                                </Text>
                                <Text fw={700}>
                                    {data.stats.totalSizeFormatted}
                                </Text>
                            </Stack>
                        </Card>
                        <Card withBorder padding="md" radius="md">
                            <Stack gap="xs">
                                <Text c="dimmed" fw={500}>
                                    {t('optimization.cache.stats.directories')}
                                </Text>
                                <Text fw={700}>
                                    {data.stats.totalDirectories}
                                </Text>
                            </Stack>
                        </Card>
                        <Card withBorder padding="md" radius="md">
                            <Stack gap="xs">
                                <Text c="dimmed" fw={500}>
                                    {t('optimization.cache.stats.files')}
                                </Text>
                                <Text fw={700}>
                                    {data.stats.totalFiles}
                                </Text>
                            </Stack>
                        </Card>
                        <Card withBorder padding="md" radius="md">
                            <Stack gap="xs">
                                <Text c="dimmed" fw={500}>
                                    {t('optimization.cache.stats.usage')}
                                </Text>
                                <Progress
                                    value={Math.min(100, (data.stats.totalSize / (1024 * 1024 * 1024)) * 100)}
                                    color="blue"
                                />
                            </Stack>
                        </Card>
                    </SimpleGrid>
                )}

                <Alert icon={<IconInfoCircle size={16} />} color="blue">
                    {t('optimization.cache.info')}
                </Alert>

                <Tabs value={activeTab} onChange={setActiveTab}>
                    <Tabs.List>
                        <Tabs.Tab value="directories" leftSection={<IconFolder size={16} />}>
                            {t('optimization.cache.tabs.directories')}
                        </Tabs.Tab>
                        <Tabs.Tab value="entries" leftSection={<IconFile size={16} />}>
                            {t('optimization.cache.tabs.entries')}
                        </Tabs.Tab>
                    </Tabs.List>

                    <Tabs.Panel value="directories" pt="md">
                        {isLoading ? (
                            <Loader />
                        ) : error ? (
                            <Alert color="red" title={t('common.error')}>
                                {error instanceof Error ? error.message : t('optimization.cache.loadError')}
                            </Alert>
                        ) : (
                            <DataTable
                                data={data?.directories || []}
                                columns={directoryColumns}
                                searchable
                                sortable
                                emptyMessage={t('optimization.cache.noDirectories')}
                            />
                        )}
                    </Tabs.Panel>

                    <Tabs.Panel value="entries" pt="md">
                        <Group mb="md" justify="space-between">
                            <Group>
                                <Checkbox
                                    checked={Boolean(data?.entries && data.entries.length > 0 && selectedKeys.size === data.entries.length)}
                                    indeterminate={selectedKeys.size > 0 && selectedKeys.size < (data?.entries.length || 0)}
                                    onChange={toggleAllKeys}
                                    label={t('optimization.cache.selectAll')}
                                />
                                {selectedKeys.size > 0 && (
                                    <Button
                                        color="red"
                                        variant="light"
                                        leftSection={<IconTrash size={14} />}
                                        onClick={handleClearSelected}
                                        loading={loading}
                                    >
                                        {t('optimization.cache.clearSelected')} ({selectedKeys.size})
                                    </Button>
                                )}
                            </Group>
                            <Button
                                variant="light"
                                leftSection={<IconTrash size={14} />}
                                onClick={open}
                            >
                                {t('optimization.cache.clearKey')}
                            </Button>
                        </Group>

                        {isLoading ? (
                            <Loader />
                        ) : error ? (
                            <Alert color="red" title={t('common.error')}>
                                {error instanceof Error ? error.message : t('optimization.cache.loadError')}
                            </Alert>
                        ) : (
                            <DataTable
                                data={data?.entries || []}
                                columns={entryColumns}
                                searchable
                                sortable
                                emptyMessage={t('optimization.cache.noEntries')}
                            />
                        )}
                    </Tabs.Panel>
                </Tabs>
            </Stack>

            <Modal opened={opened} onClose={close} title={t('optimization.cache.clearKey')}>
                <Stack gap="md">
                    <TextInput
                        label={t('optimization.cache.key')}
                        placeholder={t('optimization.cache.keyPlaceholder')}
                        value={cacheKey}
                        onChange={(e) => setCacheKey(e.currentTarget.value)}
                    />
                    <Group justify="flex-end">
                        <Button variant="subtle" onClick={close}>
                            {t('form.cancel')}
                        </Button>
                        <Button onClick={handleClearKey} loading={loading}>
                            {t('optimization.cache.clear')}
                        </Button>
                    </Group>
                </Stack>
            </Modal>
            <ConfirmDialog />
        </Container>
    );
}
