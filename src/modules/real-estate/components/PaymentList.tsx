'use client';

import { useState, useMemo, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
  Badge,
  ActionIcon,
  Group,
  Text,
  Tooltip,
  Alert,
  Modal,
  Stack,
  Select,
  Button,
} from '@mantine/core';
import {
  IconEdit,
  IconTrash,
  IconEye,
  IconCheck,
  IconCash,
} from '@tabler/icons-react';
import { usePayments, useDeletePayment, useMarkPaymentAsPaid } from '@/hooks/usePayments';
import { useApartments } from '@/hooks/useApartments';
import { useContracts } from '@/hooks/useContracts';
import { usePaymentMethods } from '@/hooks/usePaymentMethods';
import { useCompany } from '@/context/CompanyContext';
import { useTranslation } from '@/lib/i18n/client';
import { showToast } from '@/modules/notifications/components/ToastNotification';
import type { PaymentType, PaymentStatus } from '@/modules/real-estate/types/payment';
import dayjs from 'dayjs';
import { DataTable, DataTableColumn, FilterOption } from '@/components/tables/DataTable';
import { DataTableSkeleton } from '@/components/tables/DataTableSkeleton';
import { AlertModal } from '@/components/modals/AlertModal';

interface PaymentListProps {
  locale: string;
}

export function PaymentList({ locale }: PaymentListProps) {
  const router = useRouter();
  const { t } = useTranslation('modules/real-estate');
  const { t: tGlobal } = useTranslation('global');
  const { selectedCompany } = useCompany();
  const [page, setPage] = useState(1);
  const [pageSize] = useState<number>(25);
  const [apartmentId, setApartmentId] = useState<string | undefined>();
  const [contractId, setContractId] = useState<string | undefined>();
  const [typeFilter, setTypeFilter] = useState<PaymentType | undefined>();
  const [statusFilter, setStatusFilter] = useState<PaymentStatus | undefined>();
  const [deleteModalOpened, setDeleteModalOpened] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  // Ödeme tamamlama modalı state'leri
  const [completionModalOpened, setCompletionModalOpened] = useState(false);
  const [completingPaymentId, setCompletingPaymentId] = useState<string | null>(null);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<string | null>(null);

  const { data, isLoading, error } = usePayments({
    page,
    pageSize,
    ...(apartmentId ? { apartmentId } : {}),
    ...(contractId ? { contractId } : {}),
    ...(typeFilter ? { type: typeFilter } : {}),
    ...(statusFilter ? { status: statusFilter } : {}),
  });

  // Fetch apartments and contracts for filters
  const { data: apartmentsData } = useApartments({ page: 1, pageSize: 1000 });
  const { data: contractsData } = useContracts({ page: 1, pageSize: 1000 });
  const { data: paymentMethodsData } = usePaymentMethods({
    companyId: selectedCompany?.id,
    activeOnly: true
  });

  const deletePayment = useDeletePayment();
  const markAsPaid = useMarkPaymentAsPaid();

  const handleDeleteClick = useCallback((id: string) => {
    setDeleteId(id);
    setDeleteModalOpened(true);
  }, []);

  const handleDeleteConfirm = useCallback(async () => {
    if (!deleteId) return;
    try {
      await deletePayment.mutateAsync(deleteId);
      showToast({
        type: 'success',
        title: t('messages.success'),
        message: t('delete.success'),
      });
      setDeleteModalOpened(false);
      setDeleteId(null);
    } catch (error) {
      showToast({
        type: 'error',
        title: t('messages.error'),
        message: error instanceof Error ? error.message : t('delete.error'),
      });
    }
  }, [deleteId, deletePayment, t]);

  // Ödeme tamamlama modalını aç
  const handleOpenCompletionModal = useCallback((id: string) => {
    setCompletingPaymentId(id);
    setSelectedPaymentMethod(null);
    setCompletionModalOpened(true);
  }, []);

  // Ödeme tamamla
  const handleCompletePayment = useCallback(async () => {
    if (!completingPaymentId || !selectedPaymentMethod) return;

    try {
      await markAsPaid.mutateAsync({
        id: completingPaymentId,
        paidDate: new Date(),
        paymentMethod: selectedPaymentMethod
      });
      showToast({
        type: 'success',
        title: t('messages.success'),
        message: t('payments.markedAsPaid'),
      });
      setCompletionModalOpened(false);
      setCompletingPaymentId(null);
      setSelectedPaymentMethod(null);
    } catch (error) {
      showToast({
        type: 'error',
        title: t('messages.error'),
        message: error instanceof Error ? error.message : t('payments.markAsPaidError'),
      });
    }
  }, [completingPaymentId, selectedPaymentMethod, markAsPaid, t]);

  const getTypeBadge = useCallback((type: PaymentType) => {
    const typeColors: Record<PaymentType, string> = {
      rent: 'blue',
      deposit: 'green',
      fee: 'orange',
      maintenance: 'purple',
      utility: 'cyan',
    };
    return (
      <Badge color={typeColors[type] || 'gray'}>
        {t(`payments.types.${type}`) || type}
      </Badge>
    );
  }, [t]);

  const getStatusBadge = useCallback((status: PaymentStatus, dueDate: Date) => {
    const today = dayjs().startOf('day');
    const due = dayjs(dueDate);
    const isOverdue = status === 'pending' && due.isBefore(today);

    const statusColors: Record<PaymentStatus, string> = {
      pending: isOverdue ? 'red' : 'yellow',
      paid: 'green',
      overdue: 'red',
      cancelled: 'gray',
    };
    return (
      <Badge color={statusColors[status] || 'gray'}>
        {t(`payments.status.${status}`) || status}
      </Badge>
    );
  }, [t]);

  // Prepare data for DataTable
  const tableData = useMemo(() => {
    if (!data) return [];
    return data.payments.map((payment) => ({
      id: payment.id,
      type: payment.type,
      property: payment.apartment?.property?.name || '-',
      floor: payment.apartment?.floor || '-',
      apartment: payment.apartment?.unitNumber || 'N/A',
      tenant: payment.contract?.tenant?.name || '-',
      contract: payment.contract?.contractNumber || '-',
      amount: Number(payment.totalAmount),
      currency: payment.currency || 'TRY',
      dueDate: payment.dueDate,
      paidDate: payment.paidDate,
      status: payment.status,
      paymentMethod: payment.paymentMethod || '-',
      payment, // Keep full payment object for actions
    }));
  }, [data]);

  // Render functions
  const renderType = useCallback((value: PaymentType) => getTypeBadge(value), [getTypeBadge]);
  
  const renderAmount = useCallback((value: number, row: any) => {
    return value.toLocaleString('tr-TR', {
      style: 'currency',
      currency: row.currency || 'TRY',
    });
  }, []);

  const renderDueDate = useCallback((value: Date) => dayjs(value).format('DD.MM.YYYY'), []);
  
  const renderPaidDate = useCallback((value: Date | null) => {
    return value ? dayjs(value).format('DD.MM.YYYY') : '-';
  }, []);

  const renderStatus = useCallback((value: PaymentStatus, row: any) => {
    return getStatusBadge(value, row.dueDate);
  }, [getStatusBadge]);

  const renderActions = useCallback((value: any, row: any) => {
    const payment = row.payment;
    return (
      <Group gap="xs" justify="flex-end">
        <Tooltip label={t('actions.view')} withArrow>
          <ActionIcon
            variant="subtle"
            color="blue"
            onClick={(e) => {
              e.stopPropagation();
              router.push(`/${locale}/modules/real-estate/payments/${payment.id}`);
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
              router.push(`/${locale}/modules/real-estate/payments/${payment.id}/edit`);
            }}
          >
            <IconEdit size={18} />
          </ActionIcon>
        </Tooltip>
        {payment.status === 'pending' && (
          <Tooltip label={t('payments.markAsPaid')} withArrow>
            <ActionIcon
              variant="subtle"
              color="green"
              onClick={(e) => {
                e.stopPropagation();
                handleOpenCompletionModal(payment.id);
              }}
            >
              <IconCheck size={18} />
            </ActionIcon>
          </Tooltip>
        )}
        <Tooltip label={t('actions.delete')} withArrow>
          <ActionIcon
            variant="subtle"
            color="red"
            onClick={(e) => {
              e.stopPropagation();
              handleDeleteClick(payment.id);
            }}
          >
            <IconTrash size={18} />
          </ActionIcon>
        </Tooltip>
      </Group>
    );
  }, [router, locale, handleDeleteClick, handleOpenCompletionModal, t]);

  // Define columns
  const columns: DataTableColumn[] = useMemo(() => [
    {
      key: 'type',
      label: t('table.type'),
      sortable: true,
      searchable: true,
      render: renderType,
    },
    {
      key: 'property',
      label: t('table.property'),
      sortable: true,
      searchable: true,
    },
    {
      key: 'floor',
      label: t('table.floor'),
      sortable: true,
      searchable: false,
    },
    {
      key: 'apartment',
      label: t('table.apartment'),
      sortable: true,
      searchable: true,
    },
    {
      key: 'tenant',
      label: t('table.tenant'),
      sortable: true,
      searchable: true,
    },
    {
      key: 'contract',
      label: t('table.contract'),
      sortable: true,
      searchable: true,
      hidden: true,
    },
    {
      key: 'amount',
      label: t('table.amount'),
      sortable: true,
      searchable: false,
      align: 'right',
      render: renderAmount,
    },
    {
      key: 'dueDate',
      label: t('table.dueDate'),
      sortable: true,
      searchable: false,
      render: renderDueDate,
    },
    {
      key: 'paidDate',
      label: t('table.paidDate'),
      sortable: true,
      searchable: false,
      render: renderPaidDate,
    },
    {
      key: 'paymentMethod',
      label: t('table.paymentMethod'),
      sortable: true,
      searchable: false,
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
  ], [t, renderType, renderAmount, renderDueDate, renderPaidDate, renderStatus, renderActions]);

  // Filter options
  const filterOptions: FilterOption[] = useMemo(() => [
    {
      key: 'apartmentId',
      label: t('filter.apartment'),
      type: 'select',
      options: [
        { value: '', label: t('filter.all') },
        ...(apartmentsData?.apartments.map(a => ({ value: a.id, label: a.unitNumber })) || []),
      ],
    },
    {
      key: 'contractId',
      label: t('filter.contract'),
      type: 'select',
      options: [
        { value: '', label: t('filter.all') },
        ...(contractsData?.contracts.map(c => ({ value: c.id, label: c.contractNumber })) || []),
      ],
    },
    {
      key: 'type',
      label: t('filter.type'),
      type: 'select',
      options: [
        { value: '', label: t('filter.all') },
        { value: 'rent', label: t('payments.types.rent') },
        { value: 'deposit', label: t('payments.types.deposit') },
        { value: 'fee', label: t('payments.types.fee') },
        { value: 'maintenance', label: t('payments.types.maintenance') },
        { value: 'utility', label: t('payments.types.utility') },
      ],
    },
    {
      key: 'status',
      label: t('filter.status'),
      type: 'select',
      options: [
        { value: '', label: t('filter.all') },
        { value: 'pending', label: t('payments.status.pending') },
        { value: 'paid', label: t('payments.status.paid') },
        { value: 'overdue', label: t('payments.status.overdue') },
        { value: 'cancelled', label: t('payments.status.cancelled') },
      ],
    },
  ], [t, apartmentsData, contractsData]);

  const handleFilter = useCallback((filters: Record<string, any>) => {
    if (filters.apartmentId) {
      setApartmentId(filters.apartmentId);
    } else {
      setApartmentId(undefined);
    }
    
    if (filters.contractId) {
      setContractId(filters.contractId);
    } else {
      setContractId(undefined);
    }
    
    if (filters.type) {
      setTypeFilter(filters.type as PaymentType);
    } else {
      setTypeFilter(undefined);
    }
    
    if (filters.status) {
      setStatusFilter(filters.status as PaymentStatus);
    } else {
      setStatusFilter(undefined);
    }
    
    setPage(1);
  }, []);

  if (isLoading) {
    return <DataTableSkeleton columns={8} rows={8} />;
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

  if (data.payments.length === 0) {
    return (
      <Text c="dimmed">{t('table.noPayments')}</Text>
    );
  }

  return (
    <>
      <AlertModal
        opened={deleteModalOpened}
        onClose={() => {
          setDeleteModalOpened(false);
          setDeleteId(null);
        }}
        title={t('payments.delete.title') || t('delete.title') || tGlobal('common.delete')}
        message={t('delete.confirm')}
        confirmLabel={t('actions.delete') || tGlobal('common.delete')}
        cancelLabel={t('actions.cancel') || tGlobal('common.cancel')}
        onConfirm={handleDeleteConfirm}
        variant="danger"
      />

      {/* Ödeme Tamamlama Modalı */}
      <Modal
        opened={completionModalOpened}
        onClose={() => {
          setCompletionModalOpened(false);
          setCompletingPaymentId(null);
          setSelectedPaymentMethod(null);
        }}
        title={t('payments.completePayment.title')}
        centered
      >
        <Stack gap="md">
          <Text size="sm" c="dimmed">
            {t('payments.completePayment.description')}
          </Text>
          <Select
            label={t('payments.completePayment.paymentMethod')}
            placeholder={t('payments.completePayment.selectMethod')}
            value={selectedPaymentMethod}
            onChange={setSelectedPaymentMethod}
            data={
              paymentMethodsData?.paymentMethods.map((method) => ({
                value: method.code,
                label: method.name,
              })) || [
                { value: 'cash', label: 'Nakit' },
                { value: 'bank_transfer', label: 'Banka Havalesi' },
                { value: 'card', label: 'Kredi/Banka Kartı' },
              ]
            }
            leftSection={<IconCash size={16} />}
            required
          />
          <Group justify="flex-end" mt="md">
            <Button
              variant="light"
              onClick={() => {
                setCompletionModalOpened(false);
                setCompletingPaymentId(null);
                setSelectedPaymentMethod(null);
              }}
            >
              {t('actions.cancel') || tGlobal('common.cancel')}
            </Button>
            <Button
              color="green"
              onClick={handleCompletePayment}
              disabled={!selectedPaymentMethod}
              loading={markAsPaid.isPending}
              leftSection={<IconCheck size={16} />}
            >
              {t('payments.completePayment.confirm')}
            </Button>
          </Group>
        </Stack>
      </Modal>

      <DataTable
        tableId="real-estate-payments"
        columns={columns}
        data={tableData}
        searchable={true}
        sortable={true}
        pageable={true}
        defaultPageSize={pageSize}
        pageSizeOptions={[10, 25, 50, 100]}
        emptyMessage={t('table.noPayments')}
        filters={filterOptions}
        onFilter={handleFilter}
        showColumnSettings={true}
        showExportIcons={true}
        exportScope="all"
        exportTitle={t('payments.title')}
        exportNamespace="modules/real-estate"
      />
    </>
  );
}
