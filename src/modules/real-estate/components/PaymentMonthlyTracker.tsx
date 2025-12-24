'use client';

import { useState, useMemo } from 'react';
import {
  Paper,
  Table,
  Text,
  Badge,
  Group,
  Select,
  Stack,
  ScrollArea,
  Tooltip,
  ActionIcon,
  Loader,
  Center,
} from '@mantine/core';
import { IconChevronLeft, IconChevronRight, IconCheck, IconX, IconClock, IconEye } from '@tabler/icons-react';
import { usePayments } from '@/hooks/usePayments';
import { useApartments } from '@/hooks/useApartments';
import { useTranslation } from '@/lib/i18n/client';
import { useRouter } from 'next/navigation';
import dayjs from 'dayjs';

interface PaymentMonthlyTrackerProps {
  locale: string;
}

const MONTHS = [
  'Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran',
  'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık'
];

export function PaymentMonthlyTracker({ locale }: PaymentMonthlyTrackerProps) {
  const router = useRouter();
  const { t } = useTranslation('modules/real-estate');
  const currentYear = dayjs().year();
  const [selectedYear, setSelectedYear] = useState<string>(currentYear.toString());

  // Fetch all payments for the selected year
  const { data: paymentsData, isLoading: paymentsLoading } = usePayments({
    page: 1,
    pageSize: 10000, // Get all payments for the year
  });

  // Fetch all apartments
  const { data: apartmentsData, isLoading: apartmentsLoading } = useApartments({
    page: 1,
    pageSize: 1000,
  });

  // Generate year options (last 3 years + current + next year)
  const yearOptions = useMemo(() => {
    const years = [];
    for (let i = currentYear - 2; i <= currentYear + 1; i++) {
      years.push({ value: i.toString(), label: i.toString() });
    }
    return years;
  }, [currentYear]);

  // Build payment matrix: apartment -> month -> payment status
  const paymentMatrix = useMemo(() => {
    if (!paymentsData?.payments || !apartmentsData?.apartments) return [];

    const year = parseInt(selectedYear);
    const matrix: {
      apartmentId: string;
      apartmentName: string;
      propertyName: string;
      floor: number;
      tenantName: string;
      months: {
        month: number;
        status: 'paid' | 'pending' | 'overdue' | 'none';
        paymentId?: string;
        amount?: number;
        currency?: string;
      }[];
    }[] = [];

    // Group payments by apartment
    const paymentsByApartment = new Map<string, any[]>();
    paymentsData.payments.forEach((payment) => {
      const dueDate = dayjs(payment.dueDate);
      if (dueDate.year() === year && payment.apartmentId) {
        if (!paymentsByApartment.has(payment.apartmentId)) {
          paymentsByApartment.set(payment.apartmentId, []);
        }
        paymentsByApartment.get(payment.apartmentId)!.push(payment);
      }
    });

    // Build matrix for each apartment
    apartmentsData.apartments.forEach((apartment) => {
      const apartmentPayments = paymentsByApartment.get(apartment.id) || [];

      // Only include apartments that have at least one payment in the year
      // or have an active contract
      if (apartmentPayments.length === 0 && apartment.status !== 'rented') {
        return;
      }

      const months = [];
      for (let month = 0; month < 12; month++) {
        const monthPayments = apartmentPayments.filter((p) => {
          const dueDate = dayjs(p.dueDate);
          return dueDate.month() === month;
        });

        if (monthPayments.length > 0) {
          // Find rent payment or first payment
          const payment = monthPayments.find((p) => p.type === 'rent') || monthPayments[0];
          const isPaid = payment.status === 'paid';
          const isOverdue = !isPaid && dayjs(payment.dueDate).isBefore(dayjs(), 'day');

          months.push({
            month,
            status: isPaid ? 'paid' : isOverdue ? 'overdue' : 'pending',
            paymentId: payment.id,
            amount: Number(payment.totalAmount),
            currency: payment.currency || 'TRY',
          });
        } else {
          months.push({
            month,
            status: 'none' as const,
          });
        }
      }

      matrix.push({
        apartmentId: apartment.id,
        apartmentName: apartment.unitNumber || apartment.name || 'N/A',
        propertyName: apartment.property?.name || '-',
        floor: apartment.floor || 0,
        tenantName: apartment.currentContract?.tenant?.name || '-',
        months,
      });
    });

    // Sort by property name, then floor, then apartment name
    matrix.sort((a, b) => {
      if (a.propertyName !== b.propertyName) {
        return a.propertyName.localeCompare(b.propertyName);
      }
      if (a.floor !== b.floor) {
        return a.floor - b.floor;
      }
      return a.apartmentName.localeCompare(b.apartmentName);
    });

    return matrix;
  }, [paymentsData, apartmentsData, selectedYear]);

  // Calculate summary stats
  const summary = useMemo(() => {
    let totalPaid = 0;
    let totalPending = 0;
    let totalOverdue = 0;
    let totalNone = 0;

    paymentMatrix.forEach((row) => {
      row.months.forEach((m) => {
        if (m.status === 'paid') totalPaid++;
        else if (m.status === 'pending') totalPending++;
        else if (m.status === 'overdue') totalOverdue++;
        else totalNone++;
      });
    });

    return { totalPaid, totalPending, totalOverdue, totalNone };
  }, [paymentMatrix]);

  const getStatusBadge = (status: string, amount?: number, currency?: string) => {
    switch (status) {
      case 'paid':
        return (
          <Tooltip label={amount ? `${amount.toLocaleString('tr-TR')} ${currency}` : t('payments.status.paid')}>
            <Badge color="green" size="sm" variant="filled">
              <IconCheck size={12} />
            </Badge>
          </Tooltip>
        );
      case 'pending':
        return (
          <Tooltip label={amount ? `${amount.toLocaleString('tr-TR')} ${currency} - ${t('payments.status.pending')}` : t('payments.status.pending')}>
            <Badge color="yellow" size="sm" variant="filled">
              <IconClock size={12} />
            </Badge>
          </Tooltip>
        );
      case 'overdue':
        return (
          <Tooltip label={amount ? `${amount.toLocaleString('tr-TR')} ${currency} - ${t('payments.status.overdue')}` : t('payments.status.overdue')}>
            <Badge color="red" size="sm" variant="filled">
              <IconX size={12} />
            </Badge>
          </Tooltip>
        );
      default:
        return <Text size="xs" c="dimmed">-</Text>;
    }
  };

  const isLoading = paymentsLoading || apartmentsLoading;

  if (isLoading) {
    return (
      <Center py="xl">
        <Loader size="lg" />
      </Center>
    );
  }

  return (
    <Stack gap="md">
      {/* Header Controls */}
      <Paper p="md" withBorder>
        <Group justify="space-between">
          <Group gap="md">
            <Text fw={600}>{t('payments.monthlyTracker.title')}</Text>
            <Group gap="xs">
              <ActionIcon
                variant="subtle"
                onClick={() => setSelectedYear((parseInt(selectedYear) - 1).toString())}
              >
                <IconChevronLeft size={18} />
              </ActionIcon>
              <Select
                value={selectedYear}
                onChange={(value) => value && setSelectedYear(value)}
                data={yearOptions}
                w={100}
                size="sm"
              />
              <ActionIcon
                variant="subtle"
                onClick={() => setSelectedYear((parseInt(selectedYear) + 1).toString())}
              >
                <IconChevronRight size={18} />
              </ActionIcon>
            </Group>
          </Group>
          <Group gap="md">
            <Group gap="xs">
              <Badge color="green" size="sm">{summary.totalPaid}</Badge>
              <Text size="xs">{t('payments.status.paid')}</Text>
            </Group>
            <Group gap="xs">
              <Badge color="yellow" size="sm">{summary.totalPending}</Badge>
              <Text size="xs">{t('payments.status.pending')}</Text>
            </Group>
            <Group gap="xs">
              <Badge color="red" size="sm">{summary.totalOverdue}</Badge>
              <Text size="xs">{t('payments.status.overdue')}</Text>
            </Group>
          </Group>
        </Group>
      </Paper>

      {/* Monthly Payment Matrix */}
      <Paper withBorder>
        <ScrollArea>
          <Table striped highlightOnHover withTableBorder withColumnBorders>
            <Table.Thead>
              <Table.Tr>
                <Table.Th style={{ minWidth: 120, position: 'sticky', left: 0, background: 'var(--mantine-color-body)', zIndex: 1 }}>
                  {t('table.property')}
                </Table.Th>
                <Table.Th style={{ minWidth: 80, position: 'sticky', left: 120, background: 'var(--mantine-color-body)', zIndex: 1 }}>
                  {t('table.apartment')}
                </Table.Th>
                <Table.Th style={{ minWidth: 120, position: 'sticky', left: 200, background: 'var(--mantine-color-body)', zIndex: 1 }}>
                  {t('table.tenant')}
                </Table.Th>
                {MONTHS.map((month, index) => (
                  <Table.Th key={index} ta="center" style={{ minWidth: 50 }}>
                    {month.substring(0, 3)}
                  </Table.Th>
                ))}
                <Table.Th ta="center" style={{ minWidth: 60 }}>
                  {t('table.actions')}
                </Table.Th>
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {paymentMatrix.length === 0 ? (
                <Table.Tr>
                  <Table.Td colSpan={16} ta="center" py="xl">
                    <Text c="dimmed">{t('payments.monthlyTracker.noData')}</Text>
                  </Table.Td>
                </Table.Tr>
              ) : (
                paymentMatrix.map((row) => (
                  <Table.Tr key={row.apartmentId}>
                    <Table.Td style={{ position: 'sticky', left: 0, background: 'var(--mantine-color-body)', zIndex: 1 }}>
                      <Text size="sm" truncate maw={110}>
                        {row.propertyName}
                      </Text>
                    </Table.Td>
                    <Table.Td style={{ position: 'sticky', left: 120, background: 'var(--mantine-color-body)', zIndex: 1 }}>
                      <Text size="sm" fw={500}>
                        {row.floor > 0 && `K${row.floor}/`}{row.apartmentName}
                      </Text>
                    </Table.Td>
                    <Table.Td style={{ position: 'sticky', left: 200, background: 'var(--mantine-color-body)', zIndex: 1 }}>
                      <Text size="sm" truncate maw={110}>
                        {row.tenantName}
                      </Text>
                    </Table.Td>
                    {row.months.map((monthData, index) => (
                      <Table.Td
                        key={index}
                        ta="center"
                        style={{ cursor: monthData.paymentId ? 'pointer' : 'default' }}
                        onClick={() => {
                          if (monthData.paymentId) {
                            router.push(`/${locale}/modules/real-estate/payments/${monthData.paymentId}`);
                          }
                        }}
                      >
                        {getStatusBadge(monthData.status, monthData.amount, monthData.currency)}
                      </Table.Td>
                    ))}
                    <Table.Td ta="center">
                      <Tooltip label={t('actions.view')}>
                        <ActionIcon
                          variant="subtle"
                          size="sm"
                          onClick={() => router.push(`/${locale}/modules/real-estate/apartments/${row.apartmentId}`)}
                        >
                          <IconEye size={14} />
                        </ActionIcon>
                      </Tooltip>
                    </Table.Td>
                  </Table.Tr>
                ))
              )}
            </Table.Tbody>
          </Table>
        </ScrollArea>
      </Paper>
    </Stack>
  );
}
