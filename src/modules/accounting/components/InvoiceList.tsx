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
import { useInvoices, useDeleteInvoice } from '@/hooks/useInvoices';
import { useSubscriptions } from '@/hooks/useSubscriptions';
import { useTranslation } from '@/lib/i18n/client';
import { showToast } from '@/modules/notifications/components/ToastNotification';
import { useExport } from '@/lib/export/ExportProvider';
import { useConfirmDialog } from '@/hooks/useConfirmDialog';
import type { InvoiceStatus } from '@/modules/accounting/types/subscription';
import type { ExportFormat } from '@/lib/export/types';
import dayjs from 'dayjs';

interface InvoiceListProps {
  locale: string;
}

export function InvoiceList({ locale }: InvoiceListProps) {
  const router = useRouter();
  const { t } = useTranslation('modules/accounting');
  const { t: tGlobal } = useTranslation('global');
  const { exportToExcel, exportToPDF, exportToCSV, isExporting } = useExport();
  const [page, setPage] = useState(1);
  const [pageSize] = useState<number>(10);
  const [search, setSearch] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<InvoiceStatus | undefined>();
  const [subscriptionId, setSubscriptionId] = useState<string | undefined>();

  const { data, isLoading, error } = useInvoices({
    page,
    pageSize,
    ...(search ? { search } : {}),
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

  const handleExport = async (format: ExportFormat) => {
    if (!data) return;

    try {
      const exportData = {
        columns: [
          t('invoices.table.invoiceNumber'),
          t('invoices.table.invoiceDate'),
          t('invoices.table.dueDate'),
          t('invoices.table.totalAmount'),
          t('invoices.table.status'),
          t('invoices.table.paidDate'),
        ],
        rows: data.invoices.map((invoice) => [
          invoice.invoiceNumber,
          dayjs(invoice.invoiceDate).format('DD.MM.YYYY'),
          dayjs(invoice.dueDate).format('DD.MM.YYYY'),
          Number(invoice.totalAmount).toLocaleString('tr-TR', {
            style: 'currency',
            currency: invoice.currency || 'TRY',
          }),
          t(`invoices.status.${invoice.status}`) || invoice.status,
          invoice.paidDate ? dayjs(invoice.paidDate).format('DD.MM.YYYY') : '-',
        ]),
        metadata: {
          title: t('invoices.title'),
          description: t('invoices.exportDescription'),
          generatedAt: new Date().toISOString(),
        },
      };

      const options = {
        title: t('invoices.title'),
        description: t('invoices.exportDescription'),
        includeHeader: true,
        includeFooter: true,
        includePageNumbers: true,
        filename: `invoices_${dayjs().format('YYYY-MM-DD')}`,
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
        message: t('invoices.exportSuccess'),
      });
    } catch (error) {
      showToast({
        type: 'error',
        title: t('messages.error'),
        message: error instanceof Error ? error.message : t('invoices.exportError'),
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

  return (
    <Paper shadow="xs" p="md">
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
            placeholder={t('invoices.filter.subscription')}
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
            placeholder={t('invoices.filter.status')}
            data={[
              { value: '', label: t('filter.all') },
              { value: 'draft', label: t('invoices.status.draft') },
              { value: 'sent', label: t('invoices.status.sent') },
              { value: 'paid', label: t('invoices.status.paid') },
              { value: 'overdue', label: t('invoices.status.overdue') },
              { value: 'cancelled', label: t('invoices.status.cancelled') },
            ]}
            value={statusFilter || ''}
            onChange={(value) => setStatusFilter(value as InvoiceStatus | undefined)}
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
            onClick={() => router.push(`/${locale}/modules/accounting/invoices/create`)}
          >
            {t('actions.newInvoice')}
          </Button>
        </Group>
      </Group>

      <Table striped highlightOnHover>
        <Table.Thead>
          <Table.Tr>
            <Table.Th>{t('invoices.table.invoiceNumber')}</Table.Th>
            <Table.Th>{t('invoices.table.invoiceDate')}</Table.Th>
            <Table.Th>{t('invoices.table.dueDate')}</Table.Th>
            <Table.Th>{t('invoices.table.totalAmount')}</Table.Th>
            <Table.Th>{t('invoices.table.status')}</Table.Th>
            <Table.Th>{t('invoices.table.paidDate')}</Table.Th>
            <Table.Th>{t('table.actions')}</Table.Th>
          </Table.Tr>
        </Table.Thead>
        <Table.Tbody>
          {data.invoices.map((invoice) => (
            <Table.Tr key={invoice.id}>
              <Table.Td>
                <Text fw={500}>{invoice.invoiceNumber}</Text>
              </Table.Td>
              <Table.Td>
                {dayjs(invoice.invoiceDate).format('DD.MM.YYYY')}
              </Table.Td>
              <Table.Td>
                {dayjs(invoice.dueDate).format('DD.MM.YYYY')}
              </Table.Td>
              <Table.Td>
                {Number(invoice.totalAmount).toLocaleString('tr-TR', {
                  style: 'currency',
                  currency: invoice.currency || 'TRY',
                })}
              </Table.Td>
              <Table.Td>{getStatusBadge(invoice.status)}</Table.Td>
              <Table.Td>
                {invoice.paidDate ? dayjs(invoice.paidDate).format('DD.MM.YYYY') : '-'}
              </Table.Td>
              <Table.Td>
                <Group gap="xs" justify="flex-end">
                  <Tooltip label={t('actions.view')} withArrow>
                    <ActionIcon
                      variant="subtle"
                      color="blue"
                      onClick={() => router.push(`/${locale}/modules/accounting/invoices/${invoice.id}`)}
                    >
                      <IconEye size={18} />
                    </ActionIcon>
                  </Tooltip>
                  <Tooltip label={t('actions.edit')} withArrow>
                    <ActionIcon
                      variant="subtle"
                      color="gray"
                      onClick={() => router.push(`/${locale}/modules/accounting/invoices/${invoice.id}/edit`)}
                    >
                      <IconEdit size={18} />
                    </ActionIcon>
                  </Tooltip>
                  <Tooltip label={t('actions.delete')} withArrow>
                    <ActionIcon
                      variant="subtle"
                      color="red"
                      onClick={() => handleDelete(invoice.id)}
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








