'use client';

import { useState, useMemo, useCallback } from 'react';
import {
    Container,
    Group,
    Badge,
    ActionIcon,
    Alert,
    Text,
} from '@mantine/core';
import {
    IconPlus,
    IconEdit,
    IconTrash,
    IconFileText,
    IconStar,
    IconStarFilled,
    IconBuilding,
    IconMapPin,
    IconDatabase,
    IconEye,
    IconDownload,
    IconTrashX,
} from '@tabler/icons-react';
import { showToast } from '@/modules/notifications/components/ToastNotification';
import { useConfirmDialog } from '@/hooks/useConfirmDialog';
import { useRouter, useParams } from 'next/navigation';
import { useTranslation } from '@/lib/i18n/client';
import { CentralPageHeader } from '@/components/headers/CentralPageHeader';
import { DataTable, DataTableColumn } from '@/components/tables/DataTable';
import { FilterOption } from '@/components/tables/FilterModal';
import { useQuery } from '@tanstack/react-query';
import { fetchWithAuth } from '@/lib/api/fetchWithAuth';
import { ExportTemplatesPageSkeleton } from './ExportTemplatesPageSkeleton';

interface ExportTemplate {
    id: string;
    name: string;
    type: 'header' | 'footer' | 'full';
    companyId: string | null;
    locationId: string | null;
    isDefault: boolean;
    isActive: boolean;
    createdAt: string;
    updatedAt: string;
    logoUrl?: string | null;
    title?: string | null;
    subtitle?: string | null;
}

interface ExportTemplatesPageClientProps {
    locale: string;
}

export function ExportTemplatesPageClient({ locale }: ExportTemplatesPageClientProps) {
    const router = useRouter();
    const params = useParams();
    const currentLocale = (params?.locale as string) || locale;
    const { t } = useTranslation('modules/export-templates');
    const [search] = useState('');
    const [typeFilter, setTypeFilter] = useState<string | null>(null);
    const [scopeFilter, setScopeFilter] = useState<string | null>(null);
    const [selectedRows, setSelectedRows] = useState<string[]>([]);
    const { confirm, ConfirmDialog } = useConfirmDialog();

    const { data, isLoading, error, refetch } = useQuery<ExportTemplate[]>({
        queryKey: ['exportTemplates', typeFilter, scopeFilter],
        queryFn: async () => {
            const params = new URLSearchParams();
            if (typeFilter) params.append('type', typeFilter);
            if (scopeFilter === 'company') params.append('companyId', 'any');
            if (scopeFilter === 'location') params.append('locationId', 'any');

            const response = await fetch(`/api/export-templates?${params.toString()}`);
            if (!response.ok) {
                throw new Error('Failed to fetch templates');
            }
            const result = await response.json();
            return result.data || [];
        },
    });

    const filteredData = useMemo(() => {
        if (!data) return [];
        if (!search) return data;
        const searchLower = search.toLowerCase();
        return data.filter((template) =>
            template.name.toLowerCase().includes(searchLower) ||
            template.title?.toLowerCase().includes(searchLower) ||
            template.type.toLowerCase().includes(searchLower)
        );
    }, [data, search]);

    const handleDelete = async (id: string) => {
        const confirmed = await confirm({
            title: t('delete.title'),
            message: t('confirmDelete'),
            confirmLabel: t('delete.confirm'),
            confirmColor: 'red',
        });

        if (!confirmed) return;

        try {
            const response = await fetchWithAuth(`/api/export-templates/${id}`, {
                method: 'DELETE',
            });

            const result = await response.json();

            if (result.success) {
                showToast({
                    type: 'success',
                    title: t('notifications.success'),
                    message: t('notifications.deleted'),
                });
                refetch();
            } else {
                throw new Error(result.error);
            }
        } catch (error: any) {
            showToast({
                type: 'error',
                title: t('notifications.error'),
                message: error.message || t('notifications.deleteError'),
            });
        }
    };

    const handleBulkDelete = useCallback(async () => {
        if (selectedRows.length === 0) return;

        // Check if any selected row is default
        const hasDefaultTemplate = data?.some(
            (template) => selectedRows.includes(template.id) && template.isDefault
        );

        if (hasDefaultTemplate) {
            showToast({
                type: 'warning',
                title: t('notifications.warning'),
                message: t('notifications.cannotDeleteDefault'),
            });
            return;
        }

        const confirmed = await confirm({
            title: t('bulkDelete.title'),
            message: t('bulkDelete.message').replace('{{count}}', selectedRows.length.toString()),
            confirmLabel: t('bulkDelete.confirm'),
            confirmColor: 'red',
        });

        if (!confirmed) return;

        try {
            let successCount = 0;
            let errorCount = 0;

            for (const id of selectedRows) {
                try {
                    const response = await fetchWithAuth(`/api/export-templates/${id}`, {
                        method: 'DELETE',
                    });
                    const result = await response.json();
                    if (result.success) {
                        successCount++;
                    } else {
                        errorCount++;
                    }
                } catch {
                    errorCount++;
                }
            }

            if (successCount > 0) {
                showToast({
                    type: 'success',
                    title: t('notifications.success'),
                    message: t('notifications.bulkDeleted').replace('{{count}}', successCount.toString()),
                });
                setSelectedRows([]);
                refetch();
            }

            if (errorCount > 0) {
                showToast({
                    type: 'error',
                    title: t('notifications.error'),
                    message: t('notifications.bulkDeleteError').replace('{{count}}', errorCount.toString()),
                });
            }
        } catch (error: any) {
            showToast({
                type: 'error',
                title: t('notifications.error'),
                message: error.message || t('notifications.deleteError'),
            });
        }
    }, [selectedRows, data, confirm, t, refetch]);

    const handleSetDefault = async (id: string) => {
        try {
            const response = await fetchWithAuth(`/api/export-templates/${id}/set-default`, {
                method: 'POST',
            });

            const result = await response.json();

            if (result.success) {
                showToast({
                    type: 'success',
                    title: t('notifications.success'),
                    message: t('notifications.defaultUpdated'),
                });
                refetch();
            } else {
                throw new Error(result.error);
            }
        } catch (error: any) {
            showToast({
                type: 'error',
                title: t('notifications.error'),
                message: error.message || t('notifications.defaultError'),
            });
        }
    };

    const handleSeedTemplates = async () => {
        const confirmed = await confirm({
            title: t('seed.title'),
            message: t('seedConfirm'),
            confirmLabel: t('seed.confirm'),
            confirmColor: 'blue',
        });

        if (!confirmed) return;

        try {
            const response = await fetchWithAuth('/api/export-templates/seed', {
                method: 'POST',
            });

            const result = await response.json();

            if (result.success) {
                showToast({
                    type: 'success',
                    title: t('notifications.success'),
                    message: t('notifications.seeded').replace('{{count}}', result.data.templates.length.toString()),
                });
                refetch();
            } else {
                throw new Error(result.error || result.message);
            }
        } catch (error: any) {
            showToast({
                type: 'error',
                title: t('notifications.error'),
                message: error.message || t('notifications.seedError'),
            });
        }
    };

    const handleExportTemplate = async (id: string) => {
        try {
            const response = await fetchWithAuth(`/api/export-templates/${id}/export`);
            const result = await response.json();

            if (result.success) {
                const blob = new Blob([JSON.stringify(result.data, null, 2)], { type: 'application/json' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `template-${id}.json`;
                a.click();
                URL.revokeObjectURL(url);

                showToast({
                    type: 'success',
                    title: t('notifications.success'),
                    message: t('notifications.exported'),
                });
            } else {
                throw new Error(result.error);
            }
        } catch (error: any) {
            showToast({
                type: 'error',
                title: t('notifications.error'),
                message: error.message || t('notifications.exportError'),
            });
        }
    };

    const handlePreview = (id: string) => {
        window.open(`/api/export-templates/${id}/preview`, '_blank');
    };

    const filterOptions: FilterOption[] = [
        {
            key: 'type',
            label: t('table.type'),
            type: 'select',
            options: [
                { value: 'header', label: t('types.header') },
                { value: 'footer', label: t('types.footer') },
                { value: 'full', label: t('types.full') },
            ],
        },
        {
            key: 'scope',
            label: t('table.scope'),
            type: 'select',
            options: [
                { value: 'global', label: t('scope.global') },
                { value: 'company', label: t('scope.company') },
                { value: 'location', label: t('scope.location') },
            ],
        },
        {
            key: 'isActive',
            label: t('table.status'),
            type: 'select',
            options: [
                { value: 'true', label: t('status.active') },
                { value: 'false', label: t('status.inactive') },
            ],
        },
    ];

    const columns: DataTableColumn[] = [
        {
            key: 'name',
            label: t('table.name'),
            sortable: true,
            render: (value, row: ExportTemplate) => (
                <Group gap="xs">
                    <IconFileText size={18} color="var(--mantine-color-blue-6)" />
                    <Text fw={500}>{value}</Text>
                    {row.isDefault && (
                        <IconStarFilled size={14} style={{ color: 'var(--mantine-color-yellow-6)' }} />
                    )}
                </Group>
            ),
        },
        {
            key: 'type',
            label: t('table.type'),
            sortable: true,
            render: (value) => {
                const typeLabels: Record<string, string> = {
                    header: t('types.header'),
                    footer: t('types.footer'),
                    full: t('types.full'),
                };
                return (
                    <Badge variant="light" color="blue">
                        {typeLabels[value as string] || value}
                    </Badge>
                );
            },
        },
        {
            key: 'scope',
            label: t('table.scope'),
            sortable: true,
            render: (value, row: ExportTemplate) => {
                if (row.locationId) {
                    return (
                        <Group gap="xs">
                            <IconMapPin size={14} />
                            <Badge color="grape" variant="light">
                                {t('scope.location')}
                            </Badge>
                        </Group>
                    );
                }
                if (row.companyId) {
                    return (
                        <Group gap="xs">
                            <IconBuilding size={14} />
                            <Badge color="blue" variant="light">
                                {t('scope.company')}
                            </Badge>
                        </Group>
                    );
                }
                return (
                    <Badge color="gray" variant="light">
                        {t('scope.global')}
                    </Badge>
                );
            },
        },
        {
            key: t('labels.description'),
            label: t('table.description'),
            sortable: false,
            render: (value, row: ExportTemplate) => (
                <Text size="sm" {...((row as any).description ? {} : { c: 'dimmed' })} lineClamp={1}>
                    {(row as any).description || '-'}
                </Text>
            ),
        },
        {
            key: 'title',
            label: t('table.title'),
            sortable: true,
            render: (value) => (
                <Text size="sm" {...(value ? {} : { c: 'dimmed' })}>
                    {value || '-'}
                </Text>
            ),
        },
        {
            key: 'isActive',
            label: t('table.status'),
            sortable: true,
            render: (value) => (
                <Badge color={value ? 'green' : 'gray'} variant="light">
                    {value ? t('status.active') : t('status.inactive')}
                </Badge>
            ),
        },
        {
            key: 'createdAt',
            label: t('table.createdAt'),
            sortable: true,
            render: (value) => (
                <Text size="sm">{new Date(value as string).toLocaleDateString(currentLocale)}</Text>
            ),
        },
        {
            key: 'actions',
            label: t('table.actions'),
            sortable: false,
            render: (value, row: ExportTemplate) => (
                <Group gap="xs" justify="flex-end">
                    <ActionIcon
                        variant="subtle"
                        color="gray"
                        onClick={() => handlePreview(row.id)}
                        title={t('actions.preview')}
                    >
                        <IconEye size={16} />
                    </ActionIcon>
                    <ActionIcon
                        variant="subtle"
                        color="green"
                        onClick={() => handleExportTemplate(row.id)}
                        title={t('actions.export')}
                    >
                        <IconDownload size={16} />
                    </ActionIcon>
                    {!row.isDefault && (
                        <ActionIcon
                            variant="subtle"
                            color="yellow"
                            onClick={() => handleSetDefault(row.id)}
                            title={t('actions.setDefault')}
                        >
                            <IconStar size={16} />
                        </ActionIcon>
                    )}
                    <ActionIcon
                        variant="subtle"
                        color="blue"
                        onClick={() => router.push(`/${currentLocale}/settings/export-templates/${row.id}/edit`)}
                        title={t('actions.edit')}
                    >
                        <IconEdit size={16} />
                    </ActionIcon>
                    <ActionIcon
                        variant="subtle"
                        color="red"
                        onClick={() => handleDelete(row.id)}
                        disabled={row.isDefault}
                        title={t('actions.delete')}
                    >
                        <IconTrash size={16} />
                    </ActionIcon>
                </Group>
            ),
        },
    ];

    return (
        <Container size="xl" pt="xl">
            <CentralPageHeader
                title={t('title')}
                description={t('description')}
                namespace="modules/export-templates"
                icon={<IconFileText size={32} />}
                breadcrumbs={[
                    { label: 'navigation.dashboard', href: `/${currentLocale}/dashboard`, namespace: 'global' },
                    { label: 'navigation.settings', href: `/${currentLocale}/settings`, namespace: 'global' },
                    { label: 'title', namespace: 'modules/export-templates' },
                ]}
                actions={[
                    ...(selectedRows.length > 0 ? [{
                        label: t('bulkDelete.button').replace('{{count}}', selectedRows.length.toString()),
                        icon: <IconTrashX size={18} />,
                        onClick: handleBulkDelete,
                        variant: 'light' as const,
                        color: 'red',
                    }] : []),
                    {
                        label: t('seed.title'),
                        icon: <IconDatabase size={18} />,
                        onClick: handleSeedTemplates,
                        variant: 'light',
                    },
                    {
                        label: t('create'),
                        icon: <IconPlus size={18} />,
                        onClick: () => router.push(`/${currentLocale}/settings/export-templates/create`),
                        variant: 'filled',
                    },
                ]}
            />

            {isLoading ? (
                <ExportTemplatesPageSkeleton />
            ) : error ? (
                <Alert color="red" title={t('error')} mt="xl">
                    {error instanceof Error ? error.message : t('loadError')}
                </Alert>
            ) : (
                <DataTable
                    data={filteredData}
                    columns={columns}
                    searchable={true}
                    sortable={true}
                    pageable={true}
                    defaultPageSize={10}
                    pageSizeOptions={[10, 25, 50]}
                    emptyMessage={t('noTemplates')}
                    filters={filterOptions}
                    onFilter={(filters) => {
                        // Apply filters
                        if (filters.type) setTypeFilter(filters.type);
                        else setTypeFilter(null);

                        if (filters.scope) setScopeFilter(filters.scope);
                        else setScopeFilter(null);
                    }}
                    showExportIcons={true}
                    onExport={(format) => {
                        // Export functionality
                        showToast({
                            type: 'info',
                            title: t('export'),
                            message: t('exportComingSoon', { format: format.toUpperCase() }),
                        });
                    }}
                    selectable={true}
                    selectedRows={selectedRows}
                    onSelectionChange={setSelectedRows}
                    rowIdKey="id"
                />
            )}
            <ConfirmDialog />
        </Container>
    );
}
