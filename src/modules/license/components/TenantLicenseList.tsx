'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Paper,
  Button,
  Table,
  Badge,
  ActionIcon,
  Group,
  Text,
  Pagination,
  Select,
  Loader,
  Stack,
  Tooltip,
} from '@mantine/core';
import {
  IconPlus,
  IconEdit,
  IconTrash,
  IconEye,
  IconUsers,
} from '@tabler/icons-react';
import { useTenantLicenses, useDeleteTenantLicense } from '@/hooks/useTenantLicenses';
import { useTranslation } from '@/lib/i18n/client';
import { showToast } from '@/modules/notifications/components/ToastNotification';
import { useConfirmDialog } from '@/hooks/useConfirmDialog';
import type { LicenseStatus, PaymentStatus } from '@/modules/license/types/license';
import dayjs from 'dayjs';

interface TenantLicenseListProps {
  locale: string;
}

export function TenantLicenseList({ locale }: TenantLicenseListProps) {
  const router = useRouter();
  const { t } = useTranslation('modules/license');
  const { t: tGlobal } = useTranslation('global');
  const [page, setPage] = useState(1);
  const [pageSize] = useState<number>(10);
  const [statusFilter, setStatusFilter] = useState<LicenseStatus | undefined>();
  const [paymentStatusFilter, setPaymentStatusFilter] = useState<PaymentStatus | undefined>();

  const { data, isLoading, error } = useTenantLicenses({
    page,
    pageSize,
    ...(statusFilter ? { status: statusFilter } : {}),
    ...(paymentStatusFilter ? { paymentStatus: paymentStatusFilter } : {}),
  });

  const deleteLicense = useDeleteTenantLicense();
  const { confirm, ConfirmDialog } = useConfirmDialog();

  const handleDelete = async (id: string) => {
    const confirmed = await confirm({
      title: t('tenantLicenses.delete.title'),
      message: t('tenantLicenses.delete.confirm'),
      confirmLabel: tGlobal('common.delete'),
      confirmColor: 'red',
    });

    if (confirmed) {
      try {
        await deleteLicense.mutateAsync(id);
        showToast({
          type: 'success',
          title: t('messages.success'),
          message: t('tenantLicenses.delete.success'),
        });
      } catch (error) {
        showToast({
          type: 'error',
          title: t('messages.error'),
          message: error instanceof Error ? error.message : t('tenantLicenses.delete.error'),
        });
      }
    }
  };

  if (isLoading) {
    return (
      <Paper shadow="sm" p="md" radius="md">
        <Loader size="lg" />
      </Paper>
    );
  }

  if (error) {
    return (
      <Paper shadow="sm" p="md" radius="md">
        <Text c="red">{error instanceof Error ? error.message : 'Failed to load licenses'}</Text>
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
          <Group gap="xs">
            <Select
              placeholder={t('tenantLicenses.table.status')}
              data={[
                { value: 'active', label: t('tenantLicenses.status.active') },
                { value: 'expired', label: t('tenantLicenses.status.expired') },
                { value: 'suspended', label: t('tenantLicenses.status.suspended') },
                { value: 'cancelled', label: t('tenantLicenses.status.cancelled') },
              ]}
              {...(statusFilter ? { value: statusFilter } : {})}
              onChange={(value) => setStatusFilter(value as LicenseStatus | undefined)}
              clearable
              style={{ width: 150 }}
            />
            <Select
              placeholder={t('tenantLicenses.table.paymentStatus')}
              data={[
                { value: 'pending', label: t('tenantLicenses.paymentStatus.pending') },
                { value: 'paid', label: t('tenantLicenses.paymentStatus.paid') },
                { value: 'failed', label: t('tenantLicenses.paymentStatus.failed') },
              ]}
              {...(paymentStatusFilter ? { value: paymentStatusFilter } : {})}
              onChange={(value) => setPaymentStatusFilter(value as PaymentStatus | undefined)}
              clearable
              style={{ width: 150 }}
            />
          </Group>
          <Button
            leftSection={<IconPlus size={18} />}
            onClick={() => router.push(`/${locale}/admin/tenant-licenses/create`)}
          >
            {t('tenantLicenses.create')}
          </Button>
        </Group>
      </Paper>

      <Paper p="md">
        <Table>
          <Table.Thead>
            <Table.Tr>
              <Table.Th>{t('tenantLicenses.table.tenant')}</Table.Th>
              <Table.Th>{t('tenantLicenses.table.package')}</Table.Th>
              <Table.Th>{t('tenantLicenses.table.startDate')}</Table.Th>
              <Table.Th>{t('tenantLicenses.table.endDate')}</Table.Th>
              <Table.Th>{t('tenantLicenses.table.status')}</Table.Th>
              <Table.Th>{t('tenantLicenses.table.paymentStatus')}</Table.Th>
              <Table.Th>{t('tenantLicenses.table.actions')}</Table.Th>
            </Table.Tr>
          </Table.Thead>
          <Table.Tbody>
            {data.licenses.length === 0 ? (
              <Table.Tr>
                <Table.Td colSpan={7} style={{ textAlign: 'center' }}>
                  <Text c="dimmed" py="xl">
                    {t('tenantLicenses.notFound')}
                  </Text>
                </Table.Td>
              </Table.Tr>
            ) : (
              data.licenses.map((license) => (
                <Table.Tr key={license.id}>
                  <Table.Td>
                    <Group gap="xs">
                      <IconUsers size={18} />
                      <Text fw={500}>{license.tenant?.name || license.tenantId}</Text>
                    </Group>
                  </Table.Td>
                  <Table.Td>
                    <Text fw={500}>{license.package?.name || '-'}</Text>
                  </Table.Td>
                  <Table.Td>
                    <Text size="sm">{dayjs(license.startDate).format('DD/MM/YYYY')}</Text>
                  </Table.Td>
                  <Table.Td>
                    <Text size="sm">{dayjs(license.endDate).format('DD/MM/YYYY')}</Text>
                  </Table.Td>
                  <Table.Td>
                    <Badge
                      color={
                        license.status === 'active'
                          ? 'green'
                          : license.status === 'expired'
                          ? 'red'
                          : license.status === 'suspended'
                          ? 'orange'
                          : 'gray'
                      }
                    >
                      {t(`tenantLicenses.status.${license.status}`) || license.status}
                    </Badge>
                  </Table.Td>
                  <Table.Td>
                    <Badge
                      color={
                        license.paymentStatus === 'paid'
                          ? 'green'
                          : license.paymentStatus === 'pending'
                          ? 'yellow'
                          : 'red'
                      }
                    >
                      {t(`tenantLicenses.paymentStatus.${license.paymentStatus}`) || license.paymentStatus}
                    </Badge>
                  </Table.Td>
                  <Table.Td>
                    <Group gap="xs">
                      <Tooltip label={t('actions.view')}>
                        <ActionIcon
                          variant="subtle"
                          color="blue"
                          onClick={() => router.push(`/${locale}/admin/tenant-licenses/${license.id}`)}
                        >
                          <IconEye size={18} />
                        </ActionIcon>
                      </Tooltip>
                      <Tooltip label={t('actions.edit')}>
                        <ActionIcon
                          variant="subtle"
                          color="gray"
                          onClick={() => router.push(`/${locale}/admin/tenant-licenses/${license.id}/edit`)}
                        >
                          <IconEdit size={18} />
                        </ActionIcon>
                      </Tooltip>
                      <Tooltip label={t('actions.delete')}>
                        <ActionIcon
                          variant="subtle"
                          color="red"
                          onClick={() => handleDelete(license.id)}
                          loading={deleteLicense.isPending}
                        >
                          <IconTrash size={18} />
                        </ActionIcon>
                      </Tooltip>
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







