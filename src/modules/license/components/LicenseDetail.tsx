'use client';

import {
  Paper,
  Group,
  Text,
  Badge,
  Stack,
  Divider,
  Grid,
  Table,
  Loader,
} from '@mantine/core';
import { IconShieldCheck, IconCalendar, IconCurrencyDollar } from '@tabler/icons-react';
import { useCurrentLicense } from '@/hooks/useTenantLicenses';
import { useTranslation } from '@/lib/i18n/client';
import { useCurrency } from '@/hooks/useCurrency';
import dayjs from 'dayjs';

interface LicenseDetailProps {
  locale: string;
}

export function LicenseDetail({ locale }: LicenseDetailProps) {
  const { t } = useTranslation('modules/license');
  const { formatCurrency } = useCurrency();
  const { data: license, isLoading, error } = useCurrentLicense();

  if (isLoading) {
    return (
      <Paper p="xl">
        <Loader size="lg" />
      </Paper>
    );
  }

  if (error) {
    return (
      <Paper p="xl">
        <Text c="red">{error instanceof Error ? error.message : 'Failed to load license'}</Text>
      </Paper>
    );
  }

  if (!license) {
    return (
      <Paper p="xl">
        <Stack align="center" gap="md">
          <IconShieldCheck size={64} stroke={1.5} color="var(--mantine-color-gray-5)" />
          <Text size="lg" fw={500} c="dimmed">
            {t('myLicense.noLicense')}
          </Text>
        </Stack>
      </Paper>
    );
  }

  return (
    <Stack gap="md">
      <Paper p="xl">
        <Stack gap="md">
          <Group justify="space-between">
            <Group gap="xs">
              <IconShieldCheck size={32} />
              <Text size="xl" fw={700}>
                {license.package?.name || '-'}
              </Text>
            </Group>
            <Group gap="xs">
              <Badge
                color={
                  license.status === 'active'
                    ? 'green'
                    : license.status === 'expired'
                    ? 'red'
                    : license.status === 'suspended'
                    ? 'orange'
                    : 'gray'
                }
                size="lg"
              >
                {t(`tenantLicenses.status.${license.status}`) || license.status}
              </Badge>
              <Badge
                color={
                  license.paymentStatus === 'paid'
                    ? 'green'
                    : license.paymentStatus === 'pending'
                    ? 'yellow'
                    : 'red'
                }
                size="lg"
              >
                {t(`tenantLicenses.paymentStatus.${license.paymentStatus}`) || license.paymentStatus}
              </Badge>
            </Group>
          </Group>

          <Divider />

          <Grid>
            <Grid.Col span={{ base: 12, md: 6 }}>
              <Stack gap="xs">
                <Text size="sm" c="dimmed">
                  {t('myLicense.startDate')}
                </Text>
                <Group gap="xs">
                  <IconCalendar size={18} />
                  <Text fw={500}>{dayjs(license.startDate).format('DD/MM/YYYY')}</Text>
                </Group>
              </Stack>
            </Grid.Col>
            <Grid.Col span={{ base: 12, md: 6 }}>
              <Stack gap="xs">
                <Text size="sm" c="dimmed">
                  {t('myLicense.endDate')}
                </Text>
                <Group gap="xs">
                  <IconCalendar size={18} />
                  <Text fw={500}>{dayjs(license.endDate).format('DD/MM/YYYY')}</Text>
                </Group>
              </Stack>
            </Grid.Col>
            {license.renewalDate && (
              <Grid.Col span={{ base: 12, md: 6 }}>
                <Stack gap="xs">
                  <Text size="sm" c="dimmed">
                    {t('myLicense.renewalDate')}
                  </Text>
                  <Group gap="xs">
                    <IconCalendar size={18} />
                    <Text fw={500}>{dayjs(license.renewalDate).format('DD/MM/YYYY')}</Text>
                  </Group>
                </Stack>
              </Grid.Col>
            )}
            <Grid.Col span={{ base: 12, md: 6 }}>
              <Stack gap="xs">
                <Text size="sm" c="dimmed">
                  {t('packages.table.basePrice')}
                </Text>
                <Group gap="xs">
                  <IconCurrencyDollar size={18} />
                  <Text fw={500}>
                    {formatCurrency(license.package?.basePrice || 0)}
                  </Text>
                </Group>
              </Stack>
            </Grid.Col>
          </Grid>

          {license.package?.modules && license.package.modules.length > 0 && (
            <>
              <Divider />
              <Stack gap="xs">
                <Text size="sm" c="dimmed">
                  {t('myLicense.modules')}
                </Text>
                <Group gap="xs">
                  {license.package.modules.map((module: string) => (
                    <Badge key={module} variant="light">
                      {module}
                    </Badge>
                  ))}
                </Group>
              </Stack>
            </>
          )}
        </Stack>
      </Paper>

      {license.payments && license.payments.length > 0 && (
        <Paper p="xl">
          <Stack gap="md">
            <Text size="lg" fw={600}>
              {t('myLicense.paymentHistory')}
            </Text>
            <Table>
              <Table.Thead>
                <Table.Tr>
                  <Table.Th>{t('payments.table.amount')}</Table.Th>
                  <Table.Th>{t('payments.table.paymentMethod')}</Table.Th>
                  <Table.Th>{t('payments.table.paymentDate')}</Table.Th>
                  <Table.Th>{t('payments.table.status')}</Table.Th>
                </Table.Tr>
              </Table.Thead>
              <Table.Tbody>
                {license.payments.map((payment: { id: string; amount: number; currency: string; paymentMethod: string; paymentDate: Date; status: string }) => (
                  <Table.Tr key={payment.id}>
                    <Table.Td>
                      <Text fw={500}>
                        {formatCurrency(payment.amount)}
                      </Text>
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
                  </Table.Tr>
                ))}
              </Table.Tbody>
            </Table>
          </Stack>
        </Paper>
      )}
    </Stack>
  );
}

