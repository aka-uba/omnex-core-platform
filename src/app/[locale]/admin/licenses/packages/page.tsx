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
    Menu,
    Switch,
} from '@mantine/core';
import {
    IconPlus,
    IconEdit,
    IconTrash,
    IconDotsVertical,
    IconStar,
    IconPackage,
} from '@tabler/icons-react';
import { CentralPageHeader } from '@/components/headers/CentralPageHeader';
import { showToast } from '@/modules/notifications/components/ToastNotification';
import { useParams, useRouter } from 'next/navigation';
import { formatCurrency } from '@/lib/utils/format';
import { useTranslation } from '@/lib/i18n/client';
import { LicensePackagesSkeleton } from './LicensePackagesSkeleton';
import { AlertModal } from '@/components/modals/AlertModal';

interface LicensePackage {
    id: string;
    name: string;
    description?: string;
    typeId?: string;
    type?: {
        id: string;
        name: string;
        displayName: string;
        color?: string;
    };
    modules: string[];
    basePrice: number;
    currency: string;
    billingCycle: string;
    discountPercent?: number;
    maxUsers?: number;
    maxStorage?: number;
    isActive: boolean;
    isFeatured: boolean;
    sortOrder: number;
    _count?: {
        subscriptions: number;
    };
}

export default function LicensePackagesPage() {
    const { t } = useTranslation('global');
    const router = useRouter();
    const params = useParams();
    const locale = params?.locale as string || 'tr';
    const queryClient = useQueryClient();
    const [deleteModalOpen, setDeleteModalOpen] = useState(false);
    const [selectedPackage, setSelectedPackage] = useState<LicensePackage | null>(null);

    const { data: packages, isLoading } = useQuery<LicensePackage[]>({
        queryKey: ['license-packages'],
        queryFn: async () => {
            const response = await fetch('/api/admin/licenses?pageSize=100');
            const data = await response.json();
            return data.success ? data.data : [];
        },
    });

    const toggleActiveMutation = useMutation({
        mutationFn: async ({ id, isActive }: { id: string; isActive: boolean }) => {
            const response = await fetch(`/api/admin/licenses/${id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ isActive }),
            });
            return response.json();
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['license-packages'] });
            showToast({
                type: 'success',
                title: t('notifications.success.title'),
                message: t('licenses.notifications.statusUpdated'),
            });
        },
    });

    const deleteMutation = useMutation({
        mutationFn: async (id: string) => {
            const response = await fetch(`/api/admin/licenses/${id}`, {
                method: 'DELETE',
            });
            return response.json();
        },
        onSuccess: (data) => {
            if (data.success) {
                queryClient.invalidateQueries({ queryKey: ['license-packages'] });
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
            setSelectedPackage(null);
        },
    });

    const handleDelete = (pkg: LicensePackage) => {
        if (pkg._count && pkg._count.subscriptions > 0) {
            showToast({
                type: 'error',
                title: t('notifications.error.title'),
                message: t('licenses.packages.cannotDelete'),
            });
            return;
        }
        setSelectedPackage(pkg);
        setDeleteModalOpen(true);
    };

    const getBillingCycleLabel = (cycle: string) => {
        return t(`licenses.packages.billingCycles.${cycle}`) || cycle;
    };

    return (
        <Container size="xl" py="md">
            <CentralPageHeader
                title={t('licenses.packages.title')}
                description={t('licenses.packages.description')}
                namespace="global"
                icon={<IconPackage size={32} />}
                breadcrumbs={[
                    { label: 'navigation.dashboard', href: `/${locale}/dashboard`, namespace: 'global' },
                    { label: 'licenses.title', href: `/${locale}/admin/licenses`, namespace: 'global' },
                    { label: 'licenses.packages.title', namespace: 'global' },
                ]}
                actions={[
                    {
                        label: t('licenses.packages.newPackage'),
                        icon: <IconPlus size={16} />,
                        onClick: () => router.push(`/${locale}/admin/licenses/packages/create`),
                    }
                ]}
            />

            {isLoading ? (
                <LicensePackagesSkeleton />
            ) : (
                <Card withBorder mt="lg">
                    {packages && packages.length > 0 ? (
                    <Table striped highlightOnHover>
                        <Table.Thead>
                            <Table.Tr>
                                <Table.Th>{t('licenses.packages.columns.package')}</Table.Th>
                                <Table.Th>{t('licenses.packages.columns.type')}</Table.Th>
                                <Table.Th>{t('licenses.packages.columns.price')}</Table.Th>
                                <Table.Th>{t('licenses.packages.columns.cycle')}</Table.Th>
                                <Table.Th>{t('licenses.packages.columns.modules')}</Table.Th>
                                <Table.Th>{t('licenses.packages.columns.subscriptions')}</Table.Th>
                                <Table.Th>{t('licenses.packages.columns.status')}</Table.Th>
                                <Table.Th w={100}>{t('licenses.packages.columns.actions')}</Table.Th>
                            </Table.Tr>
                        </Table.Thead>
                        <Table.Tbody>
                            {packages.map((pkg) => (
                                <Table.Tr key={pkg.id}>
                                    <Table.Td>
                                        <Group gap="xs">
                                            <Text fw={500}>{pkg.name}</Text>
                                            {pkg.isFeatured && (
                                                <IconStar size={16} color="orange" fill="orange" />
                                            )}
                                        </Group>
                                        {pkg.description && (
                                            <Text size="xs" c="dimmed" lineClamp={1}>
                                                {pkg.description}
                                            </Text>
                                        )}
                                    </Table.Td>
                                    <Table.Td>
                                        {pkg.type ? (
                                            <Badge color={pkg.type.color || 'gray'} variant="light">
                                                {pkg.type.displayName}
                                            </Badge>
                                        ) : (
                                            <Text c="dimmed" size="sm">-</Text>
                                        )}
                                    </Table.Td>
                                    <Table.Td>
                                        <Text fw={600}>
                                            {formatCurrency(Number(pkg.basePrice), pkg.currency)}
                                        </Text>
                                        {pkg.discountPercent && (
                                            <Text size="xs" c="green">
                                                {t('licenses.packages.discount', { percent: pkg.discountPercent })}
                                            </Text>
                                        )}
                                    </Table.Td>
                                    <Table.Td>
                                        <Badge variant="outline">
                                            {getBillingCycleLabel(pkg.billingCycle)}
                                        </Badge>
                                    </Table.Td>
                                    <Table.Td>
                                        <Group gap={4}>
                                            {pkg.modules.slice(0, 3).map((m) => (
                                                <Badge key={m} size="xs" variant="light">
                                                    {m}
                                                </Badge>
                                            ))}
                                            {pkg.modules.length > 3 && (
                                                <Badge size="xs" variant="light" color="gray">
                                                    +{pkg.modules.length - 3}
                                                </Badge>
                                            )}
                                        </Group>
                                    </Table.Td>
                                    <Table.Td>
                                        <Badge variant="light">
                                            {pkg._count?.subscriptions || 0}
                                        </Badge>
                                    </Table.Td>
                                    <Table.Td>
                                        <Switch
                                            checked={pkg.isActive}
                                            onChange={(e) =>
                                                toggleActiveMutation.mutate({
                                                    id: pkg.id,
                                                    isActive: e.currentTarget.checked,
                                                })
                                            }
                                            size="sm"
                                        />
                                    </Table.Td>
                                    <Table.Td>
                                        <Menu shadow="md" width={150}>
                                            <Menu.Target>
                                                <ActionIcon variant="subtle">
                                                    <IconDotsVertical size={16} />
                                                </ActionIcon>
                                            </Menu.Target>
                                            <Menu.Dropdown>
                                                <Menu.Item
                                                    leftSection={<IconEdit size={14} />}
                                                    onClick={() =>
                                                        router.push(`/${locale}/admin/licenses/packages/${pkg.id}/edit`)
                                                    }
                                                >
                                                    {t('common.edit')}
                                                </Menu.Item>
                                                <Menu.Divider />
                                                <Menu.Item
                                                    color="red"
                                                    leftSection={<IconTrash size={14} />}
                                                    onClick={() => handleDelete(pkg)}
                                                >
                                                    {t('buttons.delete')}
                                                </Menu.Item>
                                            </Menu.Dropdown>
                                        </Menu>
                                    </Table.Td>
                                </Table.Tr>
                            ))}
                        </Table.Tbody>
                    </Table>
                    ) : (
                        <Text ta="center" py="xl" c="dimmed">
                            {t('licenses.packages.noPackages')}
                        </Text>
                    )}
                </Card>
            )}

            <AlertModal
                opened={deleteModalOpen}
                onClose={() => setDeleteModalOpen(false)}
                title={t('licenses.packages.deleteTitle')}
                message={t('licenses.packages.deleteConfirm', { name: selectedPackage?.name || '' })}
                variant="danger"
                loading={deleteMutation.isPending}
                onConfirm={() => selectedPackage && deleteMutation.mutate(selectedPackage.id)}
                confirmLabel={t('buttons.delete')}
                cancelLabel={t('buttons.cancel')}
            />
        </Container>
    );
}
