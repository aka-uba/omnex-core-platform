'use client';

import { useState, useMemo, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
  Badge,
  ActionIcon,
  Group,
  Text,
  Image,
  HoverCard,
  Box,
  Alert,
  Tooltip,
} from '@mantine/core';
import {
  IconEdit,
  IconTrash,
  IconEye,
  IconHome,
  IconCheck,
  IconX,
  IconClock,
} from '@tabler/icons-react';
import { useApartments, useDeleteApartment } from '@/hooks/useApartments';
import { useProperties } from '@/hooks/useProperties';
import { useTranslation } from '@/lib/i18n/client';
import { DataTable, DataTableColumn, FilterOption } from '@/components/tables/DataTable';
import { DataTableSkeleton } from '@/components/tables/DataTableSkeleton';
import { showToast } from '@/modules/notifications/components/ToastNotification';
import { AlertModal } from '@/components/modals/AlertModal';
import type { ApartmentStatus } from '@/modules/real-estate/types/apartment';

interface ApartmentListProps {
  locale: string;
}

export function ApartmentList({ locale }: ApartmentListProps) {
  const router = useRouter();
  const { t } = useTranslation('modules/real-estate');
  const { t: tGlobal } = useTranslation('global');
  const [page, setPage] = useState(1);
  const [pageSize] = useState<number>(25);
  const [search] = useState('');
  const [propertyId, setPropertyId] = useState<string | undefined>();
  const [statusFilter, setStatusFilter] = useState<ApartmentStatus | undefined>();
  const [isActiveFilter, setIsActiveFilter] = useState<boolean | undefined>();
  const [deleteModalOpened, setDeleteModalOpened] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const { data, isLoading, error } = useApartments({
    page,
    pageSize,
    ...(search ? { search } : {}),
    ...(propertyId ? { propertyId } : {}),
    ...(statusFilter ? { status: statusFilter } : {}),
    ...(isActiveFilter !== undefined ? { isActive: isActiveFilter } : {}),
  });

  // Fetch properties for filter
  const { data: propertiesData } = useProperties({ page: 1, pageSize: 1000 });

  const deleteApartment = useDeleteApartment();

  const handleDeleteClick = useCallback((id: string) => {
    setDeleteId(id);
    setDeleteModalOpened(true);
  }, []);

  const handleDeleteConfirm = useCallback(async () => {
    if (!deleteId) return;
    try {
      await deleteApartment.mutateAsync(deleteId);
      showToast({
        type: 'success',
        title: t('messages.success'),
        message: t('apartments.delete.success') || t('delete.success'),
      });
      setDeleteModalOpened(false);
      setDeleteId(null);
    } catch (error) {
      showToast({
        type: 'error',
        title: t('messages.error'),
        message: error instanceof Error ? error.message : t('apartments.delete.error') || t('delete.error'),
      });
    }
  }, [deleteId, deleteApartment, t]);

  const getStatusBadge = useCallback((status: ApartmentStatus) => {
    const statusColors: Record<ApartmentStatus, string> = {
      empty: 'gray',
      rented: 'blue',
      sold: 'green',
      maintenance: 'orange',
    };
    return (
      <Badge color={statusColors[status] || 'gray'}>
        {t(`status.${status}`) || status}
      </Badge>
    );
  }, [t]);

  const getActiveBadge = useCallback((isActive: boolean) => {
    return isActive ? (
      <Badge color="green">{t('status.active')}</Badge>
    ) : (
      <Badge color="gray">{t('status.inactive')}</Badge>
    );
  }, [t]);

  // Prepare data for DataTable
  const tableData = useMemo(() => {
    if (!data?.apartments) return [];
    return data.apartments.map((apartment: any) => {
      // Get current tenant from active contract
      const activeContract = apartment.contracts?.[0];
      const currentTenant = activeContract?.tenantRecord;

      // Get last payment info
      const lastPayment = apartment.payments?.[0];

      return {
        id: apartment.id,
        preview: apartment,
        isActive: apartment.isActive,
        property: apartment.property
          ? `${apartment.property.address || ''}\n${apartment.property.postalCode || ''} ${apartment.property.city || ''}`.trim()
          : '-',
        apartmentType: apartment.apartmentType || '-',
        floor: apartment.floor ?? '-',
        area: apartment.area,
        basementSize: apartment.basementSize ?? '-',
        rooms: apartment.roomCount,
        bedrooms: apartment.bedroomCount ?? '-',
        bathrooms: apartment.bathroomCount ?? '-',
        lastRenovation: apartment.lastRenovationDate,
        internetSpeed: apartment.internetSpeed || '-',
        coldRent: apartment.coldRent,
        additionalCosts: apartment.additionalCosts,
        heatingCosts: apartment.heatingCosts,
        deposit: apartment.deposit,
        unitNumber: apartment.unitNumber,
        status: apartment.status,
        // New: Current tenant
        currentTenant: currentTenant
          ? `${currentTenant.firstName || ''} ${currentTenant.lastName || ''}`.trim() || currentTenant.tenantNumber
          : null,
        // New: Last payment status and date
        lastPaymentStatus: lastPayment?.status || null,
        lastPaymentDate: lastPayment?.dueDate || null,
        lastPaymentPaidDate: lastPayment?.paidDate || null,
        lastPaymentAmount: lastPayment?.amount || null,
      };
    });
  }, [data]);

  // Memoized render functions
  const renderPreview = useCallback((value: any, row: any) => {
    const apartment = row.preview;
    const coverImageUrl = apartment.coverImage 
      ? `/api/core-files/${apartment.coverImage}/download`
      : apartment.images && apartment.images.length > 0
      ? `/api/core-files/${apartment.images[0]}/download`
      : null;

    return coverImageUrl ? (
      <HoverCard 
        width={300} 
        shadow="md" 
        openDelay={200} 
        closeDelay={100}
        position="bottom"
        offset={8}
        withArrow
        arrowSize={8}
        withinPortal
      >
        <HoverCard.Target>
          <Box
            style={{
              width: 60,
              height: 60,
              minWidth: 60,
              minHeight: 60,
              maxWidth: 60,
              maxHeight: 60,
              borderRadius: 'var(--mantine-radius-sm)',
              overflow: 'hidden',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Image
              src={coverImageUrl}
              alt={apartment.unitNumber}
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'cover',
                minWidth: '100%',
                minHeight: '100%',
                maxWidth: '100%',
                maxHeight: '100%',
              }}
              fallbackSrc="https://placehold.co/60x60?text=No+Image"
            />
          </Box>
        </HoverCard.Target>
        <HoverCard.Dropdown style={{ zIndex: 1000 }}>
          <Box p={6}>
            <Text size="sm" fw={500} mb={4}>
              {apartment.unitNumber} - {apartment.property?.name || ''}
            </Text>
            <Image
              src={coverImageUrl}
              alt={apartment.unitNumber}
              width="100%"
              height={220}
              fit="cover"
              radius="sm"
              fallbackSrc="https://placehold.co/300x220?text=No+Image"
            />
          </Box>
        </HoverCard.Dropdown>
      </HoverCard>
    ) : (
      <Box
        style={{
          width: 60,
          height: 60,
          borderRadius: 'var(--mantine-radius-sm)',
          backgroundColor: 'var(--mantine-color-gray-2)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <IconHome size={24} color="var(--mantine-color-gray-6)" />
      </Box>
    );
  }, []);

  const renderUnitNumber = useCallback((value: string) => (
    <Group gap="xs">
      <IconHome size={16} />
      <Text fw={500}>{value}</Text>
    </Group>
  ), []);

  const renderArea = useCallback((value: number) => value ? `${value} m²` : '-', []);

  const renderStatus = useCallback((value: ApartmentStatus) => getStatusBadge(value), [getStatusBadge]);

  const renderActive = useCallback((value: boolean) => getActiveBadge(value), [getActiveBadge]);

  const renderProperty = useCallback((value: string) => (
    <Text size="xs" style={{ whiteSpace: 'pre-line' }}>{value}</Text>
  ), []);

  const renderCurrency = useCallback((value: number | null) => {
    if (value === null || value === undefined) return '-';
    return new Intl.NumberFormat('de-DE', {
      style: 'currency',
      currency: 'EUR',
      minimumFractionDigits: 2,
    }).format(Number(value));
  }, []);

  const renderDate = useCallback((value: Date | string | null) => {
    if (!value) return '-';
    return new Date(value).toLocaleDateString('de-DE');
  }, []);

  const renderPaymentStatus = useCallback((value: string | null) => {
    if (!value) return <Text size="xs" c="dimmed">-</Text>;
    const statusColors: Record<string, string> = {
      paid: 'green',
      pending: 'yellow',
      overdue: 'red',
      cancelled: 'gray',
    };
    const statusIcons: Record<string, React.ReactNode> = {
      paid: <IconCheck size={12} />,
      pending: <IconClock size={12} />,
      overdue: <IconX size={12} />,
    };
    return (
      <Badge
        color={statusColors[value] || 'gray'}
        leftSection={statusIcons[value] || null}
        size="sm"
      >
        {t(`status.${value}`) || value}
      </Badge>
    );
  }, [t]);

  const renderTenant = useCallback((value: string | null) => {
    if (!value) return <Text size="xs" c="dimmed">-</Text>;
    return <Text size="sm">{value}</Text>;
  }, []);

  const renderActions = useCallback((value: any, row: any) => (
    <Group gap="xs" justify="flex-end">
      <Tooltip label={t('actions.view')} withArrow>
        <ActionIcon
          variant="subtle"
          color="blue"
          onClick={(e) => {
            e.stopPropagation();
            router.push(`/${locale}/modules/real-estate/apartments/${row.id}`);
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
            router.push(`/${locale}/modules/real-estate/apartments/${row.id}/edit`);
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

  // Define columns with memoization - Customer table order
  // #(rowNumber) is handled by DataTable automatically
  const columns: DataTableColumn[] = useMemo(() => [
    {
      key: 'preview',
      label: t('table.preview'),
      sortable: false,
      searchable: false,
      render: renderPreview,
    },
    {
      key: 'isActive',
      label: t('table.active'),
      sortable: true,
      searchable: false,
      render: renderActive,
    },
    {
      key: 'property',
      label: t('table.property'),
      sortable: true,
      searchable: true,
      render: renderProperty,
    },
    {
      key: 'apartmentType',
      label: t('table.apartmentType'),
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
      key: 'area',
      label: t('table.area'),
      sortable: true,
      searchable: false,
      render: renderArea,
    },
    {
      key: 'basementSize',
      label: t('table.basementSize'),
      sortable: true,
      searchable: false,
      hidden: true, // Hidden by default, can be shown via column settings
    },
    {
      key: 'rooms',
      label: t('table.rooms'),
      sortable: true,
      searchable: false,
    },
    {
      key: 'bedrooms',
      label: t('table.bedrooms'),
      sortable: true,
      searchable: false,
    },
    {
      key: 'bathrooms',
      label: t('table.bathrooms'),
      sortable: true,
      searchable: false,
    },
    {
      key: 'lastRenovation',
      label: t('table.lastRenovation'),
      sortable: true,
      searchable: false,
      render: renderDate,
      hidden: true, // Hidden by default
    },
    {
      key: 'internetSpeed',
      label: t('table.internetSpeed'),
      sortable: true,
      searchable: false,
      hidden: true, // Hidden by default
    },
    {
      key: 'coldRent',
      label: t('table.coldRent'),
      sortable: true,
      searchable: false,
      render: renderCurrency,
    },
    {
      key: 'additionalCosts',
      label: t('table.additionalCosts'),
      sortable: true,
      searchable: false,
      render: renderCurrency,
    },
    {
      key: 'heatingCosts',
      label: t('table.heatingCosts'),
      sortable: true,
      searchable: false,
      render: renderCurrency,
      hidden: true, // Hidden by default
    },
    {
      key: 'deposit',
      label: t('table.deposit'),
      sortable: true,
      searchable: false,
      render: renderCurrency,
    },
    {
      key: 'currentTenant',
      label: t('table.tenant'),
      sortable: true,
      searchable: true,
      render: renderTenant,
    },
    {
      key: 'lastPaymentStatus',
      label: t('table.lastPaymentStatus') || 'Payment Status',
      sortable: true,
      searchable: false,
      render: renderPaymentStatus,
    },
    {
      key: 'lastPaymentDate',
      label: t('table.lastPaymentDate') || 'Payment Date',
      sortable: true,
      searchable: false,
      render: renderDate,
    },
    {
      key: 'actions',
      label: t('table.actions'),
      sortable: false,
      searchable: false,
      align: 'right',
      render: renderActions,
    },
  ], [t, renderPreview, renderActive, renderProperty, renderArea, renderDate, renderCurrency, renderActions, renderPaymentStatus, renderTenant]);

  // Filter options with memoization
  const filterOptions: FilterOption[] = useMemo(() => [
    {
      key: 'propertyId',
      label: t('filter.property'),
      type: 'select',
      options: [
        { value: '', label: t('filter.all') },
        ...(propertiesData?.properties.map(p => ({ value: p.id, label: p.name })) || []),
      ],
    },
    {
      key: 'status',
      label: t('filter.status'),
      type: 'select',
      options: [
        { value: 'empty', label: t('status.empty') },
        { value: 'rented', label: t('status.rented') },
        { value: 'sold', label: t('status.sold') },
        { value: 'maintenance', label: t('status.maintenance') },
      ],
    },
    {
      key: 'isActive',
      label: t('filter.active'),
      type: 'select',
      options: [
        { value: 'true', label: t('status.active') },
        { value: 'false', label: t('status.inactive') },
      ],
    },
  ], [t, propertiesData]);

  const handleFilter = useCallback((filters: Record<string, any>) => {
    if (filters.propertyId) {
      setPropertyId(filters.propertyId);
    } else {
      setPropertyId(undefined);
    }
    
    if (filters.status) {
      setStatusFilter(filters.status as ApartmentStatus);
    } else {
      setStatusFilter(undefined);
    }
    
    if (filters.isActive) {
      setIsActiveFilter(filters.isActive === 'true');
    } else {
      setIsActiveFilter(undefined);
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

  return (
    <>
      <AlertModal
        opened={deleteModalOpened}
        onClose={() => {
          setDeleteModalOpened(false);
          setDeleteId(null);
        }}
        title={t('apartments.delete.title') || t('delete.title') || tGlobal('common.delete')}
        message={t('apartments.delete.confirm') || t('delete.confirm')}
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
        emptyMessage={t('table.noApartments')}
        filters={filterOptions}
        onFilter={handleFilter}
        showColumnSettings={true}
        showExportIcons={true}
        exportScope="all"
        exportTitle={t('apartments.title')}
        exportNamespace="modules/real-estate"
      />
    </>
  );
}
