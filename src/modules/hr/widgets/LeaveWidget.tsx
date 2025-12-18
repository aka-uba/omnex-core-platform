/**
 * HR Module - Leave Widget for Web Builder (FAZ 3)
 * Displays a list of leave requests in a web page
 */

'use client';

import { Card, Table, Badge, Text } from '@mantine/core';
import { useTranslation } from '@/lib/i18n/client';
import { useLeaves } from '@/hooks/useLeaves';
import type { LeaveWidgetConfig } from './widgets.types';

interface LeaveWidgetProps {
  config: LeaveWidgetConfig;
}

export function LeaveWidget({ config }: LeaveWidgetProps) {
  const { t } = useTranslation('modules/hr');
  const { t: tGlobal } = useTranslation('global');
  const { data: leavesData, isLoading } = useLeaves({
    page: 1,
    pageSize: config.limit || 10,
    ...(config.status && config.status !== 'all' ? { status: config.status } : {}),
  });

  const leaves = leavesData?.leaves || [];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved':
        return 'green';
      case 'pending':
        return 'yellow';
      case 'rejected':
        return 'red';
      default:
        return 'gray';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'approved':
        return t('leaves.status.approved');
      case 'pending':
        return t('leaves.status.pending');
      case 'rejected':
        return t('leaves.status.rejected');
      default:
        return status;
    }
  };

  return (
    <Card withBorder padding="md" radius="md">
      {config.title && (
        <Card.Section withBorder inheritPadding py="xs">
          <Text fw={600} size="lg">
            {config.title}
          </Text>
        </Card.Section>
      )}

      <Card.Section inheritPadding py="md">
        {isLoading ? (
          <Text c="dimmed">{tGlobal('loading')}</Text>
        ) : leaves.length === 0 ? (
          <Text c="dimmed">{t('leaves.empty.noLeaves')}</Text>
        ) : (
          <Table striped highlightOnHover>
            <Table.Thead>
              <Table.Tr>
                <Table.Th>{t('leaves.table.employee')}</Table.Th>
                <Table.Th>{t('leaves.table.type')}</Table.Th>
                <Table.Th>{t('leaves.table.startDate')}</Table.Th>
                <Table.Th>{t('leaves.table.days')}</Table.Th>
                <Table.Th>{t('leaves.table.status')}</Table.Th>
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {leaves.map((leave: any) => (
                <Table.Tr key={leave.id}>
                  <Table.Td>
                    {leave.employeeName || leave.employeeId || '-'}
                  </Table.Td>
                  <Table.Td>{leave.type || '-'}</Table.Td>
                  <Table.Td>
                    {leave.startDate
                      ? new Date(leave.startDate).toLocaleDateString('tr-TR')
                      : '-'}
                  </Table.Td>
                  <Table.Td>{leave.days || '-'}</Table.Td>
                  <Table.Td>
                    <Badge color={getStatusColor(leave.status)}>
                      {getStatusLabel(leave.status)}
                    </Badge>
                  </Table.Td>
                </Table.Tr>
              ))}
            </Table.Tbody>
          </Table>
        )}
      </Card.Section>
    </Card>
  );
}







