'use client';

import { useState } from 'react';
import {
  Paper,
  Table,
  Badge,
  Text,
  Stack,
  Loader,
  Pagination,
  Group,
} from '@mantine/core';
import { useLicensePayments } from '@/hooks/useLicensePayments';
import { useTranslation } from '@/lib/i18n/client';
import { useCurrency } from '@/hooks/useCurrency';
import dayjs from 'dayjs';

interface LicensePaymentHistoryProps {
  locale: string;
  licenseId: string;
}

export function LicensePaymentHistory({ locale, licenseId }: LicensePaymentHistoryProps) {
  const { t } = useTranslation('modules/license');
  const { t: tGlobal } = useTranslation('global');
  const { formatCurrency } = useCurrency();
  const [page, setPage] = useState(1);
  const [pageSize] = useState<number>(10);

  const { data, isLoading, error } = useLicensePayments(licenseId, {
    page,
    pageSize,
  });

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
        <Text c="red">{error instanceof Error ? error.message : 'Failed to load payments'}</Text>
      </Paper>
    );
  }

  if (!data || data.payments.length === 0) {
    return (
      <Paper shadow="sm" p="md" radius="md">
        <Text c="dimmed" ta="center">
          {t('payments.notFound')}
        </Text>
      </Paper>
    );
  }

  return (
    <Stack gap="md">
      <Paper shadow="sm" p="md" radius="md">
        <Table>
          <Table.Thead>
            <Table.Tr>
              <Table.Th>{t('payments.table.amount')}</Table.Th>
              <Table.Th>{t('payments.table.currency')}</Table.Th>
              <Table.Th>{t('payments.table.paymentMethod')}</Table.Th>
              <Table.Th>{t('payments.table.paymentDate')}</Table.Th>
              <Table.Th>{t('payments.table.status')}</Table.Th>
              <Table.Th>{t('payments.table.approvedAt')}</Table.Th>
            </Table.Tr>
          </Table.Thead>
          <Table.Tbody>
            {data.payments.map((payment: { id: string; amount: number; currency: string; paymentMethod: string; paymentDate: Date; status: string; approvedAt?: Date | null }) => (
              <Table.Tr key={payment.id}>
                <Table.Td>
                  <Text fw={500}>
                    {formatCurrency(payment.amount)}
                  </Text>
                </Table.Td>
                <Table.Td>
                  <Text size="sm">{payment.currency}</Text>
                </Table.Td>
                <Table.Td>
                  <Text size="sm">
                    {t(`payments.paymentMethods.${payment.paymentMethod}`) || payment.paymentMethod}
                  </Text>
                </Table.Td>
                <Table.Td>
                  <Text size="sm">{dayjs(payment.paymentDate).format('DD/MM/YYYY')}</Text>
                </Table.Td>
                <Table.Td>
                  <Badge
                    color={
                      payment.status === 'approved'
                        ? 'green'
                        : payment.status === 'pending'
                        ? 'yellow'
                        : 'red'
                    }
                  >
                    {t(`payments.status.${payment.status}`) || payment.status}
                  </Badge>
                </Table.Td>
                <Table.Td>
                  <Text size="sm">
                    {payment.approvedAt ? dayjs(payment.approvedAt).format('DD/MM/YYYY') : '-'}
                  </Text>
                </Table.Td>
              </Table.Tr>
            ))}
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
    </Stack>
  );
}

