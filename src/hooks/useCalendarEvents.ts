import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { CalendarEvent, CalendarEventCreate, CalendarEventUpdate, CalendarEventQuery } from '@/lib/schemas/calendar';

const API_BASE = '/api/calendar/events';

// Fetch calendar events list
export function useCalendarEvents(params?: CalendarEventQuery) {
  return useQuery({
    queryKey: ['calendarEvents', params],
    queryFn: async () => {
      const searchParams = new URLSearchParams();
      if (params?.page) searchParams.set('page', params.page);
      if (params?.pageSize) searchParams.set('pageSize', params.pageSize);
      if (params?.search) searchParams.set('search', params.search);
      if (params?.status) searchParams.set('status', params.status);
      if (params?.client) searchParams.set('client', params.client);
      if (params?.module) searchParams.set('module', params.module);
      if (params?.locationId) searchParams.set('locationId', params.locationId);
      if (params?.userId) searchParams.set('userId', params.userId);
      if (params?.dateFrom) searchParams.set('dateFrom', params.dateFrom);
      if (params?.dateTo) searchParams.set('dateTo', params.dateTo);
      if (params?.companyId) searchParams.set('companyId', params.companyId);

      const response = await fetch(`${API_BASE}?${searchParams.toString()}`);
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to fetch calendar events');
      }
      const data = await response.json();
      return data as { events: CalendarEvent[]; total: number; page: number; pageSize: number };
    },
  });
}

// Fetch single calendar event
export function useCalendarEvent(id: string | null) {
  return useQuery({
    queryKey: ['calendarEvent', id],
    queryFn: async () => {
      if (!id) return null;
      const response = await fetch(`${API_BASE}/${id}`);
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to fetch calendar event');
      }
      const data = await response.json();
      return data.event as CalendarEvent;
    },
    enabled: !!id,
  });
}

// Create calendar event
export function useCreateCalendarEvent() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CalendarEventCreate) => {
      const response = await fetch(API_BASE, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || errorData.message || 'Failed to create calendar event');
      }

      const result = await response.json();
      return result.event as CalendarEvent;
    },
    onSuccess: () => {
      // Invalidate and refetch calendar events
      queryClient.invalidateQueries({ queryKey: ['calendarEvents'] });
    },
  });
}

// Update calendar event
export function useUpdateCalendarEvent() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: CalendarEventUpdate }) => {
      const response = await fetch(`${API_BASE}/${id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || errorData.message || 'Failed to update calendar event');
      }

      const result = await response.json();
      return result.event as CalendarEvent;
    },
    onSuccess: (_, variables) => {
      // Invalidate and refetch calendar events
      queryClient.invalidateQueries({ queryKey: ['calendarEvents'] });
      queryClient.invalidateQueries({ queryKey: ['calendarEvent', variables.id] });
    },
  });
}

// Delete calendar event
export function useDeleteCalendarEvent() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const response = await fetch(`${API_BASE}/${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || errorData.message || 'Failed to delete calendar event');
      }

      return id;
    },
    onSuccess: () => {
      // Invalidate and refetch calendar events
      queryClient.invalidateQueries({ queryKey: ['calendarEvents'] });
    },
  });
}















