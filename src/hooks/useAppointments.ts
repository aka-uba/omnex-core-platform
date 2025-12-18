import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { Appointment, AppointmentCreateInput, AppointmentUpdateInput, AppointmentListParams } from '@/modules/real-estate/types/appointment';

const API_BASE = '/api/real-estate/appointments';

// Fetch appointments list
export function useAppointments(params?: AppointmentListParams) {
  return useQuery({
    queryKey: ['appointments', params],
    queryFn: async () => {
      const searchParams = new URLSearchParams();
      if (params?.page) searchParams.set('page', params.page.toString());
      if (params?.pageSize) searchParams.set('pageSize', params.pageSize.toString());
      if (params?.apartmentId) searchParams.set('apartmentId', params.apartmentId);
      if (params?.type) searchParams.set('type', params.type);
      if (params?.status) searchParams.set('status', params.status);
      if (params?.startDateFrom) searchParams.set('startDate', params.startDateFrom.toISOString());
      if (params?.startDateTo) searchParams.set('endDate', params.startDateTo.toISOString());

      const response = await fetch(`${API_BASE}?${searchParams.toString()}`);
      if (!response.ok) {
        throw new Error('Failed to fetch appointments');
      }
      const data = await response.json();
      return data.data as { appointments: Appointment[]; total: number; page: number; pageSize: number };
    },
  });
}

// Fetch single appointment
export function useAppointment(id: string) {
  return useQuery({
    queryKey: ['appointment', id],
    queryFn: async () => {
      const response = await fetch(`${API_BASE}/${id}`);
      if (!response.ok) {
        throw new Error('Failed to fetch appointment');
      }
      const data = await response.json();
      return data.data.appointment as Appointment;
    },
    enabled: !!id,
  });
}

// Create appointment
export function useCreateAppointment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: AppointmentCreateInput) => {
      const response = await fetch(API_BASE, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(input),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to create appointment');
      }

      const data = await response.json();
      return data.data.appointment as Appointment;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['appointments'] });
    },
  });
}

// Update appointment
export function useUpdateAppointment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, input }: { id: string; input: AppointmentUpdateInput }) => {
      const response = await fetch(`${API_BASE}/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(input),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to update appointment');
      }

      const data = await response.json();
      return data.data.appointment as Appointment;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['appointments'] });
      queryClient.invalidateQueries({ queryKey: ['appointment', variables.id] });
    },
  });
}

// Delete appointment
export function useDeleteAppointment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const response = await fetch(`${API_BASE}/${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to delete appointment');
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['appointments'] });
    },
  });
}

// Mark appointment as completed
export function useMarkAppointmentAsCompleted() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, result }: { id: string; result?: any }) => {
      const response = await fetch(`${API_BASE}/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: 'completed',
          result,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to mark appointment as completed');
      }

      const data = await response.json();
      return data.data.appointment as Appointment;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['appointments'] });
      queryClient.invalidateQueries({ queryKey: ['appointment', variables.id] });
    },
  });
}

// Get appointments for calendar (date range)
export function useAppointmentsForCalendar(startDate: Date, endDate: Date) {
  return useQuery({
    queryKey: ['appointments', 'calendar', startDate.toISOString(), endDate.toISOString()],
    queryFn: async () => {
      const searchParams = new URLSearchParams();
      searchParams.set('startDate', startDate.toISOString());
      searchParams.set('endDate', endDate.toISOString());
      searchParams.set('pageSize', '1000'); // Get all appointments in range

      const response = await fetch(`${API_BASE}?${searchParams.toString()}`);
      if (!response.ok) {
        throw new Error('Failed to fetch appointments');
      }
      const data = await response.json();
      return data.data.appointments as Appointment[];
    },
  });
}








