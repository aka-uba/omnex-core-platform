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
    Stack,
} from '@mantine/core';
import {
    IconPlus,
    IconEdit,
    IconTrash,
    IconDotsVertical,
    IconStar,
    IconShieldCheck,
} from '@tabler/icons-react';
import { CentralPageHeader } from '@/components/headers/CentralPageHeader';
import { showToast } from '@/modules/notifications/components/ToastNotification';
import { useParams, useRouter } from 'next/navigation';
import { useTranslation } from '@/lib/i18n/client';
import { LicenseTypesSkeleton } from './LicenseTypesSkeleton';
import { AlertModal } from '@/components/modals/AlertModal';

interface LicenseType {
    id: string;
    name: string;
    displayName: string;
    description?: string;
    color?: string;
    icon?: string;
    maxUsers?: number;
    maxStorage?: number;
    maxCompanies?: number;
    features: string[];
    defaultDurationDays: number;
    trialDays: number;
    sortOrder: number;
    isActive: boolean;
    isDefault: boolean;
    _count: {
        packages: number;
    };
}

export default function LicenseTypesPage() {
    const { t } = useTranslation('global');
    const router = useRouter();
    const params = useParams();
    const locale = params?.locale as string || 'tr';
    const queryClient = useQueryClient();
    const [deleteModalOpen, setDeleteModalOpen] = useState(false);
    const [selectedType, setSelectedType] = useState<LicenseType | null>(null);

    const { data: licenseTypes, isLoading } = useQuery<LicenseType[]>({
        queryKey: ['license-types'],
        queryFn: async () => {
            const response = await fetch('/api/admin/license-types?includeInactive=true');
            const data = await response.json();
            return data.success ? data.data : [];
        },
    });

    const toggleActiveMutation = useMutation({
        mutationFn: async ({ id, isActive }: { id: string; isActive: boolean }) => {
            const response = await fetch(`/api/admin/license-types/${id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ isActive }),
            });
            return response.json();
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['license-types'] });
            showToast({
                type: 'success',
                title: t('notifications.success.title'),
                message: t('licenses.notifications.statusUpdated'),
            });
        },
        onError: () => {
            showToast({
                type: 'error',
                title: t('notifications.error.title'),
                message: t('notifications.error.generic'),
            });
        },
    });

    const deleteMutation = useMutation({
        mutationFn: async (id: string) => {
            const response = await fetch(`/api/admin/license-types/${id}`, {
                method: 'DELETE',
            });
            return response.json();
        },
        onSuccess: (data) => {
            if (data.success) {
                queryClient.invalidateQueries({ queryKey: ['license-types'] });
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
            setSelectedType(null);
        },
        onError: () => {
            showToast({
                type: 'error',
                title: t('notifications.error.title'),
                message: t('licenses.notifications.deleteFailed'),
            });
            setDeleteModalOpen(false);
        },
    });

    const handleDelete = (type: LicenseType) => {
        if (type._count.packages > 0) {
            showToast({
                type: 'error',
                title: t('notifications.error.title'),
                message: t('licenses.types.cannotDelete'),
            });
            return;
        }
        setSelectedType(type);
        setDeleteModalOpen(true);
    };

    return (
        <Container size="xl" py="md">
            <CentralPageHeader
                title={t('licenses.types.title')}
                description={t('licenses.types.description')}
                namespace="global"
                icon={<IconShieldCheck size={32} />}
                breadcrumbs={[
                    { label: 'navigation.dashboard', href: `/${locale}/dashboard`, namespace: 'global' },
                    { label: 'licenses.title', href: `/${locale}/admin/licenses`, namespace: 'global' },
                    { label: 'licenses.types.title', namespace: 'global' },
                ]}
                actions={[
                    {
                        label: t('licenses.types.newType'),
                        icon: <IconPlus size={16} />,
                        onClick: () => router.push(`/${locale}/admin/licenses/types/create`),
                    }
                ]}
            />

            {isLoading ? (
                <LicenseTypesSkeleton />
            ) : (
                <Card withBorder mt="lg">
                    {licenseTypes && licenseTypes.length > 0 ? (
                    <Table striped highlightOnHover>
                        <Table.Thead>
                            <Table.Tr>
                                <Table.Th>{t('licenses.types.columns.type')}</Table.Th>
                                <Table.Th>{t('licenses.types.columns.description')}</Table.Th>
                                <Table.Th>{t('licenses.types.columns.limits')}</Table.Th>
                                <Table.Th>{t('licenses.types.columns.duration')}</Table.Th>
                                <Table.Th>{t('licenses.types.columns.packageCount')}</Table.Th>
                                <Table.Th>{t('licenses.types.columns.status')}</Table.Th>
                                <Table.Th w={100}>{t('licenses.types.columns.actions')}</Table.Th>
                            </Table.Tr>
                        </Table.Thead>
                        <Table.Tbody>
                            {licenseTypes.map((type) => (
                                <Table.Tr key={type.id}>
                                    <Table.Td>
                                        <Group gap="xs">
                                            <Badge color={type.color || 'gray'} variant="filled">
                                                {type.displayName}
                                            </Badge>
                                            {type.isDefault && (
                                                <IconStar size={16} color="orange" fill="orange" />
                                            )}
                                        </Group>
                                        <Text size="xs" c="dimmed">{type.name}</Text>
                                    </Table.Td>
                                    <Table.Td>
                                        <Text size="sm" lineClamp={2}>
                                            {type.description || '-'}
                                        </Text>
                                    </Table.Td>
                                    <Table.Td>
                                        <Stack gap={2}>
                                            <Text size="xs">
                                                {t('licenses.types.limits.users')}: {type.maxUsers || t('licenses.types.limits.unlimited')}
                                            </Text>
                                            <Text size="xs">
                                                {t('licenses.types.limits.storage')}: {type.maxStorage ? `${type.maxStorage} GB` : t('licenses.types.limits.unlimited')}
                                            </Text>
                                        </Stack>
                                    </Table.Td>
                                    <Table.Td>
                                        <Stack gap={2}>
                                            <Text size="xs">
                                                {t('licenses.types.duration.days', { days: type.defaultDurationDays })}
                                            </Text>
                                            {type.trialDays > 0 && (
                                                <Text size="xs" c="blue">
                                                    {t('licenses.types.duration.trial', { days: type.trialDays })}
                                                </Text>
                                            )}
                                        </Stack>
                                    </Table.Td>
                                    <Table.Td>
                                        <Badge variant="light">
                                            {t('licenses.types.packagesCount', { count: type._count.packages })}
                                        </Badge>
                                    </Table.Td>
                                    <Table.Td>
                                        <Switch
                                            checked={type.isActive}
                                            onChange={(e) =>
                                                toggleActiveMutation.mutate({
                                                    id: type.id,
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
                                                        router.push(`/${locale}/admin/licenses/types/${type.id}/edit`)
                                                    }
                                                >
                                                    {t('common.edit')}
                                                </Menu.Item>
                                                <Menu.Divider />
                                                <Menu.Item
                                                    color="red"
                                                    leftSection={<IconTrash size={14} />}
                                                    onClick={() => handleDelete(type)}
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
                            {t('licenses.types.noTypes')}
                        </Text>
                    )}
                </Card>
            )}

            <AlertModal
                opened={deleteModalOpen}
                onClose={() => setDeleteModalOpen(false)}
                title={t('licenses.types.deleteTitle')}
                message={t('licenses.types.deleteConfirm', { name: selectedType?.displayName || '' })}
                variant="danger"
                loading={deleteMutation.isPending}
                onConfirm={() => selectedType && deleteMutation.mutate(selectedType.id)}
                confirmLabel={t('buttons.delete')}
                cancelLabel={t('buttons.cancel')}
            />
        </Container>
    );
}
