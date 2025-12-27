'use client';

import { useState, useEffect, useMemo } from 'react';
import {
    Container,
    Paper,
    Group,
    TextInput,
    Select,
    Badge,
    ActionIcon,
    Text,
    Box,
    Code,
    Modal,
    Alert,
} from '@mantine/core';
import { DatePickerInput } from '@mantine/dates';
import { IconDownload, IconRefresh, IconEye, IconFileText, IconAlertCircle } from '@tabler/icons-react';
import { useDisclosure } from '@mantine/hooks';
import { showToast } from '@/modules/notifications/components/ToastNotification';
import { CentralPageHeader } from '@/components/headers/CentralPageHeader';
import { useParams } from 'next/navigation';
import { authenticatedFetchJSON, getAccessToken, getTenantSlug } from '@/lib/api/authenticatedFetch';
import { useTranslation } from '@/lib/i18n/client';
import { DataTable, DataTableColumn } from '@/components/tables/DataTable';
import { LogsPageSkeleton } from './LogsPageSkeleton';

interface AuditLog {
    id: string;
    action: string;
    module: string;
    userId: string;
    tenantSlug: string;
    status: 'SUCCESS' | 'FAILURE' | 'ERROR';
    ipAddress: string;
    createdAt: string;
    details: any;
    errorMessage?: string;
}

export default function SystemLogsPage() {
    const params = useParams();
    const locale = (params?.locale as string) || 'tr';
    const { t } = useTranslation('global');
    const [logs, setLogs] = useState<AuditLog[]>([]);
    const [loading, setLoading] = useState(true);
    const [filters, setFilters] = useState({
        action: '',
        module: '',
        status: '',
        userId: '',
        startDate: null as Date | null,
        endDate: null as Date | null,
    });

    const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null);
    const [detailsOpen, { open: openDetails, close: closeDetails }] = useDisclosure(false);
    const [error, setError] = useState<string | null>(null);

    const fetchLogs = async () => {
        setLoading(true);
        setError(null);
        try {
            const urlParams = new URLSearchParams({
                page: '1',
                limit: '1000', // DataTable handles pagination
                ...Object.fromEntries(
                    Object.entries(filters).filter(([_, v]) => v !== '' && v !== null)
                ),
            });

            if (filters.startDate) urlParams.append('startDate', filters.startDate.toISOString());
            if (filters.endDate) urlParams.append('endDate', filters.endDate.toISOString());

            const data = await authenticatedFetchJSON(`/api/admin/logs?${urlParams}`);

            if (data.success) {
                setLogs(data.data || []);
            } else {
                setError(data.error?.message || t('setup.logs.systemLogs.errors.loadFailed'));
            }
        } catch (err) {
            setError(t('setup.logs.systemLogs.errors.loadError'));
            showToast({
                type: 'error',
                title: t('actions.error'),
                message: t('setup.logs.systemLogs.errors.loadFailed'),
            });
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchLogs();
    }, [filters]);

    const handleExport = async (format: 'csv' | 'json') => {
        try {
            const urlParams = new URLSearchParams({
                format,
                ...Object.fromEntries(
                    Object.entries(filters).filter(([_, v]) => v !== '' && v !== null)
                ),
            });

            const token = getAccessToken();
            if (token) {
                urlParams.append('token', token);
            }
            const tenantSlug = getTenantSlug();
            if (tenantSlug) {
                urlParams.append('tenantSlug', tenantSlug);
            }

            window.open(`/api/admin/logs/export?${urlParams}`, '_blank');
        } catch (err) {
            showToast({
                type: 'error',
                title: t('actions.error'),
                message: t('setup.logs.systemLogs.errors.exportFailed'),
            });
        }
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'SUCCESS': return 'green';
            case 'FAILURE': return 'orange';
            case 'ERROR': return 'red';
            default: return 'gray';
        }
    };

    // Transform data for DataTable
    const tableData = useMemo(() => {
        return logs.map((log) => ({
            id: log.id,
            time: log.createdAt,
            action: log.action,
            module: log.module,
            userId: log.userId || '-',
            tenantSlug: log.tenantSlug || '-',
            status: log.status,
            ipAddress: log.ipAddress || '-',
            details: log.details,
            errorMessage: log.errorMessage,
            _raw: log,
        }));
    }, [logs]);

    // DataTable columns
    const columns: DataTableColumn[] = useMemo(() => [
        {
            key: 'time',
            label: t('setup.logs.systemLogs.table.time'),
            sortable: true,
            searchable: false,
            render: (value: string) => (
                <Text size="sm">{new Date(value).toLocaleString()}</Text>
            ),
        },
        {
            key: 'action',
            label: t('setup.logs.systemLogs.table.action'),
            sortable: true,
            searchable: true,
            render: (value: string) => <Code>{value}</Code>,
        },
        {
            key: 'module',
            label: t('setup.logs.systemLogs.table.module'),
            sortable: true,
            searchable: true,
            render: (value: string) => <Text size="sm">{value}</Text>,
        },
        {
            key: 'userId',
            label: t('setup.logs.systemLogs.table.user'),
            sortable: true,
            searchable: true,
            render: (value: string) => <Text size="sm">{value}</Text>,
        },
        {
            key: 'tenantSlug',
            label: t('setup.logs.systemLogs.table.tenant'),
            sortable: true,
            searchable: true,
            render: (value: string) => <Text size="sm">{value}</Text>,
        },
        {
            key: 'status',
            label: t('setup.logs.systemLogs.table.status'),
            sortable: true,
            searchable: false,
            render: (value: string) => (
                <Badge color={getStatusColor(value)}>{value}</Badge>
            ),
        },
        {
            key: 'ipAddress',
            label: t('setup.logs.systemLogs.table.ipAddress'),
            sortable: true,
            searchable: true,
            render: (value: string) => <Text size="sm">{value}</Text>,
        },
        {
            key: 'actions',
            label: t('setup.logs.systemLogs.table.details'),
            sortable: false,
            searchable: false,
            render: (_: any, row: any) => (
                <ActionIcon
                    variant="subtle"
                    onClick={(e) => {
                        e.stopPropagation();
                        setSelectedLog(row._raw);
                        openDetails();
                    }}
                >
                    <IconEye size={16} />
                </ActionIcon>
            ),
        },
    ], [t, openDetails]);

    if (loading) {
        return <LogsPageSkeleton />;
    }

    return (
        <Container py="xl">
            <CentralPageHeader
                title={t('setup.logs.systemLogs.title')}
                description={t('setup.logs.systemLogs.description')}
                namespace="admin"
                icon={<IconFileText size={32} />}
                breadcrumbs={[
                    { label: 'navigation.dashboard', href: `/${locale}/dashboard`, namespace: 'global' },
                    { label: t('setup.logs.systemLogs.title'), namespace: 'admin' },
                ]}
                actions={[
                    {
                        label: t('setup.logs.systemLogs.csvDownload'),
                        icon: <IconDownload size={18} />,
                        onClick: () => handleExport('csv'),
                        variant: 'default',
                    },
                    {
                        label: t('setup.logs.systemLogs.refresh'),
                        icon: <IconRefresh size={18} />,
                        onClick: fetchLogs,
                        variant: 'default',
                    },
                ]}
            />

            {error && (
                <Alert icon={<IconAlertCircle size={16} />} title={t('actions.error')} color="red" mb="md">
                    {error}
                </Alert>
            )}

            <Paper p="md" mb="lg" withBorder>
                <Group align="end" wrap="wrap" gap="md">
                    <TextInput
                        label={t('setup.logs.systemLogs.filters.userId')}
                        placeholder={t('setup.logs.systemLogs.filters.userIdPlaceholder')}
                        value={filters.userId}
                        onChange={(e) => setFilters({ ...filters, userId: e.target.value })}
                        style={{ minWidth: 150 }}
                    />
                    <Select
                        label={t('setup.logs.systemLogs.filters.status')}
                        placeholder={t('setup.logs.systemLogs.filters.statusPlaceholder')}
                        data={[
                            { value: 'SUCCESS', label: t('setup.logs.systemLogs.status.success') },
                            { value: 'FAILURE', label: t('setup.logs.systemLogs.status.failure') },
                            { value: 'ERROR', label: t('setup.logs.systemLogs.status.error') },
                        ]}
                        value={filters.status}
                        onChange={(val) => setFilters({ ...filters, status: val || '' })}
                        clearable
                        style={{ minWidth: 150 }}
                    />
                    <Select
                        label={t('setup.logs.systemLogs.filters.module')}
                        placeholder={t('setup.logs.systemLogs.filters.modulePlaceholder')}
                        data={['auth', 'users', 'tenants', 'backup', 'database', 'admin']}
                        value={filters.module}
                        onChange={(val) => setFilters({ ...filters, module: val || '' })}
                        clearable
                        style={{ minWidth: 150 }}
                    />
                    <DatePickerInput
                        label={t('setup.logs.systemLogs.filters.startDate')}
                        placeholder={t('setup.logs.systemLogs.filters.datePlaceholder')}
                        value={filters.startDate}
                        onChange={(date) => { setFilters({ ...filters, startDate: date as Date | null }); }}
                        clearable
                        style={{ minWidth: 150 }}
                    />
                    <DatePickerInput
                        label={t('setup.logs.systemLogs.filters.endDate')}
                        placeholder={t('setup.logs.systemLogs.filters.datePlaceholder')}
                        value={filters.endDate}
                        onChange={(date) => { setFilters({ ...filters, endDate: date as Date | null }); }}
                        clearable
                        style={{ minWidth: 150 }}
                    />
                </Group>
            </Paper>

            <DataTable
                columns={columns}
                data={tableData}
                searchable
                sortable
                pageable
                defaultPageSize={25}
                showExportIcons
                showColumnSettings
                exportTitle={t('setup.logs.systemLogs.title')}
                exportNamespace="global"
                tableId="admin-logs-table"
                emptyMessage={t('setup.logs.systemLogs.table.noLogs')}
            />

            <Modal
                opened={detailsOpen}
                onClose={closeDetails}
                title={t('setup.logs.systemLogs.modal.title')}
                size="lg"
            >
                {selectedLog && (
                    <Box>
                        <Group mb="md">
                            <Badge color={getStatusColor(selectedLog.status)}>
                                {selectedLog.status === 'SUCCESS' ? t('setup.logs.systemLogs.status.success') : selectedLog.status === 'FAILURE' ? t('setup.logs.systemLogs.status.failure') : t('setup.logs.systemLogs.status.error')}
                            </Badge>
                            <Text c="dimmed">
                                {new Date(selectedLog.createdAt).toLocaleString()}
                            </Text>
                        </Group>

                        {selectedLog.errorMessage && (
                            <Paper p="xs" bg="red.1" c="red" mb="md">
                                <Text fw={500}>{t('setup.logs.systemLogs.modal.error')}</Text>
                                <Text>{selectedLog.errorMessage}</Text>
                            </Paper>
                        )}

                        <Text fw={500} mb="xs">{t('setup.logs.systemLogs.modal.details')}</Text>
                        <Code block>
                            {JSON.stringify(selectedLog.details, null, 2)}
                        </Code>
                    </Box>
                )}
            </Modal>
        </Container>
    );
}
