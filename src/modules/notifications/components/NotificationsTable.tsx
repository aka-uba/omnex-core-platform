'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { Group, Text, Box, ActionIcon, Alert } from '@mantine/core';
import { IconEye, IconEdit, IconArchive, IconTrash, IconZoomIn } from '@tabler/icons-react';
import { useTranslation } from '@/lib/i18n/client';
import { useNotifications, useDeleteNotification, useArchiveNotification } from '@/modules/notifications/hooks/useNotifications';
import { NotificationStatusBadge } from './shared/NotificationStatusBadge';
import { NotificationTypeIcon } from './shared/NotificationTypeIcon';
import { PriorityIndicator } from './shared/PriorityIndicator';
import { modals } from '@mantine/modals';
import Link from 'next/link';
import { useSearchParams, useRouter, usePathname } from 'next/navigation';
import { DataTable, DataTableColumn, FilterOption } from '@/components/tables/DataTable';
import { DataTableSkeleton } from '@/components/tables/DataTableSkeleton';
import { NotificationViewModal } from './NotificationViewModal';
import dayjs from 'dayjs';

export function NotificationsTable() {
    const { t } = useTranslation('modules/notifications');
    const { t: tGlobal } = useTranslation('global');
    const router = useRouter();
    const pathname = usePathname();
    const searchParams = useSearchParams();
    
    // Extract locale from pathname
    const locale = pathname?.split('/')[1] || 'tr';

    const [page, setPage] = useState(1);
    const [pageSize] = useState<number>(25);
    const [search, _setSearch] = useState('');
    void _setSearch; // Suppress unused warning - will be used for search functionality
    const [typeFilter, setTypeFilter] = useState<string | null>(null);
    const [priorityFilter, setPriorityFilter] = useState<string | null>(null);
    const [viewModalOpened, setViewModalOpened] = useState(false);
    const [selectedNotificationId, setSelectedNotificationId] = useState<string | null>(null);

    // Memoize view param to avoid dependency array issues
    const viewParam = useMemo(() => {
        return searchParams?.get('view') || null;
    }, [searchParams?.toString()]);

    const { data: notificationsData, isLoading, error } = useNotifications({ 
        page, 
        pageSize,
        search, 
        ...(typeFilter ? { type: typeFilter } : {}),
        ...(priorityFilter ? { priority: priorityFilter } : {}),
        archived: false // Don't show archived notifications in table
    });
    const deleteMutation = useDeleteNotification();
    const archiveMutation = useArchiveNotification();

    // Extract notifications array from response
    const notifications = notificationsData?.notifications || [];
    const _total = notificationsData?.total || 0;
    void _total; // Suppress unused warning - will be used for pagination

    const handleDelete = useCallback((id: string) => {
        modals.openConfirmModal({
            title: t('actions.delete'),
            children: <Text size="sm">{t('validation.confirm_delete')}</Text>,
            labels: { confirm: t('actions.delete'), cancel: t('actions.cancel') },
            confirmProps: { color: 'red' },
            onConfirm: () => deleteMutation.mutate(id),
            centered: true,
        });
    }, [deleteMutation, t]);

    const handleArchive = useCallback((id: string) => {
        archiveMutation.mutate(id);
    }, [archiveMutation]);

    const handleQuickView = useCallback((id: string) => {
        setSelectedNotificationId(id);
        setViewModalOpened(true);
    }, []);

    // Listen for URL query param and custom event to open modal
    useEffect(() => {
        const checkViewParam = () => {
            const viewIdFromParams = viewParam;
            const urlParams = new URLSearchParams(window.location.search);
            const viewIdFromUrl = urlParams.get('view');
            const viewId = viewIdFromParams || viewIdFromUrl;
            
            if (viewId && viewId !== selectedNotificationId) {
                setSelectedNotificationId(viewId);
                setViewModalOpened(true);
            }
        };

        checkViewParam();
        
        const timeoutId1 = setTimeout(checkViewParam, 100);
        const timeoutId2 = setTimeout(checkViewParam, 500);
        const timeoutId3 = setTimeout(checkViewParam, 1000);

        const handleNotificationView = (event: CustomEvent) => {
            const notificationId = event.detail?.notificationId;
            if (notificationId && notificationId !== selectedNotificationId) {
                setSelectedNotificationId(notificationId);
                setViewModalOpened(true);
            }
        };

        const handlePopState = () => {
            setTimeout(checkViewParam, 100);
        };

        window.addEventListener('notification-view', handleNotificationView as EventListener);
        window.addEventListener('popstate', handlePopState);

        return () => {
            clearTimeout(timeoutId1);
            clearTimeout(timeoutId2);
            clearTimeout(timeoutId3);
            window.removeEventListener('notification-view', handleNotificationView as EventListener);
            window.removeEventListener('popstate', handlePopState);
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [viewParam]);

    // Handle modal close
    const handleModalClose = useCallback(() => {
        setViewModalOpened(false);
        setSelectedNotificationId(null);
        
        setTimeout(() => {
            const urlParams = new URLSearchParams(window.location.search);
            if (urlParams.get('view')) {
                urlParams.delete('view');
                const newUrl = window.location.pathname + (urlParams.toString() ? `?${urlParams.toString()}` : '');
                router.replace(newUrl, { scroll: false });
            }
        }, 0);
    }, [router]);

    // Prepare data for DataTable
    const tableData = useMemo(() => {
        return notifications.map((notification: any) => {
            const isRead = notification.isRead || notification.status === 'read';
            const isGlobal = notification.isGlobal || notification.is_global;
            // Status value for sorting: unread (0), read (1), global (2)
            const statusSortValue = isGlobal ? 2 : (isRead ? 1 : 0);

            return {
                id: notification.id,
                notification: notification,
                title: notification.title,
                message: notification.message,
                type: notification.type,
                priority: notification.priority,
                isRead: isRead,
                isGlobal: isGlobal,
                status: statusSortValue, // Numeric value for sorting
                sender: notification.sender?.name || '-',
                createdAt: notification.createdAt || notification.created_at,
            };
        });
    }, [notifications]);

    // Render functions
    const renderTitle = useCallback((value: string, row: any) => {
        const notification = row.notification;
        return (
            <Group gap="sm">
                <NotificationTypeIcon type={notification.type as any} />
                <Box>
                    <Text size="sm" fw={500}>{value}</Text>
                    <Text size="xs" c="dimmed" lineClamp={1}>{row.message}</Text>
                </Box>
            </Group>
        );
    }, []);

    const renderPriority = useCallback((value: string) => {
        return <PriorityIndicator priority={value as any} />;
    }, []);

    const renderStatus = useCallback((_value: any, row: any) => {
        return (
            <NotificationStatusBadge
                isRead={row.isRead}
                isGlobal={row.isGlobal}
            />
        );
    }, []);

    const renderCreatedAt = useCallback((value: Date | string) => {
        return <Text size="sm">{dayjs(value).format('DD.MM.YYYY')}</Text>;
    }, []);

    const renderActions = useCallback((value: any, row: any) => {
        const notification = row.notification;
        return (
            <Group gap="xs" justify="flex-end" wrap="nowrap">
                <ActionIcon
                    variant="subtle"
                    color="cyan"
                    onClick={() => handleQuickView(notification.id)}
                    title={t('actions.quick_view')}
                    size="sm"
                >
                    <IconZoomIn size={16} />
                </ActionIcon>
                <ActionIcon
                    variant="subtle"
                    color="blue"
                    component={Link}
                    href={`/${locale}/modules/notifications/${notification.id}`}
                    title={t('actions.view')}
                    size="sm"
                >
                    <IconEye size={16} />
                </ActionIcon>
                <ActionIcon
                    variant="subtle"
                    color="gray"
                    component={Link}
                    href={`/${locale}/modules/notifications/${notification.id}/edit`}
                    title={t('actions.edit')}
                    size="sm"
                >
                    <IconEdit size={16} />
                </ActionIcon>
                <ActionIcon
                    variant="subtle"
                    color="orange"
                    onClick={() => handleArchive(notification.id)}
                    title={t('actions.archive')}
                    size="sm"
                >
                    <IconArchive size={16} />
                </ActionIcon>
                <ActionIcon
                    variant="subtle"
                    color="red"
                    onClick={() => handleDelete(notification.id)}
                    title={t('actions.delete')}
                    size="sm"
                >
                    <IconTrash size={16} />
                </ActionIcon>
            </Group>
        );
    }, [handleQuickView, handleArchive, handleDelete, locale, t]);

    // Define columns
    const columns: DataTableColumn[] = useMemo(() => [
        {
            key: 'title',
            label: t('fields.title'),
            sortable: true,
            searchable: true,
            render: renderTitle,
        },
        {
            key: 'priority',
            label: t('fields.priority'),
            sortable: true,
            filterable: true,
            render: renderPriority,
        },
        {
            key: 'status',
            label: t('fields.status'),
            sortable: true,
            render: renderStatus,
        },
        {
            key: 'sender',
            label: t('fields.sender'),
            sortable: true,
            searchable: true,
        },
        {
            key: 'createdAt',
            label: t('fields.created_at'),
            sortable: true,
            render: renderCreatedAt,
        },
        {
            key: 'actions',
            label: t('fields.actions'),
            sortable: false,
            render: renderActions,
        },
    ], [t, renderTitle, renderPriority, renderStatus, renderCreatedAt, renderActions]);

    // Filter options
    const filterOptions: FilterOption[] = useMemo(() => [
        {
            key: 'type',
            label: t('fields.type'),
            type: 'select',
            options: [
                { value: 'info', label: t('type.info') },
                { value: 'warning', label: t('type.warning') },
                { value: 'error', label: t('type.error') },
                { value: 'success', label: t('type.success') },
                { value: 'task', label: t('type.task') },
                { value: 'alert', label: t('type.alert') },
            ],
        },
        {
            key: 'priority',
            label: t('fields.priority'),
            type: 'select',
            options: [
                { value: 'low', label: t('priority.low') },
                { value: 'medium', label: t('priority.medium') },
                { value: 'high', label: t('priority.high') },
                { value: 'urgent', label: t('priority.urgent') },
            ],
        },
    ], [t]);

    const handleFilter = useCallback((filters: Record<string, any>) => {
        if (filters.type) {
            setTypeFilter(filters.type);
        } else {
            setTypeFilter(null);
        }
        
        if (filters.priority) {
            setPriorityFilter(filters.priority);
        } else {
            setPriorityFilter(null);
        }
        
        setPage(1);
    }, []);

    if (isLoading) {
        return <DataTableSkeleton columns={6} rows={10} />;
    }

    if (error) {
        return (
            <Alert color="red" title={tGlobal('common.errorLoading')}>
                {error instanceof Error ? error.message : tGlobal('common.errorLoading')}
            </Alert>
        );
    }

    return (
        <>
            <DataTable
                columns={columns}
                data={tableData}
                searchable={true}
                sortable={true}
                pageable={true}
                defaultPageSize={pageSize}
                pageSizeOptions={[10, 25, 50, 100]}
                emptyMessage={t('table.noNotifications') || tGlobal('common.noData')}
                filters={filterOptions}
                onFilter={handleFilter}
                showColumnSettings={true}
                showExportIcons={true}
                exportScope="all"
                exportTitle={t('notifications.title') || 'Notifications'}
                exportNamespace="modules/notifications"
                showAuditHistory={true}
                auditEntityName="Notification"
                auditIdKey="id"
            />

            {/* Quick View Modal */}
            {selectedNotificationId && (
                <NotificationViewModal
                    opened={viewModalOpened}
                    onClose={handleModalClose}
                    notificationId={selectedNotificationId}
                />
            )}
        </>
    );
}
