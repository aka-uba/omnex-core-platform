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
  Pagination,
  Select,
  Menu,
  Loader,
  Tooltip,
} from '@mantine/core';
import {
  IconSearch,
  IconPlus,
  IconEdit,
  IconTrash,
  IconEye,
  IconDownload,
} from '@tabler/icons-react';
import { useMaintenanceRecords, useDeleteMaintenanceRecord } from '@/hooks/useMaintenanceRecords';
import { useLocations } from '@/hooks/useLocations';
import { useTranslation } from '@/lib/i18n/client';
import { showToast } from '@/modules/notifications/components/ToastNotification';
import { useExport } from '@/lib/export/ExportProvider';
import { useConfirmDialog } from '@/hooks/useConfirmDialog';
import type { MaintenanceType, MaintenanceStatus } from '@/modules/maintenance/types/maintenance';
import type { ExportFormat } from '@/lib/export/types';
import dayjs from 'dayjs';

interface MaintenanceRecordListProps {
  locale: string;
}

export function MaintenanceRecordList({ locale }: MaintenanceRecordListProps) {
  const router = useRouter();
  const { t } = useTranslation('modules/maintenance');
  const { t: tGlobal } = useTranslation('global');
  const { exportToExcel, exportToPDF, exportToCSV, isExporting } = useExport();
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState<number>(10);
  const [search, setSearch] = useState<string>('');
  const [typeFilter, setTypeFilter] = useState<MaintenanceType | undefined>();
  const [statusFilter, setStatusFilter] = useState<MaintenanceStatus | undefined>();
  const [locationId, setLocationId] = useState<string | undefined>();
  const [isActiveFilter, setIsActiveFilter] = useState<boolean | undefined>(undefined);

  const { data, isLoading, error } = useMaintenanceRecords({
    page,
    pageSize,
    ...(search ? { search } : {}),
    ...(typeFilter ? { type: typeFilter } : {}),
    ...(statusFilter ? { status: statusFilter } : {}),
    ...(locationId ? { locationId } : {}),
    ...(isActiveFilter !== undefined ? { isActive: isActiveFilter } : {}),
  });

  // Fetch locations for filter
  const { data: locationsData } = useLocations({ page: 1, pageSize: 1000 });

  const deleteRecord = useDeleteMaintenanceRecord();
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
        await deleteRecord.mutateAsync(id);
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
          t('table.title'),
          t('table.type'),
          t('table.status'),
          t('table.location'),
          t('table.equipment'),
          t('table.scheduledDate'),
          t('table.estimatedCost'),
          t('table.actualCost'),
        ],
        rows: data.records.map((record) => [
          record.title,
          t(`types.${record.type}`) || record.type,
          t(`status.${record.status}`) || record.status,
          record.location?.name || '-',
          record.equipment?.name || '-',
          dayjs(record.scheduledDate).format('DD.MM.YYYY'),
          record.estimatedCost ? Number(record.estimatedCost).toLocaleString('tr-TR', {
            style: 'currency',
            currency: 'TRY',
          }) : '-',
          record.actualCost ? Number(record.actualCost).toLocaleString('tr-TR', {
            style: 'currency',
            currency: 'TRY',
          }) : '-',
        ]),
        metadata: {
          title: t('title'),
          description: t('exportDescription'),
          generatedAt: new Date().toISOString(),
        },
      };

      const options = {
        title: t('title'),
        description: t('exportDescription'),
        includeHeader: true,
        includeFooter: true,
        includePageNumbers: true,
        filename: `maintenance_records_${dayjs().format('YYYY-MM-DD')}`,
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
        message: t('exportSuccess'),
      });
    } catch (error) {
      showToast({
        type: 'error',
        title: t('messages.error'),
        message: error instanceof Error ? error.message : t('exportError'),
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

  const getTypeBadge = (type: MaintenanceType) => {
    const typeColors: Record<MaintenanceType, string> = {
      preventive: 'blue',
      corrective: 'orange',
      emergency: 'red',
    };
    return (
      <Badge color={typeColors[type] || 'gray'}>
        {t(`types.${type}`) || type}
      </Badge>
    );
  };

  const getStatusBadge = (status: MaintenanceStatus) => {
    const statusColors: Record<MaintenanceStatus, string> = {
      scheduled: 'blue',
      in_progress: 'yellow',
      completed: 'green',
      cancelled: 'red',
    };
    return (
      <Badge color={statusColors[status] || 'gray'}>
        {t(`status.${status}`) || status}
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
            placeholder={t('filter.type')}
            data={[
              { value: '', label: tGlobal('filter.all') },
              { value: 'preventive', label: t('types.preventive') },
              { value: 'corrective', label: t('types.corrective') },
              { value: 'emergency', label: t('types.emergency') },
            ]}
            value={typeFilter || ''}
            onChange={(value) => setTypeFilter(value as MaintenanceType | undefined)}
            clearable
            style={{ width: 150 }}
          />
          <Select
            placeholder={t('filter.status')}
            data={[
              { value: '', label: tGlobal('filter.all') },
              { value: 'scheduled', label: t('status.scheduled') },
              { value: 'in_progress', label: t('status.in_progress') },
              { value: 'completed', label: t('status.completed') },
              { value: 'cancelled', label: t('status.cancelled') },
            ]}
            value={statusFilter || ''}
            onChange={(value) => setStatusFilter(value as MaintenanceStatus | undefined)}
            clearable
            style={{ width: 150 }}
          />
          <Select
            placeholder={t('filter.location')}
            data={[
              { value: '', label: tGlobal('filter.all') },
              ...(locationsData?.locations || []).map((location) => ({
                value: location.id,
                label: location.name,
              })),
            ]}
            value={locationId || ''}
            onChange={(value) => setLocationId(value || undefined)}
            clearable
            searchable
            style={{ width: 200 }}
          />
          <Select
            placeholder={tGlobal('filter.status')}
            data={[
              { value: '', label: tGlobal('filter.all') },
              { value: 'true', label: tGlobal('status.active') },
              { value: 'false', label: tGlobal('status.inactive') },
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
            onClick={() => router.push(`/${locale}/modules/maintenance/records/create`)}
          >
            {t('create')}
          </Button>
        </Group>
      </Group>

      <Table striped highlightOnHover>
        <Table.Thead>
          <Table.Tr>
            <Table.Th>{t('table.title')}</Table.Th>
            <Table.Th>{t('table.type')}</Table.Th>
            <Table.Th>{t('table.status')}</Table.Th>
            <Table.Th>{t('table.location')}</Table.Th>
            <Table.Th>{t('table.equipment')}</Table.Th>
            <Table.Th>{t('table.scheduledDate')}</Table.Th>
            <Table.Th>{t('table.estimatedCost')}</Table.Th>
            <Table.Th>{t('table.actions')}</Table.Th>
          </Table.Tr>
        </Table.Thead>
        <Table.Tbody>
          {data.records.map((record) => (
            <Table.Tr key={record.id}>
              <Table.Td>
                <Text fw={500}>{record.title}</Text>
                {record.description && (
                  <Text size="xs" c="dimmed" lineClamp={1}>
                    {record.description}
                  </Text>
                )}
              </Table.Td>
              <Table.Td>{getTypeBadge(record.type)}</Table.Td>
              <Table.Td>{getStatusBadge(record.status)}</Table.Td>
              <Table.Td>{record.location?.name || '-'}</Table.Td>
              <Table.Td>{record.equipment?.name || '-'}</Table.Td>
              <Table.Td>{dayjs(record.scheduledDate).format('DD.MM.YYYY')}</Table.Td>
              <Table.Td>
                {record.estimatedCost
                  ? Number(record.estimatedCost).toLocaleString('tr-TR', {
                      style: 'currency',
                      currency: 'TRY',
                    })
                  : '-'}
              </Table.Td>
              <Table.Td>
                <Group gap="xs">
                  <Tooltip label={t('actions.view')} withArrow>
                    <ActionIcon
                      variant="subtle"
                      color="blue"
                      onClick={() => router.push(`/${locale}/modules/maintenance/records/${record.id}`)}
                    >
                      <IconEye size={18} />
                    </ActionIcon>
                  </Tooltip>
                  <Tooltip label={t('actions.edit')} withArrow>
                    <ActionIcon
                      variant="subtle"
                      color="gray"
                      onClick={() => router.push(`/${locale}/modules/maintenance/records/${record.id}/edit`)}
                    >
                      <IconEdit size={18} />
                    </ActionIcon>
                  </Tooltip>
                  <Tooltip label={t('actions.delete')} withArrow>
                    <ActionIcon
                      variant="subtle"
                      color="red"
                      onClick={() => handleDelete(record.id)}
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
          <Select
            value={pageSize.toString()}
            onChange={(value) => {
              setPageSize(Number(value));
              setPage(1);
            }}
            data={['10', '25', '50', '100']}
            style={{ width: 80 }}
          />
        </Group>
      )}
      <ConfirmDialog />
    </Paper>
  );
}







