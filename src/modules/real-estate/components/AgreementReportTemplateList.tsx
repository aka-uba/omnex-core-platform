'use client';

import { useState, useMemo } from 'react';
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
import {
  useAgreementReportTemplates,
  useDeleteAgreementReportTemplate,
} from '@/hooks/useAgreementReportTemplates';
import { useTranslation } from '@/lib/i18n/client';
import { DataTable, DataTableColumn, FilterOption } from '@/components/tables/DataTable';
import { DataTableSkeleton } from '@/components/tables/DataTableSkeleton';
import { showToast } from '@/modules/notifications/components/ToastNotification';
import { AlertModal } from '@/components/modals/AlertModal';
import type { AgreementReportTemplateCategory } from '@/modules/real-estate/types/agreement-report-template';

interface AgreementReportTemplateListProps {
  locale: string;
}

export function AgreementReportTemplateList({ locale }: AgreementReportTemplateListProps) {
  const router = useRouter();
  const { t } = useTranslation('modules/real-estate');
  const { t: tGlobal } = useTranslation('global');
  const [page, setPage] = useState(1);
  const [pageSize] = useState<number>(25);
  const [search] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<AgreementReportTemplateCategory | undefined>();
  const [isActiveFilter, setIsActiveFilter] = useState<boolean | undefined>();
  const [deleteModalOpened, setDeleteModalOpened] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const { data, isLoading, error } = useAgreementReportTemplates({
    page,
    pageSize,
    ...(search ? { search } : {}),
    ...(categoryFilter ? { category: categoryFilter } : {}),
    ...(isActiveFilter !== undefined ? { isActive: isActiveFilter } : {}),
  });

  const deleteTemplate = useDeleteAgreementReportTemplate();

  const handleDeleteClick = (id: string) => {
    setDeleteId(id);
    setDeleteModalOpened(true);
  };

  const handleDeleteConfirm = async () => {
    if (!deleteId) return;
    try {
      await deleteTemplate.mutateAsync(deleteId);
      showToast({
        type: 'success',
        title: t('messages.success'),
        message: t('agreementReportTemplate.delete.success'),
      });
      setDeleteModalOpened(false);
      setDeleteId(null);
    } catch (error) {
      showToast({
        type: 'error',
        title: t('messages.error'),
        message: error instanceof Error ? error.message : t('agreementReportTemplate.delete.error'),
      });
    }
  };

  const getCategoryBadge = (category: AgreementReportTemplateCategory) => {
    const categoryColors: Record<AgreementReportTemplateCategory, string> = {
      boss: 'violet',
      owner: 'blue',
      tenant: 'green',
      internal: 'gray',
    };
    return (
      <Badge color={categoryColors[category] || 'gray'}>
        {t(`agreementReport.types.${category}`) || category}
      </Badge>
    );
  };

  // Prepare data for DataTable
  const tableData = useMemo(() => {
    if (!data?.templates) return [];
    return data.templates.map((template) => ({
      id: template.id,
      template: template,
      name: template.name,
      category: template.category,
      description: template.description || '-',
      isActive: template.isActive,
      isDefault: template.isDefault,
    }));
  }, [data]);

  // Define columns
  const columns: DataTableColumn[] = [
    {
      key: 'name',
      label: t('table.name'),
      sortable: true,
      searchable: true,
      render: (value, row) => (
        <Group gap="xs">
          <IconFileText size={16} />
          <div>
            <Group gap="xs">
              <Text size="sm" fw={500}>
                {value}
              </Text>
              {row.isDefault && (
                <Badge size="xs" color="blue">
                  {t('common.default')}
                </Badge>
              )}
            </Group>
          </div>
        </Group>
      ),
    },
    {
      key: 'category',
      label: t('table.category'),
      sortable: true,
      searchable: false,
      render: (value) => getCategoryBadge(value),
    },
    {
      key: t('labels.description'),
      label: t('table.description'),
      sortable: true,
      searchable: true,
      render: (value) => (
        <Text size="sm" c="dimmed" lineClamp={1}>
          {value}
        </Text>
      ),
    },
    {
      key: 'isActive',
      label: t('table.status'),
      sortable: true,
      searchable: false,
      render: (value) => (
        <Badge color={value ? 'green' : 'gray'}>
          {value ? (t('common.active')) : (t('common.inactive'))}
        </Badge>
      ),
    },
    {
      key: 'actions',
      label: t('table.actions'),
      sortable: false,
      searchable: false,
      align: 'right',
      render: (value, row) => (
        <Group gap="xs" justify="flex-end">
          <Tooltip label={t('actions.view')} withArrow>
            <ActionIcon
              variant="subtle"
              color="blue"
              onClick={(e) => {
                e.stopPropagation();
                router.push(`/${locale}/modules/real-estate/agreement-report-templates/${row.id}`);
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
                router.push(`/${locale}/modules/real-estate/agreement-report-templates/${row.id}/edit`);
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
  ];

  // Filter options
  const filterOptions: FilterOption[] = [
    {
      key: 'category',
      label: t('filter.category'),
      type: 'select',
      options: [
        { value: 'boss', label: t('agreementReport.types.boss') },
        { value: 'owner', label: t('agreementReport.types.owner') },
        { value: 'tenant', label: t('agreementReport.types.tenant') },
        { value: 'internal', label: t('agreementReport.types.internal') },
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
  ];

  const handleFilter = (filters: Record<string, any>) => {
    if (filters.category) {
      setCategoryFilter(filters.category as AgreementReportTemplateCategory);
    } else {
      setCategoryFilter(undefined);
    }
    
    if (filters.isActive) {
      setIsActiveFilter(filters.isActive === 'true');
    } else {
      setIsActiveFilter(undefined);
    }
    
    setPage(1);
  };

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
        title={t('agreementReportTemplate.delete.title') || t('delete.title') || tGlobal('common.delete')}
        message={t('agreementReportTemplate.delete.confirm')}
        confirmLabel={t('actions.delete') || tGlobal('common.delete')}
        cancelLabel={t('actions.cancel') || tGlobal('common.cancel')}
        onConfirm={handleDeleteConfirm}
        variant="danger"
      />
      <DataTable
        tableId="real-estate-agreement-report-templates"
        columns={columns}
        data={tableData}
        searchable={true}
        sortable={true}
        pageable={true}
        defaultPageSize={pageSize}
        pageSizeOptions={[10, 25, 50, 100]}
        emptyMessage={t('table.noAgreementReportTemplates')}
        filters={filterOptions}
        onFilter={handleFilter}
        showColumnSettings={true}
        showExportIcons={true}
        exportScope="all"
        exportTitle={t('agreementReportTemplates.title')}
        exportNamespace="modules/real-estate"
      />
    </>
  );
}
