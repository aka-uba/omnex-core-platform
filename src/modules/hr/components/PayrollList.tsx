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
import { usePayrolls, useDeletePayroll } from '@/hooks/usePayrolls';
import { useEmployees } from '@/hooks/useEmployees';
import { useTranslation } from '@/lib/i18n/client';
import { showToast } from '@/modules/notifications/components/ToastNotification';
import { DataTable, DataTableColumn, FilterOption } from '@/components/tables/DataTable';
import { DataTableSkeleton } from '@/components/tables/DataTableSkeleton';
import { AlertModal } from '@/components/modals/AlertModal';
import type { PayrollStatus } from '@/modules/hr/types/hr';
import dayjs from 'dayjs';

interface PayrollListProps {
  locale: string;
}

export function PayrollList({ locale }: PayrollListProps) {
  const router = useRouter();
  const { t } = useTranslation('modules/hr');
  const { t: tGlobal } = useTranslation('global');
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [employeeFilter, setEmployeeFilter] = useState<string | undefined>();
  const [periodFilter, setPeriodFilter] = useState<string | undefined>();
  const [statusFilter, setStatusFilter] = useState<PayrollStatus | undefined>();

  const { data, isLoading, error } = usePayrolls({
    page: 1,
    pageSize: 1000,
    ...(employeeFilter ? { employeeId: employeeFilter } : {}),
    ...(periodFilter ? { period: periodFilter } : {}),
    ...(statusFilter ? { status: statusFilter } : {}),
  });

  // Fetch employees for filter
  const { data: employeesData } = useEmployees({ page: 1, pageSize: 1000, isActive: true });

  const deletePayroll = useDeletePayroll();

  const handleDeleteClick = useCallback((id: string) => {
    setDeleteId(id);
    setDeleteModalOpen(true);
  }, []);

  const handleDeleteConfirm = useCallback(async () => {
    if (!deleteId) return;
    try {
      await deletePayroll.mutateAsync(deleteId);
      showToast({
        type: 'success',
        title: tGlobal('common.success'),
        message: t('payrolls.delete.success'),
      });
    } catch (error) {
      showToast({
        type: 'error',
        title: tGlobal('common.error'),
        message: error instanceof Error ? error.message : t('payrolls.delete.error'),
      });
    } finally {
      setDeleteModalOpen(false);
      setDeleteId(null);
    }
  }, [deleteId, deletePayroll, t, tGlobal]);

  const getStatusBadge = useCallback((status: PayrollStatus) => {
    const statusColors: Record<PayrollStatus, string> = {
      draft: 'gray',
      approved: 'blue',
      paid: 'green',
    };
    return (
      <Badge color={statusColors[status] || 'gray'}>
        {t(`payrolls.status.${status}`) || status}
      </Badge>
    );
  }, [t]);

  const formatCurrency = useCallback((value: number) => {
    return Number(value).toLocaleString('tr-TR', {
      style: 'currency',
      currency: 'TRY',
    });
  }, []);

  const payrolls = useMemo(() => data?.payrolls || [], [data]);

  // Employee options for filter
  const employeeOptions = useMemo(() => {
    return (employeesData?.employees || []).map((emp) => ({
      value: emp.id,
      label: `${emp.user?.name || '-'} (${emp.employeeNumber})`,
    }));
  }, [employeesData]);

  // Period options (last 12 months)
  const periodOptions = useMemo(() => {
    return Array.from({ length: 12 }, (_, i) => {
      const date = dayjs().subtract(i, 'month');
      return {
        value: date.format('YYYY-MM'),
        label: date.format('MMMM YYYY'),
      };
    });
  }, []);

  // Filter options
  const filterOptions: FilterOption[] = useMemo(() => [
    {
      key: 'employeeId',
      label: t('payrolls.table.employee'),
      type: 'select',
      options: employeeOptions,
    },
    {
      key: 'period',
      label: t('payrolls.table.period'),
      type: 'select',
      options: periodOptions,
    },
    {
      key: 'status',
      label: t('payrolls.table.status'),
      type: 'select',
      options: [
        { value: 'draft', label: t('payrolls.status.draft') },
        { value: 'approved', label: t('payrolls.status.approved') },
        { value: 'paid', label: t('payrolls.status.paid') },
      ],
    },
  ], [t, employeeOptions, periodOptions]);

  const handleFilter = useCallback((filters: Record<string, any>) => {
    setEmployeeFilter(filters.employeeId || undefined);
    setPeriodFilter(filters.period || undefined);
    setStatusFilter(filters.status as PayrollStatus || undefined);
  }, []);

  const columns: DataTableColumn[] = useMemo(() => [
    {
      key: 'employeeName',
      label: t('payrolls.table.employee'),
      sortable: true,
      searchable: true,
      render: (_value: string, row: Record<string, any>) =>
        row.employee?.user?.name || row.employee?.employeeNumber || '-',
    },
    {
      key: 'period',
      label: t('payrolls.table.period'),
      sortable: true,
    },
    {
      key: 'payDate',
      label: t('payrolls.table.payDate'),
      sortable: true,
      render: (value: string) => dayjs(value).format('DD.MM.YYYY'),
    },
    {
      key: 'grossSalary',
      label: t('payrolls.table.grossSalary'),
      sortable: true,
      align: 'right',
      render: (value: number) => formatCurrency(value),
    },
    {
      key: 'deductions',
      label: t('payrolls.table.deductions'),
      sortable: true,
      align: 'right',
      render: (value: number) => formatCurrency(value),
    },
    {
      key: 'netSalary',
      label: t('payrolls.table.netSalary'),
      sortable: true,
      align: 'right',
      render: (value: number) => formatCurrency(value),
    },
    {
      key: 'status',
      label: t('payrolls.table.status'),
      sortable: true,
      render: (value: PayrollStatus) => getStatusBadge(value),
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
                router.push(`/${locale}/modules/hr/payrolls/${row.id}`);
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
                router.push(`/${locale}/modules/hr/payrolls/${row.id}/edit`);
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
  ], [t, tGlobal, getStatusBadge, formatCurrency, router, locale, handleDeleteClick]);

  if (isLoading) {
    return <DataTableSkeleton columns={8} rows={10} />;
  }

  if (error) {
    return <DataTableSkeleton columns={8} rows={5} />;
  }

  return (
    <>
      <DataTable
        columns={columns}
        data={payrolls}
        tableId="hr-payrolls-list"
        searchable={true}
        sortable={true}
        pageable={true}
        defaultPageSize={25}
        pageSizeOptions={[10, 25, 50, 100]}
        showExportIcons={true}
        exportNamespace="modules/hr"
        showColumnSettings={true}
        emptyMessage={t('payrolls.noData')}
        filters={filterOptions}
        onFilter={handleFilter}
        onRowClick={(row) => router.push(`/${locale}/modules/hr/payrolls/${row.id}`)}
      />

      <AlertModal
        opened={deleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        title={t('payrolls.delete.title')}
        message={t('payrolls.delete.confirm')}
        variant="danger"
        loading={deletePayroll.isPending}
        onConfirm={handleDeleteConfirm}
      />
    </>
  );
}
