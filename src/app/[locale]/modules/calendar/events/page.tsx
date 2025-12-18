'use client';

import { useState, useMemo, useEffect } from 'react';
import { Container, Badge, Group, ActionIcon, Button, Stack, Paper, Text } from '@mantine/core';
import { IconPlus, IconCalendar, IconEdit, IconTrash, IconEye, IconSettings, IconRefresh } from '@tabler/icons-react';
import { CentralPageHeader } from '@/components/headers/CentralPageHeader';
import { DataTable, DataTableColumn, FilterOption } from '@/components/tables/DataTable';
import { DataTableSkeleton } from '@/components/tables/DataTableSkeleton';
import { useTranslation } from '@/lib/i18n/client';
import { useParams, useRouter } from 'next/navigation';
import { useExport } from '@/lib/export/ExportProvider';
import { showToast } from '@/modules/notifications/components/ToastNotification';
import { useConfirmDialog } from '@/hooks/useConfirmDialog';
import type { CalendarEvent } from '@/components/calendar/CalendarView';
import dynamic from 'next/dynamic';

const EventModal = dynamic(
  () => import('@/components/calendar/EventModal').then(mod => ({ default: mod.EventModal })),
  { ssr: false }
);

export default function CalendarEventsPage() {
  const params = useParams();
  const router = useRouter();
  const locale = (params?.locale as string) || 'tr';
  const { t } = useTranslation('modules/calendar');
  const { t: tGlobal } = useTranslation('global');
  const { exportToCSV, exportToExcel, exportToPDF, exportToWord, exportToHTML, printData, isExporting } = useExport();
  const { confirm, ConfirmDialog } = useConfirmDialog();

  const [mounted, setMounted] = useState(false);
  const [modalOpened, setModalOpened] = useState(false);
  const [viewMode, setViewMode] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | undefined>();
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [statusFilter, setStatusFilter] = useState<string | undefined>();
  const [clientFilter, setClientFilter] = useState<string | undefined>();

  // Prevent hydration mismatch for icons
  useEffect(() => {
    setMounted(true);
  }, []);

  // Mock data - Bu gerçek uygulamada API'den gelecek
  const initialEvents = useMemo(() => {
    const today = new Date();
    return [
      {
        id: '1',
        title: 'New product launch announcement',
        client: 'Acme Corp',
        date: new Date(today.getFullYear(), today.getMonth(), 3),
        status: 'scheduled' as const,
        color: 'yellow' as const,
      },
      {
        id: '2',
        title: 'Weekly tech roundup posted',
        client: 'Innovate LLC',
        date: new Date(today.getFullYear(), today.getMonth(), 8),
        status: 'published' as const,
        color: 'green' as const,
      },
      {
        id: '3',
        title: 'Q4 earnings preview',
        client: 'Quantum Inc',
        date: new Date(today.getFullYear(), today.getMonth(), 17),
        status: 'draft' as const,
        color: 'slate' as const,
      },
      {
        id: '4',
        title: 'Ad campaign',
        client: 'Acme Corp',
        date: new Date(today.getFullYear(), today.getMonth(), 25),
        status: 'needs-revision' as const,
        color: 'red' as const,
      },
      {
        id: '5',
        title: 'New landing page launch',
        client: 'Tech Solutions',
        date: new Date(today.getFullYear(), today.getMonth(), 9),
        status: 'scheduled' as const,
        color: 'blue' as const,
      },
      {
        id: '6',
        title: 'Q4 Sales kickoff post',
        client: 'Sales Corp',
        date: new Date(today.getFullYear(), today.getMonth(), 16),
        status: 'scheduled' as const,
        color: 'green' as const,
      },
      {
        id: '7',
        title: 'Partnership announcement',
        client: 'Partners Inc',
        date: new Date(today.getFullYear(), today.getMonth(), 16),
        status: 'scheduled' as const,
        color: 'purple' as const,
      },
    ];
  }, []);

  // Initialize events
  useEffect(() => {
    if (events.length === 0) {
      setEvents(initialEvents);
    }
  }, [initialEvents, events.length]);

  // Filter events
  const filteredEvents = useMemo(() => {
    let filtered = events;
    
    if (statusFilter) {
      filtered = filtered.filter(e => e.status === statusFilter);
    }
    
    if (clientFilter) {
      filtered = filtered.filter(e => e.client?.toLowerCase().includes(clientFilter.toLowerCase()));
    }
    
    return filtered;
  }, [events, statusFilter, clientFilter]);

  // Prepare table data
  const tableData = useMemo(() => {
    return filteredEvents.map(event => ({
      id: event.id,
      title: event.title,
      client: event.client || '-',
      date: event.date,
      status: event.status,
      color: event.color,
      event: event,
    }));
  }, [filteredEvents]);

  // Get unique clients for filter
  const uniqueClients = useMemo(() => {
    const clients = new Set<string>();
    events.forEach(event => {
      if (event.client) {
        clients.add(event.client);
      }
    });
    return Array.from(clients).sort();
  }, [events]);

  // Define columns
  const columns: DataTableColumn[] = [
    {
      key: 'title',
      label: t('events.table.title'),
      sortable: true,
      searchable: true,
    },
    {
      key: 'client',
      label: t('events.table.client'),
      sortable: true,
      searchable: true,
    },
    {
      key: 'date',
      label: t('events.table.date'),
      sortable: true,
      render: (value) => {
        const date = value as Date;
        return new Intl.DateTimeFormat(locale, {
          year: 'numeric',
          month: 'long',
          day: 'numeric',
        }).format(date);
      },
    },
    {
      key: 'status',
      label: t('events.table.status'),
      sortable: true,
      render: (value) => {
        const status = value as string;
        const statusColors: Record<string, string> = {
          draft: 'gray',
          scheduled: 'blue',
          published: 'green',
          'needs-revision': 'red',
        };
        const statusLabels: Record<string, string> = {
          draft: t('form.statusDraft'),
          scheduled: t('form.statusScheduled'),
          published: t('form.statusPublished'),
          'needs-revision': t('form.statusNeedsRevision'),
        };
        return (
          <Badge color={statusColors[status] || 'gray'}>
            {statusLabels[status] || status}
          </Badge>
        );
      },
    },
    {
      key: 'color',
      label: t('events.table.color'),
      sortable: true,
      render: (value) => {
        const color = value as string;
        const colorLabels: Record<string, string> = {
          yellow: t('form.colorYellow'),
          green: t('form.colorGreen'),
          red: t('form.colorRed'),
          blue: t('form.colorBlue'),
          purple: t('form.colorPurple'),
          slate: t('form.colorSlate'),
        };
        return (
          <Badge color={color} variant="light">
            {colorLabels[color] || color}
          </Badge>
        );
      },
    },
    {
      key: 'actions',
      label: t('events.table.actions'),
      sortable: false,
      searchable: false,
      render: (value, row) => {
        const event = row.event as CalendarEvent;
        return (
          <Group gap="xs">
            <ActionIcon
              variant="subtle"
              color="blue"
              onClick={(e) => {
                e.stopPropagation();
                handleEventView(event);
              }}
            >
              <IconEye size={16} />
            </ActionIcon>
            <ActionIcon
              variant="subtle"
              color="orange"
              onClick={(e) => {
                e.stopPropagation();
                handleEventEdit(event);
              }}
            >
              <IconEdit size={16} />
            </ActionIcon>
            <ActionIcon
              variant="subtle"
              color="red"
              onClick={(e) => {
                e.stopPropagation();
                handleEventDelete(event);
              }}
            >
              <IconTrash size={16} />
            </ActionIcon>
          </Group>
        );
      },
    },
  ];

  // Define filters
  const filters: FilterOption[] = [
    {
      key: 'status',
      label: t('events.filters.status'),
      type: 'select',
      options: [
        { value: 'draft', label: t('form.statusDraft') },
        { value: 'scheduled', label: t('form.statusScheduled') },
        { value: 'published', label: t('form.statusPublished') },
        { value: 'needs-revision', label: t('form.statusNeedsRevision') },
      ],
      // clearable: (removed - not in FilterOption type) true,
    },
    {
      key: 'client',
      label: t('events.filters.client'),
      type: 'select',
      options: uniqueClients.map(client => ({ value: client, label: client })),
      // clearable: (removed - not in FilterOption type) true,
    },
  ];

  const handleCreateEvent = () => {
    setSelectedEvent(undefined);
    setModalOpened(true);
    setViewMode(false);
  };

  const handleEventView = (event: CalendarEvent) => {
    setSelectedEvent(event);
    setModalOpened(true);
    setViewMode(true);
  };

  const handleEventEdit = (event: CalendarEvent) => {
    setSelectedEvent(event);
    setModalOpened(true);
    setViewMode(false);
  };

  const handleEventDelete = async (event: CalendarEvent) => {
    const confirmed = await confirm({
      title: t('messages.deleteTitle'),
      message: t('messages.deleteConfirm'),
      confirmLabel: tGlobal('common.delete'),
      confirmColor: 'red',
    });

    if (confirmed) {
      setEvents(prev => prev.filter(e => e.id !== event.id));
      showToast({
        type: 'success',
        title: tGlobal('notifications.success.title'),
        message: t('messages.deleteSuccess'),
      });
    }
  };

  const handleSwitchToEdit = () => {
    setViewMode(false);
    setModalOpened(true);
  };

  const handleEventSubmit = (eventData: Omit<CalendarEvent, 'id'>) => {
    if (selectedEvent) {
      // Update existing event
      setEvents((prev) =>
        prev.map((e) => (e.id === selectedEvent.id ? { ...selectedEvent, ...eventData } : e))
      );
      showToast({
        type: 'success',
        title: tGlobal('notifications.success.title'),
        message: t('messages.updateSuccess'),
      });
    } else {
      // Create new event
      const newEvent: CalendarEvent = {
        id: Date.now().toString(),
        ...eventData,
      };
      setEvents((prev) => [...prev, newEvent]);
      showToast({
        type: 'success',
        title: tGlobal('notifications.success.title'),
        message: t('messages.createSuccess'),
      });
    }
    setModalOpened(false);
    setSelectedEvent(undefined);
  };

  const handleFilter = (filterValues: Record<string, any>) => {
    setStatusFilter(filterValues.status);
    setClientFilter(filterValues.client);
  };

  const handleExport = async (format: 'csv' | 'excel' | 'word' | 'pdf' | 'print' | 'html') => {
    const exportData = {
      columns: columns.filter(col => col.key !== 'actions').map(col => col.label),
      rows: tableData.map(row => 
        columns
          .filter(col => col.key !== 'actions')
          .map(col => {
            const value = (row as Record<string, any>)[col.key];
            if (col.key === 'date' && value instanceof Date) {
              return new Intl.DateTimeFormat(locale, {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
              }).format(value);
            }
            if (col.key === 'status') {
              const statusLabels: Record<string, string> = {
                draft: t('form.statusDraft'),
                scheduled: t('form.statusScheduled'),
                published: t('form.statusPublished'),
                'needs-revision': t('form.statusNeedsRevision'),
              };
              return statusLabels[value as string] || value;
            }
            if (col.key === 'color') {
              const colorLabels: Record<string, string> = {
                yellow: t('form.colorYellow'),
                green: t('form.colorGreen'),
                red: t('form.colorRed'),
                blue: t('form.colorBlue'),
                purple: t('form.colorPurple'),
                slate: t('form.colorSlate'),
              };
              return colorLabels[value as string] || value;
            }
            return value ?? '';
          })
      ),
      metadata: {
        title: t('events.title'),
        generatedAt: new Date().toISOString(),
        totalRecords: tableData.length,
      },
    };

    const exportOptions = {
      format,
      filename: `${t('export.filename')}-${new Date().toISOString().split('T')[0]}`,
      includeHeader: true,
      includeFooter: true,
      includePageNumbers: true,
      tableStyle: 'professional' as const,
    };

    try {
      switch (format) {
        case 'csv':
          await exportToCSV(exportData, exportOptions);
          break;
        case 'excel':
          await exportToExcel(exportData, exportOptions);
          break;
        case 'word':
          await exportToWord(exportData, exportOptions);
          break;
        case 'pdf':
          await exportToPDF(exportData, exportOptions);
          break;
        case 'html':
          await exportToHTML(exportData, exportOptions);
          break;
        case 'print':
          await printData(exportData, exportOptions);
          break;
      }
    } catch (error) {
      showToast({
        type: 'error',
        title: tGlobal('notifications.error.title'),
        message: error instanceof Error ? error.message : t('messages.exportError'),
      });
    }
  };

  const handleSyncSettings = () => {
    router.push(`/${locale}/settings/general?tab=calendar`);
  };

  return (
    <Container size="xl" pt="xl">
      <CentralPageHeader
        title="events.title"
        description="events.description"
        namespace="modules/calendar"
        icon={mounted ? <IconCalendar size={32} /> : null}
        breadcrumbs={[
          { label: 'navigation.dashboard', href: `/${locale}/dashboard`, namespace: 'global' },
          { label: 'title', href: `/${locale}/modules/calendar`, namespace: 'modules/calendar' },
          { label: 'events.title', namespace: 'modules/calendar' },
        ]}
        actions={[
          {
            label: t('actions.createEvent'),
            icon: mounted ? <IconPlus size={18} /> : null,
            onClick: handleCreateEvent,
            variant: 'filled',
          },
        ]}
      />

      {/* Calendar Integration Alert */}
      <Paper p="md" withBorder mb="md" style={{ backgroundColor: 'var(--mantine-color-blue-light)' }}>
        <Stack gap="xs">
          <Group justify="space-between">
            <div>
              <Text fw={600} size="sm" mb={4}>
                {t('events.sync.title')}
              </Text>
              <Text size="xs" c="dimmed">
                {t('events.sync.description')}
              </Text>
            </div>
            <Group gap="xs">
              <Button
                variant="light"
                size="xs"
                leftSection={<IconSettings size={16} />}
                onClick={handleSyncSettings}
              >
                {t('events.sync.configure')}
              </Button>
              <Button
                variant="light"
                size="xs"
                leftSection={<IconRefresh size={16} />}
                disabled={isExporting}
              >
                {t('events.sync.syncNow')}
              </Button>
            </Group>
          </Group>
        </Stack>
      </Paper>

      {/* DataTable */}
      {mounted ? (
        <DataTable
          columns={columns}
          data={tableData}
          searchable={true}
          sortable={true}
          pageable={true}
          defaultPageSize={25}
          filters={filters}
          onFilter={handleFilter}
          onExport={handleExport}
          showExportIcons={true}
          exportScope="all"
          emptyMessage={t('messages.noEvents')}
        />
      ) : (
        <DataTableSkeleton columns={6} rows={8} />
      )}

      {/* Event Modal */}
      {mounted && (
        <EventModal
          opened={modalOpened}
          onClose={() => {
            setModalOpened(false);
            setSelectedEvent(undefined);
            setViewMode(false);
          }}
          onSubmit={handleEventSubmit}
          initialEvent={selectedEvent}
          viewMode={viewMode}
          onEdit={handleSwitchToEdit}
        />
      )}
      <ConfirmDialog />
    </Container>
  );
}
