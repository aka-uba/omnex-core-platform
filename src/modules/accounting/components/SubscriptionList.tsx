'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Paper,
  Badge,
  ActionIcon,
  Group,
  Text,
  Loader,
  Tooltip,
} from '@mantine/core';
import {
  IconEdit,
  IconTrash,
  IconEye,
} from '@tabler/icons-react';
import { useSubscriptions, useDeleteSubscription } from '@/hooks/useSubscriptions';
import { useTranslation } from '@/lib/i18n/client';
import { useCurrency } from '@/hooks/useCurrency';
import { showToast } from '@/modules/notifications/components/ToastNotification';
import { useConfirmDialog } from '@/hooks/useConfirmDialog';
import { DataTable, DataTableColumn, FilterOption } from '@/components/tables/DataTable';
import type { SubscriptionType, SubscriptionStatus } from '@/modules/accounting/types/subscription';
import dayjs from 'dayjs';

interface SubscriptionListProps {
  locale: string;
}

export function SubscriptionList({ locale }: SubscriptionListProps) {
  const router = useRouter();
  const { t } = useTranslation('modules/accounting');
  const { t: tGlobal } = useTranslation('global');
  const { formatCurrency } = useCurrency();
  const [typeFilter, setTypeFilter] = useState<SubscriptionType | undefined>();
  const [statusFilter, setStatusFilter] = useState<SubscriptionStatus | undefined>();
  const [isActiveFilter, setIsActiveFilter] = useState<boolean | undefined>(undefined);

  const { data, isLoading, error } = useSubscriptions({
    page: 1,
    pageSize: 1000,
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

  // DataTable columns
  const columns: DataTableColumn[] = [
    {
      key: 'name',
      label: t('subscriptions.table.name'),
      sortable: true,
      searchable: true,
      render: (value) => <Text fw={500}>{value}</Text>,
    },
    {
      key: 'type',
      label: t('subscriptions.table.type'),
      sortable: true,
      render: (value) => getTypeBadge(value as SubscriptionType),
    },
    {
      key: 'status',
      label: t('subscriptions.table.status'),
      sortable: true,
      render: (value) => getStatusBadge(value as SubscriptionStatus),
    },
    {
      key: 'basePrice',
      label: t('subscriptions.table.basePrice'),
      sortable: true,
      render: (value) => formatCurrency(Number(value)),
    },
    {
      key: 'billingCycle',
      label: t('subscriptions.table.billingCycle'),
      sortable: true,
      render: (value) => t(`subscriptions.billingCycle.${value}`) || value,
    },
    {
      key: 'startDate',
      label: t('subscriptions.table.startDate'),
      sortable: true,
      render: (value) => dayjs(value).format('DD.MM.YYYY'),
    },
    {
      key: 'endDate',
      label: t('subscriptions.table.endDate'),
      sortable: true,
      render: (value) => value ? dayjs(value).format('DD.MM.YYYY') : '-',
    },
    {
      key: 'actions',
      label: t('table.actions'),
      sortable: false,
      searchable: false,
      render: (_, row) => (
        <Group gap="xs" justify="flex-end">
          <Tooltip label={t('actions.view')} withArrow>
            <ActionIcon
              variant="subtle"
              color="blue"
              onClick={(e) => {
                e.stopPropagation();
                router.push(`/${locale}/modules/accounting/subscriptions/${row.id}`);
              }}
            >
              <IconEye size={18} />
            </ActionIcon>
          </Tooltip>
          <Tooltip label={t('actions.edit')} withArrow>
            <ActionIcon
              variant="subtle"
              color="gray"
              onClick={(e) => {
                e.stopPropagation();
                router.push(`/${locale}/modules/accounting/subscriptions/${row.id}/edit`);
              }}
            >
              <IconEdit size={18} />
            </ActionIcon>
          </Tooltip>
          <Tooltip label={t('actions.delete')} withArrow>
            <ActionIcon
              variant="subtle"
              color="red"
              onClick={(e) => {
                e.stopPropagation();
                handleDelete(row.id);
              }}
            >
              <IconTrash size={18} />
            </ActionIcon>
          </Tooltip>
        </Group>
      ),
    },
  ];

  // Filter options
  const filters: FilterOption[] = [
    {
      key: 'type',
      label: t('subscriptions.filter.type'),
      type: 'select',
      options: [
        { value: 'rental', label: t('subscriptions.types.rental') },
        { value: 'subscription', label: t('subscriptions.types.subscription') },
        { value: 'commission', label: t('subscriptions.types.commission') },
      ],
    },
    {
      key: 'status',
      label: t('subscriptions.filter.status'),
      type: 'select',
      options: [
        { value: 'active', label: t('subscriptions.status.active') },
        { value: 'suspended', label: t('subscriptions.status.suspended') },
        { value: 'cancelled', label: t('subscriptions.status.cancelled') },
      ],
    },
    {
      key: 'isActive',
      label: t('filter.status'),
      type: 'select',
      options: [
        { value: 'true', label: t('status.active') },
        { value: 'false', label: t('status.inactive') },
      ],
    },
    {
      key: 'startDate',
      label: t('subscriptions.table.startDate'),
      type: 'date',
    },
  ];

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

  return (
    <>
      <DataTable
        columns={columns}
        data={data.subscriptions}
        searchable
        sortable
        pageable
        defaultPageSize={25}
        filters={filters}
        onFilter={(activeFilters) => {
          setTypeFilter(activeFilters.type as SubscriptionType | undefined);
          setStatusFilter(activeFilters.status as SubscriptionStatus | undefined);
          setIsActiveFilter(activeFilters.isActive ? activeFilters.isActive === 'true' : undefined);
        }}
        showColumnSettings
        showExportIcons
        exportTitle={t('subscriptions.title')}
        exportNamespace="modules/accounting"
        tableId="accounting-subscriptions"
        onRowClick={(row) => router.push(`/${locale}/modules/accounting/subscriptions/${row.id}`)}
        showAuditHistory={true}
        auditEntityName="Subscription"
        auditIdKey="id"
      />
      <ConfirmDialog />
    </>
  );
}
