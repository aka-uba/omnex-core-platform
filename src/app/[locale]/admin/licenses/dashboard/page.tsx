'use client';

import { useQuery } from '@tanstack/react-query';
import {
    Container,
    Text,
    SimpleGrid,
    Card,
    Group,
    Stack,
    RingProgress,
    ThemeIcon,
    Badge,
    Table,
    Alert,
} from '@mantine/core';
import {
    IconShieldCheck,
    IconPackage,
    IconBuilding,
    IconCreditCard,
    IconClock,
    IconCheck,
} from '@tabler/icons-react';
import { CentralPageHeader } from '@/components/headers/CentralPageHeader';
import { useTranslation } from '@/lib/i18n/client';
import { useParams } from 'next/navigation';
import { LicenseDashboardSkeleton } from './LicenseDashboardSkeleton';

interface DashboardStats {
    totalTypes: number;
    totalPackages: number;
    totalLicenses: number;
    activeLicenses: number;
    trialLicenses: number;
    expiredLicenses: number;
    pendingPayments: number;
    totalRevenue: number;
    expiringThisMonth: number;
}

export default function LicenseDashboardPage() {
    const { t } = useTranslation('global');
    const params = useParams();
    const locale = (params?.locale as string) || 'tr';

    // Fetch dashboard stats
    const { data: stats, isLoading: statsLoading } = useQuery<DashboardStats>({
        queryKey: ['license-dashboard-stats'],
        queryFn: async () => {
            const response = await fetch('/api/admin/licenses/stats');
            const data = await response.json();
            return data.success ? data.data : null;
        },
    });

    // Fetch recent licenses
    const { data: recentLicenses, isLoading: licensesLoading } = useQuery({
        queryKey: ['recent-tenant-licenses'],
        queryFn: async () => {
            const response = await fetch('/api/admin/tenant-licenses?pageSize=5');
            const data = await response.json();
            return data.success ? (data.data?.licenses || []) : [];
        },
    });

    // Fetch expiring licenses
    const { data: expiringLicenses } = useQuery({
        queryKey: ['expiring-licenses'],
        queryFn: async () => {
            const response = await fetch('/api/admin/tenant-licenses?status=active&expiringSoon=true&pageSize=5');
            const data = await response.json();
            return data.success ? (data.data?.licenses || []) : [];
        },
    });

    const statCards = [
        {
            title: t('licenses.dashboard.stats.licenseTypes'),
            value: stats?.totalTypes || 0,
            icon: IconShieldCheck,
            color: 'blue',
        },
        {
            title: t('licenses.dashboard.stats.licensePackages'),
            value: stats?.totalPackages || 0,
            icon: IconPackage,
            color: 'violet',
        },
        {
            title: t('licenses.dashboard.stats.activeLicenses'),
            value: stats?.activeLicenses || 0,
            icon: IconBuilding,
            color: 'green',
        },
        {
            title: t('licenses.dashboard.stats.pendingPayments'),
            value: stats?.pendingPayments || 0,
            icon: IconCreditCard,
            color: 'orange',
        },
    ];

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'active': return 'green';
            case 'trial': return 'blue';
            case 'expired': return 'red';
            case 'suspended': return 'orange';
            case 'cancelled': return 'gray';
            default: return 'gray';
        }
    };

    const getStatusLabel = (status: string) => {
        return t(`licenses.status.${status}`) || status;
    };

    const getPaymentStatusLabel = (status: string) => {
        return t(`licenses.paymentStatus.${status}`) || status;
    };

    const isLoading = statsLoading || licensesLoading;

    return (
        <Container size="xl" py="md">
            <CentralPageHeader
                title={t('licenses.dashboard.title')}
                description={t('licenses.dashboard.description')}
            />

            {isLoading ? (
                <LicenseDashboardSkeleton />
            ) : (
                <>
                    {/* Stats Cards */}
                    <SimpleGrid cols={{ base: 1, sm: 2, lg: 4 }} spacing="lg" mb="xl">
                        {statCards.map((stat) => (
                            <Card key={stat.title} withBorder padding="lg" radius="md">
                                <Group justify="space-between">
                                    <div>
                                        <Text c="dimmed" size="sm" fw={500}>
                                            {stat.title}
                                        </Text>
                                        <Text fw={700} size="xl">
                                            {stat.value}
                                        </Text>
                                    </div>
                                    <ThemeIcon color={stat.color} variant="light" size={48} radius="md">
                                        <stat.icon size={28} />
                                    </ThemeIcon>
                                </Group>
                            </Card>
                        ))}
                    </SimpleGrid>

                    <SimpleGrid cols={{ base: 1, lg: 2 }} spacing="lg">
                        {/* License Status Distribution */}
                        <Card withBorder padding="lg" radius="md">
                            <Text fw={600} mb="md">{t('licenses.dashboard.distribution.title')}</Text>
                            <Group justify="center">
                                <RingProgress
                                    size={180}
                                    thickness={20}
                                    roundCaps
                                    sections={[
                                        { value: ((stats?.activeLicenses || 0) / (stats?.totalLicenses || 1)) * 100, color: 'green', tooltip: t('licenses.dashboard.distribution.active') },
                                        { value: ((stats?.trialLicenses || 0) / (stats?.totalLicenses || 1)) * 100, color: 'blue', tooltip: t('licenses.dashboard.distribution.trial') },
                                        { value: ((stats?.expiredLicenses || 0) / (stats?.totalLicenses || 1)) * 100, color: 'red', tooltip: t('licenses.dashboard.distribution.expired') },
                                    ]}
                                    label={
                                        <div style={{ textAlign: 'center' }}>
                                            <Text size="lg" fw={700}>
                                                {stats?.totalLicenses || 0}
                                            </Text>
                                            <Text size="xs" c="dimmed">{t('licenses.dashboard.distribution.total')}</Text>
                                        </div>
                                    }
                                />
                                <Stack gap="xs">
                                    <Group gap="xs">
                                        <Badge color="green" variant="dot">{t('licenses.dashboard.distribution.active')}: {stats?.activeLicenses || 0}</Badge>
                                    </Group>
                                    <Group gap="xs">
                                        <Badge color="blue" variant="dot">{t('licenses.dashboard.distribution.trial')}: {stats?.trialLicenses || 0}</Badge>
                                    </Group>
                                    <Group gap="xs">
                                        <Badge color="red" variant="dot">{t('licenses.dashboard.distribution.expired')}: {stats?.expiredLicenses || 0}</Badge>
                                    </Group>
                                </Stack>
                            </Group>
                        </Card>

                        {/* Expiring Soon */}
                        <Card withBorder padding="lg" radius="md">
                            <Group justify="space-between" mb="md">
                                <Text fw={600}>{t('licenses.dashboard.expiringSoon.title')}</Text>
                                <Badge color="orange" leftSection={<IconClock size={12} />}>
                                    {t('licenses.dashboard.expiringSoon.count', { count: stats?.expiringThisMonth || 0 })}
                                </Badge>
                            </Group>
                            {expiringLicenses && expiringLicenses.length > 0 ? (
                                <Stack gap="xs">
                                    {expiringLicenses.map((license: any) => (
                                        <Group key={license.id} justify="space-between" p="xs" bg="var(--mantine-color-orange-light)">
                                            <div>
                                                <Text size="sm" fw={500}>{license.tenant?.name || license.tenantId}</Text>
                                                <Text size="xs" c="dimmed">{license.package?.name}</Text>
                                            </div>
                                            <Text size="sm" c="orange">
                                                {new Date(license.endDate).toLocaleDateString(locale === 'tr' ? 'tr-TR' : 'en-US')}
                                            </Text>
                                        </Group>
                                    ))}
                                </Stack>
                            ) : (
                                <Alert color="green" icon={<IconCheck size={16} />}>
                                    {t('licenses.dashboard.expiringSoon.noExpiring')}
                                </Alert>
                            )}
                        </Card>
                    </SimpleGrid>

                    {/* Recent Licenses */}
                    <Card withBorder padding="lg" radius="md" mt="lg">
                        <Text fw={600} mb="md">{t('licenses.dashboard.recentLicenses.title')}</Text>
                        {recentLicenses && recentLicenses.length > 0 ? (
                            <Table striped highlightOnHover>
                                <Table.Thead>
                                    <Table.Tr>
                                        <Table.Th>{t('licenses.dashboard.recentLicenses.columns.company')}</Table.Th>
                                        <Table.Th>{t('licenses.dashboard.recentLicenses.columns.package')}</Table.Th>
                                        <Table.Th>{t('licenses.dashboard.recentLicenses.columns.status')}</Table.Th>
                                        <Table.Th>{t('licenses.dashboard.recentLicenses.columns.endDate')}</Table.Th>
                                        <Table.Th>{t('licenses.dashboard.recentLicenses.columns.payment')}</Table.Th>
                                    </Table.Tr>
                                </Table.Thead>
                                <Table.Tbody>
                                    {recentLicenses.map((license: any) => (
                                        <Table.Tr key={license.id}>
                                            <Table.Td>{license.tenant?.name || license.tenantId}</Table.Td>
                                            <Table.Td>{license.package?.name || '-'}</Table.Td>
                                            <Table.Td>
                                                <Badge color={getStatusColor(license.status)} variant="light">
                                                    {getStatusLabel(license.status)}
                                                </Badge>
                                            </Table.Td>
                                            <Table.Td>{new Date(license.endDate).toLocaleDateString(locale === 'tr' ? 'tr-TR' : 'en-US')}</Table.Td>
                                            <Table.Td>
                                                <Badge
                                                    color={license.paymentStatus === 'paid' ? 'green' : 'orange'}
                                                    variant="light"
                                                >
                                                    {getPaymentStatusLabel(license.paymentStatus)}
                                                </Badge>
                                            </Table.Td>
                                        </Table.Tr>
                                    ))}
                                </Table.Tbody>
                            </Table>
                        ) : (
                            <Text c="dimmed" ta="center">{t('licenses.dashboard.recentLicenses.noLicenses')}</Text>
                        )}
                    </Card>
                </>
            )}
        </Container>
    );
}
