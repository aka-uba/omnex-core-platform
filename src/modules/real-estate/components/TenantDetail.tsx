'use client';

import { useRouter } from 'next/navigation';
import {
  Paper,
  Text,
  Group,
  Stack,
  Grid,
  Badge,
  Table,
  Tabs,
} from '@mantine/core';
import {
  IconUser,
  IconCalendar,
  IconContract,
  IconCurrencyDollar,
} from '@tabler/icons-react';
import { useTenant } from '@/hooks/useTenants';
import { useTranslation } from '@/lib/i18n/client';
import { TenantAnalytics } from './TenantAnalytics';
import { DetailPageSkeleton } from '@/components/skeletons/DetailPageSkeleton';
import dayjs from 'dayjs';

interface TenantDetailProps {
  tenantId: string;
  locale: string;
}

export function TenantDetail({ tenantId, locale }: TenantDetailProps) {
  const router = useRouter();
  const { t } = useTranslation('modules/real-estate');
  const { t: tGlobal } = useTranslation('global');
  const { data: tenant, isLoading, error } = useTenant(tenantId);

  if (isLoading) {
    return <DetailPageSkeleton showTabs />;
  }

  if (error || !tenant) {
    return (
      <Paper shadow="xs" p="md">
        <Text c="red">{tGlobal('common.errorLoading')}</Text>
      </Paper>
    );
  }

  return (
    <Stack gap="md">
      {/* Tenant Info */}
      <Paper shadow="xs" p="md">
        <Grid>
          <Grid.Col span={{ base: 12, md: 6 }}>
            <Stack gap="xs">
              <Group>
                <IconUser size={18} />
                <Text size="sm" fw={500}>
                  {t('form.tenantNumber')}
                </Text>
              </Group>
              <Text size="sm" c="dimmed" ml={36}>
                {tenant.tenantNumber || tGlobal('common.notApplicable')}
              </Text>
            </Stack>
          </Grid.Col>

          <Grid.Col span={{ base: 12, md: 6 }}>
            <Stack gap="xs">
              <Group>
                <IconCalendar size={18} />
                <Text size="sm" fw={500}>
                  {t('form.moveInDate')}
                </Text>
              </Group>
              <Text size="sm" c="dimmed" ml={36}>
                {tenant.moveInDate
                  ? dayjs(tenant.moveInDate).format('DD.MM.YYYY')
                  : tGlobal('common.notApplicable')}
              </Text>
            </Stack>
          </Grid.Col>

          <Grid.Col span={{ base: 12, md: 6 }}>
            <Stack gap="xs">
              <Group>
                <IconCalendar size={18} />
                <Text size="sm" fw={500}>
                  {t('form.moveOutDate')}
                </Text>
              </Group>
              <Text size="sm" c="dimmed" ml={36}>
                {tenant.moveOutDate
                  ? dayjs(tenant.moveOutDate).format('DD.MM.YYYY')
                  : tGlobal('common.notApplicable')}
              </Text>
            </Stack>
          </Grid.Col>

          <Grid.Col span={{ base: 12, md: 6 }}>
            <Stack gap="xs">
              <Text size="sm" fw={500}>
                {t('table.status')}
              </Text>
              <Badge color={tenant.isActive ? 'green' : 'red'} variant="light">
                {tenant.isActive ? (t('status.active')) : (t('status.inactive'))}
              </Badge>
            </Stack>
          </Grid.Col>

          {tenant.notes && (
            <Grid.Col span={12}>
              <Stack gap="xs">
                <Text size="sm" fw={500}>
                  {t('form.notes')}
                </Text>
                <Text size="sm" c="dimmed">
                  {tenant.notes}
                </Text>
              </Stack>
            </Grid.Col>
          )}
        </Grid>
      </Paper>

      {/* Tabs */}
      <Tabs defaultValue="analytics">
        <Tabs.List>
          <Tabs.Tab value="analytics" leftSection={<IconCurrencyDollar size={18} />}>
            {t('analytics.title')}
          </Tabs.Tab>
          <Tabs.Tab value="contracts" leftSection={<IconContract size={18} />}>
            {t('contracts.title')} ({tenant.contracts?.length || 0})
          </Tabs.Tab>
          <Tabs.Tab value="payments" leftSection={<IconCurrencyDollar size={18} />}>
            {t('payments.title')} ({tenant.payments?.length || 0})
          </Tabs.Tab>
        </Tabs.List>

        <Tabs.Panel value="analytics" pt="md">
          <TenantAnalytics tenantId={tenantId} locale={locale} />
        </Tabs.Panel>

        <Tabs.Panel value="contracts" pt="md">
          <Paper shadow="xs" p="md">
            {tenant.contracts && tenant.contracts.length > 0 ? (
              <Table striped highlightOnHover>
                <Table.Thead>
                  <Table.Tr>
                    <Table.Th>{t('table.contractNumber')}</Table.Th>
                    <Table.Th>{t('form.type')}</Table.Th>
                    <Table.Th>{t('table.status')}</Table.Th>
                    <Table.Th>{t('form.startDate')}</Table.Th>
                    <Table.Th>{t('form.endDate')}</Table.Th>
                    <Table.Th>{t('form.rentAmount')}</Table.Th>
                  </Table.Tr>
                </Table.Thead>
                <Table.Tbody>
                  {tenant.contracts.map((contract: any) => (
                    <Table.Tr
                      key={contract.id}
                      style={{ cursor: 'pointer' }}
                      onClick={() => router.push(`/${locale}/modules/real-estate/contracts/${contract.id}`)}
                    >
                      <Table.Td>{contract.contractNumber}</Table.Td>
                      <Table.Td>
                        <Badge variant="light">{contract.type}</Badge>
                      </Table.Td>
                      <Table.Td>
                        <Badge
                          color={
                            contract.status === 'active'
                              ? 'green'
                              : contract.status === 'expired'
                              ? 'gray'
                              : contract.status === 'terminated'
                              ? 'red'
                              : 'yellow'
                          }
                          variant="light"
                        >
                          {contract.status}
                        </Badge>
                      </Table.Td>
                      <Table.Td>
                        {contract.startDate ? dayjs(contract.startDate).format('DD.MM.YYYY') : '-'}
                      </Table.Td>
                      <Table.Td>
                        {contract.endDate ? dayjs(contract.endDate).format('DD.MM.YYYY') : '-'}
                      </Table.Td>
                      <Table.Td>
                        {Number(contract.rentAmount).toLocaleString('tr-TR', {
                          style: 'currency',
                          currency: 'TRY',
                        })}
                      </Table.Td>
                    </Table.Tr>
                  ))}
                </Table.Tbody>
              </Table>
            ) : (
              <Text c="dimmed" ta="center" py="xl">
                {t('messages.noContracts')}
              </Text>
            )}
          </Paper>
        </Tabs.Panel>

        <Tabs.Panel value="payments" pt="md">
          <Paper shadow="xs" p="md">
            {tenant.payments && tenant.payments.length > 0 ? (
              <Table striped highlightOnHover>
                <Table.Thead>
                  <Table.Tr>
                    <Table.Th>{t('form.type')}</Table.Th>
                    <Table.Th>{t('form.amount')}</Table.Th>
                    <Table.Th>{t('table.status')}</Table.Th>
                    <Table.Th>{t('form.dueDate')}</Table.Th>
                    <Table.Th>{t('form.paidDate')}</Table.Th>
                  </Table.Tr>
                </Table.Thead>
                <Table.Tbody>
                  {tenant.payments.map((payment: any) => (
                    <Table.Tr key={payment.id}>
                      <Table.Td>
                        <Badge variant="light">{payment.type}</Badge>
                      </Table.Td>
                      <Table.Td>
                        {Number(payment.amount).toLocaleString('tr-TR', {
                          style: 'currency',
                          currency: 'TRY',
                        })}
                      </Table.Td>
                      <Table.Td>
                        <Badge
                          color={
                            payment.status === 'paid'
                              ? 'green'
                              : payment.status === 'overdue'
                              ? 'red'
                              : 'yellow'
                          }
                          variant="light"
                        >
                          {payment.status}
                        </Badge>
                      </Table.Td>
                      <Table.Td>
                        {payment.dueDate ? dayjs(payment.dueDate).format('DD.MM.YYYY') : '-'}
                      </Table.Td>
                      <Table.Td>
                        {payment.paidDate ? dayjs(payment.paidDate).format('DD.MM.YYYY') : '-'}
                      </Table.Td>
                    </Table.Tr>
                  ))}
                </Table.Tbody>
              </Table>
            ) : (
              <Text c="dimmed" ta="center" py="xl">
                {t('messages.noPayments')}
              </Text>
            )}
          </Paper>
        </Tabs.Panel>
      </Tabs>
    </Stack>
  );
}

