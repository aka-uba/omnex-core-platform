'use client';

import {
  Paper,
  Group,
  Stack,
  Text,
  Badge,
  Grid,
} from '@mantine/core';
import { IconCalendar, IconCurrencyDollar, IconHome, IconUser } from '@tabler/icons-react';
import { useContract } from '@/hooks/useContracts';
import { useTranslation } from '@/lib/i18n/client';
import dayjs from 'dayjs';
import type { ContractType, ContractStatus } from '@/modules/real-estate/types/contract';
import { DetailPageSkeleton } from '@/components/skeletons/DetailPageSkeleton';

interface ContractDetailProps {
  locale: string;
  contractId: string;
}

export function ContractDetail({ locale, contractId }: ContractDetailProps) {
  const { t } = useTranslation('modules/real-estate');
  const { data: contract, isLoading, error } = useContract(contractId);

  const getTypeBadge = (type: ContractType) => {
    const typeColors: Record<ContractType, string> = {
      rental: 'blue',
      sale: 'green',
      lease: 'orange',
    };
    return (
      <Badge color={typeColors[type] || 'gray'}>
        {t(`types.${type}`) || type}
      </Badge>
    );
  };

  const getStatusBadge = (status: ContractStatus) => {
    const statusColors: Record<ContractStatus, string> = {
      draft: 'gray',
      active: 'green',
      expired: 'red',
      terminated: 'orange',
    };
    return (
      <Badge color={statusColors[status] || 'gray'}>
        {t(`contracts.status.${status}`) || status}
      </Badge>
    );
  };

  if (isLoading) {
    return <DetailPageSkeleton />;
  }

  if (error || !contract) {
    return (
      <Paper shadow="xs" p="md">
        <Text c="red">{t('common.errorLoading')}</Text>
      </Paper>
    );
  }

  return (
    <Paper shadow="xs" p="xl">
      <Stack gap="md">

        <Grid>
          <Grid.Col span={6}>
            <Text size="sm" c="dimmed">
              {t('form.type')}
            </Text>
            <Text fw={500} component="div">{getTypeBadge(contract.type)}</Text>
          </Grid.Col>

          <Grid.Col span={6}>
            <Text size="sm" c="dimmed">
              {t('form.status')}
            </Text>
            <Text fw={500} component="div">{getStatusBadge(contract.status)}</Text>
          </Grid.Col>

          <Grid.Col span={12}>
            <Group gap="xs">
              <IconHome size={16} />
              <div>
                <Text size="sm" c="dimmed">
                  {t('form.apartment')}
                </Text>
                <Text fw={500}>
                  {contract.apartment
                    ? `${contract.apartment.unitNumber} - ${contract.apartment.property?.name || ''}`
                    : '-'}
                </Text>
              </div>
            </Group>
          </Grid.Col>

          <Grid.Col span={12}>
            <Group gap="xs">
              <IconUser size={16} />
              <div>
                <Text size="sm" c="dimmed">
                  {t('form.tenant')}
                </Text>
                <Text fw={500}>
                  {contract.tenantRecord?.tenantNumber || contract.tenantRecord?.id || '-'}
                </Text>
              </div>
            </Group>
          </Grid.Col>

          <Grid.Col span={6}>
            <Group gap="xs">
              <IconCurrencyDollar size={16} />
              <div>
                <Text size="sm" c="dimmed">
                  {t('form.rentAmount')}
                </Text>
                <Text fw={500}>
                  {new Intl.NumberFormat('tr-TR', {
                    style: 'currency',
                    currency: contract.currency || 'TRY',
                  }).format(Number(contract.rentAmount))}
                </Text>
              </div>
            </Group>
          </Grid.Col>

          {contract.deposit && (
            <Grid.Col span={6}>
              <Group gap="xs">
                <IconCurrencyDollar size={16} />
                <div>
                  <Text size="sm" c="dimmed">
                    {t('form.deposit')}
                  </Text>
                  <Text fw={500}>
                    {new Intl.NumberFormat('tr-TR', {
                      style: 'currency',
                      currency: contract.currency || 'TRY',
                    }).format(Number(contract.deposit))}
                  </Text>
                </div>
              </Group>
            </Grid.Col>
          )}

          <Grid.Col span={6}>
            <Group gap="xs">
              <IconCalendar size={16} />
              <div>
                <Text size="sm" c="dimmed">
                  {t('form.startDate')}
                </Text>
                <Text fw={500}>{dayjs(contract.startDate).format('DD.MM.YYYY')}</Text>
              </div>
            </Group>
          </Grid.Col>

          {contract.endDate && (
            <Grid.Col span={6}>
              <Group gap="xs">
                <IconCalendar size={16} />
                <div>
                  <Text size="sm" c="dimmed">
                    {t('form.endDate')}
                  </Text>
                  <Text fw={500}>{dayjs(contract.endDate).format('DD.MM.YYYY')}</Text>
                </div>
              </Group>
            </Grid.Col>
          )}

          {contract.renewalDate && (
            <Grid.Col span={6}>
              <Group gap="xs">
                <IconCalendar size={16} />
                <div>
                  <Text size="sm" c="dimmed">
                    {t('form.renewalDate')}
                  </Text>
                  <Text fw={500}>{dayjs(contract.renewalDate).format('DD.MM.YYYY')}</Text>
                </div>
              </Group>
            </Grid.Col>
          )}

          {contract.paymentType && (
            <Grid.Col span={6}>
              <Text size="sm" c="dimmed">
                {t('form.paymentType')}
              </Text>
              <Text fw={500}>
                {contract.paymentType === 'cash' 
                  ? (t('payments.methods.cash'))
                  : contract.paymentType === 'bank_transfer'
                  ? (t('payments.methods.bankTransfer'))
                  : contract.paymentType === 'auto_debit'
                  ? (t('payments.methods.autoDebit'))
                  : contract.paymentType}
              </Text>
            </Grid.Col>
          )}

          {contract.paymentDay && (
            <Grid.Col span={6}>
              <Text size="sm" c="dimmed">
                {t('form.paymentDay')}
              </Text>
              <Text fw={500}>{contract.paymentDay}</Text>
            </Grid.Col>
          )}

          <Grid.Col span={6}>
            <Text size="sm" c="dimmed">
              {t('form.autoRenewal')}
            </Text>
            <Text fw={500}>{contract.autoRenewal ? (t('common.yes')) : (t('common.no'))}</Text>
          </Grid.Col>

          {contract.increaseRate && (
            <Grid.Col span={6}>
              <Text size="sm" c="dimmed">
                {t('form.increaseRate')}
              </Text>
              <Text fw={500}>%{contract.increaseRate}</Text>
            </Grid.Col>
          )}

          {contract.terms && (
            <Grid.Col span={12}>
              <Text size="sm" c="dimmed">
                {t('form.terms')}
              </Text>
              <Text>{contract.terms}</Text>
            </Grid.Col>
          )}

          {contract.notes && (
            <Grid.Col span={12}>
              <Text size="sm" c="dimmed">
                {t('form.notes')}
              </Text>
              <Text>{contract.notes}</Text>
            </Grid.Col>
          )}
        </Grid>
      </Stack>
    </Paper>
  );
}

