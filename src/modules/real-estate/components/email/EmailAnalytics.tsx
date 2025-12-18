'use client';

import { useState } from 'react';
import {
  Paper,
  Grid,
  Text,
  Group,
  Badge,
  Stack,
  Card,
  Title,
  Progress,
  Skeleton,
} from '@mantine/core';
import { DataTable } from '@/components/tables/DataTable';
import {
  IconMail,
  IconClick,
  IconEye,
  IconUsers,
} from '@tabler/icons-react';
import { useEmailCampaignAnalytics } from '@/hooks/useEmailCampaigns';
import { useTranslation } from '@/lib/i18n/client';
import { DatePickerInput } from '@mantine/dates';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { ChartTooltip } from '@/components/charts';
import dayjs from 'dayjs';

interface EmailAnalyticsProps {
  locale: string;
}

export function EmailAnalytics({ locale }: EmailAnalyticsProps) {
  const { t } = useTranslation('modules/real-estate');
  const { t: tGlobal } = useTranslation('global');
  const [dateFrom, setDateFrom] = useState<Date | null>(dayjs().subtract(30, 'days').toDate());
  const [dateTo, setDateTo] = useState<Date | null>(dayjs().toDate());

  const { data: analytics, isLoading, error } = useEmailCampaignAnalytics({
    ...(dateFrom ? { dateFrom: dayjs(dateFrom).format('YYYY-MM-DD') } : {}),
    ...(dateTo ? { dateTo: dayjs(dateTo).format('YYYY-MM-DD') } : {}),
  });

  if (isLoading) {
    return (
      <Stack gap="md">
        <Skeleton height={80} />
        <Grid>
          {[1, 2, 3, 4].map((i) => (
            <Grid.Col key={i} span={{ base: 12, sm: 6, md: 3 }}>
              <Skeleton height={120} />
            </Grid.Col>
          ))}
        </Grid>
        <Skeleton height={300} />
        <Skeleton height={200} />
        <Skeleton height={400} />
      </Stack>
    );
  }

  if (error) {
    return (
      <Paper shadow="xs" p="md">
        <Text c="red">{tGlobal('common.errorLoading')}</Text>
      </Paper>
    );
  }

  // Check if analytics data exists and has valid structure
  if (!analytics || !analytics.summary) {
    return (
      <Paper shadow="xs" p="md">
        <Stack gap="md" align="center" py="xl">
          <Text size="lg" fw={500} c="dimmed">
            {t('email.analytics.noData')}
          </Text>
          <Text size="sm" c="dimmed" ta="center">
            {t('email.analytics.noDataDescription')}
          </Text>
        </Stack>
      </Paper>
    );
  }

  // Check if there are any campaigns
  if (analytics.summary.totalCampaigns === 0) {
    return (
      <Paper shadow="xs" p="md">
        <Stack gap="md" align="center" py="xl">
          <Text size="lg" fw={500} c="dimmed">
            {t('email.analytics.noData')}
          </Text>
          <Text size="sm" c="dimmed" ta="center">
            {t('email.analytics.noDataDescription')}
          </Text>
        </Stack>
      </Paper>
    );
  }

  return (
    <Stack gap="md">
      {/* Date Filters */}
      <Paper p="md" withBorder>
        <Group>
          <DatePickerInput label={t('analytics.dateFrom')}
            value={dateFrom}
            onChange={(value: string | Date | null) => {
              const date = value instanceof Date ? value : value ? new Date(value as string) : null;
              setDateFrom(date);
            }}
            clearable
          />
  <DatePickerInput label={t('analytics.dateTo')}
            value={dateTo}
            onChange={(value: string | Date | null) => {
              const date = value instanceof Date ? value : value ? new Date(value as string) : null;
              setDateTo(date);
            }}
            clearable
          />
        </Group>
      </Paper>

      {/* Summary Cards */}
      <Grid>
        <Grid.Col span={{ base: 12, sm: 6, md: 3 }}>
          <Card shadow="sm" padding="md" radius="md" withBorder h="100%">
            <Group justify="space-between" h="100%">
              <Stack gap="xs" style={{ flex: 1 }}>
                <Text size="xs" c="dimmed" tt="uppercase" fw={700}>
                  {t('email.analytics.totalCampaigns')}
                </Text>
                <Text fw={700} size="xl">
                  {analytics.summary.totalCampaigns}
                </Text>
              </Stack>
              <IconMail size={32} color="var(--mantine-color-blue-6)" />
            </Group>
          </Card>
        </Grid.Col>

        <Grid.Col span={{ base: 12, sm: 6, md: 3 }}>
          <Card shadow="sm" padding="md" radius="md" withBorder h="100%">
            <Group justify="space-between" h="100%">
              <Stack gap="xs" style={{ flex: 1 }}>
                <Text size="xs" c="dimmed" tt="uppercase" fw={700}>
                  {t('email.analytics.openRate')}
                </Text>
                <Text fw={700} size="xl">
                  {analytics.summary.openRate.toFixed(1)}%
                </Text>
                <Progress value={analytics.summary.openRate} color="blue" mt="xs" />
              </Stack>
              <IconEye size={32} color="var(--mantine-color-blue-6)" />
            </Group>
          </Card>
        </Grid.Col>

        <Grid.Col span={{ base: 12, sm: 6, md: 3 }}>
          <Card shadow="sm" padding="md" radius="md" withBorder h="100%">
            <Group justify="space-between" h="100%">
              <Stack gap="xs" style={{ flex: 1 }}>
                <Text size="xs" c="dimmed" tt="uppercase" fw={700}>
                  {t('email.analytics.clickRate')}
                </Text>
                <Text fw={700} size="xl">
                  {analytics.summary.clickRate.toFixed(1)}%
                </Text>
                <Progress value={analytics.summary.clickRate} color="green" mt="xs" />
              </Stack>
              <IconClick size={32} color="var(--mantine-color-green-6)" />
            </Group>
          </Card>
        </Grid.Col>

        <Grid.Col span={{ base: 12, sm: 6, md: 3 }}>
          <Card shadow="sm" padding="md" radius="md" withBorder h="100%">
            <Group justify="space-between" h="100%">
              <Stack gap="xs" style={{ flex: 1 }}>
                <Text size="xs" c="dimmed" tt="uppercase" fw={700}>
                  {t('email.analytics.totalRecipients')}
                </Text>
                <Text fw={700} size="xl">
                  {analytics.summary.totalRecipients.toLocaleString()}
                </Text>
              </Stack>
              <IconUsers size={32} color="var(--mantine-color-violet-6)" />
            </Group>
          </Card>
        </Grid.Col>
      </Grid>

      {/* Monthly Trend Chart */}
      <Paper p="md" withBorder>
        <Title order={4} mb="md">
          {t('email.analytics.monthlyTrend')}
        </Title>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={analytics.monthlyTrend}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="month" />
            <YAxis />
            <Tooltip content={<ChartTooltip />} />
            <Legend />
            <Line type="monotone" dataKey="sent" stroke="#8884d8" name={t('email.analytics.sent')} />
            <Line type="monotone" dataKey="opened" stroke="#82ca9d" name={t('email.analytics.opened')} />
            <Line type="monotone" dataKey="clicked" stroke="#ffc658" name={t('email.analytics.clicked')} />
          </LineChart>
        </ResponsiveContainer>
      </Paper>

      {/* Status Breakdown */}
      <Paper p="md" withBorder>
        <Title order={4} mb="md">
          {t('email.analytics.statusBreakdown')}
        </Title>
        <Grid>
          {analytics.statusBreakdown.map((status: { status: string; count: number }) => (
            <Grid.Col key={status.status} span={{ base: 12, sm: 6, md: 4 }}>
              <Card shadow="sm" padding="md" radius="md" withBorder>
                <Group justify="space-between">
                  <div>
                    <Text size="sm" c="dimmed">
                      {t(`email.status.${status.status}`)}
                    </Text>
                    <Text fw={700} size="lg">
                      {status.count}
                    </Text>
                  </div>
                  <Badge color={status.status === 'sent' ? 'green' : status.status === 'failed' ? 'red' : 'gray'}>
                    {status.status}
                  </Badge>
                </Group>
              </Card>
            </Grid.Col>
          ))}
        </Grid>
      </Paper>

      {/* Top Templates */}
      <Stack gap="md">
        <Title order={4}>
          {t('email.analytics.topTemplates')}
        </Title>
        <DataTable
          columns={[
            {
              key: 'templateName',
              label: t('table.template'),
              sortable: true,
              searchable: true,
            },
            {
              key: 'sent',
              label: t('table.sent'),
              sortable: true,
              searchable: false,
              align: 'right',
            },
            {
              key: 'openRate',
              label: t('table.openRate'),
              sortable: true,
              searchable: false,
              render: (value) => (
                <Group gap="xs">
                  <Text>{Number(value).toFixed(1)}%</Text>
                  <Progress value={Number(value)} color="blue" style={{ flex: 1, maxWidth: 100 }} />
                </Group>
              ),
            },
            {
              key: 'clickRate',
              label: t('table.clickRate'),
              sortable: true,
              searchable: false,
              render: (value) => (
                <Group gap="xs">
                  <Text>{Number(value).toFixed(1)}%</Text>
                  <Progress value={Number(value)} color="green" style={{ flex: 1, maxWidth: 100 }} />
                </Group>
              ),
            },
          ]}
          data={analytics.topTemplates}
          searchable={true}
          sortable={true}
          pageable={true}
          defaultPageSize={25}
          emptyMessage={t('email.analytics.noTemplates')}
          showColumnSettings={true}
        />
      </Stack>

      {/* Recent Campaigns */}
      <Stack gap="md">
        <Title order={4}>
          {t('email.analytics.recentCampaigns')}
        </Title>
        <DataTable
          columns={[
            {
              key: 'name',
              label: t('table.name'),
              sortable: true,
              searchable: true,
            },
            {
              key: 'sentAt',
              label: t('table.sentAt'),
              sortable: true,
              searchable: false,
              render: (value) => (value ? dayjs(value).format('DD.MM.YYYY HH:mm') : '-'),
            },
            {
              key: 'sentCount',
              label: t('table.sent'),
              sortable: true,
              searchable: false,
              align: 'right',
            },
            {
              key: 'openedCount',
              label: t('table.opened'),
              sortable: true,
              searchable: false,
              align: 'right',
            },
            {
              key: 'clickedCount',
              label: t('table.clicked'),
              sortable: true,
              searchable: false,
              align: 'right',
            },
          ]}
          data={analytics.recentCampaigns}
          searchable={true}
          sortable={true}
          pageable={true}
          defaultPageSize={25}
          emptyMessage={t('email.analytics.noCampaigns')}
          showColumnSettings={true}
        />
      </Stack>
    </Stack>
  );
}

