/**
 * Production Module - Order Widget for Web Builder (FAZ 3)
 * Displays a list of production orders in a web page
 */

'use client';

import { Card, Table, Badge, Text } from '@mantine/core';
import { useTranslation } from '@/lib/i18n/client';
import { useProductionOrders } from '@/hooks/useProductionOrders';
import type { OrderWidgetConfig } from './widgets.types';

interface OrderWidgetProps {
  config: OrderWidgetConfig;
}

export function OrderWidget({ config }: OrderWidgetProps) {
  const { t } = useTranslation('modules/production');
  const { t: tGlobal } = useTranslation('global');
  const { data: ordersData, isLoading } = useProductionOrders({
    page: 1,
    pageSize: config.limit || 10,
    ...(config.status !== 'all' && config.status ? { status: config.status } : {}),
  });

  const orders = ordersData?.orders || [];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'green';
      case 'in_progress':
        return 'blue';
      case 'pending':
        return 'yellow';
      case 'cancelled':
        return 'red';
      default:
        return 'gray';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'completed':
        return t('orders.status.completed');
      case 'in_progress':
        return t('orders.status.in_progress');
      case 'pending':
        return t('orders.status.pending');
      case 'cancelled':
        return t('orders.status.cancelled');
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
        ) : orders.length === 0 ? (
          <Text c="dimmed">{t('orders.empty.noOrders')}</Text>
        ) : (
          <Table striped highlightOnHover>
            <Table.Thead>
              <Table.Tr>
                <Table.Th>{t('orders.table.orderNumber')}</Table.Th>
                <Table.Th>{t('orders.table.product')}</Table.Th>
                <Table.Th>{t('orders.table.quantity')}</Table.Th>
                <Table.Th>{t('orders.table.status')}</Table.Th>
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {orders.map((order: any) => (
                <Table.Tr key={order.id}>
                  <Table.Td>{order.orderNumber || '-'}</Table.Td>
                  <Table.Td>{order.productName || '-'}</Table.Td>
                  <Table.Td>{order.quantity || '-'}</Table.Td>
                  <Table.Td>
                    <Badge color={getStatusColor(order.status)}>
                      {getStatusLabel(order.status)}
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







