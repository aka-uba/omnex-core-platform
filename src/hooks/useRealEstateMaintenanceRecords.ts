import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type {
  RealEstateMaintenanceRecord,
  RealEstateMaintenanceRecordCreateInput,
  RealEstateMaintenanceRecordUpdateInput,
  RealEstateMaintenanceRecordListParams,
} from '@/modules/real-estate/types/maintenance-record';

const API_BASE = '/api/real-estate/maintenance';

export function useRealEstateMaintenanceRecords(params?: RealEstateMaintenanceRecordListParams) {
  return useQuery({
    queryKey: ['real-estate-maintenance-records', params],
    queryFn: async () => {
      const searchParams = new URLSearchParams();
      if (params?.page) searchParams.set('page', params.page.toString());
      if (params?.pageSize) searchParams.set('pageSize', params.pageSize.toString());
      if (params?.search) searchParams.set('search', params.search);
      if (params?.type) searchParams.set('type', params.type);
      if (params?.status) searchParams.set('status', params.status);
      if (params?.apartmentId) searchParams.set('apartmentId', params.apartmentId);
      if (params?.assignedStaffId) searchParams.set('assignedStaffId', params.assignedStaffId);
      if (params?.scheduledDateFrom) searchParams.set('scheduledDateFrom', params.scheduledDateFrom.toISOString());
      if (params?.scheduledDateTo) searchParams.set('scheduledDateTo', params.scheduledDateTo.toISOString());

      const response = await fetch(`${API_BASE}?${searchParams.toString()}`);
      if (!response.ok) {
        throw new Error('Failed to fetch maintenance records');
      }
      const data = await response.json();
      return data.data as { records: RealEstateMaintenanceRecord[]; total: number; page: number; pageSize: number };
    },
  });
}

export function useRealEstateMaintenanceRecord(id: string) {
  return useQuery({
    queryKey: ['real-estate-maintenance-record', id],
    queryFn: async () => {
      const response = await fetch(`${API_BASE}/${id}`);
      if (!response.ok) {
        throw new Error('Failed to fetch maintenance record');
      }
      const data = await response.json();
      return data.data.record as RealEstateMaintenanceRecord;
    },
    enabled: !!id,
  });
}

export function useCreateRealEstateMaintenanceRecord() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: RealEstateMaintenanceRecordCreateInput) => {
      const response = await fetch(API_BASE, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...input,
          scheduledDate: input.scheduledDate instanceof Date ? input.scheduledDate.toISOString() : input.scheduledDate,
        }),
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to create maintenance record');
      }
      const data = await response.json();
      return data.data.record as RealEstateMaintenanceRecord;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['real-estate-maintenance-records'] });
    },
  });
}

export function useUpdateRealEstateMaintenanceRecord() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...input }: RealEstateMaintenanceRecordUpdateInput & { id: string }) => {
      const response = await fetch(`${API_BASE}/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...input,
          scheduledDate: input.scheduledDate instanceof Date ? input.scheduledDate.toISOString() : input.scheduledDate,
        }),
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to update maintenance record');
      }
      const data = await response.json();
      return data.data.record as RealEstateMaintenanceRecord;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['real-estate-maintenance-records'] });
      queryClient.invalidateQueries({ queryKey: ['real-estate-maintenance-record', variables.id] });
    },
  });
}

export function useDeleteRealEstateMaintenanceRecord() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const response = await fetch(`${API_BASE}/${id}`, {
        method: 'DELETE',
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to delete maintenance record');
      }
      return id;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['real-estate-maintenance-records'] });
    },
  });
}

