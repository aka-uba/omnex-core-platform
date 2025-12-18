'use client';

import { useState, useEffect } from 'react';
import {
    Container,
    Paper,
    Table,
    Group,
    TextInput,
    Select,
    Pagination,
    Badge,
    ActionIcon,
    Text,
    Box,
    Code,
    Modal,
    Alert,
    Skeleton,
    Stack,
} from '@mantine/core';
import { DatePickerInput } from '@mantine/dates';
import { IconDownload, IconRefresh, IconEye, IconFileText, IconAlertCircle } from '@tabler/icons-react';
import { useDisclosure } from '@mantine/hooks';
import { showToast } from '@/modules/notifications/components/ToastNotification';
import { CentralPageHeader } from '@/components/headers/CentralPageHeader';
import { useParams } from 'next/navigation';
import { authenticatedFetchJSON, getAccessToken, getTenantSlug } from '@/lib/api/authenticatedFetch';
import { useTranslation } from '@/lib/i18n/client';

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
    const [loading, setLoading] = useState(false);
    const [total, setTotal] = useState(0);
    const [page, setPage] = useState(1);
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
            const params = new URLSearchParams({
                page: page.toString(),
                limit: '20',
                ...Object.fromEntries(
                    Object.entries(filters).filter(([_, v]) => v !== '' && v !== null)
                ),
            });

            if (filters.startDate) params.append('startDate', filters.startDate.toISOString());
            if (filters.endDate) params.append('endDate', filters.endDate.toISOString());

            const data = await authenticatedFetchJSON(`/api/admin/logs?${params}`);

            if (data.success) {
                setLogs(data.data || []);
                setTotal((data.data as any)?.meta?.total || 0);
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
    }, [page, filters]); // Re-fetch when page or filters change

    const handleExport = async (format: 'csv' | 'json') => {
        try {
            const params = new URLSearchParams({
                format,
                ...Object.fromEntries(
                    Object.entries(filters).filter(([_, v]) => v !== '' && v !== null)
                ),
            });

            // Token'ı URL'e ekle (geçici çözüm - download için)
            const token = getAccessToken();
            if (token) {
                params.append('token', token);
            }
            const tenantSlug = getTenantSlug();
            if (tenantSlug) {
                params.append('tenantSlug', tenantSlug);
            }

            window.open(`/api/admin/logs/export?${params}`, '_blank');
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
                <Group align="end">
                    <TextInput
                        label="Kullanıcı ID"
                        placeholder="Kullanıcı ID'ye göre ara"
                        value={filters.userId}
                        onChange={(e) => setFilters({ ...filters, userId: e.target.value })}
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
                    />
                    <Select
                        label={t('setup.logs.systemLogs.filters.module')}
                        placeholder={t('setup.logs.systemLogs.filters.modulePlaceholder')}
                        data={['auth', 'users', 'tenants', 'backup', 'database', 'admin']}
                        value={filters.module}
                        onChange={(val) => setFilters({ ...filters, module: val || '' })}
                        clearable
                    />
                    <DatePickerInput
                        label={t('setup.logs.systemLogs.filters.startDate')}
                        placeholder={t('setup.logs.systemLogs.filters.datePlaceholder')}
                        value={filters.startDate}
                        onChange={(date) => { setFilters({ ...filters, startDate: date as Date | null }); }}
                        clearable
                    />
                    <DatePickerInput
                        label={t('setup.logs.systemLogs.filters.endDate')}
                        placeholder={t('setup.logs.systemLogs.filters.datePlaceholder')}
                        value={filters.endDate}
                        onChange={(date) => { setFilters({ ...filters, endDate: date as Date | null }); }}
                        clearable
                    />
                </Group>
            </Paper>

            <Paper withBorder>
                {loading ? (
                    <Stack gap="md" p="md">
                        {/* Table Header */}
                        <Group>
                            <Skeleton height={20} width={120} />
                            <Skeleton height={20} width={100} />
                            <Skeleton height={20} width={100} />
                            <Skeleton height={20} width={120} />
                            <Skeleton height={20} width={100} />
                            <Skeleton height={20} width={100} />
                            <Skeleton height={20} width={120} />
                            <Skeleton height={20} width={80} />
                        </Group>

                        {/* Table Rows */}
                        {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((i) => (
                            <Group key={i} gap="md">
                                <Skeleton height={40} width="12%" />
                                <Skeleton height={40} width="12%" />
                                <Skeleton height={40} width="12%" />
                                <Skeleton height={40} width="12%" />
                                <Skeleton height={40} width="12%" />
                                <Skeleton height={40} width="12%" />
                                <Skeleton height={40} width="12%" />
                                <Skeleton height={40} width="12%" />
                            </Group>
                        ))}
                    </Stack>
                ) : (
                    <>
                        <Table striped highlightOnHover>
                    <Table.Thead>
                        <Table.Tr>
                            <Table.Th>{t('setup.logs.systemLogs.table.time')}</Table.Th>
                            <Table.Th>{t('setup.logs.systemLogs.table.action')}</Table.Th>
                            <Table.Th>{t('setup.logs.systemLogs.table.module')}</Table.Th>
                            <Table.Th>{t('setup.logs.systemLogs.table.user')}</Table.Th>
                            <Table.Th>{t('setup.logs.systemLogs.table.tenant')}</Table.Th>
                            <Table.Th>{t('setup.logs.systemLogs.table.status')}</Table.Th>
                            <Table.Th>{t('setup.logs.systemLogs.table.ipAddress')}</Table.Th>
                            <Table.Th>{t('setup.logs.systemLogs.table.details')}</Table.Th>
                        </Table.Tr>
                    </Table.Thead>
                    <Table.Tbody>
                        {logs.map((log) => (
                            <Table.Tr key={log.id}>
                                <Table.Td>{new Date(log.createdAt).toLocaleString()}</Table.Td>
                                <Table.Td><Code>{log.action}</Code></Table.Td>
                                <Table.Td>{log.module}</Table.Td>
                                <Table.Td>{log.userId || '-'}</Table.Td>
                                <Table.Td>{log.tenantSlug || '-'}</Table.Td>
                                <Table.Td>
                                    <Badge color={getStatusColor(log.status)}>{log.status}</Badge>
                                </Table.Td>
                                <Table.Td>{log.ipAddress || '-'}</Table.Td>
                                <Table.Td>
                                    <ActionIcon variant="subtle" onClick={() => {
                                        setSelectedLog(log);
                                        openDetails();
                                    }}>
                                        <IconEye size={16} />
                                    </ActionIcon>
                                </Table.Td>
                            </Table.Tr>
                        ))}
                        {logs.length === 0 && (
                            <Table.Tr>
                                <Table.Td colSpan={8} align="center">{t('setup.logs.systemLogs.table.noLogs')}</Table.Td>
                            </Table.Tr>
                        )}
                    </Table.Tbody>
                </Table>

                        <Group justify="center" p="md">
                            <Pagination
                                total={Math.ceil(total / 20)}
                                value={page}
                                onChange={setPage}
                            />
                        </Group>
                    </>
                )}
            </Paper>

            <Modal
                opened={detailsOpen}
                onClose={closeDetails}
                title={t('setup.logs.systemLogs.modal.title')}
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
