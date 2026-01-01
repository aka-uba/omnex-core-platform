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
import { useExpenses, useDeleteExpense } from '@/hooks/useExpenses';
import { useSubscriptions } from '@/hooks/useSubscriptions';
import { useLocations } from '@/hooks/useLocations';
import { useTranslation } from '@/lib/i18n/client';
import { showToast } from '@/modules/notifications/components/ToastNotification';
import { useConfirmDialog } from '@/hooks/useConfirmDialog';
import { DataTable, DataTableColumn, FilterOption } from '@/components/tables/DataTable';
import type { ExpenseType, ExpenseStatus } from '@/modules/accounting/types/subscription';
import dayjs from 'dayjs';

interface ExpenseListProps {
  locale: string;
}

export function ExpenseList({ locale }: ExpenseListProps) {
  const router = useRouter();
  const { t } = useTranslation('modules/accounting');
  const { t: tGlobal } = useTranslation('global');
  const [categoryFilter, setCategoryFilter] = useState<string | undefined>();
  const [typeFilter, setTypeFilter] = useState<ExpenseType | undefined>();
  const [statusFilter, setStatusFilter] = useState<ExpenseStatus | undefined>();
  const [locationId, setLocationId] = useState<string | undefined>();
  const [subscriptionId, setSubscriptionId] = useState<string | undefined>();

  const { data, isLoading, error } = useExpenses({
    page: 1,
    pageSize: 1000, // Get all for client-side filtering
    ...(categoryFilter ? { category: categoryFilter } : {}),
    ...(typeFilter ? { type: typeFilter } : {}),
    ...(statusFilter ? { status: statusFilter } : {}),
    ...(locationId ? { locationId } : {}),
    ...(subscriptionId ? { subscriptionId } : {}),
  });

  // Fetch subscriptions and locations for filters
  const { data: subscriptionsData } = useSubscriptions({ page: 1, pageSize: 1000 });
  const { data: locationsData } = useLocations({ page: 1, pageSize: 1000 });

  const deleteExpense = useDeleteExpense();
  const { confirm, ConfirmDialog } = useConfirmDialog();

  const handleDelete = async (id: string) => {
    const confirmed = await confirm({
      title: t('expenses.delete.title'),
      message: t('expenses.delete.confirm'),
      confirmLabel: tGlobal('common.delete'),
      confirmColor: 'red',
    });

    if (confirmed) {
      try {
        await deleteExpense.mutateAsync(id);
        showToast({
          type: 'success',
          title: t('messages.success'),
          message: t('expenses.delete.success'),
        });
      } catch (error) {
        showToast({
          type: 'error',
          title: t('messages.error'),
          message: error instanceof Error ? error.message : t('expenses.delete.error'),
        });
      }
    }
  };

  const getTypeBadge = (type: ExpenseType) => {
    const typeColors: Record<ExpenseType, string> = {
      operational: 'blue',
      subscription: 'green',
      maintenance: 'orange',
      rent: 'purple',
      utility: 'cyan',
      other: 'gray',
    };
    return (
      <Badge color={typeColors[type] || 'gray'}>
        {t(`expenses.types.${type}`) || type}
      </Badge>
    );
  };

  const getStatusBadge = (status: ExpenseStatus) => {
    const statusColors: Record<ExpenseStatus, string> = {
      pending: 'yellow',
      approved: 'green',
      rejected: 'red',
    };
    return (
      <Badge color={statusColors[status] || 'gray'}>
        {t(`expenses.status.${status}`) || status}
      </Badge>
    );
  };

  // DataTable columns
  const columns: DataTableColumn[] = [
    {
      key: 'name',
      label: t('expenses.table.name'),
      sortable: true,
      searchable: true,
      render: (value) => <Text fw={500}>{value}</Text>,
    },
    {
      key: 'category',
      label: t('expenses.table.category'),
      sortable: true,
      searchable: true,
    },
    {
      key: 'type',
      label: t('expenses.table.type'),
      sortable: true,
      render: (value) => getTypeBadge(value as ExpenseType),
    },
    {
      key: 'amount',
      label: t('expenses.table.amount'),
      sortable: true,
      render: (value, row) => Number(value).toLocaleString('tr-TR', {
        style: 'currency',
        currency: row.currency || 'TRY',
      }),
    },
    {
      key: 'expenseDate',
      label: t('expenses.table.expenseDate'),
      sortable: true,
      render: (value) => dayjs(value).format('DD.MM.YYYY'),
    },
    {
      key: 'status',
      label: t('expenses.table.status'),
      sortable: true,
      render: (value) => getStatusBadge(value as ExpenseStatus),
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
                router.push(`/${locale}/modules/accounting/expenses/${row.id}`);
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
                router.push(`/${locale}/modules/accounting/expenses/${row.id}/edit`);
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

  // Get unique categories from data for filter
  const categories = data?.expenses
    ? Array.from(new Set(data.expenses.map(e => e.category))).filter(Boolean)
    : [];

  // Filter options
  const filters: FilterOption[] = [
    {
      key: 'type',
      label: t('expenses.filter.type'),
      type: 'select',
      options: [
        { value: 'operational', label: t('expenses.types.operational') },
        { value: 'subscription', label: t('expenses.types.subscription') },
        { value: 'maintenance', label: t('expenses.types.maintenance') },
        { value: 'rent', label: t('expenses.types.rent') },
        { value: 'utility', label: t('expenses.types.utility') },
        { value: 'other', label: t('expenses.types.other') },
      ],
    },
    {
      key: 'status',
      label: t('expenses.filter.status'),
      type: 'select',
      options: [
        { value: 'pending', label: t('expenses.status.pending') },
        { value: 'approved', label: t('expenses.status.approved') },
        { value: 'rejected', label: t('expenses.status.rejected') },
      ],
    },
    {
      key: 'category',
      label: t('expenses.filter.category'),
      type: 'select',
      options: categories.map(cat => ({ value: cat, label: cat })),
    },
    {
      key: 'locationId',
      label: t('expenses.filter.location'),
      type: 'select',
      options: locationsData?.locations.map(l => ({ value: l.id, label: l.name })) || [],
    },
    {
      key: 'subscriptionId',
      label: t('expenses.filter.subscription'),
      type: 'select',
      options: subscriptionsData?.subscriptions.map(s => ({ value: s.id, label: s.name })) || [],
    },
    {
      key: 'expenseDate',
      label: t('expenses.table.expenseDate'),
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
        data={data.expenses}
        searchable
        sortable
        pageable
        defaultPageSize={25}
        filters={filters}
        onFilter={(activeFilters) => {
          setTypeFilter(activeFilters.type as ExpenseType | undefined);
          setStatusFilter(activeFilters.status as ExpenseStatus | undefined);
          setCategoryFilter(activeFilters.category as string | undefined);
          setLocationId(activeFilters.locationId as string | undefined);
          setSubscriptionId(activeFilters.subscriptionId as string | undefined);
        }}
        showColumnSettings
        showExportIcons
        exportTitle={t('expenses.title')}
        exportNamespace="modules/accounting"
        tableId="accounting-expenses"
        onRowClick={(row) => router.push(`/${locale}/modules/accounting/expenses/${row.id}`)}
        showAuditHistory={true}
        auditEntityName="Expense"
        auditIdKey="id"
      />
      <ConfirmDialog />
    </>
  );
}
