'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Paper,
  TextInput,
  Button,
  Table,
  Badge,
  ActionIcon,
  Group,
  Text,
  Pagination,
  Select,
  Stack,
} from '@mantine/core';
import {
  IconSearch,
  IconPlus,
  IconEdit,
  IconTrash,
  IconEye,
  IconPackage,
} from '@tabler/icons-react';
import { useLicensePackages, useDeleteLicensePackage } from '@/hooks/useLicensePackages';
import { useTranslation } from '@/lib/i18n/client';
import { showToast } from '@/modules/notifications/components/ToastNotification';
import { useConfirmDialog } from '@/hooks/useConfirmDialog';
import type { BillingCycle } from '@/modules/license/types/license';
import { DataTableSkeleton } from '@/components/tables/DataTableSkeleton';

interface LicensePackageListProps {
  locale: string;
}

export function LicensePackageList({ locale }: LicensePackageListProps) {
  const router = useRouter();
  const { t } = useTranslation('modules/license');
  const { t: tGlobal } = useTranslation('global');
  const [page, setPage] = useState(1);
  const [pageSize] = useState<number>(10);
  const [search, setSearch] = useState<string>('');
  const [isActiveFilter, setIsActiveFilter] = useState<boolean | undefined>(undefined);
  const [billingCycleFilter, setBillingCycleFilter] = useState<BillingCycle | undefined>();

  const { data, isLoading, error } = useLicensePackages({
    page,
    pageSize,
    ...(search ? { search } : {}),
    ...(isActiveFilter !== undefined ? { isActive: isActiveFilter } : {}),
    ...(billingCycleFilter ? { billingCycle: billingCycleFilter } : {}),
  });

  const deletePackage = useDeleteLicensePackage();
  const { confirm, ConfirmDialog } = useConfirmDialog();

  const handleDelete = async (id: string) => {
    const confirmed = await confirm({
      title: t('packages.delete.title'),
      message: t('packages.delete.confirm'),
      confirmLabel: tGlobal('common.delete'),
      confirmColor: 'red',
    });

    if (confirmed) {
      try {
        await deletePackage.mutateAsync(id);
        showToast({
          type: 'success',
          title: t('messages.success'),
          message: t('packages.delete.success'),
        });
      } catch (error) {
        showToast({
          type: 'error',
          title: t('messages.error'),
          message: error instanceof Error ? error.message : t('packages.delete.error'),
        });
      }
    }
  };

  if (isLoading) {
    return <DataTableSkeleton columns={6} rows={8} />;
  }

  if (error) {
    return (
      <Paper shadow="sm" p="md" radius="md">
        <Text c="red">{error instanceof Error ? error.message : 'Failed to load packages'}</Text>
      </Paper>
    );
  }

  if (!data) {
    return null;
  }

  return (
    <Stack gap="md">
      <Paper shadow="sm" p="md" radius="md">
        <Group justify="space-between" mb="md">
          <TextInput
            placeholder={tGlobal('common.search')}
            leftSection={<IconSearch size={16} />}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ flex: 1, maxWidth: 400 }}
          />
          <Group gap="xs">
            <Select
              placeholder={t('packages.table.isActive')}
              data={[
                { value: 'true', label: tGlobal('common.active') },
                { value: 'false', label: tGlobal('common.inactive') },
              ]}
              {...(isActiveFilter !== undefined ? { value: isActiveFilter.toString() } : {})}
              onChange={(value) => setIsActiveFilter(value === 'true' ? true : value === 'false' ? false : undefined)}
              clearable
              style={{ width: 150 }}
            />
            <Select
              placeholder={t('packages.table.billingCycle')}
              data={[
                { value: 'monthly', label: t('packages.billingCycles.monthly') },
                { value: 'quarterly', label: t('packages.billingCycles.quarterly') },
                { value: 'yearly', label: t('packages.billingCycles.yearly') },
              ]}
              {...(billingCycleFilter ? { value: billingCycleFilter } : {})}
              onChange={(value) => setBillingCycleFilter(value as BillingCycle | undefined)}
              clearable
              style={{ width: 150 }}
            />
            <Button
              leftSection={<IconPlus size={18} />}
              onClick={() => router.push(`/${locale}/admin/licenses/create`)}
            >
              {t('packages.create')}
            </Button>
          </Group>
        </Group>
      </Paper>

      <Paper p="md">
        <Table>
          <Table.Thead>
            <Table.Tr>
              <Table.Th>{t('packages.table.name')}</Table.Th>
              <Table.Th>{t('packages.table.description')}</Table.Th>
              <Table.Th>{t('packages.table.modules')}</Table.Th>
              <Table.Th>{t('packages.table.basePrice')}</Table.Th>
              <Table.Th>{t('packages.table.billingCycle')}</Table.Th>
              <Table.Th>{t('packages.table.maxUsers')}</Table.Th>
              <Table.Th>{t('packages.table.isActive')}</Table.Th>
              <Table.Th>{t('packages.table.actions')}</Table.Th>
            </Table.Tr>
          </Table.Thead>
          <Table.Tbody>
            {data.packages.length === 0 ? (
              <Table.Tr>
                <Table.Td colSpan={8} style={{ textAlign: 'center' }}>
                  <Text c="dimmed" py="xl">
                    {t('packages.notFound')}
                  </Text>
                </Table.Td>
              </Table.Tr>
            ) : (
              data.packages.map((pkg: { id: string; name: string; description?: string | null; modules: string[]; basePrice: number; currency: string; billingCycle: string; maxUsers?: number | null; isActive: boolean }) => (
                <Table.Tr key={pkg.id}>
                  <Table.Td>
                    <Group gap="xs">
                      <IconPackage size={18} />
                      <Text fw={500}>{pkg.name}</Text>
                    </Group>
                  </Table.Td>
                  <Table.Td>
                    <Text size="sm" c="dimmed" lineClamp={1}>
                      {pkg.description || '-'}
                    </Text>
                  </Table.Td>
                  <Table.Td>
                    <Text size="sm">{pkg.modules.length} {tGlobal('common.modules')}</Text>
                  </Table.Td>
                  <Table.Td>
                    <Text fw={500}>
                      {pkg.basePrice.toLocaleString()} {pkg.currency}
                    </Text>
                  </Table.Td>
                  <Table.Td>
                    <Badge variant="light">
                      {t(`packages.billingCycles.${pkg.billingCycle}`) || pkg.billingCycle}
                    </Badge>
                  </Table.Td>
                  <Table.Td>
                    <Text size="sm">{pkg.maxUsers || '-'}</Text>
                  </Table.Td>
                  <Table.Td>
                    <Badge color={pkg.isActive ? 'green' : 'red'}>
                      {pkg.isActive ? (tGlobal('common.active')) : (tGlobal('common.inactive'))}
                    </Badge>
                  </Table.Td>
                  <Table.Td>
                    <Group gap="xs">
                      <ActionIcon
                        variant="subtle"
                        color="blue"
                        onClick={() => router.push(`/${locale}/admin/licenses/${pkg.id}`)}
                      >
                        <IconEye size={18} />
                      </ActionIcon>
                      <ActionIcon
                        variant="subtle"
                        color="gray"
                        onClick={() => router.push(`/${locale}/admin/licenses/${pkg.id}/edit`)}
                      >
                        <IconEdit size={18} />
                      </ActionIcon>
                      <ActionIcon
                        variant="subtle"
                        color="red"
                        onClick={() => handleDelete(pkg.id)}
                        loading={deletePackage.isPending}
                      >
                        <IconTrash size={18} />
                      </ActionIcon>
                    </Group>
                  </Table.Td>
                </Table.Tr>
              ))
            )}
          </Table.Tbody>
        </Table>

        {data.total > 0 && (
          <Group justify="space-between" mt="md">
            <Text size="sm" c="dimmed">
              {tGlobal('common.showing')} {(page - 1) * pageSize + 1} - {Math.min(page * pageSize, data.total)} {tGlobal('common.of')} {data.total}
            </Text>
            <Pagination
              value={page}
              onChange={setPage}
              total={Math.ceil(data.total / pageSize)}
            />
          </Group>
        )}
      </Paper>
      <ConfirmDialog />
    </Stack>
  );
}

