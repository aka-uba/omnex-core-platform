'use client';

import { useState, useMemo, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
  Badge,
  ActionIcon,
  Group,
  Tooltip,
} from '@mantine/core';
import {
  IconEdit,
  IconTrash,
  IconEye,
} from '@tabler/icons-react';
import { useLeaves, useDeleteLeave } from '@/hooks/useLeaves';
import { useEmployees } from '@/hooks/useEmployees';
import { useTranslation } from '@/lib/i18n/client';
import { showToast } from '@/modules/notifications/components/ToastNotification';
import { DataTable, DataTableColumn, FilterOption } from '@/components/tables/DataTable';
import { DataTableSkeleton } from '@/components/tables/DataTableSkeleton';
import { AlertModal } from '@/components/modals/AlertModal';
import type { LeaveType, LeaveStatus } from '@/modules/hr/types/hr';
import dayjs from 'dayjs';

interface LeaveListProps {
  locale: string;
}

export function LeaveList({ locale }: LeaveListProps) {
  const router = useRouter();
  const { t } = useTranslation('modules/hr');
  const { t: tGlobal } = useTranslation('global');
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [employeeFilter, setEmployeeFilter] = useState<string | undefined>();
  const [typeFilter, setTypeFilter] = useState<LeaveType | undefined>();
  const [statusFilter, setStatusFilter] = useState<LeaveStatus | undefined>();

  const { data, isLoading, error } = useLeaves({
    page: 1,
    pageSize: 1000,
    ...(employeeFilter ? { employeeId: employeeFilter } : {}),
    ...(typeFilter ? { type: typeFilter } : {}),
    ...(statusFilter ? { status: statusFilter } : {}),
  });

  // Fetch employees for filter
  const { data: employeesData } = useEmployees({ page: 1, pageSize: 1000, isActive: true });

  const deleteLeave = useDeleteLeave();

  const handleDeleteClick = useCallback((id: string) => {
    setDeleteId(id);
    setDeleteModalOpen(true);
  }, []);

  const handleDeleteConfirm = useCallback(async () => {
    if (!deleteId) return;
    try {
      await deleteLeave.mutateAsync(deleteId);
      showToast({
        type: 'success',
        title: tGlobal('common.success'),
        message: t('leaves.delete.success'),
      });
    } catch (error) {
      showToast({
        type: 'error',
        title: tGlobal('common.error'),
        message: error instanceof Error ? error.message : t('leaves.delete.error'),
      });
    } finally {
      setDeleteModalOpen(false);
      setDeleteId(null);
    }
  }, [deleteId, deleteLeave, t, tGlobal]);

  const getTypeBadge = useCallback((type: LeaveType) => {
    const typeColors: Record<LeaveType, string> = {
      annual: 'blue',
      sick: 'red',
      unpaid: 'orange',
      maternity: 'purple',
    };
    return (
      <Badge color={typeColors[type] || 'gray'}>
        {t(`leaves.types.${type}`) || type}
      </Badge>
    );
  }, [t]);

  const getStatusBadge = useCallback((status: LeaveStatus) => {
    const statusColors: Record<LeaveStatus, string> = {
      pending: 'yellow',
      approved: 'green',
      rejected: 'red',
    };
    return (
      <Badge color={statusColors[status] || 'gray'}>
        {t(`leaves.status.${status}`) || status}
      </Badge>
    );
  }, [t]);

  const leaves = useMemo(() => data?.leaves || [], [data]);

  // Employee options for filter
  const employeeOptions = useMemo(() => {
    return (employeesData?.employees || []).map((emp) => ({
      value: emp.id,
      label: `${emp.user?.name || '-'} (${emp.employeeNumber})`,
    }));
  }, [employeesData]);

  // Filter options
  const filterOptions: FilterOption[] = useMemo(() => [
    {
      key: 'employeeId',
      label: t('leaves.table.employee'),
      type: 'select',
      options: employeeOptions,
    },
    {
      key: 'type',
      label: t('leaves.table.type'),
      type: 'select',
      options: [
        { value: 'annual', label: t('leaves.types.annual') },
        { value: 'sick', label: t('leaves.types.sick') },
        { value: 'unpaid', label: t('leaves.types.unpaid') },
        { value: 'maternity', label: t('leaves.types.maternity') },
      ],
    },
    {
      key: 'status',
      label: t('leaves.table.status'),
      type: 'select',
      options: [
        { value: 'pending', label: t('leaves.status.pending') },
        { value: 'approved', label: t('leaves.status.approved') },
        { value: 'rejected', label: t('leaves.status.rejected') },
      ],
    },
  ], [t, employeeOptions]);

  const handleFilter = useCallback((filters: Record<string, any>) => {
    setEmployeeFilter(filters.employeeId || undefined);
    setTypeFilter(filters.type as LeaveType || undefined);
    setStatusFilter(filters.status as LeaveStatus || undefined);
  }, []);

  const columns: DataTableColumn[] = useMemo(() => [
    {
      key: 'employeeName',
      label: t('leaves.table.employee'),
      sortable: true,
      searchable: true,
      render: (_value: string, row: Record<string, any>) =>
        row.employee?.user?.name || row.employee?.employeeNumber || '-',
    },
    {
      key: 'type',
      label: t('leaves.table.type'),
      sortable: true,
      render: (value: LeaveType) => getTypeBadge(value),
    },
    {
      key: 'startDate',
      label: t('leaves.table.startDate'),
      sortable: true,
      render: (value: string) => dayjs(value).format('DD.MM.YYYY'),
    },
    {
      key: 'endDate',
      label: t('leaves.table.endDate'),
      sortable: true,
      render: (value: string) => dayjs(value).format('DD.MM.YYYY'),
    },
    {
      key: 'days',
      label: t('leaves.table.days'),
      sortable: true,
      align: 'right',
    },
    {
      key: 'status',
      label: t('leaves.table.status'),
      sortable: true,
      render: (value: LeaveStatus) => getStatusBadge(value),
    },
    {
      key: 'actions',
      label: tGlobal('table.actions'),
      align: 'right',
      render: (_value: any, row: Record<string, any>) => (
        <Group gap="xs" justify="flex-end">
          <Tooltip label={t('actions.view')} withArrow>
            <ActionIcon
              variant="subtle"
              color="blue"
              onClick={(e) => {
                e.stopPropagation();
                router.push(`/${locale}/modules/hr/leaves/${row.id}`);
              }}
            >
              <IconEye size={18} />
            </ActionIcon>
          </Tooltip>
          <Tooltip label={t('actions.edit')} withArrow>
            <ActionIcon
              variant="subtle"
              color="gray"
              onClick={(e) => {
                e.stopPropagation();
                router.push(`/${locale}/modules/hr/leaves/${row.id}/edit`);
              }}
            >
              <IconEdit size={18} />
            </ActionIcon>
          </Tooltip>
          <Tooltip label={t('actions.delete')} withArrow>
            <ActionIcon
              variant="subtle"
              color="red"
              onClick={(e) => {
                e.stopPropagation();
                handleDeleteClick(row.id);
              }}
            >
              <IconTrash size={18} />
            </ActionIcon>
          </Tooltip>
        </Group>
      ),
    },
  ], [t, tGlobal, getTypeBadge, getStatusBadge, router, locale, handleDeleteClick]);

  if (isLoading) {
    return <DataTableSkeleton columns={7} rows={10} />;
  }

  if (error) {
    return <DataTableSkeleton columns={7} rows={5} />;
  }

  return (
    <>
      <DataTable
        columns={columns}
        data={leaves}
        tableId="hr-leaves-list"
        searchable={true}
        sortable={true}
        pageable={true}
        defaultPageSize={25}
        pageSizeOptions={[10, 25, 50, 100]}
        showExportIcons={true}
        exportNamespace="modules/hr"
        showColumnSettings={true}
        emptyMessage={t('leaves.noData')}
        filters={filterOptions}
        onFilter={handleFilter}
        onRowClick={(row) => router.push(`/${locale}/modules/hr/leaves/${row.id}`)}
        showAuditHistory={true}
        auditEntityName="Leave"
        auditIdKey="id"
      />

      <AlertModal
        opened={deleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        title={t('leaves.delete.title')}
        message={t('leaves.delete.confirm')}
        variant="danger"
        loading={deleteLeave.isPending}
        onConfirm={handleDeleteConfirm}
      />
    </>
  );
}
