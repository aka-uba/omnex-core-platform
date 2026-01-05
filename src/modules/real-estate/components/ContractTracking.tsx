'use client';

import { useState, useMemo } from 'react';
import {
  Paper,
  Text,
  Group,
  Stack,
  Grid,
  Badge,
  Button,
  Tabs,
  Card,
  Alert,
  Loader,
} from '@mantine/core';
import {
  IconRefresh,
  IconAlertCircle,
  IconCheck,
  IconClock,
  IconCalendar,
  IconContract,
  IconTrendingUp,
} from '@tabler/icons-react';
import { useContracts } from '@/hooks/useContracts';
import { useTranslation } from '@/lib/i18n/client';
import { useCurrency } from '@/hooks/useCurrency';
import { DataTable, DataTableColumn } from '@/components/tables/DataTable';
import dayjs from 'dayjs';

interface ContractTrackingProps {
  locale: string;
}

export function ContractTracking({ locale }: ContractTrackingProps) {
  const { t } = useTranslation('modules/real-estate');
  const { t: tGlobal } = useTranslation('global');
  const { formatCurrency } = useCurrency();
  const [activeTab, setActiveTab] = useState<string>('upcoming');
  const [daysAhead] = useState<number>(30);

  const { data: contractsData, isLoading, refetch } = useContracts({
    page: 1,
    pageSize: 1000,
    status: 'active',
  });

  if (isLoading) {
    return (
      <Paper shadow="xs" p="md">
        <Loader />
      </Paper>
    );
  }

  if (!contractsData) {
    return (
      <Paper shadow="xs" p="md">
        <Text>{tGlobal('common.noData')}</Text>
      </Paper>
    );
  }

  const contracts = contractsData.contracts || [];
  const today = dayjs().startOf('day');

  // Filter contracts by status
  const upcomingRenewals = contracts.filter((contract: any) => {
    if (!contract.endDate) return false;
    const endDate = dayjs(contract.endDate);
    const daysUntil = endDate.diff(today, 'day');
    return daysUntil >= 0 && daysUntil <= daysAhead;
  }).sort((a: any, b: any) => {
    const aDate = dayjs(a.endDate);
    const bDate = dayjs(b.endDate);
    return aDate.diff(bDate, 'day');
  });

  const expiredContracts = contracts.filter((contract: any) => {
    if (!contract.endDate) return false;
    return dayjs(contract.endDate).isBefore(today);
  });

  const activeContracts = contracts.filter((contract: any) => {
    if (!contract.endDate) return true;
    return dayjs(contract.endDate).isAfter(today);
  });

  const getDaysUntilRenewal = (endDate: Date | null | undefined): number => {
    if (!endDate) return Infinity;
    return dayjs(endDate).diff(today, 'day');
  };

  // const getRenewalStatusBadge = (contract: any) => { // removed - unused
  //   const daysUntil = getDaysUntilRenewal(contract.endDate);
  //   if (daysUntil < 0) {
  //     return <Badge color="red">{t('tracking.expired')}</Badge>;
  //   } else if (daysUntil <= 7) {
  //     return <Badge color="orange">{t('tracking.urgent')}</Badge>;
  //   } else if (daysUntil <= 30) {
  //     return <Badge color="yellow">{t('tracking.upcoming')}</Badge>;
  //   }
  //   return <Badge color="blue">{t('tracking.active')}</Badge>;
  // };

  // Upcoming renewals columns
  const upcomingColumns: DataTableColumn[] = [
    {
      key: 'contractNumber',
      label: t('table.contractNumber'),
      sortable: true,
      searchable: true,
    },
    {
      key: 'apartment',
      label: t('table.apartment'),
      sortable: true,
      searchable: true,
    },
    {
      key: 'endDate',
      label: t('table.endDate'),
      sortable: true,
      searchable: false,
      render: (value) => (value ? dayjs(value).format('DD.MM.YYYY') : '-'),
    },
    {
      key: 'daysUntil',
      label: t('table.daysUntil'),
      sortable: true,
      searchable: false,
      align: 'right',
    },
    {
      key: 'status',
      label: t('table.status'),
      sortable: true,
      searchable: false,
    },
    {
      key: 'autoRenewal',
      label: t('tracking.autoRenewal'),
      sortable: true,
      searchable: false,
      render: (value) => (
        <Badge color={value ? 'green' : 'gray'} variant="light">
          {value ? (t('common.yes')) : (t('common.no'))}
        </Badge>
      ),
    },
  ];

  // Active contracts columns
  const activeColumns: DataTableColumn[] = [
    {
      key: 'contractNumber',
      label: t('table.contractNumber'),
      sortable: true,
      searchable: true,
    },
    {
      key: 'apartment',
      label: t('table.apartment'),
      sortable: true,
      searchable: true,
    },
    {
      key: 'startDate',
      label: t('form.startDate'),
      sortable: true,
      searchable: false,
      render: (value) => (value ? dayjs(value).format('DD.MM.YYYY') : '-'),
    },
    {
      key: 'endDate',
      label: t('table.endDate'),
      sortable: true,
      searchable: false,
      render: (value) => (value ? dayjs(value).format('DD.MM.YYYY') : '-'),
    },
    {
      key: 'rentAmount',
      label: t('form.rentAmount'),
      sortable: true,
      searchable: false,
      align: 'right',
      render: (value) => formatCurrency(Number(value)),
    },
    {
      key: 'autoRenewal',
      label: t('tracking.autoRenewal'),
      sortable: true,
      searchable: false,
      render: (value) => (
        <Badge color={value ? 'green' : 'gray'} variant="light">
          {value ? (t('common.yes')) : (t('common.no'))}
        </Badge>
      ),
    },
  ];

  // Expired contracts columns
  const expiredColumns: DataTableColumn[] = [
    {
      key: 'contractNumber',
      label: t('table.contractNumber'),
      sortable: true,
      searchable: true,
    },
    {
      key: 'apartment',
      label: t('table.apartment'),
      sortable: true,
      searchable: true,
    },
    {
      key: 'endDate',
      label: t('table.endDate'),
      sortable: true,
      searchable: false,
      render: (value) => (value ? dayjs(value).format('DD.MM.YYYY') : '-'),
    },
    {
      key: 'status',
      label: t('table.status'),
      sortable: true,
      searchable: false,
      render: () => (
        <Badge color="red" variant="light">
          {t('tracking.expired')}
        </Badge>
      ),
    },
  ];

  // Prepare data for tables
  const upcomingData = useMemo(() => {
    return upcomingRenewals.map((contract: any) => ({
      id: contract.id,
      contractNumber: contract.contractNumber,
      apartment: contract.apartment?.unitNumber || 'N/A',
      endDate: contract.endDate,
      daysUntil: getDaysUntilRenewal(contract.endDate),
      status: contract,
      autoRenewal: contract.autoRenewal,
    }));
  }, [upcomingRenewals]);

  const activeData = useMemo(() => {
    return activeContracts.map((contract: any) => ({
      id: contract.id,
      contractNumber: contract.contractNumber,
      apartment: contract.apartment?.unitNumber || 'N/A',
      startDate: contract.startDate,
      endDate: contract.endDate,
      rentAmount: contract.rentAmount,
      currency: contract.currency,
      autoRenewal: contract.autoRenewal,
    }));
  }, [activeContracts]);

  const expiredData = useMemo(() => {
    return expiredContracts.map((contract: any) => ({
      id: contract.id,
      contractNumber: contract.contractNumber,
      apartment: contract.apartment?.unitNumber || 'N/A',
      endDate: contract.endDate,
      status: 'expired',
    }));
  }, [expiredContracts]);

  return (
    <Stack gap="md">
      <Group justify="space-between">
        <Text fw={500}>
          {t('tracking.title')}
        </Text>
        <Button
          leftSection={<IconRefresh size={18} />}
          onClick={() => refetch()}
          variant="subtle"
        >
          {tGlobal('common.refresh')}
        </Button>
      </Group>

      {/* Summary Cards */}
      <Grid>
        <Grid.Col span={{ base: 12, md: 3 }}>
          <Card shadow="sm" padding="lg" radius="md" withBorder>
            <Stack gap="xs">
              <Group justify="space-between">
                <Text c="dimmed">
                  {t('tracking.totalActive')}
                </Text>
                <IconContract size={20} />
              </Group>
              <Text fw={700}>
                {activeContracts.length}
              </Text>
            </Stack>
          </Card>
        </Grid.Col>
        <Grid.Col span={{ base: 12, md: 3 }}>
          <Card shadow="sm" padding="lg" radius="md" withBorder>
            <Stack gap="xs">
              <Group justify="space-between">
                <Text c="dimmed">
                  {t('tracking.upcomingRenewals')}
                </Text>
                <IconCalendar size={20} />
              </Group>
              <Text fw={700} c="orange">
                {upcomingRenewals.length}
              </Text>
            </Stack>
          </Card>
        </Grid.Col>
        <Grid.Col span={{ base: 12, md: 3 }}>
          <Card shadow="sm" padding="lg" radius="md" withBorder>
            <Stack gap="xs">
              <Group justify="space-between">
                <Text c="dimmed">
                  {t('tracking.expired')}
                </Text>
                <IconAlertCircle size={20} />
              </Group>
              <Text fw={700} c="red">
                {expiredContracts.length}
              </Text>
            </Stack>
          </Card>
        </Grid.Col>
        <Grid.Col span={{ base: 12, md: 3 }}>
          <Card shadow="sm" padding="lg" radius="md" withBorder>
            <Stack gap="xs">
              <Group justify="space-between">
                <Text c="dimmed">
                  {t('tracking.autoRenewal')}
                </Text>
                <IconTrendingUp size={20} />
              </Group>
              <Text fw={700} c="green">
                {contracts.filter((c: any) => c.autoRenewal).length}
              </Text>
            </Stack>
          </Card>
        </Grid.Col>
      </Grid>

      {/* Tabs */}
      <Tabs value={activeTab} onChange={(value) => setActiveTab(value || 'upcoming')}>
        <Tabs.List>
          <Tabs.Tab value="upcoming" leftSection={<IconClock size={18} />}>
            {t('tracking.upcomingRenewals')} ({upcomingRenewals.length})
          </Tabs.Tab>
          <Tabs.Tab value="active" leftSection={<IconCheck size={18} />}>
            {t('tracking.active')} ({activeContracts.length})
          </Tabs.Tab>
          <Tabs.Tab value="expired" leftSection={<IconAlertCircle size={18} />}>
            {t('tracking.expired')} ({expiredContracts.length})
          </Tabs.Tab>
        </Tabs.List>

        <Tabs.Panel value="upcoming" pt="md">
          {upcomingRenewals.length > 0 ? (
            <DataTable
              columns={upcomingColumns}
              data={upcomingData}
              searchable={true}
              sortable={true}
              pageable={true}
              defaultPageSize={25}
              emptyMessage={t('tracking.noUpcomingRenewals')}
              showColumnSettings={true}
            />
          ) : (
            <Alert icon={<IconCheck size={16} />} color="green">
              {t('tracking.noUpcomingRenewals')}
            </Alert>
          )}
        </Tabs.Panel>

        <Tabs.Panel value="active" pt="md">
          {activeContracts.length > 0 ? (
            <DataTable
              columns={activeColumns}
              data={activeData}
              searchable={true}
              sortable={true}
              pageable={true}
              defaultPageSize={25}
              emptyMessage={t('tracking.noActiveContracts')}
              showColumnSettings={true}
            />
          ) : (
            <Text c="dimmed" ta="center" py="xl">
              {t('tracking.noActiveContracts')}
            </Text>
          )}
        </Tabs.Panel>

        <Tabs.Panel value="expired" pt="md">
          {expiredContracts.length > 0 ? (
            <DataTable
              columns={expiredColumns}
              data={expiredData}
              searchable={true}
              sortable={true}
              pageable={true}
              defaultPageSize={25}
              emptyMessage={t('tracking.noExpiredContracts')}
              showColumnSettings={true}
            />
          ) : (
            <Alert icon={<IconCheck size={16} />} color="green">
              {t('tracking.noExpiredContracts')}
            </Alert>
          )}
        </Tabs.Panel>
      </Tabs>
    </Stack>
  );
}
