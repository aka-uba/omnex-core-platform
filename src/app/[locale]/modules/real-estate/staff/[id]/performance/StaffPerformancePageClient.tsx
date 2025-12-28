'use client';

import { useMemo, useState } from 'react';
import { Container, Paper, Stack, Group, Text, Grid, Title, Progress, Card, Badge } from '@mantine/core';
import { IconChartBar, IconUsers, IconCurrencyDollar, IconHome, IconTools } from '@tabler/icons-react';
import { CentralPageHeader } from '@/components/headers/CentralPageHeader';
import { StaffPerformancePageSkeleton } from './StaffPerformancePageSkeleton';
import { useRealEstateStaffMember, useStaffPerformance } from '@/hooks/useRealEstateStaff';
import { useTranslation } from '@/lib/i18n/client';
import { useRouter } from 'next/navigation';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend, LineChart, Line, XAxis, YAxis, CartesianGrid, BarChart, Bar } from 'recharts';
import { ChartTooltip } from '@/components/charts';
import { DatePickerInput } from '@mantine/dates';
import dayjs from 'dayjs';
import 'dayjs/locale/tr';
import 'dayjs/locale/de';
import 'dayjs/locale/ar';

interface StaffPerformancePageClientProps {
  locale: string;
  staffId: string;
}

export function StaffPerformancePageClient({ locale, staffId }: StaffPerformancePageClientProps) {
  const router = useRouter();
  const { t } = useTranslation('modules/real-estate');
  const [dateFrom, setDateFrom] = useState<Date | null>(dayjs().subtract(12, 'months').toDate());
  const [dateTo, setDateTo] = useState<Date | null>(dayjs().toDate());
  const { data: staff, isLoading: isLoadingStaff } = useRealEstateStaffMember(staffId);
  const { data: performance, isLoading: isLoadingPerformance } = useStaffPerformance(staffId, {
    ...(dateFrom ? { dateFrom: dateFrom.toISOString() } : {}),
    ...(dateTo ? { dateTo: dateTo.toISOString() } : {}),
  });

  // Format currency
  const formatCurrency = useMemo(() => (amount: number) => {
    return new Intl.NumberFormat('tr-TR', {
      style: 'currency',
      currency: 'TRY',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  }, []);

  // Prepare chart data - MUST be called before any conditional returns
  const collectionChartData = useMemo(() => {
    if (!performance) return [];
    return [
      { name: t('analytics.paid'), value: performance.totalPaid, color: '#82ca9d' },
      { name: t('analytics.pending'), value: Math.max(0, performance.totalDue - performance.totalPaid), color: '#ffc658' },
    ];
  }, [performance?.totalPaid, performance?.totalDue, t, performance]);

  const maintenanceChartData = useMemo(() => {
    if (!performance) return [];
    return [
      { name: t('staff.performance.completed'), value: performance.completedMaintenance, color: '#82ca9d' },
      { name: t('analytics.pending'), value: Math.max(0, performance.totalMaintenance - performance.completedMaintenance), color: '#ffc658' },
    ];
  }, [performance?.completedMaintenance, performance?.totalMaintenance, t, performance]);

  if (isLoadingStaff || isLoadingPerformance) {
    return (
      <Container size="xl" pt="xl">
        <CentralPageHeader
          title={t('staff.performance.title')}
          description={t('staff.performance.description')}
          namespace="modules/real-estate"
          icon={<IconChartBar size={32} />}
          breadcrumbs={[
            { label: 'navigation.dashboard', href: `/${locale}/dashboard`, namespace: 'global' },
            { label: 'staff.title', href: `/${locale}/modules/real-estate/staff`, namespace: 'modules/real-estate' },
            { label: 'staff.detail.title', href: `/${locale}/modules/real-estate/staff/${staffId}`, namespace: 'modules/real-estate' },
            { label: 'staff.performance.title', namespace: 'modules/real-estate' },
          ]}
        />
        <StaffPerformancePageSkeleton />
      </Container>
    );
  }

  if (!staff || !performance) {
    return (
      <Container size="xl" pt="xl">
        <CentralPageHeader
          title={t('staff.performance.title')}
          description={t('staff.performance.description')}
          namespace="modules/real-estate"
          icon={<IconChartBar size={32} />}
          breadcrumbs={[
            { label: 'navigation.dashboard', href: `/${locale}/dashboard`, namespace: 'global' },
            { label: 'staff.title', href: `/${locale}/modules/real-estate/staff`, namespace: 'modules/real-estate' },
            { label: 'staff.detail.title', href: `/${locale}/modules/real-estate/staff/${staffId}`, namespace: 'modules/real-estate' },
            { label: 'staff.performance.title', namespace: 'modules/real-estate' },
          ]}
        />
        <Text c="red" mt="md">{t('common.errorLoading')}</Text>
      </Container>
    );
  }

  return (
    <Container size="xl" pt="xl">
      <CentralPageHeader
        title={t('staff.performance.title')}
        description={t('staff.performance.description')}
        namespace="modules/real-estate"
        icon={<IconChartBar size={32} />}
        breadcrumbs={[
          { label: 'navigation.dashboard', href: `/${locale}/dashboard`, namespace: 'global' },
          { label: 'staff.title', href: `/${locale}/modules/real-estate/staff`, namespace: 'modules/real-estate' },
          { label: 'staff.detail.title', href: `/${locale}/modules/real-estate/staff/${staffId}`, namespace: 'modules/real-estate' },
          { label: 'staff.performance.title', namespace: 'modules/real-estate' },
        ]}
      />

      <Stack gap="md">
        {/* Date Range Filter */}
        <Paper shadow="xs" p="md">
          <Group>
            <DatePickerInput label={t('analytics.dateFrom')}
              value={dateFrom}
              onChange={(value: string | Date | null) => {
                const date = value instanceof Date ? value : value ? new Date(value as string) : null;
                setDateFrom(date);
              }}
              locale={locale === 'tr' ? 'tr' : locale === 'de' ? 'de' : locale === 'ar' ? 'ar' : 'en'}
              clearable
            />
      <DatePickerInput label={t('analytics.dateTo')}
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

        {/* Performance Summary Cards */}
        <Grid>
          <Grid.Col span={{ base: 12, sm: 6, md: 3 }}>
            <Card shadow="sm" padding="lg" radius="md" withBorder>
              <Group justify="space-between">
                <div>
                  <Text size="xs" c="dimmed" tt="uppercase" fw={700}>
                    {t('table.assignedUnits')}
                  </Text>
                  <Text size="xl" fw={700} mt="xs">
                    {performance.assignedUnits}
                  </Text>
                </div>
                <IconUsers size={32} color="var(--mantine-color-blue-6)" />
              </Group>
            </Card>
          </Grid.Col>
          <Grid.Col span={{ base: 12, sm: 6, md: 3 }}>
            <Card shadow="sm" padding="lg" radius="md" withBorder>
              <Group justify="space-between">
                <div>
                  <Text size="xs" c="dimmed" tt="uppercase" fw={700}>
                    {t('table.collectionRate')}
                  </Text>
                  <Text size="xl" fw={700} mt="xs" c={performance.collectionRate >= 80 ? 'green' : performance.collectionRate >= 60 ? 'yellow' : 'red'}>
                    {performance.collectionRate.toFixed(1)}%
                  </Text>
                  <Progress
                    value={performance.collectionRate}
                    color={performance.collectionRate >= 80 ? 'green' : performance.collectionRate >= 60 ? 'yellow' : 'red'}
                    mt="xs"
                    size="sm"
                  />
                </div>
                <IconCurrencyDollar size={32} color="var(--mantine-color-green-6)" />
              </Group>
            </Card>
          </Grid.Col>
          <Grid.Col span={{ base: 12, sm: 6, md: 3 }}>
            <Card shadow="sm" padding="lg" radius="md" withBorder>
              <Group justify="space-between">
                <div>
                  <Text size="xs" c="dimmed" tt="uppercase" fw={700}>
                    {t('table.emptyApartments')}
                  </Text>
                  <Text size="xl" fw={700} mt="xs" c="orange">
                    {performance.emptyApartments}
                  </Text>
                </div>
                <IconHome size={32} color="var(--mantine-color-orange-6)" />
              </Group>
            </Card>
          </Grid.Col>
          <Grid.Col span={{ base: 12, sm: 6, md: 3 }}>
            <Card shadow="sm" padding="lg" radius="md" withBorder>
              <Group justify="space-between">
                <div>
                  <Text size="xs" c="dimmed" tt="uppercase" fw={700}>
                    {t('table.maintenanceCompletion')}
                  </Text>
                  <Text size="xl" fw={700} mt="xs" c="violet">
                    {performance.maintenanceCompletionRate.toFixed(1)}%
                  </Text>
                  <Progress
                    value={performance.maintenanceCompletionRate}
                    color="violet"
                    mt="xs"
                    size="sm"
                  />
                </div>
                <IconTools size={32} color="var(--mantine-color-violet-6)" />
              </Group>
            </Card>
          </Grid.Col>
        </Grid>

        {/* Collection Rate Chart */}
        <Paper shadow="xs" p="md" withBorder>
          <Title order={4} mb="md">
            {t('analytics.collectionRate')}
          </Title>
          <Grid>
            <Grid.Col span={{ base: 12, md: 6 }}>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={collectionChartData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name}: ${((percent ?? 0) * 100).toFixed(0)}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {collectionChartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip content={<ChartTooltip formatter={(value) => formatCurrency(Number(value))} />} />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </Grid.Col>
            <Grid.Col span={{ base: 12, md: 6 }}>
              <Stack gap="md">
                <Card withBorder p="md">
                  <Group justify="space-between">
                    <Text size="sm" fw={500}>
                      {t('analytics.totalAmount')}
                    </Text>
                    <Text size="lg" fw={700}>
                      {formatCurrency(performance.totalDue)}
                    </Text>
                  </Group>
                </Card>
                <Card withBorder p="md" c="green">
                  <Group justify="space-between">
                    <Text size="sm" fw={500}>
                      {t('analytics.paidAmount')}
                    </Text>
                    <Text size="lg" fw={700} c="green">
                      {formatCurrency(performance.totalPaid)}
                    </Text>
                  </Group>
                </Card>
                <Card withBorder p="md" c="yellow">
                  <Group justify="space-between">
                    <Text size="sm" fw={500}>
                      {t('analytics.pending')}
                    </Text>
                    <Text size="lg" fw={700} c="yellow">
                      {formatCurrency(Math.max(0, performance.totalDue - performance.totalPaid))}
                    </Text>
                  </Group>
                </Card>
                <Stack gap="xs">
                  <Progress
                    value={performance.collectionRate}
                    color={performance.collectionRate >= 80 ? 'green' : performance.collectionRate >= 60 ? 'yellow' : 'red'}
                    size="lg"
                  />
                  <Text size="sm" ta="center" fw={500}>
                    {`${performance.collectionRate.toFixed(1)}%`}
                  </Text>
                </Stack>
              </Stack>
            </Grid.Col>
          </Grid>
        </Paper>

        {/* Maintenance Completion Chart */}
        <Paper shadow="xs" p="md" withBorder>
          <Title order={4} mb="md">
            {t('table.maintenanceCompletion')}
          </Title>
          <Grid>
            <Grid.Col span={{ base: 12, md: 6 }}>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={maintenanceChartData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name}: ${((percent ?? 0) * 100).toFixed(0)}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {maintenanceChartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip content={<ChartTooltip />} />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </Grid.Col>
            <Grid.Col span={{ base: 12, md: 6 }}>
              <Stack gap="md">
                <Card withBorder p="md">
                  <Group justify="space-between">
                    <Text size="sm" fw={500}>
                      {t('table.totalMaintenance')}
                    </Text>
                    <Text size="lg" fw={700}>
                      {performance.totalMaintenance}
                    </Text>
                  </Group>
                </Card>
                <Card withBorder p="md" c="green">
                  <Group justify="space-between">
                    <Text size="sm" fw={500}>
                      {t('staff.performance.completed')}
                    </Text>
                    <Text size="lg" fw={700} c="green">
                      {performance.completedMaintenance}
                    </Text>
                  </Group>
                </Card>
                <Card withBorder p="md" c="yellow">
                  <Group justify="space-between">
                    <Text size="sm" fw={500}>
                      {t('analytics.pending')}
                    </Text>
                    <Text size="lg" fw={700} c="yellow">
                      {Math.max(0, performance.totalMaintenance - performance.completedMaintenance)}
                    </Text>
                  </Group>
                </Card>
                <Stack gap="xs">
                  <Progress
                    value={performance.maintenanceCompletionRate}
                    color="violet"
                    size="lg"
                  />
                  <Text size="sm" ta="center" fw={500}>
                    {`${performance.maintenanceCompletionRate.toFixed(1)}%`}
                  </Text>
                </Stack>
              </Stack>
            </Grid.Col>
          </Grid>
        </Paper>

        {/* Status Breakdown */}
        {performance.byStatus && (
          <Paper shadow="xs" p="md" withBorder>
            <Title order={4} mb="md">
              {t('analytics.statusBreakdown')}
            </Title>
            <Grid>
              <Grid.Col span={{ base: 12, sm: 6, md: 4 }}>
                <Stack gap="xs">
                  <Group justify="space-between">
                    <Text size="sm" fw={500}>
                      {t('payments.status.paid')}
                    </Text>
                    <Badge color="green" size="lg">
                      {performance.byStatus.paid.count}
                    </Badge>
                  </Group>
                  <Text size="xl" fw={700} c="green">
                    {formatCurrency(performance.byStatus.paid.amount)}
                  </Text>
                </Stack>
              </Grid.Col>
              <Grid.Col span={{ base: 12, sm: 6, md: 4 }}>
                <Stack gap="xs">
                  <Group justify="space-between">
                    <Text size="sm" fw={500}>
                      {t('payments.status.pending')}
                    </Text>
                    <Badge color="yellow" size="lg">
                      {performance.byStatus.pending.count}
                    </Badge>
                  </Group>
                  <Text size="xl" fw={700} c="yellow">
                    {formatCurrency(performance.byStatus.pending.amount)}
                  </Text>
                </Stack>
              </Grid.Col>
              <Grid.Col span={{ base: 12, sm: 6, md: 4 }}>
                <Stack gap="xs">
                  <Group justify="space-between">
                    <Text size="sm" fw={500}>
                      {t('payments.status.overdue')}
                    </Text>
                    <Badge color="red" size="lg">
                      {performance.byStatus.overdue.count}
                    </Badge>
                  </Group>
                  <Text size="xl" fw={700} c="red">
                    {formatCurrency(performance.byStatus.overdue.amount)}
                  </Text>
                </Stack>
              </Grid.Col>
            </Grid>
          </Paper>
        )}

        {/* Monthly Trend Chart */}
        {performance.monthlyTrend && performance.monthlyTrend.length > 0 && (
          <Paper shadow="xs" p="md" withBorder>
            <Title order={4} mb="md">
              {t('analytics.monthlyTrend')}
            </Title>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={performance.monthlyTrend.map((item) => ({
                month: dayjs(item.month).format('MMM YYYY'),
                collectionRate: item.collectionRate,
                maintenanceCompletionRate: item.maintenanceCompletionRate,
              }))}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip content={<ChartTooltip formatter={(value) => `${Number(value).toFixed(1)}%`} />} />
                <Legend />
                <Line type="monotone" dataKey="collectionRate" stroke="#8884d8" name={t('analytics.collectionRate')} />
                <Line type="monotone" dataKey="maintenanceCompletionRate" stroke="#82ca9d" name={t('table.maintenanceCompletion')} />
              </LineChart>
            </ResponsiveContainer>
          </Paper>
        )}

        {/* Payment Amount Trend */}
        {performance.monthlyTrend && performance.monthlyTrend.length > 0 && (
          <Paper shadow="xs" p="md" withBorder>
            <Title order={4} mb="md">
              {t('analytics.paymentAmountTrend')}
            </Title>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={performance.monthlyTrend.map((item) => ({
                month: dayjs(item.month).format('MMM YYYY'),
                totalDue: item.totalDue,
                totalPaid: item.totalPaid,
              }))}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip content={<ChartTooltip formatter={(value) => formatCurrency(Number(value))} />} />
                <Legend />
                <Bar dataKey="totalDue" fill="#ffc658" name={t('analytics.totalAmount')} />
                <Bar dataKey="totalPaid" fill="#82ca9d" name={t('analytics.paidAmount')} />
              </BarChart>
            </ResponsiveContainer>
          </Paper>
        )}

        {/* Maintenance Trend */}
        {performance.monthlyTrend && performance.monthlyTrend.length > 0 && (
          <Paper shadow="xs" p="md" withBorder>
            <Title order={4} mb="md">
              {t('analytics.maintenanceTrend')}
            </Title>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={performance.monthlyTrend.map((item) => ({
                month: dayjs(item.month).format('MMM YYYY'),
                completed: item.completedMaintenance,
                total: item.totalMaintenance,
              }))}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip content={<ChartTooltip />} />
                <Legend />
                <Bar dataKey="total" fill="#ffc658" name={t('table.totalMaintenance')} />
                <Bar dataKey="completed" fill="#82ca9d" name={t('staff.performance.completed')} />
              </BarChart>
            </ResponsiveContainer>
          </Paper>
        )}

        {/* Detailed Metrics */}
        <Paper shadow="xs" p="md" withBorder>
          <Title order={4} mb="md">
            {t('staff.performance.detailedMetrics')}
          </Title>
          <Grid>
            {performance.averageVacancyDays !== null && (
              <Grid.Col span={{ base: 12, md: 6 }}>
                <Card withBorder p="md">
                  <Text size="sm" c="dimmed" mb="xs">
                    {t('table.averageVacancyDays')}
                  </Text>
                  <Text size="xl" fw={700}>
                    {performance.averageVacancyDays.toFixed(1)} {t('common.days')}
                  </Text>
                </Card>
              </Grid.Col>
            )}
            {performance.customerSatisfaction !== null && (
              <Grid.Col span={{ base: 12, md: 6 }}>
                <Card withBorder p="md">
                  <Text size="sm" c="dimmed" mb="xs">
                    {t('table.customerSatisfaction')}
                  </Text>
                  <Progress value={performance.customerSatisfaction} color="blue" size="lg" />
                  <Text size="xs" c="dimmed" mt="xs">
                    {performance.customerSatisfaction.toFixed(1)}/100
                  </Text>
                </Card>
              </Grid.Col>
            )}
            <Grid.Col span={{ base: 12, md: 6 }}>
              <Card withBorder p="md">
                <Text size="sm" c="dimmed" mb="xs">
                  {t('table.totalContracts')}
                </Text>
                <Text size="xl" fw={700}>
                  {performance.totalContracts}
                </Text>
              </Card>
            </Grid.Col>
            <Grid.Col span={{ base: 12, md: 6 }}>
              <Card withBorder p="md">
                <Text size="sm" c="dimmed" mb="xs">
                  {t('table.totalMaintenance')}
                </Text>
                <Text size="xl" fw={700}>
                  {performance.totalMaintenance}
                </Text>
              </Card>
            </Grid.Col>
          </Grid>
        </Paper>

      </Stack>
    </Container>
  );
}

