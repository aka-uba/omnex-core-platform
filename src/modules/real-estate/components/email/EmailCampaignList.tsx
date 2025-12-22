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
  IconTrash,
  IconEye,
  IconMail,
} from '@tabler/icons-react';
import { useEmailCampaigns, useDeleteEmailCampaign } from '@/hooks/useEmailCampaigns';
import { useTranslation } from '@/lib/i18n/client';
import { DataTable, DataTableColumn, FilterOption } from '@/components/tables/DataTable';
import { DataTableSkeleton } from '@/components/tables/DataTableSkeleton';
import { showToast } from '@/modules/notifications/components/ToastNotification';
import { AlertModal } from '@/components/modals/AlertModal';
import type { EmailCampaignStatus } from '@/modules/real-estate/types/email-campaign';
import dayjs from 'dayjs';

interface EmailCampaignListProps {
  locale: string;
}

export function EmailCampaignList({ locale }: EmailCampaignListProps) {
  const router = useRouter();
  const { t } = useTranslation('modules/real-estate');
  const { t: tGlobal } = useTranslation('global');
  const [page, setPage] = useState(1);
  const [pageSize] = useState<number>(25);
  const [search] = useState('');
  const [statusFilter, setStatusFilter] = useState<EmailCampaignStatus | undefined>();
  const [deleteModalOpened, setDeleteModalOpened] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const { data, isLoading, error } = useEmailCampaigns({
    page,
    pageSize,
    ...(search ? { search } : {}),
    ...(statusFilter ? { status: statusFilter } : {}),
  });

  const deleteCampaign = useDeleteEmailCampaign();

  const handleDeleteClick = (id: string) => {
    setDeleteId(id);
    setDeleteModalOpened(true);
  };

  const handleDeleteConfirm = async () => {
    if (!deleteId) return;
    try {
      await deleteCampaign.mutateAsync(deleteId);
      showToast({
        type: 'success',
        title: t('messages.success'),
        message: t('email.campaign.delete.success'),
      });
      setDeleteModalOpened(false);
      setDeleteId(null);
    } catch (error) {
      showToast({
        type: 'error',
        title: t('messages.error'),
        message: error instanceof Error ? error.message : t('email.campaign.delete.error'),
      });
    }
  };

  const getStatusBadge = (status: EmailCampaignStatus) => {
    const statusColors: Record<EmailCampaignStatus, string> = {
      draft: 'gray',
      scheduled: 'blue',
      sending: 'yellow',
      sent: 'green',
      failed: 'red',
    };
    return (
      <Badge color={statusColors[status] || 'gray'}>
        {t(`email.campaign.status.${status}`) || status}
      </Badge>
    );
  };

  // Prepare data for DataTable
  const tableData = useMemo(() => {
    if (!data?.campaigns) return [];
    return data.campaigns.map((campaign) => ({
      id: campaign.id,
      name: campaign.name,
      template: campaign.template?.name || '-',
      recipientCount: campaign.recipientCount,
      sentCount: campaign.sentCount,
      openedCount: campaign.openedCount,
      clickedCount: campaign.clickedCount,
      status: campaign.status,
      sentAt: campaign.sentAt,
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
      key: 'template',
      label: t('table.template'),
      sortable: true,
      searchable: true,
    },
    {
      key: 'recipientCount',
      label: t('table.recipients'),
      sortable: true,
      searchable: false,
      align: 'right',
    },
    {
      key: 'sentCount',
      label: t('table.sent'),
      sortable: true,
      searchable: false,
      align: 'right',
    },
    {
      key: 'openedCount',
      label: t('table.opened'),
      sortable: true,
      searchable: false,
      align: 'right',
    },
    {
      key: 'clickedCount',
      label: t('table.clicked'),
      sortable: true,
      searchable: false,
      align: 'right',
    },
    {
      key: 'status',
      label: t('table.status'),
      sortable: true,
      searchable: false,
      render: (value) => getStatusBadge(value as EmailCampaignStatus),
    },
    {
      key: 'sentAt',
      label: t('table.sentAt'),
      sortable: true,
      searchable: false,
      render: (value) => value ? dayjs(value).format('DD.MM.YYYY HH:mm') : '-',
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
                router.push(`/${locale}/modules/real-estate/email/campaigns/${row.id}`);
              }}
            >
              <IconEye size={18} />
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
      key: 'status',
      label: t('filter.status'),
      type: 'select',
      options: [
        { value: 'draft', label: t('email.campaign.status.draft') },
        { value: 'scheduled', label: t('email.campaign.status.scheduled') },
        { value: 'sending', label: t('email.campaign.status.sending') },
        { value: 'sent', label: t('email.campaign.status.sent') },
        { value: 'failed', label: t('email.campaign.status.failed') },
      ],
    },
  ];

  const handleFilter = (filters: Record<string, any>) => {
    if (filters.status) {
      setStatusFilter(filters.status as EmailCampaignStatus);
    } else {
      setStatusFilter(undefined);
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
        title={t('email.campaign.delete.title') || t('delete.title') || tGlobal('common.delete')}
        message={t('email.campaign.delete.confirm')}
        confirmLabel={t('actions.delete') || tGlobal('common.delete')}
        cancelLabel={t('actions.cancel') || tGlobal('common.cancel')}
        onConfirm={handleDeleteConfirm}
        variant="danger"
      />
      <DataTable
        tableId="real-estate-email-campaigns"
        columns={columns}
        data={tableData}
        searchable={true}
        sortable={true}
        pageable={true}
        defaultPageSize={pageSize}
        pageSizeOptions={[10, 25, 50, 100]}
        emptyMessage={t('table.noEmailCampaigns')}
        filters={filterOptions}
        onFilter={handleFilter}
        showColumnSettings={true}
        showExportIcons={true}
        exportScope="all"
        exportTitle={t('email.campaigns.title')}
        exportNamespace="modules/real-estate"
      />
    </>
  );
}
