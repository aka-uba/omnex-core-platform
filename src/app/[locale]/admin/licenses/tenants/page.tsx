'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
    Container,
    Card,
    Table,
    Group,
    Text,
    Badge,
    ActionIcon,
    Button,
    Menu,
    Modal,
    Stack,
    Select,
    TextInput,
    Progress,
} from '@mantine/core';
import {
    IconPlus,
    IconEdit,
    IconTrash,
    IconDotsVertical,
    IconSearch,
    IconFilter,
    IconEye,
    IconCreditCard,
    IconRefresh,
    IconBuilding,
} from '@tabler/icons-react';
import { CentralPageHeader } from '@/components/headers/CentralPageHeader';
import { showToast } from '@/modules/notifications/components/ToastNotification';
import { useParams, useRouter } from 'next/navigation';
import { formatCurrency } from '@/lib/utils/format';
import { useTranslation } from '@/lib/i18n/client';
import { TenantLicensesSkeleton } from './TenantLicensesSkeleton';

interface TenantLicense {
    id: string;
    tenantId: string;
    packageId: string;
    licenseKey?: string;
    startDate: string;
    endDate: string;
    trialEndDate?: string;
    status: string;
    paymentStatus: string;
    totalPaid: number;
    currentUsers: number;
    currentStorage: number;
    autoRenew: boolean;
    tenant?: {
        id: string;
        name: string;
        slug: string;
    };
    package?: {
        id: string;
        name: string;
        basePrice: number;
        currency: string;
        maxUsers?: number;
        maxStorage?: number;
    };
}

export default function TenantLicensesPage() {
    const { t } = useTranslation('global');
    const router = useRouter();
    const params = useParams();
    const locale = params?.locale as string || 'tr';
    const queryClient = useQueryClient();
    const [deleteModalOpen, setDeleteModalOpen] = useState(false);
    const [selectedLicense, setSelectedLicense] = useState<TenantLicense | null>(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState<string | null>(null);

    const { data: licenses, isLoading } = useQuery<TenantLicense[]>({
        queryKey: ['tenant-licenses', statusFilter],
        queryFn: async () => {
            let url = '/api/admin/tenant-licenses?pageSize=100';
            if (statusFilter) url += `&status=${statusFilter}`;
            const response = await fetch(url);
            const data = await response.json();
            // API returns { licenses: [...], total, page, pageSize }
            return data.success ? (data.data?.licenses || []) : [];
        },
    });

    const deleteMutation = useMutation({
        mutationFn: async (id: string) => {
            const response = await fetch(`/api/admin/tenant-licenses/${id}`, {
                method: 'DELETE',
            });
            return response.json();
        },
        onSuccess: (data) => {
            if (data.success) {
                queryClient.invalidateQueries({ queryKey: ['tenant-licenses'] });
                showToast({
                    type: 'success',
                    title: t('notifications.success.title'),
                    message: t('licenses.notifications.deleted'),
                });
            } else {
                showToast({
                    type: 'error',
                    title: t('notifications.error.title'),
                    message: data.error || t('licenses.notifications.deleteFailed'),
                });
            }
            setDeleteModalOpen(false);
            setSelectedLicense(null);
        },
    });

    const filteredLicenses = licenses?.filter((license) => {
        if (!searchQuery) return true;
        const query = searchQuery.toLowerCase();
        return (
            license.tenant?.name?.toLowerCase().includes(query) ||
            license.tenant?.slug?.toLowerCase().includes(query) ||
            license.package?.name?.toLowerCase().includes(query) ||
            license.licenseKey?.toLowerCase().includes(query)
        );
    });

    const getDaysRemaining = (endDate: string) => {
        const end = new Date(endDate);
        const now = new Date();
        const diff = Math.ceil((end.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
        return diff;
    };

    const getUserProgress = (license: TenantLicense) => {
        if (!license.package?.maxUsers) return 0;
        return (license.currentUsers / license.package.maxUsers) * 100;
    };

    const getStatusLabel = (status: string) => t(`licenses.status.${status}`) || status;
    const getPaymentStatusLabel = (status: string) => t(`licenses.paymentStatus.${status}`) || status;

    const getStatusColor = (status: string) => {
        const colors: Record<string, string> = {
            trial: 'blue',
            active: 'green',
            expired: 'red',
            suspended: 'orange',
            cancelled: 'gray',
        };
        return colors[status] || 'gray';
    };

    const getPaymentStatusColor = (status: string) => {
        const colors: Record<string, string> = {
            pending: 'yellow',
            paid: 'green',
            failed: 'red',
            refunded: 'gray',
        };
        return colors[status] || 'gray';
    };

    return (
        <Container size="xl" py="md">
            <CentralPageHeader
                title={t('licenses.tenants.title')}
                description={t('licenses.tenants.description')}
                namespace="global"
                icon={<IconBuilding size={32} />}
                breadcrumbs={[
                    { label: 'navigation.dashboard', href: `/${locale}/dashboard`, namespace: 'global' },
                    { label: 'licenses.title', href: `/${locale}/admin/licenses`, namespace: 'global' },
                    { label: 'licenses.tenants.title', namespace: 'global' },
                ]}
                actions={[
                    {
                        label: t('licenses.tenants.assignLicense'),
                        icon: <IconPlus size={16} />,
                        onClick: () => router.push(`/${locale}/admin/licenses/tenants/create`),
                    }
                ]}
            />

            {isLoading ? (
                <TenantLicensesSkeleton />
            ) : (
                <>
                    {/* Filters */}
                    <Card withBorder mt="lg" mb="md" p="sm">
                        <Group>
                            <TextInput
                                placeholder={t('licenses.tenants.searchPlaceholder')}
                                leftSection={<IconSearch size={16} />}
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.currentTarget.value)}
                                style={{ flex: 1 }}
                            />
                            <Select
                                placeholder={t('licenses.tenants.filterStatus')}
                                leftSection={<IconFilter size={16} />}
                                clearable
                                data={[
                                    { value: 'trial', label: t('licenses.status.trial') },
                                    { value: 'active', label: t('licenses.status.active') },
                                    { value: 'expired', label: t('licenses.status.expired') },
                                    { value: 'suspended', label: t('licenses.status.suspended') },
                                    { value: 'cancelled', label: t('licenses.status.cancelled') },
                                ]}
                                value={statusFilter}
                                onChange={setStatusFilter}
                                w={180}
                            />
                        </Group>
                    </Card>

                    <Card withBorder>
                        {filteredLicenses && filteredLicenses.length > 0 ? (
                    <Table striped highlightOnHover>
                        <Table.Thead>
                            <Table.Tr>
                                <Table.Th>{t('licenses.tenants.columns.company')}</Table.Th>
                                <Table.Th>{t('licenses.tenants.columns.package')}</Table.Th>
                                <Table.Th>{t('licenses.tenants.columns.status')}</Table.Th>
                                <Table.Th>{t('licenses.tenants.columns.payment')}</Table.Th>
                                <Table.Th>{t('licenses.tenants.columns.usage')}</Table.Th>
                                <Table.Th>{t('licenses.tenants.columns.endDate')}</Table.Th>
                                <Table.Th w={100}>{t('licenses.tenants.columns.actions')}</Table.Th>
                            </Table.Tr>
                        </Table.Thead>
                        <Table.Tbody>
                            {filteredLicenses.map((license) => {
                                const daysRemaining = getDaysRemaining(license.endDate);
                                const userProgress = getUserProgress(license);

                                return (
                                    <Table.Tr key={license.id}>
                                        <Table.Td>
                                            <Text fw={500}>{license.tenant?.name || '-'}</Text>
                                            <Text size="xs" c="dimmed">{license.tenant?.slug}</Text>
                                        </Table.Td>
                                        <Table.Td>
                                            <Text size="sm">{license.package?.name || '-'}</Text>
                                            <Text size="xs" c="dimmed">
                                                {license.package && formatCurrency(Number(license.package.basePrice), license.package.currency)}
                                            </Text>
                                        </Table.Td>
                                        <Table.Td>
                                            <Badge color={getStatusColor(license.status)} variant="light">
                                                {getStatusLabel(license.status)}
                                            </Badge>
                                            {license.autoRenew && (
                                                <IconRefresh size={14} style={{ marginLeft: 4 }} color="green" />
                                            )}
                                        </Table.Td>
                                        <Table.Td>
                                            <Badge color={getPaymentStatusColor(license.paymentStatus)} variant="outline">
                                                {getPaymentStatusLabel(license.paymentStatus)}
                                            </Badge>
                                        </Table.Td>
                                        <Table.Td>
                                            <Stack gap={4}>
                                                <Group gap={4}>
                                                    <Text size="xs">
                                                        {t('licenses.tenants.usageLabel', {
                                                            current: license.currentUsers,
                                                            max: license.package?.maxUsers || '∞'
                                                        })}
                                                    </Text>
                                                </Group>
                                                {license.package?.maxUsers && (
                                                    <Progress
                                                        value={userProgress}
                                                        size="xs"
                                                        color={userProgress > 80 ? 'red' : userProgress > 60 ? 'yellow' : 'blue'}
                                                    />
                                                )}
                                            </Stack>
                                        </Table.Td>
                                        <Table.Td>
                                            <Text
                                                size="sm"
                                                c={daysRemaining <= 0 ? 'red' : daysRemaining <= 30 ? 'orange' : 'inherit'}
                                            >
                                                {new Date(license.endDate).toLocaleDateString(locale === 'tr' ? 'tr-TR' : 'en-US')}
                                            </Text>
                                            <Text size="xs" c={daysRemaining <= 0 ? 'red' : daysRemaining <= 30 ? 'orange' : 'dimmed'}>
                                                {daysRemaining <= 0
                                                    ? t('licenses.tenants.expired')
                                                    : t('licenses.tenants.daysRemaining', { days: daysRemaining })}
                                            </Text>
                                        </Table.Td>
                                        <Table.Td>
                                            <Menu shadow="md" width={180}>
                                                <Menu.Target>
                                                    <ActionIcon variant="subtle">
                                                        <IconDotsVertical size={16} />
                                                    </ActionIcon>
                                                </Menu.Target>
                                                <Menu.Dropdown>
                                                    <Menu.Item
                                                        leftSection={<IconEye size={14} />}
                                                        onClick={() =>
                                                            router.push(`/${locale}/admin/licenses/tenants/${license.id}`)
                                                        }
                                                    >
                                                        {t('licenses.tenants.menu.details')}
                                                    </Menu.Item>
                                                    <Menu.Item
                                                        leftSection={<IconEdit size={14} />}
                                                        onClick={() =>
                                                            router.push(`/${locale}/admin/licenses/tenants/${license.id}/edit`)
                                                        }
                                                    >
                                                        {t('licenses.tenants.menu.edit')}
                                                    </Menu.Item>
                                                    <Menu.Item
                                                        leftSection={<IconCreditCard size={14} />}
                                                        onClick={() =>
                                                            router.push(`/${locale}/admin/licenses/payments?licenseId=${license.id}`)
                                                        }
                                                    >
                                                        {t('licenses.tenants.menu.payments')}
                                                    </Menu.Item>
                                                    <Menu.Divider />
                                                    <Menu.Item
                                                        color="red"
                                                        leftSection={<IconTrash size={14} />}
                                                        onClick={() => {
                                                            setSelectedLicense(license);
                                                            setDeleteModalOpen(true);
                                                        }}
                                                    >
                                                        {t('licenses.tenants.menu.delete')}
                                                    </Menu.Item>
                                                </Menu.Dropdown>
                                            </Menu>
                                        </Table.Td>
                                    </Table.Tr>
                                );
                            })}
                        </Table.Tbody>
                    </Table>
                        ) : (
                            <Text ta="center" py="xl" c="dimmed">
                                {searchQuery || statusFilter
                                    ? t('licenses.tenants.noFilterResults')
                                    : t('licenses.tenants.noLicenses')}
                            </Text>
                        )}
                    </Card>
                </>
            )}

            {/* Delete Confirmation Modal */}
            <Modal
                opened={deleteModalOpen}
                onClose={() => setDeleteModalOpen(false)}
                title={t('licenses.tenants.deleteTitle')}
                centered
            >
                <Text mb="lg">
                    {t('licenses.tenants.deleteConfirm', { name: selectedLicense?.tenant?.name || '' })}
                </Text>
                <Group justify="flex-end">
                    <Button variant="default" onClick={() => setDeleteModalOpen(false)}>
                        {t('buttons.cancel')}
                    </Button>
                    <Button
                        color="red"
                        loading={deleteMutation.isPending}
                        onClick={() => selectedLicense && deleteMutation.mutate(selectedLicense.id)}
                    >
                        {t('buttons.delete')}
                    </Button>
                </Group>
            </Modal>
        </Container>
    );
}
