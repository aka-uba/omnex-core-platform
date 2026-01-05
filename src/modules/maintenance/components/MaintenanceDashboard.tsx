'use client';

import { useState, useEffect } from 'react';
import {
  Paper,
  Grid,
  Text,
  Group,
  Badge,
  Stack,
  Card,
  Title,
  Loader,
  Table,
} from '@mantine/core';
import { DatePickerInput } from '@mantine/dates';
import {
  IconTools,
  IconCalendar,
  IconCheck,
  IconTrendingUp,
} from '@tabler/icons-react';
import { useMaintenanceAnalytics } from '@/hooks/useMaintenanceRecords';
import { useTranslation } from '@/lib/i18n/client';
import { useCurrency } from '@/hooks/useCurrency';
import dayjs from 'dayjs';
import 'dayjs/locale/tr';
import 'dayjs/locale/de';
import 'dayjs/locale/ar';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, BarChart, Bar } from 'recharts';
import { ChartTooltip } from '@/components/charts';
import { useRouter } from 'next/navigation';

interface MaintenanceDashboardProps {
  locale: string;
}

export function MaintenanceDashboard({ locale }: MaintenanceDashboardProps) {
  const router = useRouter();
  const { t } = useTranslation('modules/maintenance');
  const { t: tGlobal } = useTranslation('global');
  const { formatCurrency } = useCurrency();
  const [dateFrom, setDateFrom] = useState<Date | null>(dayjs().subtract(12, 'months').toDate());
  const [dateTo, setDateTo] = useState<Date | null>(dayjs().toDate());

  // Set dayjs locale
  useEffect(() => {
    const dayjsLocale = locale === 'tr' ? 'tr' : locale === 'de' ? 'de' : locale === 'ar' ? 'ar' : 'en';
    dayjs.locale(dayjsLocale);
  }, [locale]);

  const { data, isLoading, error } = useMaintenanceAnalytics({
    ...(dateFrom ? { dateFrom } : {}),
    ...(dateTo ? { dateTo } : {}),
  });

  if (isLoading) {
    return (
      <Paper shadow="xs" p="md">
        <Loader />
      </Paper>
    );
  }

  if (error || !data) {
    return (
      <Paper shadow="xs" p="md">
        <Text c="red">{tGlobal('common.errorLoading')}</Text>
      </Paper>
    );
  }

  const { summary, byType, monthlyTrend, upcomingMaintenance, overdueMaintenance } = data;

  // Prepare chart data
  const chartData = monthlyTrend.map((item) => ({
    month: dayjs(item.month).format('MMM YYYY'),
    scheduled: item.scheduled,
    completed: item.completed,
    cost: item.cost,
  }));

  return (
    <Stack gap="md">
      {/* Date Range Filter */}
      <Paper shadow="xs" p="md">
        <Group>
          <DatePickerInput label={t('dashboard.dateFrom')}
            value={dateFrom}
            onChange={(value: string | Date | null) => {
              const date = value instanceof Date ? value : value ? new Date(value as string) : null;
              setDateFrom(date);
            }}
            locale={locale === 'tr' ? 'tr' : locale === 'de' ? 'de' : locale === 'ar' ? 'ar' : 'en'}
            clearable
          />
  <DatePickerInput label={t('dashboard.dateTo')}
            value={dateTo}
            onChange={(value: string | Date | null) => {
              const date = value instanceof Date ? value : value ? new Date(value as string) : null;
              setDateTo(date);
            }}
            locale={locale === 'tr' ? 'tr' : locale === 'de' ? 'de' : locale === 'ar' ? 'ar' : 'en'}
            clearable
          />
        </Group>
      </Paper>

      {/* Summary Cards */}
      <Grid>
        <Grid.Col span={{ base: 12, sm: 6, md: 3 }}>
          <Card shadow="sm" padding="lg" radius="md" withBorder>
            <Group justify="space-between">
              <div>
                <Text size="xs" tt="uppercase" fw={700} c="dimmed">
                  {t('dashboard.totalRecords')}
                </Text>
                <Text fw={700} size="xl">
                  {summary.totalRecords}
                </Text>
              </div>
              <IconTools size={40} stroke={1.5} />
            </Group>
          </Card>
        </Grid.Col>

        <Grid.Col span={{ base: 12, sm: 6, md: 3 }}>
          <Card shadow="sm" padding="lg" radius="md" withBorder>
            <Group justify="space-between">
              <div>
                <Text size="xs" tt="uppercase" fw={700} c="dimmed">
                  {t('dashboard.completed')}
                </Text>
                <Text fw={700} size="xl" c="green">
                  {summary.completed}
                </Text>
              </div>
              <IconCheck size={40} stroke={1.5} color="green" />
            </Group>
          </Card>
        </Grid.Col>

        <Grid.Col span={{ base: 12, sm: 6, md: 3 }}>
          <Card shadow="sm" padding="lg" radius="md" withBorder>
            <Group justify="space-between">
              <div>
                <Text size="xs" tt="uppercase" fw={700} c="dimmed">
                  {t('dashboard.totalCost')}
                </Text>
                <Text fw={700} size="xl" c="blue">
                  {formatCurrency(summary.totalActualCost)}
                </Text>
              </div>
              <IconTrendingUp size={40} stroke={1.5} color="blue" />
            </Group>
          </Card>
        </Grid.Col>

        <Grid.Col span={{ base: 12, sm: 6, md: 3 }}>
          <Card shadow="sm" padding="lg" radius="md" withBorder>
            <Group justify="space-between">
              <div>
                <Text size="xs" tt="uppercase" fw={700} c="dimmed">
                  {t('dashboard.scheduled')}
                </Text>
                <Text fw={700} size="xl" c="yellow">
                  {summary.scheduled}
                </Text>
              </div>
              <IconCalendar size={40} stroke={1.5} color="yellow" />
            </Group>
          </Card>
        </Grid.Col>
      </Grid>

      {/* Charts */}
      <Grid>
        <Grid.Col span={{ base: 12, md: 8 }}>
          <Paper shadow="xs" p="md">
            <Title order={4} mb="md">
              {t('dashboard.maintenanceTrend')}
            </Title>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip content={<ChartTooltip />} />
                <Legend />
                <Line type="monotone" dataKey="scheduled" stroke="#8884d8" name={t('dashboard.scheduled')} />
                <Line type="monotone" dataKey="completed" stroke="#82ca9d" name={t('dashboard.completed')} />
              </LineChart>
            </ResponsiveContainer>
          </Paper>
        </Grid.Col>

        <Grid.Col span={{ base: 12, md: 4 }}>
          <Paper shadow="xs" p="md">
            <Title order={4} mb="md">
              {t('dashboard.byType')}
            </Title>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={[
                { name: t('types.preventive'), value: byType.preventive },
                { name: t('types.corrective'), value: byType.corrective },
                { name: t('types.emergency'), value: byType.emergency },
              ]}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip content={<ChartTooltip />} />
                <Bar dataKey="value" fill="#8884d8" />
              </BarChart>
            </ResponsiveContainer>
          </Paper>
        </Grid.Col>
      </Grid>

      {/* Upcoming and Overdue Maintenance */}
      <Grid>
        <Grid.Col span={{ base: 12, md: 6 }}>
          <Paper shadow="xs" p="md">
            <Title order={4} mb="md">
              {t('dashboard.upcomingMaintenance')}
            </Title>
            {upcomingMaintenance.length > 0 ? (
              <Table>
                <Table.Thead>
                  <Table.Tr>
                    <Table.Th>{t('table.title')}</Table.Th>
                    <Table.Th>{t('table.equipment')}</Table.Th>
                    <Table.Th>{t('table.scheduledDate')}</Table.Th>
                  </Table.Tr>
                </Table.Thead>
                <Table.Tbody>
                  {upcomingMaintenance.map((item) => (
                    <Table.Tr
                      key={item.id}
                      style={{ cursor: 'pointer' }}
                      onClick={() => router.push(`/${locale}/modules/maintenance/records/${item.id}`)}
                    >
                      <Table.Td>
                        <Text fw={500}>{item.title}</Text>
                      </Table.Td>
                      <Table.Td>{item.equipment}</Table.Td>
                      <Table.Td>{dayjs(item.scheduledDate).format('DD.MM.YYYY')}</Table.Td>
                    </Table.Tr>
                  ))}
                </Table.Tbody>
              </Table>
            ) : (
              <Text c="dimmed">{t('dashboard.noUpcoming')}</Text>
            )}
          </Paper>
        </Grid.Col>

        <Grid.Col span={{ base: 12, md: 6 }}>
          <Paper shadow="xs" p="md">
            <Title order={4} mb="md">
              {t('dashboard.overdueMaintenance')}
            </Title>
            {overdueMaintenance.length > 0 ? (
              <Table>
                <Table.Thead>
                  <Table.Tr>
                    <Table.Th>{t('table.title')}</Table.Th>
                    <Table.Th>{t('table.equipment')}</Table.Th>
                    <Table.Th>{t('dashboard.daysOverdue')}</Table.Th>
                  </Table.Tr>
                </Table.Thead>
                <Table.Tbody>
                  {overdueMaintenance.map((item) => (
                    <Table.Tr
                      key={item.id}
                      style={{ cursor: 'pointer' }}
                      onClick={() => router.push(`/${locale}/modules/maintenance/records/${item.id}`)}
                    >
                      <Table.Td>
                        <Text fw={500}>{item.title}</Text>
                      </Table.Td>
                      <Table.Td>{item.equipment}</Table.Td>
                      <Table.Td>
                        <Badge color="red">{item.daysOverdue}</Badge>
                      </Table.Td>
                    </Table.Tr>
                  ))}
                </Table.Tbody>
              </Table>
            ) : (
              <Text c="dimmed">{t('dashboard.noOverdue')}</Text>
            )}
          </Paper>
        </Grid.Col>
      </Grid>
    </Stack>
  );
}

