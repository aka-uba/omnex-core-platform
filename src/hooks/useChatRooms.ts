// Chat Module React Query Hooks (FAZ 3)

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type { ChatRoom, ChatRoomCreateInput, ChatRoomUpdateInput, ChatRoomListParams } from '@/modules/sohbet/types/chat';
import { authenticatedFetch } from '@/lib/api/authenticatedFetch';

const API_BASE = '/api/chat/rooms';

// GET /api/chat/rooms - List chat rooms
export function useChatRooms(params?: ChatRoomListParams) {
  return useQuery<{ rooms: ChatRoom[]; total: number; page: number; pageSize: number }>({
    queryKey: ['chatRooms', params],
    queryFn: async () => {
      const searchParams = new URLSearchParams();
      if (params?.page) searchParams.set('page', params.page.toString());
      if (params?.pageSize) searchParams.set('pageSize', params.pageSize.toString());
      if (params?.search) searchParams.set('search', params.search);
      if (params?.type) searchParams.set('type', params.type);
      if (params?.isActive !== undefined) searchParams.set('isActive', params.isActive.toString());
      if (params?.participantId) searchParams.set('participantId', params.participantId);
      if (params?.companyId) searchParams.set('companyId', params.companyId);

      const response = await authenticatedFetch(`${API_BASE}?${searchParams.toString()}`);
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error('Chat rooms API error:', errorData);
        const errorMessage = errorData.error?.message || errorData.error?.details || errorData.message || 'Failed to fetch chat rooms';
        throw new Error(errorMessage);
      }
      const data = await response.json();
      if (!data.success) {
        console.error('Chat rooms API returned error:', data);
        const errorMessage = data.error?.message || data.error?.details || data.message || 'Failed to fetch chat rooms';
        throw new Error(errorMessage);
      }
      return data.data;
    },
  });
}

// GET /api/chat/rooms/[id] - Get chat room
export function useChatRoom(id: string) {
  return useQuery<{ room: ChatRoom }>({
    queryKey: ['chatRoom', id],
    queryFn: async () => {
      const response = await authenticatedFetch(`${API_BASE}/${id}`);
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const errorMessage = errorData.error?.message || errorData.error?.details || errorData.message || 'Failed to fetch chat room';
        throw new Error(errorMessage);
      }
      const data = await response.json();
      if (!data.success) {
        const errorMessage = data.error?.message || data.error?.details || data.message || 'Failed to fetch chat room';
        throw new Error(errorMessage);
      }
      return data.data;
    },
    enabled: !!id,
  });
}

// POST /api/chat/rooms - Create chat room
export function useCreateChatRoom() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: ChatRoomCreateInput) => {
      const response = await authenticatedFetch(API_BASE, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        // Zod validation errors
        if (errorData.error?.details && Array.isArray(errorData.error.details)) {
          const validationErrors = errorData.error.details.map((err: any) => {
            const path = err.path?.join('.') || 'field';
            const message = err.message || 'Invalid value';
            return `${path}: ${message}`;
          }).join(', ');
          throw new Error(`Validation error: ${validationErrors}`);
        }
        const errorMessage = errorData.error?.message || errorData.error?.details || errorData.message || 'Failed to create chat room';
        throw new Error(errorMessage);
      }
      const result = await response.json();
      if (!result.success) {
        const errorMessage = result.error?.message || result.error?.details || result.message || 'Failed to create chat room';
        throw new Error(errorMessage);
      }
      return result.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['chatRooms'] });
    },
  });
}

// PATCH /api/chat/rooms/[id] - Update chat room
export function useUpdateChatRoom() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: ChatRoomUpdateInput }) => {
      const response = await authenticatedFetch(`${API_BASE}/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const errorMessage = errorData.error?.message || errorData.error?.details || errorData.message || 'Failed to update chat room';
        throw new Error(errorMessage);
      }
      const result = await response.json();
      if (!result.success) {
        const errorMessage = result.error?.message || result.error?.details || result.message || 'Failed to update chat room';
        throw new Error(errorMessage);
      }
      return result.data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['chatRooms'] });
      queryClient.invalidateQueries({ queryKey: ['chatRoom', variables.id] });
    },
  });
}

// DELETE /api/chat/rooms/[id] - Delete chat room
export function useDeleteChatRoom() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const response = await authenticatedFetch(`${API_BASE}/${id}`, {
        method: 'DELETE',
      });
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const errorMessage = errorData.error?.message || errorData.error?.details || errorData.message || 'Failed to delete chat room';
        throw new Error(errorMessage);
      }
      const result = await response.json();
      if (!result.success) {
        const errorMessage = result.error?.message || result.error?.details || result.message || 'Failed to delete chat room';
        throw new Error(errorMessage);
      }
      return result.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['chatRooms'] });
    },
  });
}







