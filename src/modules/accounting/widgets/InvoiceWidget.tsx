/**
 * Accounting Module - Invoice Widget for Web Builder (FAZ 3)
 * Displays a list of invoices in a web page
 */

'use client';

import { Card, Table, Badge, Text } from '@mantine/core';
import { useTranslation } from '@/lib/i18n/client';
import { useCurrency } from '@/hooks/useCurrency';
import { useInvoices } from '@/hooks/useInvoices';
import type { InvoiceWidgetConfig } from './widgets.types';
import type { Invoice } from '@/modules/accounting/types/subscription';

interface InvoiceWidgetProps {
  config: InvoiceWidgetConfig;
}

export function InvoiceWidget({ config }: InvoiceWidgetProps) {
  const { t } = useTranslation('modules/accounting');
  const { t: tGlobal } = useTranslation('global');
  const { formatCurrency } = useCurrency();
  const { data: invoicesData, isLoading } = useInvoices({
    page: 1,
    pageSize: config.limit || 10,
    ...(config.status && config.status !== 'all' ? { status: config.status as 'draft' | 'sent' | 'paid' | 'overdue' | 'cancelled' } : {}),
  });

  const invoices = invoicesData?.invoices || [];

  return (
    <Card withBorder padding="md" radius="md">
      {config.title && (
        <Card.Section withBorder inheritPadding py="xs">
          <Text fw={600} size="lg">
            {config.title}
          </Text>
        </Card.Section>
      )}

      <Card.Section inheritPadding py="md">
        {isLoading ? (
          <Text c="dimmed">{tGlobal('loading')}</Text>
        ) : invoices.length === 0 ? (
          <Text c="dimmed">{t('invoices.empty.noInvoices')}</Text>
        ) : (
          <Table striped highlightOnHover>
            <Table.Thead>
              <Table.Tr>
                <Table.Th>{t('invoices.table.invoiceNumber')}</Table.Th>
                <Table.Th>{t('invoices.table.invoiceDate')}</Table.Th>
                <Table.Th>{t('invoices.table.customer')}</Table.Th>
                <Table.Th>{t('invoices.table.totalAmount')}</Table.Th>
                <Table.Th>{t('invoices.table.status')}</Table.Th>
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {invoices.map((invoice: Invoice) => (
                <Table.Tr key={invoice.id}>
                  <Table.Td>{invoice.invoiceNumber || '-'}</Table.Td>
                  <Table.Td>
                    {invoice.invoiceDate
                      ? new Date(invoice.invoiceDate).toLocaleDateString('tr-TR')
                      : '-'}
                  </Table.Td>
                  <Table.Td>
                    {invoice.customerId || '-'}
                  </Table.Td>
                  <Table.Td>
                    {invoice.totalAmount
                      ? formatCurrency(Number(invoice.totalAmount))
                      : '-'}
                  </Table.Td>
                  <Table.Td>
                    <Badge
                      color={
                        invoice.status === 'paid'
                          ? 'green'
                          : invoice.status === 'overdue'
                          ? 'red'
                          : 'yellow'
                      }
                    >
                      {invoice.status === 'paid'
                        ? t('invoices.status.paid')
                        : invoice.status === 'overdue'
                        ? t('invoices.status.overdue')
                        : t('invoices.status.pending')}
                    </Badge>
                  </Table.Td>
                </Table.Tr>
              ))}
            </Table.Tbody>
          </Table>
        )}
      </Card.Section>
    </Card>
  );
}

