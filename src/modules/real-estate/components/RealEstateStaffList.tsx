'use client';

import { useState, useMemo, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
  Badge,
  ActionIcon,
  Group,
  Text,
  Alert,
  Tooltip,
} from '@mantine/core';
import {
  IconEdit,
  IconTrash,
  IconEye,
  IconUsers,
  IconChartBar,
} from '@tabler/icons-react';
import {
  useRealEstateStaff,
  useDeleteRealEstateStaff,
} from '@/hooks/useRealEstateStaff';
import { useTranslation } from '@/lib/i18n/client';
import { DataTable, DataTableColumn, FilterOption } from '@/components/tables/DataTable';
import { DataTableSkeleton } from '@/components/tables/DataTableSkeleton';
import { showToast } from '@/modules/notifications/components/ToastNotification';
import { AlertModal } from '@/components/modals/AlertModal';
import type { StaffType, StaffRole } from '@/modules/real-estate/types/staff';

interface RealEstateStaffListProps {
  locale: string;
}

export function RealEstateStaffList({ locale }: RealEstateStaffListProps) {
  const router = useRouter();
  const { t } = useTranslation('modules/real-estate');
  const [page, setPage] = useState(1);
  const [pageSize] = useState<number>(25);
  const [search] = useState('');
  const [staffTypeFilter, setStaffTypeFilter] = useState<StaffType | undefined>();
  const [roleFilter, setRoleFilter] = useState<StaffRole | undefined>();
  const [isActiveFilter, setIsActiveFilter] = useState<boolean | undefined>();
  const [deleteModalOpened, setDeleteModalOpened] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const { data, isLoading, error } = useRealEstateStaff({
    page,
    pageSize,
    ...(search ? { search } : {}),
    ...(staffTypeFilter ? { staffType: staffTypeFilter } : {}),
    ...(roleFilter ? { role: roleFilter } : {}),
    ...(isActiveFilter !== undefined ? { isActive: isActiveFilter } : {}),
  });

  const deleteStaff = useDeleteRealEstateStaff();

  const handleDeleteClick = useCallback((id: string) => {
    setDeleteId(id);
    setDeleteModalOpened(true);
  }, []);

  const handleDeleteConfirm = useCallback(async () => {
    if (!deleteId) return;
    try {
      await deleteStaff.mutateAsync(deleteId);
      showToast({
        type: 'success',
        title: t('messages.success'),
        message: t('staff.delete.success'),
      });
      setDeleteModalOpened(false);
      setDeleteId(null);
    } catch (error) {
      showToast({
        type: 'error',
        title: t('messages.error'),
        message: error instanceof Error ? error.message : t('staff.delete.error'),
      });
    }
  }, [deleteId, deleteStaff, t]);

  const getStaffTypeBadge = useCallback((staffType: StaffType) => {
    return (
      <Badge color={staffType === 'internal' ? 'blue' : 'gray'}>
        {t(`staff.types.${staffType}`) || staffType}
      </Badge>
    );
  }, [t]);

  const getRoleBadge = useCallback((role: StaffRole) => {
    const roleColors: Record<StaffRole, string> = {
      manager: 'violet',
      agent: 'blue',
      accountant: 'green',
      maintenance: 'orange',
      observer: 'gray',
    };
    return (
      <Badge color={roleColors[role] || 'gray'}>
        {t(`staff.roles.${role}`) || role}
      </Badge>
    );
  }, [t]);

  // Prepare data for DataTable
  const tableData = useMemo(() => {
    if (!data?.staff) return [];
    return data.staff.map((staffMember) => ({
      id: staffMember.id,
      staffMember: staffMember,
      name: staffMember.name,
      email: staffMember.email,
      staffType: staffMember.staffType,
      role: staffMember.role,
      assignedUnits: staffMember.assignedUnits,
      collectionRate: staffMember.collectionRate,
      isActive: staffMember.isActive,
    }));
  }, [data]);

  // Memoized render functions
  const renderName = useCallback((value: string, row: any) => (
    <Group gap="xs">
      <IconUsers size={16} />
      <div>
        <Text size="sm" fw={500}>
          {value}
        </Text>
        {row.email && (
          <Text size="xs" c="dimmed">
            {row.email}
          </Text>
        )}
      </div>
    </Group>
  ), []);

  const renderStaffType = useCallback((value: StaffType) => getStaffTypeBadge(value), [getStaffTypeBadge]);

  const renderRole = useCallback((value: StaffRole) => getRoleBadge(value), [getRoleBadge]);

  const renderCollectionRate = useCallback((value: number | null | undefined) =>
    value !== null && value !== undefined ? (
      <Text size="sm">{Number(value).toFixed(1)}%</Text>
    ) : (
      <Text size="sm" c="dimmed">-</Text>
    ),
  []);

  const renderStatus = useCallback((value: boolean) => (
    <Badge color={value ? 'green' : 'gray'}>
      {value ? (t('common.active')) : (t('common.inactive'))}
    </Badge>
  ), [t]);

  const renderActions = useCallback((value: any, row: any) => (
    <Group gap="xs" justify="flex-end">
      <Tooltip label={t('actions.view')} withArrow>
        <ActionIcon
          variant="subtle"
          color="blue"
          onClick={(e) => {
            e.stopPropagation();
            router.push(`/${locale}/modules/real-estate/staff/${row.id}`);
          }}
        >
          <IconEye size={18} />
        </ActionIcon>
      </Tooltip>
      <Tooltip label={t('staff.performance.title')} withArrow>
        <ActionIcon
          variant="subtle"
          color="green"
          onClick={(e) => {
            e.stopPropagation();
            router.push(`/${locale}/modules/real-estate/staff/${row.id}/performance`);
          }}
        >
          <IconChartBar size={18} />
        </ActionIcon>
      </Tooltip>
      <Tooltip label={t('actions.edit')} withArrow>
        <ActionIcon
          variant="subtle"
          color="gray"
          onClick={(e) => {
            e.stopPropagation();
            router.push(`/${locale}/modules/real-estate/staff/${row.id}/edit`);
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
  ), [router, locale, handleDeleteClick, t]);

  // Define columns with memoization
  const columns: DataTableColumn[] = useMemo(() => [
    {
      key: 'name',
      label: t('table.name'),
      sortable: true,
      searchable: true,
      render: renderName,
    },
    {
      key: 'staffType',
      label: t('table.type'),
      sortable: true,
      searchable: false,
      render: renderStaffType,
    },
    {
      key: 'role',
      label: t('table.role'),
      sortable: true,
      searchable: false,
      render: renderRole,
    },
    {
      key: 'assignedUnits',
      label: t('table.assignedUnits'),
      sortable: true,
      searchable: false,
      align: 'right',
    },
    {
      key: 'collectionRate',
      label: t('table.collectionRate'),
      sortable: true,
      searchable: false,
      align: 'right',
      render: renderCollectionRate,
    },
    {
      key: 'isActive',
      label: t('table.status'),
      sortable: true,
      searchable: false,
      render: renderStatus,
    },
    {
      key: 'actions',
      label: t('table.actions'),
      sortable: false,
      searchable: false,
      align: 'right',
      render: renderActions,
    },
  ], [t, renderName, renderStaffType, renderRole, renderCollectionRate, renderStatus, renderActions]);

  // Filter options with memoization
  const filterOptions: FilterOption[] = useMemo(() => [
    {
      key: 'staffType',
      label: t('filter.type'),
      type: 'select',
      options: [
        { value: 'internal', label: t('staff.types.internal') },
        { value: 'external', label: t('staff.types.external') },
      ],
    },
    {
      key: 'role',
      label: t('filter.role'),
      type: 'select',
      options: [
        { value: 'manager', label: t('staff.roles.manager') },
        { value: 'agent', label: t('staff.roles.agent') },
        { value: 'accountant', label: t('staff.roles.accountant') },
        { value: 'maintenance', label: t('staff.roles.maintenance') },
        { value: 'observer', label: t('staff.roles.observer') },
      ],
    },
    {
      key: 'isActive',
      label: t('filter.status'),
      type: 'select',
      options: [
        { value: 'true', label: t('common.active') },
        { value: 'false', label: t('common.inactive') },
      ],
    },
  ], [t]);

  const handleFilter = useCallback((filters: Record<string, any>) => {
    if (filters.staffType) {
      setStaffTypeFilter(filters.staffType as StaffType);
    } else {
      setStaffTypeFilter(undefined);
    }
    
    if (filters.role) {
      setRoleFilter(filters.role as StaffRole);
    } else {
      setRoleFilter(undefined);
    }
    
    if (filters.isActive) {
      setIsActiveFilter(filters.isActive === 'true');
    } else {
      setIsActiveFilter(undefined);
    }
    
    setPage(1);
  }, []);


  if (isLoading) {
    return <DataTableSkeleton columns={7} rows={8} />;
  }

  if (error) {
    return (
      <Alert color="red" title={t('common.errorLoading')}>
        {error instanceof Error ? error.message : t('common.errorLoading')}
      </Alert>
    );
  }

  if (!data) {
    return <Text>{t('common.noData')}</Text>;
  }

  return (
    <>
      <AlertModal
        opened={deleteModalOpened}
        onClose={() => {
          setDeleteModalOpened(false);
          setDeleteId(null);
        }}
        title={t('staff.delete.title') || t('delete.title')}
        message={t('staff.delete.confirm')}
        confirmLabel={t('actions.delete')}
        cancelLabel={t('actions.cancel')}
        onConfirm={handleDeleteConfirm}
        variant="danger"
      />
      <DataTable
        tableId="real-estate-staff"
        columns={columns}
        data={tableData}
        searchable={true}
        sortable={true}
        pageable={true}
        defaultPageSize={pageSize}
        pageSizeOptions={[10, 25, 50, 100]}
        emptyMessage={t('table.noStaff')}
        filters={filterOptions}
        onFilter={handleFilter}
        showColumnSettings={true}
        showExportIcons={true}
        exportScope="all"
        exportTitle={t('staff.title')}
        exportNamespace="modules/real-estate"
      />
    </>
  );
}
