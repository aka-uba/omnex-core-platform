'use client';

import { useState } from 'react';
import {
  Paper,
  Button,
  Group,
  Text,
  Badge,
  ActionIcon,
  Stack,
  Alert,
  Loader,
} from '@mantine/core';
import { DataTable } from '@/components/tables/DataTable';
import {
  IconRefresh,
  IconAlertCircle,
  IconCheck,
} from '@tabler/icons-react';
import { showToast } from '@/modules/notifications/components/ToastNotification';
import { useContractsNeedingRenewal, useRenewContract, useAutoRenewContracts } from '@/hooks/useContractRenewal';
import { useTranslation } from '@/lib/i18n/client';
import type { Contract } from '@/modules/real-estate/types/contract';

interface ContractRenewalManagerProps {
  locale: string;
  daysAhead?: number;
}

export function ContractRenewalManager({ locale, daysAhead = 30 }: ContractRenewalManagerProps) {
  const { t } = useTranslation('modules/real-estate');
  const { t: tGlobal } = useTranslation('global');
  const [selectedContractId, setSelectedContractId] = useState<string | null>(null);

  const { data, isLoading, refetch } = useContractsNeedingRenewal(daysAhead);
  const renewContract = useRenewContract();
  const autoRenewContracts = useAutoRenewContracts();

  const handleRenew = async (contractId: string) => {
    setSelectedContractId(contractId);
    try {
      await renewContract.mutateAsync(contractId);
      showToast({
        type: 'success',
        title: t('messages.renewSuccess'),
        message: t('messages.renewSuccess'),
      });
      refetch();
    } catch (error) {
      showToast({
        type: 'error',
        title: t('messages.renewError'),
        message: error instanceof Error ? error.message : (t('messages.renewError')),
      });
    } finally {
      setSelectedContractId(null);
    }
  };

  const handleAutoRenew = async () => {
    try {
      const result = await autoRenewContracts.mutateAsync();
      showToast({
        type: result.failed === 0 ? 'success' : 'warning',
        title: t('messages.autoRenewSuccess'),
        message: `${result.renewed} contracts renewed, ${result.failed} failed`,
      });
      refetch();
    } catch (error) {
      showToast({
        type: 'error',
        title: t('messages.autoRenewError'),
        message: error instanceof Error ? error.message : (t('messages.autoRenewError')),
      });
    }
  };

  const getDaysUntilRenewal = (endDate: string | Date | null | undefined): number => {
    if (!endDate) return 0;
    const end = new Date(endDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const diff = end.getTime() - today.getTime();
    return Math.ceil(diff / (1000 * 60 * 60 * 24));
  };

  const getStatusBadge = (contract: Contract) => {
    const daysUntil = getDaysUntilRenewal(contract.endDate);
    if (daysUntil < 0) {
      return <Badge color="red">{t('status.overdue')}</Badge>;
    } else if (daysUntil <= 7) {
      return <Badge color="orange">{t('status.urgent')}</Badge>;
    } else if (daysUntil <= 30) {
      return <Badge color="yellow">{t('status.upcoming')}</Badge>;
    }
    return <Badge color="blue">{t('status.scheduled')}</Badge>;
  };

  if (isLoading) {
    return (
      <Paper shadow="xs" p="md">
        <Loader />
      </Paper>
    );
  }

  if (!data) {
    return (
      <Paper shadow="xs" p="md">
        <Text>{tGlobal('common.noData')}</Text>
      </Paper>
    );
  }

  return (
    <Paper shadow="xs" p="md">
      <Stack gap="md">
        <Group justify="space-between">
          <Text fw={500}>
            {t('renewal.title')}
          </Text>
          <Group>
            <Button
              leftSection={<IconRefresh size={18} />}
              onClick={() => refetch()}
              variant="subtle"
            >
              {tGlobal('common.refresh')}
            </Button>
            <Button
              leftSection={<IconRefresh size={18} />}
              onClick={handleAutoRenew}
              loading={autoRenewContracts.isPending}
              disabled={data.count === 0}
            >
              {t('renewal.autoRenew')}
            </Button>
          </Group>
        </Group>

        {data.count === 0 ? (
          <Alert icon={<IconCheck size={16} />} color="green">
            {t('renewal.noContracts')}
          </Alert>
        ) : (
          <>
            <Alert icon={<IconAlertCircle size={16} />} color="blue">
              {`${data.count} ${t('renewal.info')} ${daysAhead} ${t('renewal.days')}`}
            </Alert>

            <DataTable
              columns={[
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
                  render: (value, row) => row.apartment?.unitNumber || '-',
                },
                {
                  key: 'endDate',
                  label: t('table.endDate'),
                  sortable: true,
                  searchable: false,
                  render: (value) => (value ? new Date(value as string | Date).toLocaleDateString() : '-'),
                },
                {
                  key: 'daysUntil',
                  label: t('table.daysUntil'),
                  sortable: true,
                  searchable: false,
                  align: 'right',
                  render: (value, row) => {
                    const daysUntil = getDaysUntilRenewal(row.endDate);
                    return (
                      <Text c={daysUntil < 0 ? 'red' : daysUntil <= 7 ? 'orange' : 'blue'}>
                        {daysUntil}
                      </Text>
                    );
                  },
                },
                {
                  key: 'status',
                  label: t('table.status'),
                  sortable: true,
                  searchable: false,
                  render: (value, row) => getStatusBadge(row),
                },
                {
                  key: 'actions',
                  label: t('table.actions'),
                  sortable: false,
                  searchable: false,
                  align: 'right',
                  render: (value, row) => (
                    <Group gap="xs" justify="flex-end">
                      <ActionIcon
                        variant="subtle"
                        color="green"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleRenew(row.id);
                        }}
                        loading={selectedContractId === row.id && renewContract.isPending}
                      >
                        <IconRefresh size={18} />
                      </ActionIcon>
                    </Group>
                  ),
                },
              ]}
              data={data.contracts.map((contract) => ({
                id: contract.id,
                contract: contract,
                contractNumber: contract.contractNumber,
                apartment: contract.apartment,
                endDate: contract.endDate,
                daysUntil: getDaysUntilRenewal(contract.endDate),
                status: contract,
              }))}
              searchable={true}
              sortable={true}
              pageable={true}
              defaultPageSize={25}
              emptyMessage={t('renewal.noContracts')}
              showColumnSettings={true}
            />
          </>
        )}
      </Stack>
    </Paper>
  );
}

