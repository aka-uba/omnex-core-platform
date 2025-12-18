'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Paper,
  TextInput,
  Button,
  Table,
  Badge,
  ActionIcon,
  Group,
  Text,
  Tooltip,
  Pagination,
  Select,
  Menu,
  Loader,
} from '@mantine/core';
import {
  IconSearch,
  IconPlus,
  IconEdit,
  IconTrash,
  IconEye,
  IconDownload,
} from '@tabler/icons-react';
import { useProductionOrders, useDeleteProductionOrder } from '@/hooks/useProductionOrders';
import { useProducts } from '@/hooks/useProducts';
import { useLocations } from '@/hooks/useLocations';
import { useTranslation } from '@/lib/i18n/client';
import { showToast } from '@/modules/notifications/components/ToastNotification';
import { useExport } from '@/lib/export/ExportProvider';
import { useConfirmDialog } from '@/hooks/useConfirmDialog';
import type { ProductionOrderStatus, ProductionOrderPriority } from '@/modules/production/types/product';
import type { ExportFormat } from '@/lib/export/types';
import dayjs from 'dayjs';

interface ProductionOrderListProps {
  locale: string;
}

export function ProductionOrderList({ locale }: ProductionOrderListProps) {
  const router = useRouter();
  const { t } = useTranslation('modules/production');
  const { t: tGlobal } = useTranslation('global');
  const { exportToExcel, exportToPDF, exportToCSV, isExporting } = useExport();
  const [page, setPage] = useState(1);
  const [pageSize] = useState<number>(10);
  const [search, setSearch] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<ProductionOrderStatus | undefined>();
  const [priorityFilter, setPriorityFilter] = useState<ProductionOrderPriority | undefined>();
  const [productId, setProductId] = useState<string | undefined>();
  const [locationId, setLocationId] = useState<string | undefined>();

  const { data, isLoading, error } = useProductionOrders({
    page,
    pageSize,
    ...(search ? { search } : {}),
    ...(statusFilter ? { status: statusFilter } : {}),
    ...(priorityFilter ? { priority: priorityFilter } : {}),
    ...(productId ? { productId } : {}),
    ...(locationId ? { locationId } : {}),
  });

  // Fetch products and locations for filters
  const { data: productsData } = useProducts({ page: 1, pageSize: 1000 });
  const { data: locationsData } = useLocations({ page: 1, pageSize: 1000 });

  const deleteOrder = useDeleteProductionOrder();
  const { confirm, ConfirmDialog } = useConfirmDialog();

  const handleDelete = async (id: string) => {
    const confirmed = await confirm({
      title: t('orders.delete.title'),
      message: t('orders.delete.confirm'),
      confirmLabel: tGlobal('common.delete'),
      confirmColor: 'red',
    });

    if (confirmed) {
      try {
        await deleteOrder.mutateAsync(id);
        showToast({
          type: 'success',
          title: t('messages.success'),
          message: t('orders.delete.success'),
        });
      } catch (error) {
        showToast({
          type: 'error',
          title: t('messages.error'),
          message: error instanceof Error ? error.message : t('orders.delete.error'),
        });
      }
    }
  };

  const handleExport = async (format: ExportFormat) => {
    if (!data) return;

    try {
      const exportData = {
        columns: [
          t('orders.table.orderNumber'),
          t('orders.table.product'),
          t('orders.table.quantity'),
          t('orders.table.status'),
          t('orders.table.priority'),
          t('orders.table.plannedStart'),
          t('orders.table.plannedEnd'),
          t('orders.table.actualStart'),
          t('orders.table.actualEnd'),
        ],
        rows: data.orders.map((order) => [
          order.orderNumber,
          order.product?.name || '-',
          `${Number(order.quantity).toLocaleString('tr-TR')} ${order.unit}`,
          t(`orders.status.${order.status}`) || order.status,
          t(`orders.priority.${order.priority}`) || order.priority,
          order.plannedStartDate ? dayjs(order.plannedStartDate).format('DD.MM.YYYY') : '-',
          order.plannedEndDate ? dayjs(order.plannedEndDate).format('DD.MM.YYYY') : '-',
          order.actualStartDate ? dayjs(order.actualStartDate).format('DD.MM.YYYY') : '-',
          order.actualEndDate ? dayjs(order.actualEndDate).format('DD.MM.YYYY') : '-',
        ]),
        metadata: {
          title: t('orders.title'),
          description: t('orders.exportDescription'),
          generatedAt: new Date().toISOString(),
        },
      };

      const options = {
        title: t('orders.title'),
        description: t('orders.exportDescription'),
        includeHeader: true,
        includeFooter: true,
        includePageNumbers: true,
        filename: `production_orders_${dayjs().format('YYYY-MM-DD')}`,
      };

      switch (format) {
        case 'excel':
          await exportToExcel(exportData, options);
          break;
        case 'pdf':
          await exportToPDF(exportData, options);
          break;
        case 'csv':
          await exportToCSV(exportData, options);
          break;
      }

      showToast({
        type: 'success',
        title: t('messages.success'),
        message: t('orders.exportSuccess'),
      });
    } catch (error) {
      showToast({
        type: 'error',
        title: t('messages.error'),
        message: error instanceof Error ? error.message : t('orders.exportError'),
      });
    }
  };

  if (isLoading) {
    return (
      <Paper shadow="sm" p="md" radius="md">
        <Loader />
      </Paper>
    );
  }

  if (error) {
    return (
      <Paper shadow="sm" p="md" radius="md">
        <Text c="red">{tGlobal('common.errorLoading')}</Text>
      </Paper>
    );
  }

  if (!data) {
    return (
      <Paper shadow="sm" p="md" radius="md">
        <Text>{tGlobal('common.noData')}</Text>
      </Paper>
    );
  }

  const getStatusBadge = (status: ProductionOrderStatus) => {
    const statusColors: Record<ProductionOrderStatus, string> = {
      pending: 'yellow',
      in_progress: 'blue',
      completed: 'green',
      cancelled: 'red',
    };
    return (
      <Badge color={statusColors[status] || 'gray'}>
        {t(`orders.status.${status}`) || status}
      </Badge>
    );
  };

  const getPriorityBadge = (priority: ProductionOrderPriority) => {
    const priorityColors: Record<ProductionOrderPriority, string> = {
      low: 'gray',
      normal: 'blue',
      high: 'orange',
      urgent: 'red',
    };
    return (
      <Badge color={priorityColors[priority] || 'gray'}>
        {t(`orders.priority.${priority}`) || priority}
      </Badge>
    );
  };

  return (
    <Paper shadow="xs" p="md">
      <Group justify="space-between" mb="md">
        <TextInput
          placeholder={t('search.placeholder')}
          leftSection={<IconSearch size={16} />}
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setPage(1);
          }}
          style={{ flex: 1, maxWidth: 400 }}
        />
        <Group>
          <Select
            placeholder={t('orders.filter.product')}
            data={[
              { value: '', label: t('filter.all') },
              ...(productsData?.products.map(p => ({ value: p.id, label: p.name })) || []),
            ]}
            value={productId || ''}
            onChange={(value) => setProductId(value || undefined)}
            clearable
            searchable
            style={{ width: 200 }}
          />
          <Select
            placeholder={t('orders.filter.location')}
            data={[
              { value: '', label: t('filter.all') },
              ...(locationsData?.locations.map(l => ({ value: l.id, label: l.name })) || []),
            ]}
            value={locationId || ''}
            onChange={(value) => setLocationId(value || undefined)}
            clearable
            style={{ width: 200 }}
          />
          <Select
            placeholder={t('orders.filter.status')}
            data={[
              { value: '', label: t('filter.all') },
              { value: 'pending', label: t('orders.status.pending') },
              { value: 'in_progress', label: t('orders.status.in_progress') },
              { value: 'completed', label: t('orders.status.completed') },
              { value: 'cancelled', label: t('orders.status.cancelled') },
            ]}
            value={statusFilter || ''}
            onChange={(value) => setStatusFilter(value as ProductionOrderStatus | undefined)}
            clearable
            style={{ width: 150 }}
          />
          <Select
            placeholder={t('orders.filter.priority')}
            data={[
              { value: '', label: t('filter.all') },
              { value: 'low', label: t('orders.priority.low') },
              { value: 'normal', label: t('orders.priority.normal') },
              { value: 'high', label: t('orders.priority.high') },
              { value: 'urgent', label: t('orders.priority.urgent') },
            ]}
            value={priorityFilter || ''}
            onChange={(value) => setPriorityFilter(value as ProductionOrderPriority | undefined)}
            clearable
            style={{ width: 150 }}
          />
          <Menu>
            <Menu.Target>
              <Button
                leftSection={<IconDownload size={16} />}
                variant="light"
                loading={isExporting}
              >
                {t('export.title')}
              </Button>
            </Menu.Target>
            <Menu.Dropdown>
              <Menu.Item onClick={() => handleExport('excel')}>
                {t('export.excel')}
              </Menu.Item>
              <Menu.Item onClick={() => handleExport('pdf')}>
                {t('export.pdf')}
              </Menu.Item>
              <Menu.Item onClick={() => handleExport('csv')}>
                {t('export.csv')}
              </Menu.Item>
            </Menu.Dropdown>
          </Menu>
          <Button
            leftSection={<IconPlus size={16} />}
            onClick={() => router.push(`/${locale}/modules/production/orders/create`)}
          >
            {t('orders.create')}
          </Button>
        </Group>
      </Group>

      <Table striped highlightOnHover>
        <Table.Thead>
          <Table.Tr>
            <Table.Th>{t('orders.table.orderNumber')}</Table.Th>
            <Table.Th>{t('orders.table.product')}</Table.Th>
            <Table.Th>{t('orders.table.quantity')}</Table.Th>
            <Table.Th>{t('orders.table.status')}</Table.Th>
            <Table.Th>{t('orders.table.priority')}</Table.Th>
            <Table.Th>{t('orders.table.plannedStart')}</Table.Th>
            <Table.Th>{t('orders.table.plannedEnd')}</Table.Th>
            <Table.Th>{t('orders.table.actions')}</Table.Th>
          </Table.Tr>
        </Table.Thead>
        <Table.Tbody>
          {data.orders.map((order) => (
            <Table.Tr key={order.id}>
              <Table.Td>
                <Text fw={500}>{order.orderNumber}</Text>
              </Table.Td>
              <Table.Td>{order.product?.name || '-'}</Table.Td>
              <Table.Td>
                {Number(order.quantity).toLocaleString('tr-TR')} {order.unit}
              </Table.Td>
              <Table.Td>{getStatusBadge(order.status)}</Table.Td>
              <Table.Td>{getPriorityBadge(order.priority)}</Table.Td>
              <Table.Td>
                {order.plannedStartDate ? dayjs(order.plannedStartDate).format('DD.MM.YYYY') : '-'}
              </Table.Td>
              <Table.Td>
                {order.plannedEndDate ? dayjs(order.plannedEndDate).format('DD.MM.YYYY') : '-'}
              </Table.Td>
              <Table.Td>
                <Group gap="xs" justify="flex-end">
                  <Tooltip label={t('actions.view')} withArrow>
                    <ActionIcon
                      variant="subtle"
                      color="blue"
                      onClick={() => router.push(`/${locale}/modules/production/orders/${order.id}`)}
                    >
                      <IconEye size={18} />
                    </ActionIcon>
                  </Tooltip>
                  <Tooltip label={t('actions.edit')} withArrow>
                    <ActionIcon
                      variant="subtle"
                      color="gray"
                      onClick={() => router.push(`/${locale}/modules/production/orders/${order.id}/edit`)}
                    >
                      <IconEdit size={18} />
                    </ActionIcon>
                  </Tooltip>
                  <Tooltip label={t('actions.delete')} withArrow>
                    <ActionIcon
                      variant="subtle"
                      color="red"
                      onClick={() => handleDelete(order.id)}
                    >
                      <IconTrash size={18} />
                    </ActionIcon>
                  </Tooltip>
                </Group>
              </Table.Td>
            </Table.Tr>
          ))}
        </Table.Tbody>
      </Table>

      {data.total > 0 && (
        <Group justify="space-between" mt="md">
          <Text size="sm" c="dimmed">
            {t('pagination.showing')} {(page - 1) * pageSize + 1} - {Math.min(page * pageSize, data.total)} {t('pagination.of')} {data.total}
          </Text>
          <Pagination
            value={page}
            onChange={setPage}
            total={Math.ceil(data.total / pageSize)}
          />
        </Group>
      )}
      <ConfirmDialog />
    </Paper>
  );
}








