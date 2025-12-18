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
  Menu,
  Loader,
  Tooltip,
} from '@mantine/core';
import {
  IconSearch,
  IconPlus,
  IconEdit,
  IconTrash,
  IconEye,
  IconDownload,
} from '@tabler/icons-react';
import { useSubscriptions, useDeleteSubscription } from '@/hooks/useSubscriptions';
import { useTranslation } from '@/lib/i18n/client';
import { showToast } from '@/modules/notifications/components/ToastNotification';
import { useExport } from '@/lib/export/ExportProvider';
import { useConfirmDialog } from '@/hooks/useConfirmDialog';
import type { SubscriptionType, SubscriptionStatus } from '@/modules/accounting/types/subscription';
import type { ExportFormat } from '@/lib/export/types';
import dayjs from 'dayjs';

interface SubscriptionListProps {
  locale: string;
}

export function SubscriptionList({ locale }: SubscriptionListProps) {
  const router = useRouter();
  const { t } = useTranslation('modules/accounting');
  const { t: tGlobal } = useTranslation('global');
  const { exportToExcel, exportToPDF, exportToCSV, isExporting } = useExport();
  const [page, setPage] = useState(1);
  const [pageSize] = useState<number>(10);
  const [search, setSearch] = useState<string>('');
  const [typeFilter, setTypeFilter] = useState<SubscriptionType | undefined>();
  const [statusFilter, setStatusFilter] = useState<SubscriptionStatus | undefined>();
  const [isActiveFilter, setIsActiveFilter] = useState<boolean | undefined>(undefined);

  const { data, isLoading, error } = useSubscriptions({
    page,
    pageSize,
    ...(search ? { search } : {}),
    ...(typeFilter ? { type: typeFilter } : {}),
    ...(statusFilter ? { status: statusFilter } : {}),
    ...(isActiveFilter !== undefined ? { isActive: isActiveFilter } : {}),
  });

  const deleteSubscription = useDeleteSubscription();
  const { confirm, ConfirmDialog } = useConfirmDialog();

  const handleDelete = async (id: string) => {
    const confirmed = await confirm({
      title: t('subscriptions.delete.title'),
      message: t('subscriptions.delete.confirm'),
      confirmLabel: tGlobal('common.delete'),
      confirmColor: 'red',
    });

    if (confirmed) {
      try {
        await deleteSubscription.mutateAsync(id);
        showToast({
          type: 'success',
          title: t('messages.success'),
          message: t('subscriptions.delete.success'),
        });
      } catch (error) {
        showToast({
          type: 'error',
          title: t('messages.error'),
          message: error instanceof Error ? error.message : t('subscriptions.delete.error'),
        });
      }
    }
  };

  const handleExport = async (format: ExportFormat) => {
    if (!data) return;

    try {
      const exportData = {
        columns: [
          t('subscriptions.table.name'),
          t('subscriptions.table.type'),
          t('subscriptions.table.status'),
          t('subscriptions.table.basePrice'),
          t('subscriptions.table.billingCycle'),
          t('subscriptions.table.startDate'),
          t('subscriptions.table.endDate'),
        ],
        rows: data.subscriptions.map((subscription) => [
          subscription.name,
          t(`subscriptions.types.${subscription.type}`) || subscription.type,
          t(`subscriptions.status.${subscription.status}`) || subscription.status,
          Number(subscription.basePrice).toLocaleString('tr-TR', {
            style: 'currency',
            currency: subscription.currency || 'TRY',
          }),
          t(`subscriptions.billingCycle.${subscription.billingCycle}`) || subscription.billingCycle,
          dayjs(subscription.startDate).format('DD.MM.YYYY'),
          subscription.endDate ? dayjs(subscription.endDate).format('DD.MM.YYYY') : '-',
        ]),
        metadata: {
          title: t('subscriptions.title'),
          description: t('subscriptions.exportDescription'),
          generatedAt: new Date().toISOString(),
        },
      };

      const options = {
        title: t('subscriptions.title'),
        description: t('subscriptions.exportDescription'),
        includeHeader: true,
        includeFooter: true,
        includePageNumbers: true,
        filename: `subscriptions_${dayjs().format('YYYY-MM-DD')}`,
      };

      switch (format) {
        case 'excel':
          await exportToExcel(exportData, options);
          break;
        case 'pdf':
          await exportToPDF(exportData, options);
          break;
        case 'csv':
          await exportToCSV(exportData, options);
          break;
      }

      showToast({
        type: 'success',
        title: t('messages.success'),
        message: t('subscriptions.exportSuccess'),
      });
    } catch (error) {
      showToast({
        type: 'error',
        title: t('messages.error'),
        message: error instanceof Error ? error.message : t('subscriptions.exportError'),
      });
    }
  };

  if (isLoading) {
    return (
      <Paper shadow="sm" p="md" radius="md">
        <Loader />
      </Paper>
    );
  }

  if (error) {
    return (
      <Paper shadow="sm" p="md" radius="md">
        <Text c="red">{tGlobal('common.errorLoading')}</Text>
      </Paper>
    );
  }

  if (!data) {
    return (
      <Paper shadow="sm" p="md" radius="md">
        <Text>{tGlobal('common.noData')}</Text>
      </Paper>
    );
  }

  const getTypeBadge = (type: SubscriptionType) => {
    const typeColors: Record<SubscriptionType, string> = {
      rental: 'blue',
      subscription: 'green',
      commission: 'orange',
    };
    return (
      <Badge color={typeColors[type] || 'gray'}>
        {t(`subscriptions.types.${type}`) || type}
      </Badge>
    );
  };

  const getStatusBadge = (status: SubscriptionStatus) => {
    const statusColors: Record<SubscriptionStatus, string> = {
      active: 'green',
      suspended: 'yellow',
      cancelled: 'red',
    };
    return (
      <Badge color={statusColors[status] || 'gray'}>
        {t(`subscriptions.status.${status}`) || status}
      </Badge>
    );
  };

  return (
    <Paper shadow="sm" p="md" radius="md">
      <Group justify="space-between" mb="md">
        <TextInput
          placeholder={t('search.placeholder')}
          leftSection={<IconSearch size={16} />}
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setPage(1);
          }}
          style={{ flex: 1, maxWidth: 400 }}
        />
        <Group>
          <Select
            placeholder={t('subscriptions.filter.type')}
            data={[
              { value: '', label: t('filter.all') },
              { value: 'rental', label: t('subscriptions.types.rental') },
              { value: 'subscription', label: t('subscriptions.types.subscription') },
              { value: 'commission', label: t('subscriptions.types.commission') },
            ]}
            value={typeFilter || ''}
            onChange={(value) => setTypeFilter(value as SubscriptionType | undefined)}
            clearable
            style={{ width: 150 }}
          />
          <Select
            placeholder={t('subscriptions.filter.status')}
            data={[
              { value: '', label: t('filter.all') },
              { value: 'active', label: t('subscriptions.status.active') },
              { value: 'suspended', label: t('subscriptions.status.suspended') },
              { value: 'cancelled', label: t('subscriptions.status.cancelled') },
            ]}
            value={statusFilter || ''}
            onChange={(value) => setStatusFilter(value as SubscriptionStatus | undefined)}
            clearable
            style={{ width: 150 }}
          />
          <Select
            placeholder={t('filter.status')}
            data={[
              { value: '', label: t('filter.all') },
              { value: 'true', label: t('status.active') },
              { value: 'false', label: t('status.inactive') },
            ]}
            value={isActiveFilter !== undefined ? isActiveFilter.toString() : ''}
            onChange={(value) => setIsActiveFilter(value ? value === 'true' : undefined)}
            clearable
            style={{ width: 150 }}
          />
          <Menu>
            <Menu.Target>
              <Button
                leftSection={<IconDownload size={16} />}
                variant="light"
                loading={isExporting}
              >
                {t('export.title')}
              </Button>
            </Menu.Target>
            <Menu.Dropdown>
              <Menu.Item onClick={() => handleExport('excel')}>
                {t('export.excel')}
              </Menu.Item>
              <Menu.Item onClick={() => handleExport('pdf')}>
                {t('export.pdf')}
              </Menu.Item>
              <Menu.Item onClick={() => handleExport('csv')}>
                {t('export.csv')}
              </Menu.Item>
            </Menu.Dropdown>
          </Menu>
          <Button
            leftSection={<IconPlus size={16} />}
            onClick={() => router.push(`/${locale}/modules/accounting/subscriptions/create`)}
          >
            {t('actions.newSubscription')}
          </Button>
        </Group>
      </Group>

      <Table striped highlightOnHover>
        <Table.Thead>
          <Table.Tr>
            <Table.Th>{t('subscriptions.table.name')}</Table.Th>
            <Table.Th>{t('subscriptions.table.type')}</Table.Th>
            <Table.Th>{t('subscriptions.table.status')}</Table.Th>
            <Table.Th>{t('subscriptions.table.basePrice')}</Table.Th>
            <Table.Th>{t('subscriptions.table.billingCycle')}</Table.Th>
            <Table.Th>{t('subscriptions.table.startDate')}</Table.Th>
            <Table.Th>{t('subscriptions.table.endDate')}</Table.Th>
            <Table.Th>{t('table.actions')}</Table.Th>
          </Table.Tr>
        </Table.Thead>
        <Table.Tbody>
          {data.subscriptions.map((subscription) => (
            <Table.Tr key={subscription.id}>
              <Table.Td>
                <Text fw={500}>{subscription.name}</Text>
              </Table.Td>
              <Table.Td>{getTypeBadge(subscription.type)}</Table.Td>
              <Table.Td>{getStatusBadge(subscription.status)}</Table.Td>
              <Table.Td>
                {Number(subscription.basePrice).toLocaleString('tr-TR', {
                  style: 'currency',
                  currency: subscription.currency || 'TRY',
                })}
              </Table.Td>
              <Table.Td>
                {t(`subscriptions.billingCycle.${subscription.billingCycle}`) || subscription.billingCycle}
              </Table.Td>
              <Table.Td>
                {dayjs(subscription.startDate).format('DD.MM.YYYY')}
              </Table.Td>
              <Table.Td>
                {subscription.endDate ? dayjs(subscription.endDate).format('DD.MM.YYYY') : '-'}
              </Table.Td>
              <Table.Td>
                <Group gap="xs" justify="flex-end">
                  <Tooltip label={t('actions.view')} withArrow>
                    <ActionIcon
                      variant="subtle"
                      color="blue"
                      onClick={() => router.push(`/${locale}/modules/accounting/subscriptions/${subscription.id}`)}
                    >
                      <IconEye size={18} />
                    </ActionIcon>
                  </Tooltip>
                  <Tooltip label={t('actions.edit')} withArrow>
                    <ActionIcon
                      variant="subtle"
                      color="gray"
                      onClick={() => router.push(`/${locale}/modules/accounting/subscriptions/${subscription.id}/edit`)}
                    >
                      <IconEdit size={18} />
                    </ActionIcon>
                  </Tooltip>
                  <Tooltip label={t('actions.delete')} withArrow>
                    <ActionIcon
                      variant="subtle"
                      color="red"
                      onClick={() => handleDelete(subscription.id)}
                    >
                      <IconTrash size={18} />
                    </ActionIcon>
                  </Tooltip>
                </Group>
              </Table.Td>
            </Table.Tr>
          ))}
        </Table.Tbody>
      </Table>

      {data.total > 0 && (
        <Group justify="space-between" mt="md">
          <Text size="sm" c="dimmed">
            {t('pagination.showing')} {(page - 1) * pageSize + 1} - {Math.min(page * pageSize, data.total)} {t('pagination.of')} {data.total}
          </Text>
          <Pagination
            value={page}
            onChange={setPage}
            total={Math.ceil(data.total / pageSize)}
          />
        </Group>
      )}
      <ConfirmDialog />
    </Paper>
  );
}








