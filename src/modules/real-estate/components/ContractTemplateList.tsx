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
  IconFileText,
} from '@tabler/icons-react';
import { useContractTemplates, useDeleteContractTemplate } from '@/hooks/useContractTemplates';
import { useTranslation } from '@/lib/i18n/client';
import { DataTable, DataTableColumn, FilterOption } from '@/components/tables/DataTable';
import { DataTableSkeleton } from '@/components/tables/DataTableSkeleton';
import { showToast } from '@/modules/notifications/components/ToastNotification';
import { AlertModal } from '@/components/modals/AlertModal';

type ContractTemplateType = 'rental' | 'sale' | 'lease' | 'general';

interface ContractTemplateListProps {
  locale: string;
}

export function ContractTemplateList({ locale }: ContractTemplateListProps) {
  const router = useRouter();
  const { t } = useTranslation('modules/real-estate');
  const { t: tGlobal } = useTranslation('global');
  const [page, setPage] = useState(1);
  const [pageSize] = useState<number>(25);
  const [search] = useState('');
  const [typeFilter, setTypeFilter] = useState<ContractTemplateType | undefined>();
  const [isActiveFilter, setIsActiveFilter] = useState<boolean | undefined>();
  const [deleteModalOpened, setDeleteModalOpened] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const { data, isLoading, error } = useContractTemplates({
    page,
    pageSize,
    ...(search ? { search } : {}),
    ...(typeFilter ? { type: typeFilter } : {}),
    ...(isActiveFilter !== undefined ? { isActive: isActiveFilter } : {}),
  });

  const deleteTemplate = useDeleteContractTemplate();

  const handleDeleteClick = useCallback((id: string) => {
    setDeleteId(id);
    setDeleteModalOpened(true);
  }, []);

  const handleDeleteConfirm = useCallback(async () => {
    if (!deleteId) return;
    try {
      await deleteTemplate.mutateAsync(deleteId);
      showToast({
        type: 'success',
        title: t('messages.success'),
        message: t('contracts.templates.delete.success') || t('delete.success'),
      });
      setDeleteModalOpened(false);
      setDeleteId(null);
    } catch (error) {
      showToast({
        type: 'error',
        title: t('messages.error'),
        message: error instanceof Error ? error.message : t('contracts.templates.delete.error') || t('delete.error'),
      });
    }
  }, [deleteId, deleteTemplate, t]);

  const getTypeBadge = useCallback((type: ContractTemplateType) => {
    const typeColors: Record<ContractTemplateType, string> = {
      rental: 'blue',
      sale: 'green',
      lease: 'orange',
      general: 'gray',
    };
    return (
      <Badge color={typeColors[type] || 'gray'}>
        {t(`types.${type}`) || type}
      </Badge>
    );
  }, [t]);

  const getStatusBadge = useCallback((isActive: boolean, isDefault: boolean) => {
    if (isDefault) {
      return <Badge color="violet">{t('status.default')}</Badge>;
    }
    return isActive ? (
      <Badge color="green">{t('status.active')}</Badge>
    ) : (
      <Badge color="gray">{t('status.inactive')}</Badge>
    );
  }, [t]);

  // Prepare data for DataTable
  const tableData = useMemo(() => {
    if (!data?.templates) return [];
    return data.templates.map((template) => ({
      id: template.id,
      template: template,
      name: template.name,
      type: template.type,
      category: template.category || '-',
      isActive: template.isActive,
      isDefault: template.isDefault,
    }));
  }, [data]);

  // Memoized render functions
  const renderName = useCallback((value: string) => (
    <Group gap="xs">
      <IconFileText size={16} />
      <Text fw={500}>{value}</Text>
    </Group>
  ), []);

  const renderType = useCallback((value: ContractTemplateType) => getTypeBadge(value), [getTypeBadge]);

  const renderStatus = useCallback((value: any, row: any) => getStatusBadge(row.isActive, row.isDefault), [getStatusBadge]);

  const renderActions = useCallback((value: any, row: any) => (
    <Group gap="xs" justify="flex-end">
      <Tooltip label={t('actions.view')} withArrow>
        <ActionIcon
          variant="subtle"
          color="blue"
          onClick={(e) => {
            e.stopPropagation();
            router.push(`/${locale}/modules/real-estate/contract-templates/${row.id}`);
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
            router.push(`/${locale}/modules/real-estate/contract-templates/${row.id}/edit`);
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
      key: 'type',
      label: t('table.type'),
      sortable: true,
      searchable: false,
      render: renderType,
    },
    {
      key: 'category',
      label: t('table.category'),
      sortable: true,
      searchable: true,
    },
    {
      key: 'status',
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
  ], [t, renderName, renderType, renderStatus, renderActions]);

  // Filter options with memoization
  const filterOptions: FilterOption[] = useMemo(() => [
    {
      key: 'type',
      label: t('filter.type'),
      type: 'select',
      options: [
        { value: 'rental', label: t('types.rental') },
        { value: 'sale', label: t('types.sale') },
        { value: 'lease', label: t('types.lease') },
        { value: 'general', label: t('types.general') },
      ],
    },
    {
      key: 'isActive',
      label: t('filter.status'),
      type: 'select',
      options: [
        { value: 'true', label: t('status.active') },
        { value: 'false', label: t('status.inactive') },
      ],
    },
  ], [t]);

  const handleFilter = useCallback((filters: Record<string, any>) => {
    if (filters.type) {
      setTypeFilter(filters.type as ContractTemplateType);
    } else {
      setTypeFilter(undefined);
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
      <Alert color="red" title={tGlobal('common.errorLoading')}>
        {error instanceof Error ? error.message : tGlobal('common.errorLoading')}
      </Alert>
    );
  }

  if (!data) {
    return <Text>{tGlobal('common.noData')}</Text>;
  }

  return (
    <>
      <AlertModal
        opened={deleteModalOpened}
        onClose={() => {
          setDeleteModalOpened(false);
          setDeleteId(null);
        }}
        title={t('contracts.templates.delete.title') || t('delete.title') || tGlobal('common.delete')}
        message={t('contracts.templates.delete.confirm') || t('delete.confirm')}
        confirmLabel={t('actions.delete') || tGlobal('common.delete')}
        cancelLabel={t('actions.cancel') || tGlobal('common.cancel')}
        onConfirm={handleDeleteConfirm}
        variant="danger"
      />
      <DataTable
        columns={columns}
        data={tableData}
        searchable={true}
        sortable={true}
        pageable={true}
        defaultPageSize={pageSize}
        pageSizeOptions={[10, 25, 50, 100]}
        emptyMessage={t('table.noContractTemplates')}
        filters={filterOptions}
        onFilter={handleFilter}
        showColumnSettings={true}
        showExportIcons={true}
        exportScope="all"
        exportTitle={t('contractTemplates.title')}
        exportNamespace="modules/real-estate"
      />
    </>
  );
}
