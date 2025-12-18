import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { MaintenanceRecord, MaintenanceRecordCreateInput, MaintenanceRecordUpdateInput, MaintenanceRecordListParams } from '@/modules/maintenance/types/maintenance';

const API_BASE = '/api/maintenance/records';

export function useMaintenanceRecords(params?: MaintenanceRecordListParams) {
  return useQuery({
    queryKey: ['maintenance-records', params],
    queryFn: async () => {
      const searchParams = new URLSearchParams();
      if (params?.page) searchParams.set('page', params.page.toString());
      if (params?.pageSize) searchParams.set('pageSize', params.pageSize.toString());
      if (params?.search) searchParams.set('search', params.search);
      if (params?.type) searchParams.set('type', params.type);
      if (params?.status) searchParams.set('status', params.status);
      if (params?.locationId) searchParams.set('locationId', params.locationId);
      if (params?.equipmentId) searchParams.set('equipmentId', params.equipmentId);
      if (params?.assignedTo) searchParams.set('assignedTo', params.assignedTo);
      if (params?.performedBy) searchParams.set('performedBy', params.performedBy);
      if (params?.scheduledDateFrom) searchParams.set('scheduledDateFrom', params.scheduledDateFrom.toISOString());
      if (params?.scheduledDateTo) searchParams.set('scheduledDateTo', params.scheduledDateTo.toISOString());
      if (params?.isActive !== undefined) searchParams.set('isActive', params.isActive.toString());

      const response = await fetch(`${API_BASE}?${searchParams.toString()}`);
      if (!response.ok) {
        throw new Error('Failed to fetch maintenance records');
      }
      const data = await response.json();
      return data.data as { records: MaintenanceRecord[]; total: number; page: number; pageSize: number };
    },
  });
}

export function useMaintenanceRecord(id: string) {
  return useQuery({
    queryKey: ['maintenance-record', id],
    queryFn: async () => {
      const response = await fetch(`${API_BASE}/${id}`);
      if (!response.ok) {
        throw new Error('Failed to fetch maintenance record');
      }
      const data = await response.json();
      return data.data.record as MaintenanceRecord;
    },
    enabled: !!id,
  });
}

export function useCreateMaintenanceRecord() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: MaintenanceRecordCreateInput) => {
      const response = await fetch(API_BASE, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...input,
          scheduledDate: input.scheduledDate instanceof Date ? input.scheduledDate.toISOString() : input.scheduledDate,
          startDate: input.startDate instanceof Date ? input.startDate.toISOString() : input.startDate,
          endDate: input.endDate instanceof Date ? input.endDate.toISOString() : input.endDate,
        }),
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to create maintenance record');
      }
      const data = await response.json();
      return data.data.record as MaintenanceRecord;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['maintenance-records'] });
      queryClient.invalidateQueries({ queryKey: ['maintenance-analytics'] });
    },
  });
}

export function useUpdateMaintenanceRecord() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...input }: MaintenanceRecordUpdateInput & { id: string }) => {
      const response = await fetch(`${API_BASE}/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...input,
          scheduledDate: input.scheduledDate instanceof Date ? input.scheduledDate.toISOString() : input.scheduledDate,
          startDate: input.startDate instanceof Date ? input.startDate.toISOString() : input.startDate,
          endDate: input.endDate instanceof Date ? input.endDate.toISOString() : input.endDate,
        }),
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to update maintenance record');
      }
      const data = await response.json();
      return data.data.record as MaintenanceRecord;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['maintenance-records'] });
      queryClient.invalidateQueries({ queryKey: ['maintenance-record', variables.id] });
      queryClient.invalidateQueries({ queryKey: ['maintenance-analytics'] });
    },
  });
}

export function useDeleteMaintenanceRecord() {
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
      queryClient.invalidateQueries({ queryKey: ['maintenance-records'] });
      queryClient.invalidateQueries({ queryKey: ['maintenance-analytics'] });
    },
  });
}

export function useMaintenanceAnalytics(params?: { companyId?: string; dateFrom?: Date; dateTo?: Date }) {
  return useQuery({
    queryKey: ['maintenance-analytics', params],
    queryFn: async () => {
      const searchParams = new URLSearchParams();
      if (params?.companyId) searchParams.set('companyId', params.companyId);
      if (params?.dateFrom) searchParams.set('dateFrom', params.dateFrom.toISOString());
      if (params?.dateTo) searchParams.set('dateTo', params.dateTo.toISOString());

      const response = await fetch(`/api/maintenance/analytics?${searchParams.toString()}`);
      if (!response.ok) {
        throw new Error('Failed to fetch maintenance analytics');
      }
      const data = await response.json();
      return data.data as {
        summary: {
          totalRecords: number;
          scheduled: number;
          inProgress: number;
          completed: number;
          cancelled: number;
          totalEstimatedCost: number;
          totalActualCost: number;
        };
        byType: {
          preventive: number;
          corrective: number;
          emergency: number;
        };
        byStatus: {
          scheduled: number;
          in_progress: number;
          completed: number;
          cancelled: number;
        };
        monthlyTrend: Array<{
          month: string;
          scheduled: number;
          completed: number;
          cost: number;
        }>;
        upcomingMaintenance: Array<{
          id: string;
          title: string;
          equipment: string;
          scheduledDate: string;
          type: string;
        }>;
        overdueMaintenance: Array<{
          id: string;
          title: string;
          equipment: string;
          scheduledDate: string;
          daysOverdue: number;
        }>;
      };
    },
  });
}
