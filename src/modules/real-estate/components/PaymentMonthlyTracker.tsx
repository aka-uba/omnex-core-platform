'use client';

import { useState, useMemo, useCallback } from 'react';
import {
  Paper,
  Grid,
  Text,
  Group,
  Badge,
  Stack,
  Card,
  ActionIcon,
  Loader,
  Select,
  Table,
  ScrollArea,
  Tooltip,
} from '@mantine/core';
import {
  IconChevronLeft,
  IconChevronRight,
  IconCheck,
  IconClock,
  IconAlertCircle,
  IconCurrencyDollar,
  IconX,
} from '@tabler/icons-react';
import { usePayments } from '@/hooks/usePayments';
import { useApartments } from '@/hooks/useApartments';
import { useTranslation } from '@/lib/i18n/client';
import dayjs from 'dayjs';
import 'dayjs/locale/tr';
import 'dayjs/locale/en';

interface PaymentMonthlyTrackerProps {
  locale: string;
}

interface MonthPaymentInfo {
  status: 'paid' | 'pending' | 'overdue' | 'none';
  amount: number;
  dueDate: string | null;
  paidDate: string | null;
  paymentMethod: string | null;
  paymentId: string | null;
}

interface ApartmentRow {
  id: string;
  propertyName: string;
  unitNumber: string;
  floor: string;
  tenantName: string;
  months: Record<number, MonthPaymentInfo>;
}

export function PaymentMonthlyTracker({ locale }: PaymentMonthlyTrackerProps) {
  const { t } = useTranslation('modules/real-estate');
  const { t: tGlobal } = useTranslation('global');

  const [currentYear, setCurrentYear] = useState(dayjs().year());
  const [propertyFilter, setPropertyFilter] = useState<string | null>(null);

  const { data: paymentsData, isLoading: paymentsLoading } = usePayments({
    page: 1,
    pageSize: 1000,
  });

  const { data: apartmentsData, isLoading: apartmentsLoading } = useApartments({
    page: 1,
    pageSize: 1000,
  });

  const isLoading = paymentsLoading || apartmentsLoading;

  // Get unique properties for filter
  const properties = useMemo(() => {
    if (!apartmentsData?.apartments) return [];
    const propertyMap = new Map<string, string>();
    apartmentsData.apartments.forEach((apt: any) => {
      if (apt.property?.id && apt.property?.name) {
        propertyMap.set(apt.property.id, apt.property.name);
      }
    });
    return Array.from(propertyMap.entries()).map(([id, name]) => ({
      value: id,
      label: name,
    }));
  }, [apartmentsData]);

  // Filter payments for current year
  const yearPayments = useMemo(() => {
    if (!paymentsData?.payments) return [];
    return paymentsData.payments.filter((payment: any) => {
      const dueDate = dayjs(payment.dueDate);
      return dueDate.year() === currentYear;
    });
  }, [paymentsData, currentYear]);

  // Build pivot table data
  const tableData = useMemo(() => {
    if (!apartmentsData?.apartments) return [];

    const rows: ApartmentRow[] = [];

    // Filter apartments by property if filter is set
    const filteredApartments = propertyFilter
      ? apartmentsData.apartments.filter((apt: any) => apt.property?.id === propertyFilter)
      : apartmentsData.apartments;

    filteredApartments.forEach((apartment: any) => {
      // Get tenant from current contract
      const activeContract = apartment.contracts?.find((c: any) => c.status === 'active');
      const tenant = activeContract?.tenantRecord;
      const tenantName = tenant
        ? tenant.tenantType === 'company'
          ? tenant.companyName || '-'
          : `${tenant.firstName || ''} ${tenant.lastName || ''}`.trim() || '-'
        : '-';

      // Initialize months
      const months: Record<number, MonthPaymentInfo> = {};
      for (let i = 0; i < 12; i++) {
        months[i] = {
          status: 'none',
          amount: 0,
          dueDate: null,
          paidDate: null,
          paymentMethod: null,
          paymentId: null,
        };
      }

      // Find payments for this apartment
      const apartmentPayments = yearPayments.filter(
        (p: any) => p.apartmentId === apartment.id
      );

      apartmentPayments.forEach((payment: any) => {
        const month = dayjs(payment.dueDate).month();
        const isPastDue = dayjs(payment.dueDate).isBefore(dayjs()) && payment.status === 'pending';

        months[month] = {
          status: payment.status === 'paid' ? 'paid' : isPastDue ? 'overdue' : payment.status,
          amount: Number(payment.totalAmount || payment.amount),
          dueDate: payment.dueDate,
          paidDate: payment.paidDate,
          paymentMethod: payment.paymentMethod,
          paymentId: payment.id,
        };
      });

      rows.push({
        id: apartment.id,
        propertyName: apartment.property?.name || '-',
        unitNumber: apartment.unitNumber,
        floor: apartment.floor || '-',
        tenantName,
        months,
      });
    });

    // Sort by property name and unit number
    rows.sort((a, b) => {
      const propCompare = a.propertyName.localeCompare(b.propertyName);
      if (propCompare !== 0) return propCompare;
      return a.unitNumber.localeCompare(b.unitNumber);
    });

    return rows;
  }, [apartmentsData, yearPayments, propertyFilter]);

  // Calculate summary statistics
  const summary = useMemo(() => {
    const total = yearPayments.length;
    const paid = yearPayments.filter((p: any) => p.status === 'paid').length;
    const pending = yearPayments.filter((p: any) => p.status === 'pending').length;
    const overdue = yearPayments.filter((p: any) =>
      p.status === 'overdue' || (p.status === 'pending' && dayjs(p.dueDate).isBefore(dayjs()))
    ).length;

    const totalAmount = yearPayments.reduce((sum: number, p: any) => sum + Number(p.totalAmount || p.amount), 0);
    const paidAmount = yearPayments.filter((p: any) => p.status === 'paid')
      .reduce((sum: number, p: any) => sum + Number(p.totalAmount || p.amount), 0);

    return {
      total,
      paid,
      pending,
      overdue,
      totalAmount,
      paidAmount,
      collectionRate: total > 0 ? (paid / total) * 100 : 0,
    };
  }, [yearPayments]);

  // Format currency
  const formatCurrency = useCallback((amount: number) => {
    return new Intl.NumberFormat(locale === 'tr' ? 'tr-TR' : 'en-US', {
      style: 'currency',
      currency: 'TRY',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  }, [locale]);

  // Navigate years
  const navigatePrevious = useCallback(() => {
    setCurrentYear(prev => prev - 1);
  }, []);

  const navigateNext = useCallback(() => {
    setCurrentYear(prev => prev + 1);
  }, []);

  // Get month names
  const monthNames = useMemo(() => {
    return Array.from({ length: 12 }, (_, i) =>
      dayjs().month(i).locale(locale).format('MMM')
    );
  }, [locale]);

  // Render cell based on payment status
  const renderCell = (info: MonthPaymentInfo, monthIndex: number) => {
    if (info.status === 'none') {
      return (
        <Text size="xs" c="dimmed" ta="center">-</Text>
      );
    }

    const statusColors = {
      paid: 'green',
      pending: 'yellow',
      overdue: 'red',
    };

    const statusIcons = {
      paid: <IconCheck size={12} />,
      pending: <IconClock size={12} />,
      overdue: <IconAlertCircle size={12} />,
    };

    const tooltipContent = (
      <Stack gap={4}>
        <Text size="xs">{formatCurrency(info.amount)}</Text>
        <Text size="xs">{t(`payments.status.${info.status}`)}</Text>
        {info.dueDate && (
          <Text size="xs">{t('table.dueDate')}: {dayjs(info.dueDate).format('DD.MM.YYYY')}</Text>
        )}
        {info.paidDate && (
          <Text size="xs">{t('table.paidDate')}: {dayjs(info.paidDate).format('DD.MM.YYYY')}</Text>
        )}
        {info.paymentMethod && (
          <Text size="xs">{t('table.paymentMethod')}: {t(`payments.methods.${info.paymentMethod}`) || info.paymentMethod}</Text>
        )}
      </Stack>
    );

    return (
      <Tooltip label={tooltipContent} multiline w={200}>
        <Badge
          size="sm"
          color={statusColors[info.status]}
          variant="filled"
          leftSection={statusIcons[info.status]}
          style={{ cursor: 'pointer', width: '100%' }}
        >
          {formatCurrency(info.amount).replace('₺', '').trim()}
        </Badge>
      </Tooltip>
    );
  };

  if (isLoading) {
    return (
      <Paper shadow="xs" p="md">
        <Loader />
      </Paper>
    );
  }

  return (
    <Stack gap="md">
      {/* Year Navigation and Filters */}
      <Paper shadow="xs" p="md">
        <Group justify="space-between">
          <Group>
            <ActionIcon variant="subtle" onClick={navigatePrevious} size="lg">
              <IconChevronLeft size={24} />
            </ActionIcon>
            <Text size="xl" fw={700}>
              {currentYear}
            </Text>
            <ActionIcon variant="subtle" onClick={navigateNext} size="lg">
              <IconChevronRight size={24} />
            </ActionIcon>
          </Group>
          <Select
            placeholder={t('payments.monthlyTracker.allProperties') || 'Tüm Gayrimenkuller'}
            value={propertyFilter}
            onChange={setPropertyFilter}
            data={properties}
            clearable
            w={250}
          />
        </Group>
      </Paper>

      {/* Summary Cards */}
      <Grid>
        <Grid.Col span={{ base: 12, sm: 6, md: 3 }}>
          <Card shadow="sm" padding="lg" radius="md" withBorder>
            <Group justify="space-between">
              <div>
                <Text size="xs" c="dimmed" tt="uppercase" fw={700}>
                  {t('payments.monthlyTracker.totalPayments')}
                </Text>
                <Text size="xl" fw={700} mt="xs">
                  {summary.total}
                </Text>
                <Text size="sm" c="dimmed">
                  {formatCurrency(summary.totalAmount)}
                </Text>
              </div>
              <IconCurrencyDollar size={32} color="var(--mantine-color-blue-6)" />
            </Group>
          </Card>
        </Grid.Col>

        <Grid.Col span={{ base: 12, sm: 6, md: 3 }}>
          <Card shadow="sm" padding="lg" radius="md" withBorder>
            <Group justify="space-between">
              <div>
                <Text size="xs" c="dimmed" tt="uppercase" fw={700}>
                  {t('payments.monthlyTracker.paidPayments')}
                </Text>
                <Text size="xl" fw={700} mt="xs" c="green">
                  {summary.paid}
                </Text>
                <Text size="sm" c="dimmed">
                  {formatCurrency(summary.paidAmount)}
                </Text>
              </div>
              <IconCheck size={32} color="var(--mantine-color-green-6)" />
            </Group>
          </Card>
        </Grid.Col>

        <Grid.Col span={{ base: 12, sm: 6, md: 3 }}>
          <Card shadow="sm" padding="lg" radius="md" withBorder>
            <Group justify="space-between">
              <div>
                <Text size="xs" c="dimmed" tt="uppercase" fw={700}>
                  {t('payments.monthlyTracker.pendingPayments')}
                </Text>
                <Text size="xl" fw={700} mt="xs" c="yellow">
                  {summary.pending}
                </Text>
              </div>
              <IconClock size={32} color="var(--mantine-color-yellow-6)" />
            </Group>
          </Card>
        </Grid.Col>

        <Grid.Col span={{ base: 12, sm: 6, md: 3 }}>
          <Card shadow="sm" padding="lg" radius="md" withBorder>
            <Group justify="space-between">
              <div>
                <Text size="xs" c="dimmed" tt="uppercase" fw={700}>
                  {t('payments.monthlyTracker.overduePayments')}
                </Text>
                <Text size="xl" fw={700} mt="xs" c="red">
                  {summary.overdue}
                </Text>
                <Text size="sm" c="dimmed">
                  {t('payments.monthlyTracker.collectionRate')}: {summary.collectionRate.toFixed(0)}%
                </Text>
              </div>
              <IconAlertCircle size={32} color="var(--mantine-color-red-6)" />
            </Group>
          </Card>
        </Grid.Col>
      </Grid>

      {/* Pivot Table */}
      <Paper shadow="xs" p="md">
        <ScrollArea>
          <Table striped highlightOnHover withTableBorder withColumnBorders style={{ minWidth: 1400 }}>
            <Table.Thead>
              <Table.Tr>
                <Table.Th style={{ position: 'sticky', left: 0, backgroundColor: 'var(--mantine-color-body)', zIndex: 1, minWidth: 150 }}>
                  {t('table.property')}
                </Table.Th>
                <Table.Th style={{ position: 'sticky', left: 150, backgroundColor: 'var(--mantine-color-body)', zIndex: 1, minWidth: 80 }}>
                  {t('table.unit')}
                </Table.Th>
                <Table.Th style={{ position: 'sticky', left: 230, backgroundColor: 'var(--mantine-color-body)', zIndex: 1, minWidth: 60 }}>
                  {t('table.floor')}
                </Table.Th>
                <Table.Th style={{ position: 'sticky', left: 290, backgroundColor: 'var(--mantine-color-body)', zIndex: 1, minWidth: 150 }}>
                  {t('table.tenant')}
                </Table.Th>
                {monthNames.map((month, index) => (
                  <Table.Th key={index} ta="center" style={{ minWidth: 85 }}>
                    {month}
                  </Table.Th>
                ))}
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {tableData.length === 0 ? (
                <Table.Tr>
                  <Table.Td colSpan={16} ta="center">
                    <Text c="dimmed" py="xl">{t('payments.monthlyTracker.noData') || 'Veri bulunamadı'}</Text>
                  </Table.Td>
                </Table.Tr>
              ) : (
                tableData.map((row) => (
                  <Table.Tr key={row.id}>
                    <Table.Td style={{ position: 'sticky', left: 0, backgroundColor: 'var(--mantine-color-body)', zIndex: 1 }}>
                      <Text size="sm" fw={500}>{row.propertyName}</Text>
                    </Table.Td>
                    <Table.Td style={{ position: 'sticky', left: 150, backgroundColor: 'var(--mantine-color-body)', zIndex: 1 }}>
                      <Text size="sm">{row.unitNumber}</Text>
                    </Table.Td>
                    <Table.Td style={{ position: 'sticky', left: 230, backgroundColor: 'var(--mantine-color-body)', zIndex: 1 }}>
                      <Text size="sm">{row.floor}</Text>
                    </Table.Td>
                    <Table.Td style={{ position: 'sticky', left: 290, backgroundColor: 'var(--mantine-color-body)', zIndex: 1 }}>
                      <Text size="sm" lineClamp={1}>{row.tenantName}</Text>
                    </Table.Td>
                    {Array.from({ length: 12 }, (_, i) => (
                      <Table.Td key={i} ta="center" p={4}>
                        {renderCell(row.months[i], i)}
                      </Table.Td>
                    ))}
                  </Table.Tr>
                ))
              )}
            </Table.Tbody>
          </Table>
        </ScrollArea>
      </Paper>

      {/* Legend */}
      <Paper shadow="xs" p="sm">
        <Group gap="md">
          <Group gap="xs">
            <Badge color="green" size="sm" leftSection={<IconCheck size={10} />}>{t('payments.status.paid')}</Badge>
          </Group>
          <Group gap="xs">
            <Badge color="yellow" size="sm" leftSection={<IconClock size={10} />}>{t('payments.status.pending')}</Badge>
          </Group>
          <Group gap="xs">
            <Badge color="red" size="sm" leftSection={<IconAlertCircle size={10} />}>{t('payments.status.overdue')}</Badge>
          </Group>
          <Group gap="xs">
            <Text size="sm" c="dimmed">- : {t('payments.monthlyTracker.noPayment') || 'Ödeme Yok'}</Text>
          </Group>
        </Group>
      </Paper>
    </Stack>
  );
}
