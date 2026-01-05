'use client';

import { useState } from 'react';
import {
  Paper,
  Badge,
  Group,
  Text,
  Loader,
  Modal,
  ActionIcon,
  Tooltip,
} from '@mantine/core';
import {
  IconEdit,
  IconTrash,
  IconEye,
} from '@tabler/icons-react';
import { useAccountingPayments } from '@/hooks/useAccountingPayments';
import { useInvoices } from '@/hooks/useInvoices';
import { useSubscriptions } from '@/hooks/useSubscriptions';
import { useTranslation } from '@/lib/i18n/client';
import { useCurrency } from '@/hooks/useCurrency';
import { DataTable, DataTableColumn, FilterOption } from '@/components/tables/DataTable';
import type { PaymentMethod, PaymentStatus } from '@/modules/accounting/types/subscription';
import dayjs from 'dayjs';
import { PaymentForm } from './PaymentForm';

interface PaymentListProps {
  locale: string;
  paymentType?: 'incoming' | 'outgoing';
}

export function PaymentList({ locale, paymentType }: PaymentListProps) {
  const { t } = useTranslation('modules/accounting');
  const { t: tGlobal } = useTranslation('global');
  const { formatCurrency } = useCurrency();
  const [invoiceId, setInvoiceId] = useState<string | undefined>();
  const [subscriptionId, setSubscriptionId] = useState<string | undefined>();
  const [statusFilter, setStatusFilter] = useState<PaymentStatus | undefined>();
  const [paymentMethodFilter, setPaymentMethodFilter] = useState<PaymentMethod | undefined>();
  const [createModalOpened, setCreateModalOpened] = useState(false);

  const { data, isLoading, error } = useAccountingPayments({
    page: 1,
    pageSize: 1000,
    ...(invoiceId ? { invoiceId } : {}),
    ...(subscriptionId ? { subscriptionId } : {}),
    ...(statusFilter ? { status: statusFilter } : {}),
    ...(paymentMethodFilter ? { paymentMethod: paymentMethodFilter } : {}),
    ...(paymentType ? { paymentType } : {}),
  });

  // Fetch invoices and subscriptions for filters
  const { data: invoicesData } = useInvoices({ page: 1, pageSize: 1000 });
  const { data: subscriptionsData } = useSubscriptions({ page: 1, pageSize: 1000 });

  const getStatusBadge = (status: PaymentStatus) => {
    const statusColors: Record<PaymentStatus, string> = {
      pending: 'yellow',
      completed: 'green',
      failed: 'red',
      cancelled: 'gray',
    };
    return (
      <Badge color={statusColors[status] || 'gray'}>
        {t(`payments.status.${status}`) || status}
      </Badge>
    );
  };

  // DataTable columns
  const columns: DataTableColumn[] = [
    {
      key: 'amount',
      label: t('payments.table.amount'),
      sortable: true,
      render: (value) => (
        <Text fw={500}>
          {formatCurrency(Number(value))}
        </Text>
      ),
    },
    {
      key: 'paymentDate',
      label: t('payments.table.paymentDate'),
      sortable: true,
      render: (value) => dayjs(value).format('DD.MM.YYYY'),
    },
    {
      key: 'paymentMethod',
      label: t('payments.table.paymentMethod'),
      sortable: true,
      render: (value) => t(`payments.methods.${value}`) || value,
    },
    {
      key: 'status',
      label: t('payments.table.status'),
      sortable: true,
      render: (value) => getStatusBadge(value as PaymentStatus),
    },
    {
      key: 'reference',
      label: t('payments.table.reference'),
      sortable: false,
      render: (_, row) => row.invoice?.invoiceNumber || row.subscription?.name || '-',
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
                // TODO: Add payment detail page
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
                // TODO: Add payment edit page
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
                // TODO: Add delete handler
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
      label: t('payments.filter.status'),
      type: 'select',
      options: [
        { value: 'pending', label: t('payments.status.pending') },
        { value: 'completed', label: t('payments.status.completed') },
        { value: 'failed', label: t('payments.status.failed') },
        { value: 'cancelled', label: t('payments.status.cancelled') },
      ],
    },
    {
      key: 'paymentMethod',
      label: t('payments.filter.paymentMethod'),
      type: 'select',
      options: [
        { value: 'cash', label: t('payments.methods.cash') },
        { value: 'bank_transfer', label: t('payments.methods.bank_transfer') },
        { value: 'card', label: t('payments.methods.card') },
        { value: 'check', label: t('payments.methods.check') },
        { value: 'other', label: t('payments.methods.other') },
      ],
    },
    {
      key: 'invoiceId',
      label: t('payments.filter.invoice'),
      type: 'select',
      options: invoicesData?.invoices.map(i => ({ value: i.id, label: i.invoiceNumber })) || [],
    },
    {
      key: 'subscriptionId',
      label: t('payments.filter.subscription'),
      type: 'select',
      options: subscriptionsData?.subscriptions.map(s => ({ value: s.id, label: s.name })) || [],
    },
    {
      key: 'paymentDate',
      label: t('payments.table.paymentDate'),
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
        data={data.payments}
        searchable
        sortable
        pageable
        defaultPageSize={25}
        filters={filters}
        onFilter={(activeFilters) => {
          setStatusFilter(activeFilters.status as PaymentStatus | undefined);
          setPaymentMethodFilter(activeFilters.paymentMethod as PaymentMethod | undefined);
          setInvoiceId(activeFilters.invoiceId as string | undefined);
          setSubscriptionId(activeFilters.subscriptionId as string | undefined);
        }}
        showColumnSettings
        showExportIcons
        exportTitle={t('payments.title')}
        exportNamespace="modules/accounting"
        tableId="accounting-payments"
        showAuditHistory={true}
        auditEntityName="AccountingPayment"
        auditIdKey="id"
      />

      <Modal
        opened={createModalOpened}
        onClose={() => setCreateModalOpened(false)}
        title={t('payments.create')}
        size="xl"
      >
        <PaymentForm
          locale={locale}
          onSuccess={() => {
            setCreateModalOpened(false);
          }}
        />
      </Modal>
    </>
  );
}
