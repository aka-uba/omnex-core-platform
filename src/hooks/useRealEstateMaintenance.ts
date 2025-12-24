import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

const API_BASE = '/api/real-estate/maintenance';

// Types
export interface RealEstateMaintenanceRecord {
  id: string;
  tenantId: string;
  companyId: string;
  apartmentId: string;
  type: 'preventive' | 'corrective' | 'emergency';
  title: string;
  description?: string | null;
  status: 'scheduled' | 'in_progress' | 'completed' | 'cancelled';
  scheduledDate: string;
  startDate?: string | null;
  endDate?: string | null;
  assignedStaffId?: string | null;
  performedByStaffId?: string | null;
  estimatedCost?: number | null;
  actualCost?: number | null;
  documents: string[];
  photos: string[];
  notes?: string | null;
  createdAt: string;
  updatedAt: string;
  apartment?: {
    id: string;
    unitNumber: string;
    property?: {
      id: string;
      name: string;
    };
  };
}

export interface MaintenanceRecordCreateInput {
  apartmentId: string;
  type: 'preventive' | 'corrective' | 'emergency';
  title: string;
  description?: string | null;
  status?: 'scheduled' | 'in_progress' | 'completed' | 'cancelled';
  scheduledDate: string;
  startDate?: string | null;
  endDate?: string | null;
  assignedStaffId?: string | null;
  performedByStaffId?: string | null;
  estimatedCost?: number | null;
  actualCost?: number | null;
  documents?: string[];
  photos?: string[];
  notes?: string | null;
}

export interface MaintenanceRecordUpdateInput {
  apartmentId?: string;
  type?: 'preventive' | 'corrective' | 'emergency';
  title?: string;
  description?: string | null;
  status?: 'scheduled' | 'in_progress' | 'completed' | 'cancelled';
  scheduledDate?: string;
  startDate?: string | null;
  endDate?: string | null;
  assignedStaffId?: string | null;
  performedByStaffId?: string | null;
  estimatedCost?: number | null;
  actualCost?: number | null;
  documents?: string[];
  photos?: string[];
  notes?: string | null;
}

export interface MaintenanceListParams {
  page?: number;
  pageSize?: number;
  search?: string;
  apartmentId?: string;
  propertyId?: string;
  type?: 'preventive' | 'corrective' | 'emergency';
  status?: 'scheduled' | 'in_progress' | 'completed' | 'cancelled';
  scheduledDateFrom?: Date;
  scheduledDateTo?: Date;
  assignedStaffId?: string;
  companyId?: string;
}

// Hook to get maintenance records list
export function useRealEstateMaintenanceRecords(params?: MaintenanceListParams) {
  return useQuery({
    queryKey: ['realEstateMaintenanceRecords', params],
    queryFn: async () => {
      const searchParams = new URLSearchParams();
      if (params?.page) searchParams.set('page', params.page.toString());
      if (params?.pageSize) searchParams.set('pageSize', params.pageSize.toString());
      if (params?.search) searchParams.set('search', params.search);
      if (params?.apartmentId) searchParams.set('apartmentId', params.apartmentId);
      if (params?.propertyId) searchParams.set('propertyId', params.propertyId);
      if (params?.type) searchParams.set('type', params.type);
      if (params?.status) searchParams.set('status', params.status);
      if (params?.scheduledDateFrom) searchParams.set('scheduledDateFrom', params.scheduledDateFrom.toISOString());
      if (params?.scheduledDateTo) searchParams.set('scheduledDateTo', params.scheduledDateTo.toISOString());
      if (params?.assignedStaffId) searchParams.set('assignedStaffId', params.assignedStaffId);
      if (params?.companyId) searchParams.set('companyId', params.companyId);

      const response = await fetch(`${API_BASE}?${searchParams.toString()}`);
      if (!response.ok) {
        throw new Error('Failed to fetch maintenance records');
      }
      const data = await response.json();
      return data.data as {
        records: RealEstateMaintenanceRecord[];
        total: number;
        page: number;
        pageSize: number;
      };
    },
  });
}

// Hook to get single maintenance record
export function useRealEstateMaintenanceRecord(id: string) {
  return useQuery({
    queryKey: ['realEstateMaintenanceRecord', id],
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

// Hook to create maintenance record
export function useCreateRealEstateMaintenance() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: MaintenanceRecordCreateInput) => {
      const response = await fetch(API_BASE, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(input),
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to create maintenance record');
      }
      const data = await response.json();
      return data.data.record as RealEstateMaintenanceRecord;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['realEstateMaintenanceRecords'] });
    },
  });
}

// Hook to update maintenance record
export function useUpdateRealEstateMaintenance() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...input }: MaintenanceRecordUpdateInput & { id: string }) => {
      const response = await fetch(`${API_BASE}/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(input),
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to update maintenance record');
      }
      const data = await response.json();
      return data.data.record as RealEstateMaintenanceRecord;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['realEstateMaintenanceRecords'] });
      queryClient.invalidateQueries({ queryKey: ['realEstateMaintenanceRecord', variables.id] });
    },
  });
}

// Hook to delete maintenance record
export function useDeleteRealEstateMaintenance() {
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
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['realEstateMaintenanceRecords'] });
    },
  });
}
