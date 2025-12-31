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
import { useEmployees, useDeleteEmployee } from '@/hooks/useEmployees';
import { useTranslation } from '@/lib/i18n/client';
import { showToast } from '@/modules/notifications/components/ToastNotification';
import { DataTable, DataTableColumn, FilterOption } from '@/components/tables/DataTable';
import { DataTableSkeleton } from '@/components/tables/DataTableSkeleton';
import { AlertModal } from '@/components/modals/AlertModal';
import type { WorkType } from '@/modules/hr/types/hr';
import dayjs from 'dayjs';

interface EmployeeListProps {
  locale: string;
}

export function EmployeeList({ locale }: EmployeeListProps) {
  const router = useRouter();
  const { t } = useTranslation('modules/hr');
  const { t: tGlobal } = useTranslation('global');
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [departmentFilter, setDepartmentFilter] = useState<string | undefined>();
  const [workTypeFilter, setWorkTypeFilter] = useState<WorkType | undefined>();
  const [isActiveFilter, setIsActiveFilter] = useState<boolean | undefined>();

  const { data, isLoading, error } = useEmployees({
    page: 1,
    pageSize: 1000,
    ...(departmentFilter ? { department: departmentFilter } : {}),
    ...(workTypeFilter ? { workType: workTypeFilter } : {}),
    ...(isActiveFilter !== undefined ? { isActive: isActiveFilter } : {}),
  });

  const deleteEmployee = useDeleteEmployee();

  const handleDeleteClick = useCallback((id: string) => {
    setDeleteId(id);
    setDeleteModalOpen(true);
  }, []);

  const handleDeleteConfirm = useCallback(async () => {
    if (!deleteId) return;
    try {
      await deleteEmployee.mutateAsync(deleteId);
      showToast({
        type: 'success',
        title: tGlobal('common.success'),
        message: t('employees.delete.success'),
      });
    } catch (error) {
      showToast({
        type: 'error',
        title: tGlobal('common.error'),
        message: error instanceof Error ? error.message : t('employees.delete.error'),
      });
    } finally {
      setDeleteModalOpen(false);
      setDeleteId(null);
    }
  }, [deleteId, deleteEmployee, t, tGlobal]);

  const getWorkTypeBadge = useCallback((workType: WorkType) => {
    const workTypeColors: Record<WorkType, string> = {
      full_time: 'blue',
      part_time: 'yellow',
      contract: 'orange',
    };
    return (
      <Badge color={workTypeColors[workType] || 'gray'}>
        {t(`employees.workTypes.${workType}`) || workType}
      </Badge>
    );
  }, [t]);

  const getActiveBadge = useCallback((isActive: boolean) => {
    return isActive ? (
      <Badge color="green">{tGlobal('status.active')}</Badge>
    ) : (
      <Badge color="gray">{tGlobal('status.inactive')}</Badge>
    );
  }, [tGlobal]);

  const employees = useMemo(() => data?.employees || [], [data]);

  // Unique departments for filter
  const departmentOptions = useMemo(() => {
    const departments = Array.from(new Set(employees.map(emp => emp.department))).sort();
    return departments.map(dept => ({ value: dept, label: dept }));
  }, [employees]);

  // Filter options
  const filterOptions: FilterOption[] = useMemo(() => [
    {
      key: 'department',
      label: t('employees.table.department'),
      type: 'select',
      options: departmentOptions,
    },
    {
      key: 'workType',
      label: t('employees.table.workType'),
      type: 'select',
      options: [
        { value: 'full_time', label: t('employees.workTypes.full_time') },
        { value: 'part_time', label: t('employees.workTypes.part_time') },
        { value: 'contract', label: t('employees.workTypes.contract') },
      ],
    },
    {
      key: 'isActive',
      label: tGlobal('status.title'),
      type: 'select',
      options: [
        { value: 'true', label: tGlobal('status.active') },
        { value: 'false', label: tGlobal('status.inactive') },
      ],
    },
  ], [t, tGlobal, departmentOptions]);

  const handleFilter = useCallback((filters: Record<string, any>) => {
    setDepartmentFilter(filters.department || undefined);
    setWorkTypeFilter(filters.workType as WorkType || undefined);
    setIsActiveFilter(filters.isActive ? filters.isActive === 'true' : undefined);
  }, []);

  const columns: DataTableColumn[] = useMemo(() => [
    {
      key: 'employeeNumber',
      label: t('employees.table.employeeNumber'),
      sortable: true,
      searchable: true,
    },
    {
      key: 'name',
      label: t('employees.table.name'),
      sortable: true,
      searchable: true,
      render: (_value: string, row: Record<string, any>) => row.user?.name || '-',
    },
    {
      key: 'email',
      label: t('employees.table.email'),
      sortable: true,
      searchable: true,
      render: (_value: string, row: Record<string, any>) => row.user?.email || '-',
    },
    {
      key: 'department',
      label: t('employees.table.department'),
      sortable: true,
    },
    {
      key: 'position',
      label: t('employees.table.position'),
      sortable: true,
      searchable: true,
    },
    {
      key: 'workType',
      label: t('employees.table.workType'),
      sortable: true,
      render: (value: WorkType) => getWorkTypeBadge(value),
    },
    {
      key: 'hireDate',
      label: t('employees.table.hireDate'),
      sortable: true,
      render: (value: string) => dayjs(value).format('DD.MM.YYYY'),
    },
    {
      key: 'isActive',
      label: tGlobal('status.title'),
      sortable: true,
      render: (value: boolean) => getActiveBadge(value),
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
                router.push(`/${locale}/modules/hr/employees/${row.id}`);
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
                router.push(`/${locale}/modules/hr/employees/${row.id}/edit`);
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
  ], [t, tGlobal, getWorkTypeBadge, getActiveBadge, router, locale, handleDeleteClick]);

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
        data={employees}
        tableId="hr-employees-list"
        searchable={true}
        sortable={true}
        pageable={true}
        defaultPageSize={25}
        pageSizeOptions={[10, 25, 50, 100]}
        showExportIcons={true}
        exportNamespace="modules/hr"
        showColumnSettings={true}
        emptyMessage={t('employees.noData')}
        filters={filterOptions}
        onFilter={handleFilter}
        onRowClick={(row) => router.push(`/${locale}/modules/hr/employees/${row.id}`)}
      />

      <AlertModal
        opened={deleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        title={t('employees.delete.title')}
        message={t('employees.delete.confirm')}
        variant="danger"
        loading={deleteEmployee.isPending}
        onConfirm={handleDeleteConfirm}
      />
    </>
  );
}
