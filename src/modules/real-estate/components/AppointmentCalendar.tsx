'use client';

import { useMemo } from 'react';
import { Paper } from '@mantine/core';
import { CalendarView, type CalendarEvent } from '@/components/calendar/CalendarView';
// // import { useTranslation } from '@/lib/i18n/client'; // removed - unused // removed - unused
import { useRouter } from 'next/navigation';
import type { Appointment } from '@/modules/real-estate/types/appointment';
import { useAppointments } from '@/hooks/useAppointments';

interface AppointmentCalendarProps {
  locale: string;
}

export function AppointmentCalendar({ locale }: AppointmentCalendarProps) {
  const router = useRouter();
  // const { t: tGlobal } = useTranslation('global'); // removed - unused

  // Get current month range
  const today = new Date();

  // Fetch appointments
  const { data: appointmentsData } = useAppointments({
    page: 1,
    pageSize: 1000, // Get all appointments for calendar
  });

  const appointments = appointmentsData?.appointments || [];

  // Convert appointments to calendar events
  const calendarEvents: CalendarEvent[] = useMemo(() => {
    if (!appointments || appointments.length === 0) return [];

    return appointments.map((appointment: Appointment) => {
      const startDate = new Date(appointment.startDate);
      const typeColors: Record<string, 'yellow' | 'green' | 'red' | 'blue' | 'purple' | 'slate'> = {
        viewing: 'blue',
        delivery: 'green',
        maintenance: 'yellow',
        inspection: 'purple',
        meeting: 'blue',
      };

      const statusColors: Record<string, 'yellow' | 'green' | 'red' | 'blue' | 'purple' | 'slate'> = {
        scheduled: 'blue',
        completed: 'green',
        cancelled: 'red',
        no_show: 'red',
      };

      return {
        id: appointment.id,
        title: appointment.title,
        description: appointment.description || '',
        date: startDate,
        client: appointment.apartment?.unitNumber || '',
        status: appointment.status === 'scheduled' ? 'scheduled' : appointment.status === 'completed' ? 'published' : 'draft',
        color: typeColors[appointment.type] || statusColors[appointment.status] || 'blue',
      };
    });
  }, [appointments]);

  const handleDateSelect = (date: Date) => {
    router.push(`/${locale}/modules/real-estate/appointments/create?date=${date.toISOString()}`);
  };

  const handleEventClick = (event: CalendarEvent) => {
    router.push(`/${locale}/modules/real-estate/appointments/${event.id}`);
  };

  const handleEventEdit = (event: CalendarEvent) => {
    router.push(`/${locale}/modules/real-estate/appointments/${event.id}/edit`);
  };

  const handleEventCreate = (date: Date) => {
    router.push(`/${locale}/modules/real-estate/appointments/create?date=${date.toISOString()}`);
  };

  return (
    <Paper shadow="xs" p="md">
      <CalendarView
        events={calendarEvents}
        onDateSelect={handleDateSelect}
        onEventClick={handleEventClick}
        onEventEdit={handleEventEdit}
        onEventCreate={handleEventCreate}
        selectedDate={today}
      />
    </Paper>
  );
}

