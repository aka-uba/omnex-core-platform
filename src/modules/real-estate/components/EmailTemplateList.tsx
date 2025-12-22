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
  IconMail,
  IconSend,
} from '@tabler/icons-react';
import { useEmailTemplates, useDeleteEmailTemplate } from '@/hooks/useEmailTemplates';
import { useTranslation } from '@/lib/i18n/client';
import { DataTable, DataTableColumn, FilterOption } from '@/components/tables/DataTable';
import { DataTableSkeleton } from '@/components/tables/DataTableSkeleton';
import { showToast } from '@/modules/notifications/components/ToastNotification';
import { AlertModal } from '@/components/modals/AlertModal';
import type { EmailTemplateCategory } from '@/modules/real-estate/types/email-template';

interface EmailTemplateListProps {
  locale: string;
}

export function EmailTemplateList({ locale }: EmailTemplateListProps) {
  const router = useRouter();
  const { t } = useTranslation('modules/real-estate');
  const { t: tGlobal } = useTranslation('global');
  const [page, setPage] = useState(1);
  const [pageSize] = useState<number>(25);
  const [search] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<EmailTemplateCategory | undefined>();
  const [isActiveFilter, setIsActiveFilter] = useState<boolean | undefined>();
  const [deleteModalOpened, setDeleteModalOpened] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const { data, isLoading, error } = useEmailTemplates({
    page,
    pageSize,
    ...(search ? { search } : {}),
    ...(categoryFilter ? { category: categoryFilter } : {}),
    ...(isActiveFilter !== undefined ? { isActive: isActiveFilter } : {}),
  });

  const deleteTemplate = useDeleteEmailTemplate();

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
        message: t('email.delete.success'),
      });
      setDeleteModalOpened(false);
      setDeleteId(null);
    } catch (error) {
      showToast({
        type: 'error',
        title: t('messages.error'),
        message: error instanceof Error ? error.message : t('email.delete.error'),
      });
    }
  };

  const getCategoryBadge = (category: EmailTemplateCategory) => {
    const categoryColors: Record<EmailTemplateCategory, string> = {
      promotion: 'blue',
      announcement: 'green',
      reminder: 'yellow',
      welcome: 'cyan',
      agreement: 'purple',
    };
    return (
      <Badge color={categoryColors[category] || 'gray'}>
        {t(`email.categories.${category}`) || category}
      </Badge>
    );
  };

  const getStatusBadge = (isActive: boolean, isDefault: boolean) => {
    if (isDefault) {
      return <Badge color="violet">{t('email.status.default')}</Badge>;
    }
    return isActive ? (
      <Badge color="green">{t('email.status.active')}</Badge>
    ) : (
      <Badge color="gray">{t('email.status.inactive')}</Badge>
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
      subject: template.subject,
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
      render: (value) => (
        <Group gap="xs">
          <IconMail size={16} />
          <Text fw={500}>{value}</Text>
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
      key: 'subject',
      label: t('table.subject'),
      sortable: true,
      searchable: true,
      render: (value) => (
        <Text size="sm" c="dimmed" lineClamp={1}>
          {value}
        </Text>
      ),
    },
    {
      key: 'status',
      label: t('table.status'),
      sortable: true,
      searchable: false,
      render: (value, row) => getStatusBadge(row.isActive, row.isDefault),
    },
    {
      key: 'actions',
      label: t('table.actions'),
      sortable: false,
      searchable: false,
      align: 'right',
      render: (value, row) => (
        <Group gap="xs" justify="flex-end">
          <ActionIcon
            variant="subtle"
            color="green"
            onClick={(e) => {
              e.stopPropagation();
              router.push(`/${locale}/modules/real-estate/email/send?templateId=${row.id}`);
            }}
            title={t('email.send.title')}
          >
            <IconSend size={18} />
          </ActionIcon>
          <Tooltip label={t('actions.view')} withArrow>
            <ActionIcon
              variant="subtle"
              color="blue"
              onClick={(e) => {
                e.stopPropagation();
                router.push(`/${locale}/modules/real-estate/email/templates/${row.id}`);
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
                router.push(`/${locale}/modules/real-estate/email/templates/${row.id}/edit`);
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
        { value: 'promotion', label: t('email.categories.promotion') },
        { value: 'announcement', label: t('email.categories.announcement') },
        { value: 'reminder', label: t('email.categories.reminder') },
        { value: 'welcome', label: t('email.categories.welcome') },
        { value: 'agreement', label: t('email.categories.agreement') },
      ],
    },
    {
      key: 'isActive',
      label: t('filter.status'),
      type: 'select',
      options: [
        { value: 'true', label: t('email.status.active') },
        { value: 'false', label: t('email.status.inactive') },
      ],
    },
  ];

  const handleFilter = (filters: Record<string, any>) => {
    if (filters.category) {
      setCategoryFilter(filters.category as EmailTemplateCategory);
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
        title={t('email.delete.title') || t('delete.title') || tGlobal('common.delete')}
        message={t('email.delete.confirm')}
        confirmLabel={t('actions.delete') || tGlobal('common.delete')}
        cancelLabel={t('actions.cancel') || tGlobal('common.cancel')}
        onConfirm={handleDeleteConfirm}
        variant="danger"
      />
      <DataTable
        tableId="real-estate-email-templates"
        columns={columns}
        data={tableData}
        searchable={true}
        sortable={true}
        pageable={true}
        defaultPageSize={pageSize}
        pageSizeOptions={[10, 25, 50, 100]}
        emptyMessage={t('table.noEmailTemplates')}
        filters={filterOptions}
        onFilter={handleFilter}
        showColumnSettings={true}
        showExportIcons={true}
        exportScope="all"
        exportTitle={t('email.templates.title')}
        exportNamespace="modules/real-estate"
      />
    </>
  );
}
