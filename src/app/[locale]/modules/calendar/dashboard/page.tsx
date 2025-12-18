'use client';

import { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { CentralPageHeader } from '@/components/headers/CentralPageHeader';
import { Container, Skeleton } from '@mantine/core';
import { IconPlus, IconCalendar } from '@tabler/icons-react';
import { useTranslation } from '@/lib/i18n/client';
import { useParams } from 'next/navigation';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { fetchWithAuth } from '@/lib/api/fetchWithAuth';
import type { CalendarEvent } from '@/components/calendar/CalendarView';

// Dynamic imports for better performance
const CalendarView = dynamic(
  () => import('@/components/calendar/CalendarView').then(mod => ({ default: mod.CalendarView })),
  { 
    loading: () => <Skeleton height={600} radius="md" />,
    ssr: false 
  }
);

const EventModal = dynamic(
  () => import('@/components/calendar/EventModal').then(mod => ({ default: mod.EventModal })),
  { ssr: false }
);

// Appointment status'u CalendarEvent color'a çevir
const getColorFromStatus = (status: string): CalendarEvent['color'] => {
  switch (status) {
    case 'pending': return 'yellow';
    case 'confirmed': return 'green';
    case 'cancelled': return 'red';
    case 'completed': return 'blue';
    default: return 'slate';
  }
};

// Appointment status'u CalendarEvent status'a çevir
const getEventStatusFromAppointmentStatus = (status: string): CalendarEvent['status'] => {
  switch (status) {
    case 'pending': return 'scheduled';
    case 'confirmed': return 'published';
    case 'cancelled': return 'needs-revision';
    case 'completed': return 'published';
    default: return 'draft';
  }
};

export default function CalendarDashboard() {
  const params = useParams();
  const locale = (params?.locale as string) || 'tr';
  const { t } = useTranslation('modules/calendar');
  const queryClient = useQueryClient();
  const [mounted, setMounted] = useState(false);
  const [modalOpened, setModalOpened] = useState(false);
  const [viewMode, setViewMode] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>();
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | undefined>();

  // Prevent hydration mismatch for icons
  useEffect(() => {
    setMounted(true);
  }, []);

  // API'den randevuları çek
  const { data: appointmentsData, isLoading: appointmentsLoading } = useQuery({
    queryKey: ['appointments'],
    queryFn: async () => {
      const response = await fetchWithAuth('/api/calendar/appointments');
      if (!response.ok) {
        throw new Error('Failed to fetch appointments');
      }
      const result = await response.json();
      return result.data || [];
    },
  });

  // API'den etkinlikleri çek (tüm CalendarEvent'ler)
  const { data: eventsData, isLoading: eventsLoading } = useQuery({
    queryKey: ['calendar-events'],
    queryFn: async () => {
      const response = await fetchWithAuth('/api/calendar/events?pageSize=1000');
      if (!response.ok) {
        throw new Error('Failed to fetch events');
      }
      const result = await response.json();
      return result.events || [];
    },
  });

  const isLoading = appointmentsLoading || eventsLoading;

  // Randevuları CalendarEvent formatına dönüştür
  const appointmentEvents: CalendarEvent[] = (appointmentsData || []).map((appointment: {
    id: string;
    title: string;
    clientName?: string;
    date: string;
    status: string;
  }) => ({
    id: appointment.id,
    title: appointment.title,
    client: appointment.clientName || '',
    date: new Date(appointment.date),
    status: getEventStatusFromAppointmentStatus(appointment.status),
    color: getColorFromStatus(appointment.status),
  }));

  // Etkinlikleri CalendarEvent formatına dönüştür (appointments hariç)
  const calendarEvents: CalendarEvent[] = (eventsData || [])
    .filter((event: { module?: string }) => event.module !== 'appointments')
    .map((event: {
      id: string;
      title: string;
      client?: string;
      date: string;
      status: string;
      color?: string;
    }) => ({
      id: event.id,
      title: event.title,
      client: event.client || '',
      date: new Date(event.date),
      status: event.status as CalendarEvent['status'],
      color: (event.color || 'blue') as CalendarEvent['color'],
    }));

  // Tüm etkinlikleri birleştir
  const events: CalendarEvent[] = [...appointmentEvents, ...calendarEvents];

  const handleCreateEvent = (date?: Date) => {
    setSelectedDate(date);
    setSelectedEvent(undefined);
    setModalOpened(true);
    setViewMode(false);
  };

  const handleEventClick = (event: CalendarEvent) => {
    // View mode - read-only modal
    setSelectedEvent(event);
    setSelectedDate(undefined);
    setViewMode(true);
    setModalOpened(true);
  };

  const handleEventEdit = (event: CalendarEvent) => {
    // Edit mode
    setSelectedEvent(event);
    setSelectedDate(undefined);
    setViewMode(false);
    setModalOpened(true);
  };

  const handleSwitchToEdit = () => {
    setViewMode(false);
    setModalOpened(true);
  };

  const handleEventSubmit = async (eventData: Omit<CalendarEvent, 'id'>) => {
    // EventModal'dan gelen veriyi API'ye gönder
    // NOT: Bu şu an EventModal için, Appointment modal ayrı
    // Randevular appointments sayfasından yönetiliyor
    setModalOpened(false);
    setSelectedEvent(undefined);
    setSelectedDate(undefined);
    // Cache'i yenile
    queryClient.invalidateQueries({ queryKey: ['appointments'] });
    queryClient.invalidateQueries({ queryKey: ['calendar-events'] });
  };

  return (
    <Container size="xl" pt="xl">
      <CentralPageHeader
        title="dashboard.title"
        description="dashboard.description"
        namespace="modules/calendar"
        icon={mounted ? <IconCalendar size={32} /> : null}
        breadcrumbs={[
          { label: 'navigation.dashboard', href: `/${locale}/dashboard`, namespace: 'global' },
          { label: 'title', href: `/${locale}/modules/calendar`, namespace: 'modules/calendar' },
          { label: 'dashboard.title', namespace: 'modules/calendar' },
        ]}
        actions={[
          {
            label: t('actions.createEvent'),
            icon: mounted ? <IconPlus size={18} /> : null,
            onClick: () => handleCreateEvent(),
            variant: 'filled',
          },
        ]}
      />

      {/* Calendar View */}
      {isLoading ? (
        <Skeleton height={600} radius="md" />
      ) : (
        <CalendarView
          events={events}
          onEventClick={handleEventClick}
          onEventEdit={handleEventEdit}
          onEventCreate={handleCreateEvent}
        />
      )}

      {/* Event Modal */}
      <EventModal
        opened={modalOpened}
        onClose={() => {
          setModalOpened(false);
          setSelectedEvent(undefined);
          setSelectedDate(undefined);
          setViewMode(false);
        }}
        onSubmit={handleEventSubmit}
        initialDate={selectedDate}
        initialEvent={selectedEvent}
        viewMode={viewMode}
        onEdit={handleSwitchToEdit}
      />
    </Container>
  );
}
