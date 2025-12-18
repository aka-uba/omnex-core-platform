'use client';

import { Grid, Paper, Title, Stack, Group, Text, Badge, Button } from '@mantine/core';
import { IconArrowRight } from '@tabler/icons-react';
import { useTranslation } from '@/lib/i18n/client';
import { useRouter, useParams } from 'next/navigation';
import type {
  DashboardUpcomingPayment,
  DashboardExpiringContract,
} from '@/hooks/useRealEstateDashboard';
import dayjs from 'dayjs';

interface UpcomingEventsProps {
  upcomingPayments: DashboardUpcomingPayment[];
  expiringContracts: DashboardExpiringContract[];
  loading?: boolean;
}

export function UpcomingEvents({
  upcomingPayments,
  expiringContracts,
  loading,
}: UpcomingEventsProps) {
  const { t } = useTranslation('modules/real-estate');
  const router = useRouter();
  const params = useParams();
  const locale = (params?.locale as string) || 'tr';

  if (loading) {
    return (
      <Grid>
        <Grid.Col span={{ base: 12, md: 6 }}>
          <Paper shadow="sm" p="md" radius="md" withBorder>
            <div style={{ height: 300 }} />
          </Paper>
        </Grid.Col>
        <Grid.Col span={{ base: 12, md: 6 }}>
          <Paper shadow="sm" p="md" radius="md" withBorder>
            <div style={{ height: 300 }} />
          </Paper>
        </Grid.Col>
      </Grid>
    );
  }

  const formatCurrency = (amount: number, currency: string) => {
    return new Intl.NumberFormat('tr-TR', {
      style: 'currency',
      currency: currency || 'TRY',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  return (
    <Grid>
      {/* Upcoming Payments */}
      <Grid.Col span={{ base: 12, md: 6 }}>
        <Paper shadow="sm" p="md" radius="md" withBorder>
          <Group justify="space-between" mb="md">
            <Title order={4}>{t('dashboard.upcomingPayments')}</Title>
            <Button
              variant="subtle"
              size="xs"
              rightSection={<IconArrowRight size={14} />}
              onClick={() => router.push(`/${locale}/modules/real-estate/payments`)}
            >
              {t('dashboard.viewAll')}
            </Button>
          </Group>
          {upcomingPayments.length === 0 ? (
            <Text c="dimmed" ta="center" py="xl">
              {t('dashboard.noUpcomingPayments')}
            </Text>
          ) : (
            <Stack gap="sm">
              {upcomingPayments.slice(0, 5).map((payment) => (
                <Group key={payment.id} justify="space-between" p="xs" style={{ borderRadius: 4 }}>
                  <div style={{ flex: 1 }}>
                    <Text size="sm" fw={500}>
                      {payment.tenantName}
                    </Text>
                    <Text size="xs" c="dimmed">
                      {payment.apartment} • {dayjs(payment.dueDate).format('DD.MM.YYYY')}
                    </Text>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <Text size="sm" fw={600}>
                      {formatCurrency(payment.amount, payment.currency)}
                    </Text>
                    <Badge
                      color={payment.daysUntilDue <= 7 ? 'red' : payment.daysUntilDue <= 14 ? 'yellow' : 'blue'}
                      size="sm"
                      variant="light"
                    >
                      {payment.daysUntilDue} {t('dashboard.days')}
                    </Badge>
                  </div>
                </Group>
              ))}
            </Stack>
          )}
        </Paper>
      </Grid.Col>

      {/* Expiring Contracts */}
      <Grid.Col span={{ base: 12, md: 6 }}>
        <Paper shadow="sm" p="md" radius="md" withBorder>
          <Group justify="space-between" mb="md">
            <Title order={4}>{t('dashboard.expiringContracts')}</Title>
            <Button
              variant="subtle"
              size="xs"
              rightSection={<IconArrowRight size={14} />}
              onClick={() => router.push(`/${locale}/modules/real-estate/contracts`)}
            >
              {t('dashboard.viewAll')}
            </Button>
          </Group>
          {expiringContracts.length === 0 ? (
            <Text c="dimmed" ta="center" py="xl">
              {t('dashboard.noExpiringContracts')}
            </Text>
          ) : (
            <Stack gap="sm">
              {expiringContracts.slice(0, 5).map((contract) => (
                <Group key={contract.id} justify="space-between" p="xs" style={{ borderRadius: 4 }}>
                  <div style={{ flex: 1 }}>
                    <Text size="sm" fw={500}>
                      {contract.tenantName}
                    </Text>
                    <Text size="xs" c="dimmed">
                      {contract.apartment} • {contract.contractNumber}
                    </Text>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <Text size="xs" c="dimmed">
                      {dayjs(contract.endDate).format('DD.MM.YYYY')}
                    </Text>
                    <Badge
                      color={contract.daysUntilExpiry <= 7 ? 'red' : contract.daysUntilExpiry <= 14 ? 'yellow' : 'blue'}
                      size="sm"
                      variant="light"
                    >
                      {contract.daysUntilExpiry} {t('dashboard.days')}
                    </Badge>
                  </div>
                </Group>
              ))}
            </Stack>
          )}
        </Paper>
      </Grid.Col>
    </Grid>
  );
}

