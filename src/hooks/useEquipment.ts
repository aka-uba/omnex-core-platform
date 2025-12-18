import { useQuery } from '@tanstack/react-query';

const API_BASE = '/api/equipment';

export interface Equipment {
  id: string;
  name: string;
  code?: string | null;
  category: string;
  type: string;
  locationId?: string | null;
  status: string;
  isActive: boolean;
}

export interface EquipmentListParams {
  page?: number;
  pageSize?: number;
  search?: string;
  category?: string;
  type?: string;
  status?: string;
  locationId?: string;
  isActive?: boolean;
}

export function useEquipment(params?: EquipmentListParams) {
  return useQuery({
    queryKey: ['equipment', params],
    queryFn: async () => {
      const searchParams = new URLSearchParams();
      if (params?.page) searchParams.set('page', params.page.toString());
      if (params?.pageSize) searchParams.set('pageSize', params.pageSize.toString());
      if (params?.search) searchParams.set('search', params.search);
      if (params?.category) searchParams.set('category', params.category);
      if (params?.type) searchParams.set('type', params.type);
      if (params?.status) searchParams.set('status', params.status);
      if (params?.locationId) searchParams.set('locationId', params.locationId);
      if (params?.isActive !== undefined) searchParams.set('isActive', params.isActive.toString());

      const response = await fetch(`${API_BASE}?${searchParams.toString()}`);
      if (!response.ok) {
        throw new Error('Failed to fetch equipment');
      }
      const data = await response.json();
      return data.data as { equipment: Equipment[]; total: number; page: number; pageSize: number };
    },
  });
}







