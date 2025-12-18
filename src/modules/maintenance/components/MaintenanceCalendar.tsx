'use client';

import { useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { CalendarView, type CalendarEvent } from '@/components/calendar/CalendarView';
import { useMaintenanceRecords } from '@/hooks/useMaintenanceRecords';
import dayjs from 'dayjs';
import type { MaintenanceRecord } from '@/modules/maintenance/types/maintenance';

interface MaintenanceCalendarProps {
  locale: string;
}

export function MaintenanceCalendar({ locale }: MaintenanceCalendarProps) {
  const router = useRouter();

  // Get current month range
  const today = new Date();
  const startOfMonth = dayjs(today).startOf('month').toDate();
  const endOfMonth = dayjs(today).endOf('month').toDate();

  const { data: recordsData } = useMaintenanceRecords({
    page: 1,
    pageSize: 1000,
    scheduledDateFrom: startOfMonth,
    scheduledDateTo: endOfMonth,
  });

  // Convert maintenance records to calendar events
  const calendarEvents: CalendarEvent[] = useMemo(() => {
    if (!recordsData?.records) return [];

    return recordsData.records.map((record: MaintenanceRecord) => {
      const scheduledDate = new Date(record.scheduledDate);
      const typeColors: Record<string, 'yellow' | 'green' | 'red' | 'blue' | 'purple' | 'slate'> = {
        preventive: 'blue',
        corrective: 'yellow',
        emergency: 'red',
      };
      const description = record.description || '';
      const client = (record as any).client || '';

      const statusColors: Record<string, 'yellow' | 'green' | 'red' | 'blue' | 'purple' | 'slate'> = {
        scheduled: 'blue',
        in_progress: 'yellow',
        completed: 'green',
        cancelled: 'red',
      };

      // Use type color, fallback to status color
      const eventColor = typeColors[record.type] || statusColors[record.status] || 'blue';

      return {
        id: record.id,
        title: record.title,
        description: description,
        date: scheduledDate,
        client: client,
        status: record.status === 'completed' ? 'published' : record.status === 'cancelled' ? 'draft' : 'scheduled',
        color: eventColor,
      };
    });
  }, [recordsData]);

  const handleDateSelect = (date: Date) => {
    router.push(`/${locale}/modules/maintenance/records/create?scheduledDate=${date.toISOString()}`);
  };

  const handleEventClick = (event: CalendarEvent) => {
    router.push(`/${locale}/modules/maintenance/records/${event.id}`);
  };

  const handleEventEdit = (event: CalendarEvent) => {
    router.push(`/${locale}/modules/maintenance/records/${event.id}/edit`);
  };

  const handleEventCreate = () => {
    router.push(`/${locale}/modules/maintenance/records/create`);
  };

  return (
    <CalendarView
      events={calendarEvents}
      onDateSelect={handleDateSelect}
      onEventClick={handleEventClick}
      onEventEdit={handleEventEdit}
      onEventCreate={handleEventCreate}
    />
  );
}

