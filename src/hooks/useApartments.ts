import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { Apartment, ApartmentCreateInput, ApartmentUpdateInput, ApartmentListParams } from '@/modules/real-estate/types/apartment';

const API_BASE = '/api/real-estate/apartments';

// Fetch apartments list
export function useApartments(params?: ApartmentListParams) {
  return useQuery({
    queryKey: ['apartments', params],
    queryFn: async () => {
      const searchParams = new URLSearchParams();
      if (params?.page) searchParams.set('page', params.page.toString());
      if (params?.pageSize) searchParams.set('pageSize', params.pageSize.toString());
      if (params?.search) searchParams.set('search', params.search);
      if (params?.propertyId) searchParams.set('propertyId', params.propertyId);
      if (params?.status) searchParams.set('status', params.status);
      if (params?.isActive !== undefined) searchParams.set('isActive', params.isActive.toString());

      const response = await fetch(`${API_BASE}?${searchParams.toString()}`);
      if (!response.ok) {
        throw new Error('Failed to fetch apartments');
      }
      const data = await response.json();
      return data.data as { apartments: Apartment[]; total: number; page: number; pageSize: number };
    },
  });
}

// Fetch single apartment
export function useApartment(id: string) {
  return useQuery({
    queryKey: ['apartment', id],
    queryFn: async () => {
      const response = await fetch(`${API_BASE}/${id}`);
      if (!response.ok) {
        throw new Error('Failed to fetch apartment');
      }
      const data = await response.json();
      return data.data.apartment as Apartment;
    },
    enabled: !!id,
  });
}

// Create apartment
export function useCreateApartment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: ApartmentCreateInput) => {
      const response = await fetch(API_BASE, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(input),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to create apartment');
      }

      const data = await response.json();
      return data.data.apartment as Apartment;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['apartments'] });
    },
  });
}

// Update apartment
export function useUpdateApartment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, input }: { id: string; input: ApartmentUpdateInput }) => {
      const response = await fetch(`${API_BASE}/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(input),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to update apartment');
      }

      const data = await response.json();
      return data.data.apartment as Apartment;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['apartments'] });
      queryClient.invalidateQueries({ queryKey: ['apartment', variables.id] });
    },
  });
}

// Delete apartment
export function useDeleteApartment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const response = await fetch(`${API_BASE}/${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to delete apartment');
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['apartments'] });
    },
  });
}








