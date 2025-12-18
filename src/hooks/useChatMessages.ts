// Chat Module React Query Hooks - Messages (FAZ 3)

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type { ChatMessage, ChatMessageCreateInput, ChatMessageUpdateInput, ChatMessageListParams } from '@/modules/sohbet/types/chat';
import { authenticatedFetch } from '@/lib/api/authenticatedFetch';

const API_BASE = '/api/chat/messages';

// GET /api/chat/messages - List chat messages
export function useChatMessages(params: ChatMessageListParams) {
  return useQuery<{ messages: ChatMessage[]; total: number; page: number; pageSize: number }>({
    queryKey: ['chatMessages', params.roomId, params],
    queryFn: async () => {
      const searchParams = new URLSearchParams();
      searchParams.set('roomId', params.roomId);
      if (params.page) searchParams.set('page', params.page.toString());
      if (params.pageSize) searchParams.set('pageSize', params.pageSize.toString());
      if (params.search) searchParams.set('search', params.search);
      if (params.type) searchParams.set('type', params.type);
      if (params.isRead !== undefined) searchParams.set('isRead', params.isRead.toString());
      if (params.senderId) searchParams.set('senderId', params.senderId);

      if (params.companyId) searchParams.set('companyId', params.companyId);

      const response = await authenticatedFetch(`${API_BASE}?${searchParams.toString()}`);
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const errorMessage = errorData.error?.message || errorData.error?.details || errorData.message || 'Failed to fetch chat messages';
        throw new Error(errorMessage);
      }
      const data = await response.json();
      if (!data.success) {
        const errorMessage = data.error?.message || data.error?.details || data.message || 'Failed to fetch chat messages';
        throw new Error(errorMessage);
      }
      return data.data;
    },
    enabled: !!params.roomId,
    refetchInterval: 5000, // Poll every 5 seconds for real-time updates
  });
}

// GET /api/chat/messages/[id] - Get chat message
export function useChatMessage(id: string) {
  return useQuery<{ message: ChatMessage }>({
    queryKey: ['chatMessage', id],
    queryFn: async () => {
      const response = await authenticatedFetch(`${API_BASE}/${id}`);
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const errorMessage = errorData.error?.message || errorData.error?.details || errorData.message || 'Failed to fetch chat message';
        throw new Error(errorMessage);
      }
      const data = await response.json();
      if (!data.success) {
        const errorMessage = data.error?.message || data.error?.details || data.message || 'Failed to fetch chat message';
        throw new Error(errorMessage);
      }
      return data.data;
    },
    enabled: !!id,
  });
}

// POST /api/chat/messages - Create chat message
export function useCreateChatMessage() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: ChatMessageCreateInput) => {
      const response = await authenticatedFetch(API_BASE, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const errorMessage = errorData.error?.message || errorData.error?.details || errorData.message || 'Failed to create chat message';
        throw new Error(errorMessage);
      }
      const result = await response.json();
      if (!result.success) {
        const errorMessage = result.error?.message || result.error?.details || result.message || 'Failed to create chat message';
        throw new Error(errorMessage);
      }
      return result.data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['chatMessages', variables.roomId] });
      queryClient.invalidateQueries({ queryKey: ['chatRooms'] });
      queryClient.invalidateQueries({ queryKey: ['chatRoom', variables.roomId] });
    },
  });
}

// PATCH /api/chat/messages/[id] - Update chat message
export function useUpdateChatMessage() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: ChatMessageUpdateInput }) => {
      const response = await authenticatedFetch(`${API_BASE}/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const errorMessage = errorData.error?.message || errorData.error?.details || errorData.message || 'Failed to update chat message';
        throw new Error(errorMessage);
      }
      const result = await response.json();
      if (!result.success) {
        const errorMessage = result.error?.message || result.error?.details || result.message || 'Failed to update chat message';
        throw new Error(errorMessage);
      }
      return result.data;
    },
    onSuccess: (data) => {
      const roomId = data.message.roomId;
      queryClient.invalidateQueries({ queryKey: ['chatMessages', roomId] });
      queryClient.invalidateQueries({ queryKey: ['chatMessage', data.message.id] });
    },
  });
}

// DELETE /api/chat/messages/[id] - Delete chat message
export function useDeleteChatMessage() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, roomId }: { id: string; roomId: string }) => {
      const response = await authenticatedFetch(`${API_BASE}/${id}`, {
        method: 'DELETE',
      });
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const errorMessage = errorData.error?.message || errorData.error?.details || errorData.message || 'Failed to delete chat message';
        throw new Error(errorMessage);
      }
      const result = await response.json();
      if (!result.success) {
        const errorMessage = result.error?.message || result.error?.details || result.message || 'Failed to delete chat message';
        throw new Error(errorMessage);
      }
      return result.data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['chatMessages', variables.roomId] });
    },
  });
}

// PATCH /api/chat/messages/[id] - Mark message as read
export function useMarkMessageAsRead() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, roomId }: { id: string; roomId: string }) => {
      const response = await authenticatedFetch(`${API_BASE}/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isRead: true }),
      });
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const errorMessage = errorData.error?.message || errorData.error?.details || errorData.message || 'Failed to mark message as read';
        throw new Error(errorMessage);
      }
      const result = await response.json();
      if (!result.success) {
        const errorMessage = result.error?.message || result.error?.details || result.message || 'Failed to mark message as read';
        throw new Error(errorMessage);
      }
      return result.data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['chatMessages', variables.roomId] });
      queryClient.invalidateQueries({ queryKey: ['chatMessage', variables.id] });
    },
  });
}







