'use client';

import { ActionIcon, Group, Text, Tooltip } from '@mantine/core';
import { IconEye, IconTrash, IconDownload } from '@tabler/icons-react';
import { useTranslation } from '@/lib/i18n/client';
import { ReportStatusBadge } from './shared/ReportStatusBadge';
import { ReportActionsDropdown } from './shared/ReportActionsDropdown';
import { useNotification } from '@/hooks/useNotification';
import type { Report } from '../types/report';
import { DataTable, DataTableColumn, FilterOption } from '@/components/tables/DataTable';
import { DataTableSkeleton } from '@/components/tables/DataTableSkeleton';
import { useMemo, useCallback } from 'react';
import dayjs from 'dayjs';

type ExportFormat = 'csv' | 'excel' | 'word' | 'pdf' | 'print' | 'html';

interface ReportListProps {
  reports: Report[];
  onDelete?: (id: string) => void;
  onView?: (report: Report) => void;
  onExport?: (report: Report, format: ExportFormat) => Promise<void>;
  onSelectionChange?: (selectedIds: string[]) => void;
  onBulkExport?: () => void;
  onBulkDelete?: (ids: string[]) => void;
  selectedCount?: number;
  loading?: boolean;
}

export function ReportList({ 
  reports, 
  onDelete, 
  onView, 
  onExport, 
  onSelectionChange, 
  onBulkExport, 
  onBulkDelete, 
  selectedCount = 0,
  loading = false
}: ReportListProps) {
  const { t } = useTranslation('modules/raporlar');
  const { t: tGlobal } = useTranslation('global');
  const { showConfirm } = useNotification();

  const formatDate = useCallback((dateString: string) => {
    return dayjs(dateString).format('DD.MM.YYYY HH:mm');
  }, []);

  const handleDelete = useCallback((report: Report) => {
    if (!onDelete) return;
    showConfirm(
      t('actions.delete'),
      t('messages.delete.confirm', { name: report.name }) || `"${report.name}" raporu silinecek. Bu işlem geri alınamaz. Emin misiniz?`,
      () => onDelete(report.id)
    );
  }, [onDelete, showConfirm, t]);

  const columns: DataTableColumn[] = useMemo(() => [
    {
      key: 'name',
      label: t('list.columns.name'),
      sortable: true,
      searchable: true,
      render: (value) => (
        <Text fw={500}>{value}</Text>
      ),
    },
    {
      key: 'type',
      label: t('list.columns.type'),
      sortable: true,
      searchable: true,
      render: (value, row) => (
        <Text size="sm" c="dimmed">{row.typeName || row.type}</Text>
      ),
    },
    {
      key: 'status',
      label: t('list.columns.status'),
      sortable: true,
      render: (value) => <ReportStatusBadge status={value as any} />,
    },
    {
      key: 'createdAt',
      label: t('list.columns.createdAt'),
      sortable: true,
      render: (value) => (
        <Text size="sm" c="dimmed">{formatDate(value)}</Text>
      ),
    },
    {
      key: 'fileSize',
      label: t('list.columns.fileSize'),
      sortable: true,
      render: (value) => (
        <Text size="sm" c="dimmed">{value || '-'}</Text>
      ),
    },
    {
      key: 'actions',
      label: tGlobal('table.actions'),
      sortable: false,
      searchable: false,
      align: 'right',
      render: (value, row) => {
        const report = row as Report;
        return (
          <Group gap="xs" justify="flex-end">
            {report.status === 'completed' && (
              <>
                <Tooltip label={t('tooltips.view')} withArrow>
                  <ActionIcon
                    variant="subtle"
                    color="blue"
                    onClick={(e) => {
                      e.stopPropagation();
                      onView?.(report);
                    }}
                  >
                    <IconEye size={18} />
                  </ActionIcon>
                </Tooltip>
                <Tooltip label={t('tooltips.downloadPdf')} withArrow>
                  <ActionIcon
                    variant="subtle"
                    color="green"
                    onClick={(e) => {
                      e.stopPropagation();
                      onExport?.(report, 'pdf');
                    }}
                  >
                    <IconDownload size={18} />
                  </ActionIcon>
                </Tooltip>
              </>
            )}
            {onDelete && (
              <Tooltip label={tGlobal('actions.delete')} withArrow>
                <ActionIcon
                  variant="subtle"
                  color="red"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDelete(report);
                  }}
                >
                  <IconTrash size={18} />
                </ActionIcon>
              </Tooltip>
            )}
            <ReportActionsDropdown
              report={report}
              {...(onDelete ? { onDelete: () => handleDelete(report) } : {})}
              {...(onView ? { onView: () => onView(report) } : {})}
              {...(onExport ? { onExport } : {})}
            />
          </Group>
        );
      },
    },
  ], [t, tGlobal, formatDate, onView, onExport, onDelete, handleDelete]);

  const filterOptions: FilterOption[] = useMemo(() => [
    {
      key: 'type',
      label: t('filters.type'),
      type: 'select',
      options: [
        { value: 'user_activity', label: t('filters.typeOptions.userActivity') },
        { value: 'system_stats', label: t('filters.typeOptions.systemStats') },
        { value: 'login_history', label: t('filters.typeOptions.loginHistory') },
      ],
    },
    {
      key: 'status',
      label: t('filters.status'),
      type: 'select',
      options: [
        { value: 'completed', label: t('status.completed') },
        { value: 'generating', label: t('status.generating') },
        { value: 'pending', label: t('status.pending') },
        { value: 'failed', label: t('status.failed') },
      ],
    },
  ], [t]);

  const handleFilter = useCallback((filters: Record<string, any>) => {
    // Filter logic is handled by parent component or can be added here
  }, []);

  if (loading) {
    return <DataTableSkeleton columns={columns.length} rows={10} />;
  }

  return (
    <DataTable
      columns={columns}
      data={reports}
      searchable={true}
      sortable={true}
      pageable={true}
      defaultPageSize={10}
      pageSizeOptions={[10, 25, 50, 100]}
      emptyMessage={t('empty.noReports')}
      filters={filterOptions}
      onFilter={handleFilter}
      showColumnSettings={true}
      showExportIcons={true}
      exportTitle={t('list.title')}
      exportNamespace="modules/raporlar"
    />
  );
}
