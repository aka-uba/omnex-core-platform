'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Paper,
  Button,
  Table,
  Badge,
  Group,
  Text,
  Pagination,
  Select,
  Menu,
  Loader,
} from '@mantine/core';
import {
  IconPlus,
  IconDownload,
} from '@tabler/icons-react';
import { useStockMovements } from '@/hooks/useStockMovements';
import { useProducts } from '@/hooks/useProducts';
import { useLocations } from '@/hooks/useLocations';
import { useTranslation } from '@/lib/i18n/client';
import { showToast } from '@/modules/notifications/components/ToastNotification';
import { useExport } from '@/lib/export/ExportProvider';
import type { StockMovementType } from '@/modules/production/types/product';
import type { ExportFormat } from '@/lib/export/types';
import dayjs from 'dayjs';

interface StockMovementListProps {
  locale: string;
}

export function StockMovementList({ locale }: StockMovementListProps) {
  const router = useRouter();
  const { t } = useTranslation('modules/production');
  const { t: tGlobal } = useTranslation('global');
  const { exportToExcel, exportToPDF, exportToCSV, isExporting } = useExport();
  const [page, setPage] = useState(1);
  const [pageSize] = useState<number>(10);
  const [productId, setProductId] = useState<string | undefined>();
  const [locationId, setLocationId] = useState<string | undefined>();
  const [typeFilter, setTypeFilter] = useState<StockMovementType | undefined>();

  const { data, isLoading, error } = useStockMovements({
    page,
    pageSize,
    ...(productId ? { productId } : {}),
    ...(locationId ? { locationId } : {}),
    ...(typeFilter ? { type: typeFilter } : {}),
  });

  // Fetch products and locations for filters
  const { data: productsData } = useProducts({ page: 1, pageSize: 1000 });
  const { data: locationsData } = useLocations({ page: 1, pageSize: 1000 });

  const handleExport = async (format: ExportFormat) => {
    if (!data) return;

    try {
      const exportData = {
        columns: [
          t('stock.table.product'),
          t('stock.table.type'),
          t('stock.table.quantity'),
          t('stock.table.unit'),
          t('stock.table.movementDate'),
          t('stock.table.referenceType'),
          t('stock.table.notes'),
        ],
        rows: data.movements.map((movement) => [
          movement.product?.name || '-',
          t(`stock.types.${movement.type}`) || movement.type,
          Number(movement.quantity).toLocaleString('tr-TR'),
          movement.unit,
          dayjs(movement.movementDate).format('DD.MM.YYYY HH:mm'),
          movement.referenceType || '-',
          movement.notes || '-',
        ]),
        metadata: {
          title: t('stock.title'),
          description: t('stock.exportDescription'),
          generatedAt: new Date().toISOString(),
        },
      };

      const options = {
        title: t('stock.title'),
        description: t('stock.exportDescription'),
        includeHeader: true,
        includeFooter: true,
        includePageNumbers: true,
        filename: `stock_movements_${dayjs().format('YYYY-MM-DD')}`,
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
        message: t('stock.exportSuccess'),
      });
    } catch (error) {
      showToast({
        type: 'error',
        title: t('messages.error'),
        message: error instanceof Error ? error.message : t('stock.exportError'),
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

  const getTypeBadge = (type: StockMovementType) => {
    const typeColors: Record<StockMovementType, string> = {
      in: 'green',
      out: 'red',
      transfer: 'blue',
      adjustment: 'orange',
    };
    return (
      <Badge color={typeColors[type] || 'gray'}>
        {t(`stock.types.${type}`) || type}
      </Badge>
    );
  };

  return (
    <Paper shadow="sm" p="md" radius="md">
      <Group justify="space-between" mb="md">
        <Group>
          <Select
            placeholder={t('stock.filter.product')}
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
            placeholder={t('stock.filter.location')}
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
            placeholder={t('stock.filter.type')}
            data={[
              { value: '', label: t('filter.all') },
              { value: 'in', label: t('stock.types.in') },
              { value: 'out', label: t('stock.types.out') },
              { value: 'transfer', label: t('stock.types.transfer') },
              { value: 'adjustment', label: t('stock.types.adjustment') },
            ]}
            value={typeFilter || ''}
            onChange={(value) => setTypeFilter(value as StockMovementType | undefined)}
            clearable
            style={{ width: 150 }}
          />
        </Group>
        <Group>
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
            onClick={() => router.push(`/${locale}/modules/production/stock/create`)}
          >
            {t('stock.create')}
          </Button>
        </Group>
      </Group>

      <Table striped highlightOnHover>
        <Table.Thead>
          <Table.Tr>
            <Table.Th>{t('stock.table.product')}</Table.Th>
            <Table.Th>{t('stock.table.type')}</Table.Th>
            <Table.Th>{t('stock.table.quantity')}</Table.Th>
            <Table.Th>{t('stock.table.unit')}</Table.Th>
            <Table.Th>{t('stock.table.movementDate')}</Table.Th>
            <Table.Th>{t('stock.table.referenceType')}</Table.Th>
            <Table.Th>{t('stock.table.notes')}</Table.Th>
          </Table.Tr>
        </Table.Thead>
        <Table.Tbody>
          {data.movements.map((movement) => (
            <Table.Tr key={movement.id}>
              <Table.Td>
                <Text fw={500}>{movement.product?.name || '-'}</Text>
              </Table.Td>
              <Table.Td>{getTypeBadge(movement.type)}</Table.Td>
              <Table.Td>
                {Number(movement.quantity).toLocaleString('tr-TR')}
              </Table.Td>
              <Table.Td>{movement.unit}</Table.Td>
              <Table.Td>
                {dayjs(movement.movementDate).format('DD.MM.YYYY HH:mm')}
              </Table.Td>
              <Table.Td>{movement.referenceType || '-'}</Table.Td>
              <Table.Td>{movement.notes || '-'}</Table.Td>
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
    </Paper>
  );
}








