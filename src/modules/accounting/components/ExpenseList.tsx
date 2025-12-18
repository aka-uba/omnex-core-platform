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
import { useExpenses, useDeleteExpense } from '@/hooks/useExpenses';
import { useSubscriptions } from '@/hooks/useSubscriptions';
import { useLocations } from '@/hooks/useLocations';
import { useTranslation } from '@/lib/i18n/client';
import { showToast } from '@/modules/notifications/components/ToastNotification';
import { useExport } from '@/lib/export/ExportProvider';
import { useConfirmDialog } from '@/hooks/useConfirmDialog';
import type { ExpenseType, ExpenseStatus } from '@/modules/accounting/types/subscription';
import type { ExportFormat } from '@/lib/export/types';
import dayjs from 'dayjs';

interface ExpenseListProps {
  locale: string;
}

export function ExpenseList({ locale }: ExpenseListProps) {
  const router = useRouter();
  const { t } = useTranslation('modules/accounting');
  const { t: tGlobal } = useTranslation('global');
  const { exportToExcel, exportToPDF, exportToCSV, isExporting } = useExport();
  const [page, setPage] = useState(1);
  const [pageSize] = useState<number>(10);
  const [search, setSearch] = useState<string>('');
  const [categoryFilter, setCategoryFilter] = useState<string | undefined>();
  const [typeFilter, setTypeFilter] = useState<ExpenseType | undefined>();
  const [statusFilter, setStatusFilter] = useState<ExpenseStatus | undefined>();
  const [locationId, setLocationId] = useState<string | undefined>();
  const [subscriptionId, setSubscriptionId] = useState<string | undefined>();

  const { data, isLoading, error } = useExpenses({
    page,
    pageSize,
    ...(search ? { search } : {}),
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

  const handleExport = async (format: ExportFormat) => {
    if (!data) return;

    try {
      const exportData = {
        columns: [
          t('expenses.table.name'),
          t('expenses.table.category'),
          t('expenses.table.type'),
          t('expenses.table.amount'),
          t('expenses.table.expenseDate'),
          t('expenses.table.status'),
        ],
        rows: data.expenses.map((expense) => [
          expense.name,
          expense.category,
          t(`expenses.types.${expense.type}`) || expense.type,
          Number(expense.amount).toLocaleString('tr-TR', {
            style: 'currency',
            currency: expense.currency || 'TRY',
          }),
          dayjs(expense.expenseDate).format('DD.MM.YYYY'),
          t(`expenses.status.${expense.status}`) || expense.status,
        ]),
        metadata: {
          title: t('expenses.title'),
          description: t('expenses.exportDescription'),
          generatedAt: new Date().toISOString(),
        },
      };

      const options = {
        title: t('expenses.title'),
        description: t('expenses.exportDescription'),
        includeHeader: true,
        includeFooter: true,
        includePageNumbers: true,
        filename: `expenses_${dayjs().format('YYYY-MM-DD')}`,
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
        message: t('expenses.exportSuccess'),
      });
    } catch (error) {
      showToast({
        type: 'error',
        title: t('messages.error'),
        message: error instanceof Error ? error.message : t('expenses.exportError'),
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
            placeholder={t('expenses.filter.location')}
            data={[
              { value: '', label: t('filter.all') },
              ...(locationsData?.locations.map(l => ({ value: l.id, label: l.name })) || []),
            ]}
            value={locationId || ''}
            onChange={(value) => setLocationId(value || undefined)}
            clearable
            style={{ width: 200 }}
          />
          <Select
            placeholder={t('expenses.filter.subscription')}
            data={[
              { value: '', label: t('filter.all') },
              ...(subscriptionsData?.subscriptions.map(s => ({ value: s.id, label: s.name })) || []),
            ]}
            value={subscriptionId || ''}
            onChange={(value) => setSubscriptionId(value || undefined)}
            clearable
            searchable
            style={{ width: 200 }}
          />
          <Select
            placeholder={t('expenses.filter.category')}
            data={[
              { value: '', label: t('filter.all') },
              ...Array.from(new Set(data.expenses.map(e => e.category))).map(cat => ({ value: cat, label: cat })),
            ]}
            value={categoryFilter || ''}
            onChange={(value) => setCategoryFilter(value || undefined)}
            clearable
            style={{ width: 200 }}
          />
          <Select
            placeholder={t('expenses.filter.type')}
            data={[
              { value: '', label: t('filter.all') },
              { value: 'operational', label: t('expenses.types.operational') },
              { value: 'subscription', label: t('expenses.types.subscription') },
              { value: 'maintenance', label: t('expenses.types.maintenance') },
              { value: 'rent', label: t('expenses.types.rent') },
              { value: 'utility', label: t('expenses.types.utility') },
              { value: 'other', label: t('expenses.types.other') },
            ]}
            value={typeFilter || ''}
            onChange={(value) => setTypeFilter(value as ExpenseType | undefined)}
            clearable
            style={{ width: 150 }}
          />
          <Select
            placeholder={t('expenses.filter.status')}
            data={[
              { value: '', label: t('filter.all') },
              { value: 'pending', label: t('expenses.status.pending') },
              { value: 'approved', label: t('expenses.status.approved') },
              { value: 'rejected', label: t('expenses.status.rejected') },
            ]}
            value={statusFilter || ''}
            onChange={(value) => setStatusFilter(value as ExpenseStatus | undefined)}
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
            onClick={() => router.push(`/${locale}/modules/accounting/expenses/create`)}
          >
            {t('actions.newExpense')}
          </Button>
        </Group>
      </Group>

      <Table striped highlightOnHover>
        <Table.Thead>
          <Table.Tr>
            <Table.Th>{t('expenses.table.name')}</Table.Th>
            <Table.Th>{t('expenses.table.category')}</Table.Th>
            <Table.Th>{t('expenses.table.type')}</Table.Th>
            <Table.Th>{t('expenses.table.amount')}</Table.Th>
            <Table.Th>{t('expenses.table.expenseDate')}</Table.Th>
            <Table.Th>{t('expenses.table.status')}</Table.Th>
            <Table.Th>{t('table.actions')}</Table.Th>
          </Table.Tr>
        </Table.Thead>
        <Table.Tbody>
          {data.expenses.map((expense) => (
            <Table.Tr key={expense.id}>
              <Table.Td>
                <Text fw={500}>{expense.name}</Text>
              </Table.Td>
              <Table.Td>{expense.category}</Table.Td>
              <Table.Td>{getTypeBadge(expense.type)}</Table.Td>
              <Table.Td>
                {Number(expense.amount).toLocaleString('tr-TR', {
                  style: 'currency',
                  currency: expense.currency || 'TRY',
                })}
              </Table.Td>
              <Table.Td>
                {dayjs(expense.expenseDate).format('DD.MM.YYYY')}
              </Table.Td>
              <Table.Td>{getStatusBadge(expense.status)}</Table.Td>
              <Table.Td>
                <Group gap="xs" justify="flex-end">
                  <Tooltip label={t('actions.view')} withArrow>
                    <ActionIcon
                      variant="subtle"
                      color="blue"
                      onClick={() => router.push(`/${locale}/modules/accounting/expenses/${expense.id}`)}
                    >
                      <IconEye size={18} />
                    </ActionIcon>
                  </Tooltip>
                  <Tooltip label={t('actions.edit')} withArrow>
                    <ActionIcon
                      variant="subtle"
                      color="gray"
                      onClick={() => router.push(`/${locale}/modules/accounting/expenses/${expense.id}/edit`)}
                    >
                      <IconEdit size={18} />
                    </ActionIcon>
                  </Tooltip>
                  <Tooltip label={t('actions.delete')} withArrow>
                    <ActionIcon
                      variant="subtle"
                      color="red"
                      onClick={() => handleDelete(expense.id)}
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








