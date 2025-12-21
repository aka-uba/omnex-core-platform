'use client';

import { useMemo } from 'react';
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
  Card,
  Title,
  Divider,
} from '@mantine/core';
import {
  IconUser,
  IconCalendar,
  IconContract,
  IconCurrencyDollar,
  IconCash,
  IconHome,
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

  // Aktif sözleşme ve daire bilgileri
  const activeContract = useMemo(() => {
    if (!tenant?.contracts) return null;
    return tenant.contracts.find((c: any) => c.status === 'active') || null;
  }, [tenant?.contracts]);

  // Yan gider hesaplaması
  const sideCostSummary = useMemo(() => {
    if (!activeContract?.apartment) return null;
    const apt = activeContract.apartment;
    const coldRent = Number(apt.coldRent) || 0;
    const additionalCosts = Number(apt.additionalCosts) || 0;
    const heatingCosts = Number(apt.heatingCosts) || 0;
    const warmRent = coldRent + additionalCosts + heatingCosts;
    const deposit = Number(apt.deposit) || 0;

    return {
      coldRent,
      additionalCosts,
      heatingCosts,
      warmRent,
      deposit,
      apartmentUnit: apt.unitNumber,
      propertyName: apt.property?.name,
      area: Number(apt.area) || 0,
    };
  }, [activeContract]);

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

      {/* Yan Gider Özeti */}
      {sideCostSummary && (
        <Card withBorder p="md" radius="md">
          <Stack gap="md">
            <Group gap="xs">
              <IconCash size={20} />
              <Title order={4}>{t('sideCosts.rentAndSideCosts')}</Title>
            </Group>

            {/* Daire Bilgisi */}
            <Group gap="xs">
              <IconHome size={16} />
              <Text size="sm" c="dimmed">
                {sideCostSummary.propertyName} - {sideCostSummary.apartmentUnit}
                {sideCostSummary.area > 0 && ` (${sideCostSummary.area} m²)`}
              </Text>
            </Group>

            <Divider />

            <Grid>
              <Grid.Col span={8}>
                <Text size="sm" c="dimmed">{t('form.coldRent')}</Text>
              </Grid.Col>
              <Grid.Col span={4}>
                <Text size="sm" ta="right" fw={500}>
                  {sideCostSummary.coldRent.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} ₺
                </Text>
              </Grid.Col>

              <Grid.Col span={8}>
                <Text size="sm" c="dimmed">{t('form.additionalCosts')}</Text>
              </Grid.Col>
              <Grid.Col span={4}>
                <Text size="sm" ta="right" fw={500}>
                  {sideCostSummary.additionalCosts.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} ₺
                </Text>
              </Grid.Col>

              <Grid.Col span={8}>
                <Text size="sm" c="dimmed">{t('form.heatingCosts')}</Text>
              </Grid.Col>
              <Grid.Col span={4}>
                <Text size="sm" ta="right" fw={500}>
                  {sideCostSummary.heatingCosts.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} ₺
                </Text>
              </Grid.Col>

              <Grid.Col span={12}>
                <Divider my="xs" />
              </Grid.Col>

              <Grid.Col span={8}>
                <Text size="sm" fw={600}>{t('sideCosts.totalRent')}</Text>
              </Grid.Col>
              <Grid.Col span={4}>
                <Text size="sm" ta="right" fw={700} c="blue">
                  {sideCostSummary.warmRent.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} ₺
                </Text>
              </Grid.Col>

              {sideCostSummary.deposit > 0 && (
                <>
                  <Grid.Col span={8}>
                    <Text size="sm" c="dimmed">{t('form.deposit')}</Text>
                  </Grid.Col>
                  <Grid.Col span={4}>
                    <Text size="sm" ta="right" fw={500}>
                      {sideCostSummary.deposit.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} ₺
                    </Text>
                  </Grid.Col>
                </>
              )}
            </Grid>
          </Stack>
        </Card>
      )}

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

