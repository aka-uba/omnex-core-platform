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
import { useProducts, useDeleteProduct } from '@/hooks/useProducts';
import { useLocations } from '@/hooks/useLocations';
import { useTranslation } from '@/lib/i18n/client';
import { showToast } from '@/modules/notifications/components/ToastNotification';
import { useExport } from '@/lib/export/ExportProvider';
import { useConfirmDialog } from '@/hooks/useConfirmDialog';
import type { ProductType } from '@/modules/production/types/product';
import type { ExportFormat } from '@/lib/export/types';
import dayjs from 'dayjs';

interface ProductListProps {
  locale: string;
}

export function ProductList({ locale }: ProductListProps) {
  const router = useRouter();
  const { t } = useTranslation('modules/production');
  const { t: tGlobal } = useTranslation('global');
  const { exportToExcel, exportToPDF, exportToCSV, isExporting } = useExport();
  const [page, setPage] = useState(1);
  const [pageSize] = useState<number>(10);
  const [search, setSearch] = useState<string>('');
  const [categoryFilter, setCategoryFilter] = useState<string | undefined>();
  const [typeFilter, setTypeFilter] = useState<ProductType | undefined>();
  const [isActiveFilter, setIsActiveFilter] = useState<boolean | undefined>(undefined);
  const [locationId, setLocationId] = useState<string | undefined>();

  const { data, isLoading, error } = useProducts({
    page,
    pageSize,
    ...(search ? { search } : {}),
    ...(categoryFilter ? { category: categoryFilter } : {}),
    ...(typeFilter ? { type: typeFilter } : {}),
    ...(isActiveFilter !== undefined ? { isActive: isActiveFilter } : {}),
    ...(locationId ? { locationId } : {}),
  });

  // Fetch locations for filter
  const { data: locationsData } = useLocations({ page: 1, pageSize: 1000 });

  const deleteProduct = useDeleteProduct();
  const { confirm, ConfirmDialog } = useConfirmDialog();

  const handleDelete = async (id: string) => {
    const confirmed = await confirm({
      title: t('delete.title'),
      message: t('delete.confirm'),
      confirmLabel: tGlobal('common.delete'),
      confirmColor: 'red',
    });

    if (confirmed) {
      try {
        await deleteProduct.mutateAsync(id);
        showToast({
          type: 'success',
          title: t('messages.success'),
          message: t('delete.success'),
        });
      } catch (error) {
        showToast({
          type: 'error',
          title: t('messages.error'),
          message: error instanceof Error ? error.message : t('delete.error'),
        });
      }
    }
  };

  const handleExport = async (format: ExportFormat) => {
    if (!data) return;

    try {
      const exportData = {
        columns: [
          t('table.code'),
          t('table.name'),
          t('table.category'),
          t('table.type'),
          t('table.stockQuantity'),
          t('table.unit'),
          t('table.costPrice'),
          t('table.sellingPrice'),
          t('table.status'),
        ],
        rows: data.products.map((product) => [
          product.code,
          product.name,
          product.category,
          t(`types.${product.type}`) || product.type,
          Number(product.stockQuantity).toLocaleString('tr-TR'),
          product.unit,
          product.costPrice ? Number(product.costPrice).toLocaleString('tr-TR', {
            style: 'currency',
            currency: product.currency || 'TRY',
          }) : '-',
          product.sellingPrice ? Number(product.sellingPrice).toLocaleString('tr-TR', {
            style: 'currency',
            currency: product.currency || 'TRY',
          }) : '-',
          product.isActive ? (t('status.active')) : (t('status.inactive')),
        ]),
        metadata: {
          title: t('products.title'),
          description: t('products.exportDescription'),
          generatedAt: new Date().toISOString(),
        },
      };

      const options = {
        title: t('products.title'),
        description: t('products.exportDescription'),
        includeHeader: true,
        includeFooter: true,
        includePageNumbers: true,
        filename: `products_${dayjs().format('YYYY-MM-DD')}`,
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
        message: t('products.exportSuccess'),
      });
    } catch (error) {
      showToast({
        type: 'error',
        title: t('messages.error'),
        message: error instanceof Error ? error.message : t('products.exportError'),
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

  const getTypeBadge = (type: ProductType) => {
    const typeColors: Record<ProductType, string> = {
      hammadde: 'blue',
      yarı_mamul: 'orange',
      mamul: 'green',
    };
    return (
      <Badge color={typeColors[type] || 'gray'}>
        {t(`types.${type}`) || type}
      </Badge>
    );
  };

  const getStockBadge = (stock: number, minStock?: number | null) => {
    if (minStock && stock < minStock) {
      return <Badge color="red">{Number(stock).toLocaleString('tr-TR')}</Badge>;
    }
    return <Text>{Number(stock).toLocaleString('tr-TR')}</Text>;
  };

  return (
    <Paper shadow="sm" p="md" radius="md">
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
            placeholder={t('filter.location')}
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
            placeholder={t('filter.category')}
            data={[
              { value: '', label: t('filter.all') },
              ...Array.from(new Set(data.products.map(p => p.category))).map(cat => ({ value: cat, label: cat })),
            ]}
            value={categoryFilter || ''}
            onChange={(value) => setCategoryFilter(value || undefined)}
            clearable
            style={{ width: 200 }}
          />
          <Select
            placeholder={t('filter.type')}
            data={[
              { value: '', label: t('filter.all') },
              { value: 'hammadde', label: t('types.hammadde') },
              { value: 'yarı_mamul', label: t('types.yarı_mamul') },
              { value: 'mamul', label: t('types.mamul') },
            ]}
            value={typeFilter || ''}
            onChange={(value) => setTypeFilter(value as ProductType | undefined)}
            clearable
            style={{ width: 200 }}
          />
          <Select
            placeholder={t('filter.status')}
            data={[
              { value: '', label: t('filter.all') },
              { value: 'true', label: t('status.active') },
              { value: 'false', label: t('status.inactive') },
            ]}
            value={isActiveFilter !== undefined ? isActiveFilter.toString() : ''}
            onChange={(value) => setIsActiveFilter(value ? value === 'true' : undefined)}
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
            onClick={() => router.push(`/${locale}/modules/production/products/create`)}
          >
            {t('products.create')}
          </Button>
        </Group>
      </Group>

      <Table striped highlightOnHover>
        <Table.Thead>
          <Table.Tr>
            <Table.Th>{t('table.code')}</Table.Th>
            <Table.Th>{t('table.name')}</Table.Th>
            <Table.Th>{t('table.category')}</Table.Th>
            <Table.Th>{t('table.type')}</Table.Th>
            <Table.Th>{t('table.stockQuantity')}</Table.Th>
            <Table.Th>{t('table.unit')}</Table.Th>
            <Table.Th>{t('table.costPrice')}</Table.Th>
            <Table.Th>{t('table.sellingPrice')}</Table.Th>
            <Table.Th>{t('table.status')}</Table.Th>
            <Table.Th>{t('table.actions')}</Table.Th>
          </Table.Tr>
        </Table.Thead>
        <Table.Tbody>
          {data.products.map((product) => (
            <Table.Tr key={product.id}>
              <Table.Td>
                <Text fw={500}>{product.code}</Text>
              </Table.Td>
              <Table.Td>{product.name}</Table.Td>
              <Table.Td>{product.category}</Table.Td>
              <Table.Td>{getTypeBadge(product.type)}</Table.Td>
              <Table.Td>{getStockBadge(Number(product.stockQuantity), product.minStockLevel ? Number(product.minStockLevel) : null)}</Table.Td>
              <Table.Td>{product.unit}</Table.Td>
              <Table.Td>
                {product.costPrice
                  ? Number(product.costPrice).toLocaleString('tr-TR', {
                      style: 'currency',
                      currency: product.currency || 'TRY',
                    })
                  : '-'}
              </Table.Td>
              <Table.Td>
                {product.sellingPrice
                  ? Number(product.sellingPrice).toLocaleString('tr-TR', {
                      style: 'currency',
                      currency: product.currency || 'TRY',
                    })
                  : '-'}
              </Table.Td>
              <Table.Td>
                <Badge color={product.isActive ? 'green' : 'gray'}>
                  {product.isActive ? (t('status.active')) : (t('status.inactive'))}
                </Badge>
              </Table.Td>
              <Table.Td>
                <Group gap="xs" justify="flex-end">
                  <Tooltip label={t('actions.view')} withArrow>
                    <ActionIcon
                      variant="subtle"
                      color="blue"
                      onClick={() => router.push(`/${locale}/modules/production/products/${product.id}`)}
                    >
                      <IconEye size={18} />
                    </ActionIcon>
                  </Tooltip>
                  <Tooltip label={t('actions.edit')} withArrow>
                    <ActionIcon
                      variant="subtle"
                      color="gray"
                      onClick={() => router.push(`/${locale}/modules/production/products/${product.id}/edit`)}
                    >
                      <IconEdit size={18} />
                    </ActionIcon>
                  </Tooltip>
                  <Tooltip label={t('actions.delete')} withArrow>
                    <ActionIcon
                      variant="subtle"
                      color="red"
                      onClick={() => handleDelete(product.id)}
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








