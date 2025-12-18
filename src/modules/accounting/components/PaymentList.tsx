'use client';

import { useState } from 'react';
import {
  Paper,
  Button,
  Table,
  Badge,
  Group,
  Text,
  Pagination,
  Select,
  Menu,
  Loader,
  Modal,
  ActionIcon,
  Tooltip,
} from '@mantine/core';
import {
  IconPlus,
  IconDownload,
  IconEdit,
  IconTrash,
  IconEye,
} from '@tabler/icons-react';
import { useAccountingPayments } from '@/hooks/useAccountingPayments';
import { useInvoices } from '@/hooks/useInvoices';
import { useSubscriptions } from '@/hooks/useSubscriptions';
import { useTranslation } from '@/lib/i18n/client';
import { showToast } from '@/modules/notifications/components/ToastNotification';
import { useExport } from '@/lib/export/ExportProvider';
import type { PaymentMethod, PaymentStatus } from '@/modules/accounting/types/subscription';
import type { ExportFormat } from '@/lib/export/types';
import dayjs from 'dayjs';
import { PaymentForm } from './PaymentForm';

interface PaymentListProps {
  locale: string;
}

export function PaymentList({ locale }: PaymentListProps) {
  const { t } = useTranslation('modules/accounting');
  const { t: tGlobal } = useTranslation('global');
  const { exportToExcel, exportToPDF, exportToCSV, isExporting } = useExport();
  const [page, setPage] = useState(1);
  const [pageSize] = useState<number>(10);
  const [invoiceId, setInvoiceId] = useState<string | undefined>();
  const [subscriptionId, setSubscriptionId] = useState<string | undefined>();
  const [statusFilter, setStatusFilter] = useState<PaymentStatus | undefined>();
  const [paymentMethodFilter, setPaymentMethodFilter] = useState<PaymentMethod | undefined>();
  const [createModalOpened, setCreateModalOpened] = useState(false);

  const { data, isLoading, error } = useAccountingPayments({
    page,
    pageSize,
    ...(invoiceId ? { invoiceId } : {}),
    ...(subscriptionId ? { subscriptionId } : {}),
    ...(statusFilter ? { status: statusFilter } : {}),
    ...(paymentMethodFilter ? { paymentMethod: paymentMethodFilter } : {}),
  });

  // Fetch invoices and subscriptions for filters
  const { data: invoicesData } = useInvoices({ page: 1, pageSize: 1000 });
  const { data: subscriptionsData } = useSubscriptions({ page: 1, pageSize: 1000 });

  const handleExport = async (format: ExportFormat) => {
    if (!data) return;

    try {
      const exportData = {
        columns: [
          t('payments.table.amount'),
          t('payments.table.paymentDate'),
          t('payments.table.paymentMethod'),
          t('payments.table.status'),
          t('payments.table.reference'),
        ],
        rows: data.payments.map((payment) => [
          Number(payment.amount).toLocaleString('tr-TR', {
            style: 'currency',
            currency: payment.currency || 'TRY',
          }),
          dayjs(payment.paymentDate).format('DD.MM.YYYY'),
          t(`payments.methods.${payment.paymentMethod}`) || payment.paymentMethod,
          t(`payments.status.${payment.status}`) || payment.status,
          payment.invoice?.invoiceNumber || payment.subscription?.name || '-',
        ]),
        metadata: {
          title: t('payments.title'),
          description: t('payments.exportDescription'),
          generatedAt: new Date().toISOString(),
        },
      };

      const options = {
        title: t('payments.title'),
        description: t('payments.exportDescription'),
        includeHeader: true,
        includeFooter: true,
        includePageNumbers: true,
        filename: `payments_${dayjs().format('YYYY-MM-DD')}`,
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
        message: t('payments.exportSuccess'),
      });
    } catch (error) {
      showToast({
        type: 'error',
        title: t('messages.error'),
        message: error instanceof Error ? error.message : t('payments.exportError'),
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

  return (
    <>
      <Paper shadow="sm" p="md" radius="md">
        <Group justify="space-between" mb="md">
          <Group>
            <Select
              placeholder={t('payments.filter.invoice')}
              data={[
                { value: '', label: t('filter.all') },
                ...(invoicesData?.invoices.map(i => ({ value: i.id, label: i.invoiceNumber })) || []),
              ]}
              value={invoiceId || ''}
              onChange={(value) => setInvoiceId(value || undefined)}
              clearable
              searchable
              style={{ width: 200 }}
            />
            <Select
              placeholder={t('payments.filter.subscription')}
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
              placeholder={t('payments.filter.status')}
              data={[
                { value: '', label: t('filter.all') },
                { value: 'pending', label: t('payments.status.pending') },
                { value: 'completed', label: t('payments.status.completed') },
                { value: 'failed', label: t('payments.status.failed') },
                { value: 'cancelled', label: t('payments.status.cancelled') },
              ]}
              value={statusFilter || ''}
              onChange={(value) => setStatusFilter(value as PaymentStatus | undefined)}
              clearable
              style={{ width: 150 }}
            />
            <Select
              placeholder={t('payments.filter.paymentMethod')}
              data={[
                { value: '', label: t('filter.all') },
                { value: 'cash', label: t('payments.methods.cash') },
                { value: 'bank_transfer', label: t('payments.methods.bank_transfer') },
                { value: 'card', label: t('payments.methods.card') },
                { value: 'check', label: t('payments.methods.check') },
                { value: 'other', label: t('payments.methods.other') },
              ]}
              value={paymentMethodFilter || ''}
              onChange={(value) => setPaymentMethodFilter(value as PaymentMethod | undefined)}
              clearable
              style={{ width: 150 }}
            />
          </Group>
          <Group>
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
              onClick={() => setCreateModalOpened(true)}
            >
              {t('actions.newPayment') || t('payments.create')}
            </Button>
          </Group>
        </Group>

        <Table striped highlightOnHover>
          <Table.Thead>
            <Table.Tr>
              <Table.Th>{t('payments.table.amount')}</Table.Th>
              <Table.Th>{t('payments.table.paymentDate')}</Table.Th>
              <Table.Th>{t('payments.table.paymentMethod')}</Table.Th>
              <Table.Th>{t('payments.table.status')}</Table.Th>
              <Table.Th>{t('payments.table.reference')}</Table.Th>
              <Table.Th>{t('table.actions')}</Table.Th>
            </Table.Tr>
          </Table.Thead>
          <Table.Tbody>
            {data.payments.map((payment) => (
              <Table.Tr key={payment.id}>
                <Table.Td>
                  <Text fw={500}>
                    {Number(payment.amount).toLocaleString('tr-TR', {
                      style: 'currency',
                      currency: payment.currency || 'TRY',
                    })}
                  </Text>
                </Table.Td>
                <Table.Td>
                  {dayjs(payment.paymentDate).format('DD.MM.YYYY')}
                </Table.Td>
                <Table.Td>
                  {t(`payments.methods.${payment.paymentMethod}`) || payment.paymentMethod}
                </Table.Td>
                <Table.Td>{getStatusBadge(payment.status)}</Table.Td>
                <Table.Td>
                  {payment.invoice?.invoiceNumber || payment.subscription?.name || '-'}
                </Table.Td>
                <Table.Td>
                  <Group gap="xs" justify="flex-end">
                    <Tooltip label={t('actions.view')} withArrow>
                      <ActionIcon
                        variant="subtle"
                        color="blue"
                        onClick={() => {
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
                        onClick={() => {
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
                        onClick={() => {
                          // TODO: Add delete handler
                        }}
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
      </Paper>

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

