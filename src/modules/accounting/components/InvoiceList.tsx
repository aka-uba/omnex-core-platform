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
import { useInvoices, useDeleteInvoice } from '@/hooks/useInvoices';
import { useSubscriptions } from '@/hooks/useSubscriptions';
import { useTranslation } from '@/lib/i18n/client';
import { useCurrency } from '@/hooks/useCurrency';
import { showToast } from '@/modules/notifications/components/ToastNotification';
import { useConfirmDialog } from '@/hooks/useConfirmDialog';
import { DataTable, DataTableColumn, FilterOption } from '@/components/tables/DataTable';
import type { InvoiceStatus } from '@/modules/accounting/types/subscription';
import dayjs from 'dayjs';

interface InvoiceListProps {
  locale: string;
}

export function InvoiceList({ locale }: InvoiceListProps) {
  const router = useRouter();
  const { t } = useTranslation('modules/accounting');
  const { t: tGlobal } = useTranslation('global');
  const { formatCurrency } = useCurrency();
  const [page, _setPage] = useState(1);
  const [_pageSize] = useState<number>(25);
  const [statusFilter, setStatusFilter] = useState<InvoiceStatus | undefined>();
  const [subscriptionId, setSubscriptionId] = useState<string | undefined>();

  const { data, isLoading, error } = useInvoices({
    page,
    pageSize: 1000, // Get all for client-side filtering
    ...(statusFilter ? { status: statusFilter } : {}),
    ...(subscriptionId ? { subscriptionId } : {}),
  });

  // Fetch subscriptions for filter
  const { data: subscriptionsData } = useSubscriptions({ page: 1, pageSize: 1000 });

  const deleteInvoice = useDeleteInvoice();
  const { confirm, ConfirmDialog } = useConfirmDialog();

  const handleDelete = async (id: string) => {
    const confirmed = await confirm({
      title: t('invoices.delete.title'),
      message: t('invoices.delete.confirm'),
      confirmLabel: tGlobal('common.delete'),
      confirmColor: 'red',
    });

    if (confirmed) {
      try {
        await deleteInvoice.mutateAsync(id);
        showToast({
          type: 'success',
          title: t('messages.success'),
          message: t('invoices.delete.success'),
        });
      } catch (error) {
        showToast({
          type: 'error',
          title: t('messages.error'),
          message: error instanceof Error ? error.message : t('invoices.delete.error'),
        });
      }
    }
  };

  const getStatusBadge = (status: InvoiceStatus) => {
    const statusColors: Record<InvoiceStatus, string> = {
      draft: 'gray',
      sent: 'blue',
      paid: 'green',
      overdue: 'red',
      cancelled: 'gray',
    };
    return (
      <Badge color={statusColors[status] || 'gray'}>
        {t(`invoices.status.${status}`) || status}
      </Badge>
    );
  };

  // DataTable columns
  const columns: DataTableColumn[] = [
    {
      key: 'invoiceNumber',
      label: t('invoices.table.invoiceNumber'),
      sortable: true,
      searchable: true,
      render: (value) => <Text fw={500}>{value}</Text>,
    },
    {
      key: 'invoiceDate',
      label: t('invoices.table.invoiceDate'),
      sortable: true,
      render: (value) => dayjs(value).format('DD.MM.YYYY'),
    },
    {
      key: 'dueDate',
      label: t('invoices.table.dueDate'),
      sortable: true,
      render: (value) => dayjs(value).format('DD.MM.YYYY'),
    },
    {
      key: 'totalAmount',
      label: t('invoices.table.totalAmount'),
      sortable: true,
      render: (value) => formatCurrency(Number(value)),
    },
    {
      key: 'status',
      label: t('invoices.table.status'),
      sortable: true,
      render: (value) => getStatusBadge(value as InvoiceStatus),
    },
    {
      key: 'paidDate',
      label: t('invoices.table.paidDate'),
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
                router.push(`/${locale}/modules/accounting/invoices/${row.id}`);
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
                router.push(`/${locale}/modules/accounting/invoices/${row.id}/edit`);
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
      key: 'status',
      label: t('invoices.filter.status'),
      type: 'select',
      options: [
        { value: 'draft', label: t('invoices.status.draft') },
        { value: 'sent', label: t('invoices.status.sent') },
        { value: 'paid', label: t('invoices.status.paid') },
        { value: 'overdue', label: t('invoices.status.overdue') },
        { value: 'cancelled', label: t('invoices.status.cancelled') },
      ],
    },
    {
      key: 'subscriptionId',
      label: t('invoices.filter.subscription'),
      type: 'select',
      options: subscriptionsData?.subscriptions.map(s => ({ value: s.id, label: s.name })) || [],
    },
    {
      key: 'invoiceDate',
      label: t('invoices.table.invoiceDate'),
      type: 'date',
    },
    {
      key: 'dueDate',
      label: t('invoices.table.dueDate'),
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
        data={data.invoices}
        searchable
        sortable
        pageable
        defaultPageSize={25}
        filters={filters}
        onFilter={(activeFilters) => {
          setStatusFilter(activeFilters.status as InvoiceStatus | undefined);
          setSubscriptionId(activeFilters.subscriptionId as string | undefined);
        }}
        showColumnSettings
        showExportIcons
        exportTitle={t('invoices.title')}
        exportNamespace="modules/accounting"
        tableId="accounting-invoices"
        onRowClick={(row) => router.push(`/${locale}/modules/accounting/invoices/${row.id}`)}
        showAuditHistory={true}
        auditEntityName="Invoice"
        auditIdKey="id"
      />
      <ConfirmDialog />
    </>
  );
}
