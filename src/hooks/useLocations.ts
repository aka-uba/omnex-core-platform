import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type { LocationCreateSchema, LocationUpdateSchema } from '@/lib/schemas/location';

export interface Location {
  id: string;
  name: string;
  type: string;
  code?: string | null;
  description?: string | null;
  parentId?: string | null;
  address?: string | null;
  city?: string | null;
  country?: string | null;
  postalCode?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  metadata?: Record<string, any>;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  parent?: {
    id: string;
    name: string;
    type: string;
    code?: string | null;
  } | null;
  children?: Array<{
    id: string;
    name: string;
    type: string;
    code?: string | null;
  }>;
  _count?: {
    equipment: number;
    children: number;
  };
}

export interface LocationsResponse {
  locations: Location[];
  total: number;
  page: number;
  pageSize: number;
}

interface UseLocationsOptions {
  page?: number;
  pageSize?: number;
  search?: string;
  type?: string;
  parentId?: string | null;
  isActive?: boolean;
  companyId?: string;
}

// GET /api/locations
export function useLocations(options: UseLocationsOptions = {}) {
  const { page = 1, pageSize = 10, search, type, parentId, isActive, companyId } = options;

  return useQuery<LocationsResponse>({
    queryKey: ['locations', page, pageSize, search, type, parentId, isActive, companyId],
    queryFn: async () => {
      const params = new URLSearchParams({
        page: page.toString(),
        pageSize: pageSize.toString(),
      });

      if (search) params.append('search', search);
      if (type) params.append('type', type);
      if (parentId !== undefined) params.append('parentId', parentId || '');
      if (isActive !== undefined) params.append('isActive', isActive.toString());
      if (companyId) params.append('companyId', companyId);

      const response = await fetch(`/api/locations?${params.toString()}`);
      if (!response.ok) {
        throw new Error('Failed to fetch locations');
      }

      const data = await response.json();
      if (!data.success) {
        throw new Error(data.error || 'Failed to fetch locations');
      }

      return data.data;
    },
  });
}

// GET /api/locations/[id]
export function useLocation(id: string | null) {
  return useQuery<{ location: Location }>({
    queryKey: ['location', id],
    queryFn: async () => {
      if (!id) throw new Error('Location ID is required');

      const response = await fetch(`/api/locations/${id}`);
      if (!response.ok) {
        throw new Error('Failed to fetch location');
      }

      const data = await response.json();
      if (!data.success) {
        throw new Error(data.error || 'Failed to fetch location');
      }

      return data.data;
    },
    enabled: !!id,
  });
}

// POST /api/locations
export function useCreateLocation() {
  const queryClient = useQueryClient();

  return useMutation<{ location: Location }, Error, LocationCreateSchema>({
    mutationFn: async (data) => {
      const response = await fetch('/api/locations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const error = await response.json();
        const errorMessage = error.details || error.error || 'Failed to create location';
        throw new Error(errorMessage);
      }

      const result = await response.json();
      if (!result.success) {
        throw new Error(result.error || 'Failed to create location');
      }

      return result.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['locations'] });
    },
  });
}

// PATCH /api/locations/[id]
export function useUpdateLocation() {
  const queryClient = useQueryClient();

  return useMutation<{ location: Location }, Error, { id: string; data: LocationUpdateSchema }>({
    mutationFn: async ({ id, data }) => {
      const response = await fetch(`/api/locations/${id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const error = await response.json();
        const errorMessage = error.error || error.message || 'Failed to update location';
        const errorDetails = error.details || error.message || '';
        const fullError = errorDetails ? `${errorMessage}: ${errorDetails}` : errorMessage;
        throw new Error(fullError);
      }

      const result = await response.json();
      if (!result.success) {
        throw new Error(result.error || 'Failed to update location');
      }

      return result.data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['locations'] });
      queryClient.invalidateQueries({ queryKey: ['location', variables.id] });
    },
  });
}

// DELETE /api/locations/[id]
export function useDeleteLocation() {
  const queryClient = useQueryClient();

  return useMutation<void, Error, string>({
    mutationFn: async (id) => {
      const response = await fetch(`/api/locations/${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to delete location');
      }

      const result = await response.json();
      if (!result.success) {
        throw new Error(result.error || 'Failed to delete location');
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['locations'] });
    },
  });
}









