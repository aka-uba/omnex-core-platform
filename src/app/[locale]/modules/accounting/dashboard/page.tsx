'use client';

import { Container, Grid, Paper, Title, Text, Group, Stack } from '@mantine/core';
import { IconCurrencyDollar, IconRepeat, IconFileText, IconCreditCard, IconReceipt, IconChartBar } from '@tabler/icons-react';
import { useTranslation } from '@/lib/i18n/client';

export default function AccountingDashboard() {
  const { t } = useTranslation('modules/accounting');

  return (
    <Container size="xl" pt="xl">
      <Stack gap="xl">
        <div>
          <Title order={1}>{t('dashboard.title')}</Title>
          <Text c="dimmed">{t('dashboard.description')}</Text>
        </div>

        <Grid>
          <Grid.Col span={{ base: 12, sm: 6, md: 4 }}>
            <Paper shadow="sm" p="xl" withBorder>
              <Group>
                <IconCurrencyDollar size={40} color="var(--mantine-color-blue-6)" />
                <Stack gap={0}>
                  <Text size="xl" fw={700}>$0</Text>
                  <Text size="sm" c="dimmed">{t('dashboard.totalRevenue')}</Text>
                </Stack>
              </Group>
            </Paper>
          </Grid.Col>

          <Grid.Col span={{ base: 12, sm: 6, md: 4 }}>
            <Paper shadow="sm" p="xl" withBorder>
              <Group>
                <IconRepeat size={40} color="var(--mantine-color-green-6)" />
                <Stack gap={0}>
                  <Text size="xl" fw={700}>0</Text>
                  <Text size="sm" c="dimmed">{t('dashboard.activeSubscriptions')}</Text>
                </Stack>
              </Group>
            </Paper>
          </Grid.Col>

          <Grid.Col span={{ base: 12, sm: 6, md: 4 }}>
            <Paper shadow="sm" p="xl" withBorder>
              <Group>
                <IconFileText size={40} color="var(--mantine-color-orange-6)" />
                <Stack gap={0}>
                  <Text size="xl" fw={700}>0</Text>
                  <Text size="sm" c="dimmed">{t('dashboard.pendingInvoices')}</Text>
                </Stack>
              </Group>
            </Paper>
          </Grid.Col>

          <Grid.Col span={{ base: 12, sm: 6, md: 4 }}>
            <Paper shadow="sm" p="xl" withBorder>
              <Group>
                <IconCreditCard size={40} color="var(--mantine-color-violet-6)" />
                <Stack gap={0}>
                  <Text size="xl" fw={700}>$0</Text>
                  <Text size="sm" c="dimmed">{t('dashboard.outstandingPayments')}</Text>
                </Stack>
              </Group>
            </Paper>
          </Grid.Col>

          <Grid.Col span={{ base: 12, sm: 6, md: 4 }}>
            <Paper shadow="sm" p="xl" withBorder>
              <Group>
                <IconReceipt size={40} color="var(--mantine-color-red-6)" />
                <Stack gap={0}>
                  <Text size="xl" fw={700}>$0</Text>
                  <Text size="sm" c="dimmed">{t('dashboard.totalExpenses')}</Text>
                </Stack>
              </Group>
            </Paper>
          </Grid.Col>

          <Grid.Col span={{ base: 12, sm: 6, md: 4 }}>
            <Paper shadow="sm" p="xl" withBorder>
              <Group>
                <IconChartBar size={40} color="var(--mantine-color-teal-6)" />
                <Stack gap={0}>
                  <Text size="xl" fw={700}>$0</Text>
                  <Text size="sm" c="dimmed">{t('dashboard.netProfit')}</Text>
                </Stack>
              </Group>
            </Paper>
          </Grid.Col>
        </Grid>

        <Paper shadow="sm" p="xl" withBorder>
          <Title order={3} mb="md">{t('dashboard.recentActivity')}</Title>
          <Text c="dimmed">{t('dashboard.noActivity')}</Text>
        </Paper>
      </Stack>
    </Container>
  );
}
