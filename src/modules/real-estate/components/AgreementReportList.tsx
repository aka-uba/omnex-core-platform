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
  IconTrash,
  IconEye,
  IconFileText,
  IconHome,
} from '@tabler/icons-react';
import { useAgreementReports, useDeleteAgreementReport } from '@/hooks/useAgreementReports';
import { useTranslation } from '@/lib/i18n/client';
import { DataTable, DataTableColumn, FilterOption } from '@/components/tables/DataTable';
import { DataTableSkeleton } from '@/components/tables/DataTableSkeleton';
import { showToast } from '@/modules/notifications/components/ToastNotification';
import { AlertModal } from '@/components/modals/AlertModal';
import type { AgreementReportType, AgreementReportStatus, AgreementStatus } from '@/modules/real-estate/types/agreement-report';
import dayjs from 'dayjs';

interface AgreementReportListProps {
  locale: string;
}

export function AgreementReportList({ locale }: AgreementReportListProps) {
  const router = useRouter();
  const { t } = useTranslation('modules/real-estate');
  const { t: tGlobal } = useTranslation('global');
  const [page, setPage] = useState(1);
  const [pageSize] = useState<number>(25);
  const [search] = useState('');
  const [typeFilter, setTypeFilter] = useState<AgreementReportType | undefined>();
  const [statusFilter, setStatusFilter] = useState<AgreementReportStatus | undefined>();
  const [agreementStatusFilter, setAgreementStatusFilter] = useState<AgreementStatus | undefined>();
  const [deleteModalOpened, setDeleteModalOpened] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const { data, isLoading, error } = useAgreementReports({
    page,
    pageSize,
    ...(search ? { search } : {}),
    ...(typeFilter ? { type: typeFilter } : {}),
    ...(statusFilter ? { status: statusFilter } : {}),
    ...(agreementStatusFilter ? { agreementStatus: agreementStatusFilter } : {}),
  });

  const deleteReport = useDeleteAgreementReport();

  const handleDeleteClick = useCallback((id: string) => {
    setDeleteId(id);
    setDeleteModalOpened(true);
  }, []);

  const handleDeleteConfirm = useCallback(async () => {
    if (!deleteId) return;
    try {
      await deleteReport.mutateAsync(deleteId);
      showToast({
        type: 'success',
        title: t('messages.success'),
        message: t('agreementReports.agreementReport.delete.success'),
      });
      setDeleteModalOpened(false);
      setDeleteId(null);
    } catch (error) {
      showToast({
        type: 'error',
        title: t('messages.error'),
        message: error instanceof Error ? error.message : t('agreementReports.agreementReport.delete.error'),
      });
    }
  }, [deleteId, deleteReport, t]);

  const getTypeBadge = useCallback((type: AgreementReportType) => {
    const typeColors: Record<AgreementReportType, string> = {
      boss: 'violet',
      owner: 'blue',
      tenant: 'green',
      internal: 'gray',
    };
    return (
      <Badge color={typeColors[type] || 'gray'}>
        {t(`agreementReports.agreementReport.types.${type}`) || type}
      </Badge>
    );
  }, [t]);

  const getStatusBadge = useCallback((status: AgreementReportStatus) => {
    const statusColors: Record<AgreementReportStatus, string> = {
      draft: 'gray',
      sent: 'blue',
      viewed: 'green',
    };
    return (
      <Badge color={statusColors[status] || 'gray'}>
        {t(`agreementReports.agreementReport.status.${status}`) || status}
      </Badge>
    );
  }, [t]);

  const getAgreementStatusBadge = useCallback((status: AgreementStatus) => {
    const statusColors: Record<AgreementStatus, string> = {
      pre_agreement: 'yellow',
      signed: 'green',
      delivery_scheduled: 'blue',
      deposit_received: 'cyan',
    };
    return (
      <Badge color={statusColors[status] || 'gray'}>
        {t(`agreementReports.agreementReport.agreementStatus.${status}`) || status}
      </Badge>
    );
  }, [t]);

  // Prepare data for DataTable
  const tableData = useMemo(() => {
    if (!data?.reports) return [];
    return data.reports.map((report: any) => ({
      id: report.id,
      type: report.type,
      apartmentId: report.apartmentId,
      apartment: report.apartment,
      agreementStatus: report.agreementStatus,
      rentAmount: report.rentAmount,
      status: report.status,
      sentAt: report.sentAt,
    }));
  }, [data]);

  // Memoized render functions
  const renderType = useCallback((value: AgreementReportType) => (
    <Group gap="xs">
      <IconFileText size={16} />
      {getTypeBadge(value)}
    </Group>
  ), [getTypeBadge]);

  const renderApartment = useCallback((value: any, row: any) => {
    const apartment = row.apartment;
    if (!apartment) {
      return <Text size="sm" c="dimmed">-</Text>;
    }
    return (
      <Group gap="xs">
        <IconHome size={16} />
        <div>
          <Text size="sm" fw={500}>
            {apartment.unitNumber || '-'}
          </Text>
          {apartment.property && (
            <Text size="xs" c="dimmed">
              {apartment.property.name}
            </Text>
          )}
        </div>
      </Group>
    );
  }, []);

  const renderAgreementStatus = useCallback((value: AgreementStatus) => getAgreementStatusBadge(value), [getAgreementStatusBadge]);

  const renderRentAmount = useCallback((value: any) =>
    value
      ? new Intl.NumberFormat('tr-TR', {
          style: 'currency',
          currency: 'TRY',
        }).format(Number(value))
      : '-',
  []);

  const renderStatus = useCallback((value: AgreementReportStatus) => getStatusBadge(value), [getStatusBadge]);

  const renderSentAt = useCallback((value: any) => (value ? dayjs(value).format('DD.MM.YYYY HH:mm') : '-'), []);

  const renderActions = useCallback((value: any, row: any) => (
    <Group gap="xs" justify="flex-end">
      <Tooltip label={t('actions.view')} withArrow>
        <ActionIcon
          variant="subtle"
          color="blue"
          onClick={(e) => {
            e.stopPropagation();
            router.push(`/${locale}/modules/real-estate/agreement-reports/${row.id}`);
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
  ), [router, locale, handleDeleteClick, t]);

  // Define columns with memoization
  const columns: DataTableColumn[] = useMemo(() => [
    {
      key: 'type',
      label: t('table.type'),
      sortable: true,
      searchable: false,
      render: renderType,
    },
    {
      key: 'apartmentId',
      label: t('table.apartment'),
      sortable: true,
      searchable: true,
      render: renderApartment,
    },
    {
      key: 'agreementStatus',
      label: t('table.agreementStatus'),
      sortable: true,
      searchable: false,
      render: renderAgreementStatus,
    },
    {
      key: 'rentAmount',
      label: t('table.rentAmount'),
      sortable: true,
      searchable: false,
      align: 'right',
      render: renderRentAmount,
    },
    {
      key: 'status',
      label: t('table.status'),
      sortable: true,
      searchable: false,
      render: renderStatus,
    },
    {
      key: 'sentAt',
      label: t('table.sentAt'),
      sortable: true,
      searchable: false,
      render: renderSentAt,
    },
    {
      key: 'actions',
      label: t('table.actions'),
      sortable: false,
      searchable: false,
      align: 'right',
      render: renderActions,
    },
  ], [t, renderType, renderApartment, renderAgreementStatus, renderRentAmount, renderStatus, renderSentAt, renderActions]);

  // Filter options with memoization
  const filterOptions: FilterOption[] = useMemo(() => [
    {
      key: 'type',
      label: t('filter.type'),
      type: 'select',
      options: [
        { value: 'boss', label: t('agreementReports.agreementReport.types.boss') },
        { value: 'owner', label: t('agreementReports.agreementReport.types.owner') },
        { value: 'tenant', label: t('agreementReports.agreementReport.types.tenant') },
        { value: 'internal', label: t('agreementReports.agreementReport.types.internal') },
      ],
    },
    {
      key: 'status',
      label: t('filter.status'),
      type: 'select',
      options: [
        { value: 'draft', label: t('agreementReports.agreementReport.status.draft') },
        { value: 'sent', label: t('agreementReports.agreementReport.status.sent') },
        { value: 'viewed', label: t('agreementReports.agreementReport.status.viewed') },
      ],
    },
    {
      key: 'agreementStatus',
      label: t('filter.agreementStatus'),
      type: 'select',
      options: [
        { value: 'pre_agreement', label: t('agreementReports.agreementReport.agreementStatus.pre_agreement') },
        { value: 'signed', label: t('agreementReports.agreementReport.agreementStatus.signed') },
        { value: 'delivery_scheduled', label: t('agreementReports.agreementReport.agreementStatus.delivery_scheduled') },
        { value: 'deposit_received', label: t('agreementReports.agreementReport.agreementStatus.deposit_received') },
      ],
    },
  ], [t]);

  const handleFilter = useCallback((filters: Record<string, any>) => {
    if (filters.type) {
      setTypeFilter(filters.type as AgreementReportType);
    } else {
      setTypeFilter(undefined);
    }
    
    if (filters.status) {
      setStatusFilter(filters.status as AgreementReportStatus);
    } else {
      setStatusFilter(undefined);
    }
    
    if (filters.agreementStatus) {
      setAgreementStatusFilter(filters.agreementStatus as AgreementStatus);
    } else {
      setAgreementStatusFilter(undefined);
    }
    
    setPage(1);
  }, []);

  if (isLoading) {
    return <DataTableSkeleton columns={8} rows={8} />;
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
        title={t('agreementReports.agreementReport.delete.title') || t('delete.title') || tGlobal('common.delete')}
        message={t('agreementReports.agreementReport.delete.confirm')}
        confirmLabel={t('actions.delete') || tGlobal('common.delete')}
        cancelLabel={t('actions.cancel') || tGlobal('common.cancel')}
        onConfirm={handleDeleteConfirm}
        variant="danger"
      />
      <DataTable
        tableId="real-estate-agreement-reports"
        columns={columns}
        data={tableData}
        searchable={true}
        sortable={true}
        pageable={true}
        defaultPageSize={pageSize}
        pageSizeOptions={[10, 25, 50, 100]}
        emptyMessage={t('table.noAgreementReports')}
        filters={filterOptions}
        onFilter={handleFilter}
        showColumnSettings={true}
        showExportIcons={true}
        exportScope="all"
        exportTitle={t('agreementReports.title')}
        exportNamespace="modules/real-estate"
      />
    </>
  );
}
