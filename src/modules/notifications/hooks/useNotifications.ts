import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

export interface NotificationFilters {
  module?: string;
  is_global?: boolean;
  archived?: boolean;
  is_read?: boolean;
  type?: string;
  priority?: string;
  search?: string;
  page?: number;
  pageSize?: number;
}

export function useNotifications(filters?: NotificationFilters) {
  return useQuery({
    queryKey: ['notifications', filters],
    queryFn: async () => {
      const params = new URLSearchParams();
      
      if (filters?.module) params.append('module', filters.module);
      if (filters?.is_global !== undefined) params.append('is_global', String(filters.is_global));
      if (filters?.archived !== undefined) params.append('archived', String(filters.archived));
      if (filters?.is_read !== undefined) params.append('is_read', String(filters.is_read));
      if (filters?.type) params.append('type', filters.type);
      if (filters?.priority) params.append('priority', filters.priority);
      if (filters?.search) params.append('search', filters.search);
      if (filters?.page) params.append('page', String(filters.page));
      if (filters?.pageSize) params.append('pageSize', String(filters.pageSize));

      const response = await fetch(`/api/notifications?${params.toString()}`);
      if (!response.ok) throw new Error('Failed to fetch notifications');
      return response.json();
    },
  });
}

export function useNotification(id: string) {
  return useQuery({
    queryKey: ['notification', id],
    queryFn: async () => {
      const response = await fetch(`/api/notifications/${id}`);
      if (!response.ok) throw new Error('Failed to fetch notification');
      const data = await response.json();
      // API returns { notification: {...} }, extract it
      return data.notification || data;
    },
    enabled: !!id,
  });
}

export function useDeleteNotification() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const response = await fetch(`/api/notifications/${id}`, {
        method: 'DELETE',
      });
      if (!response.ok) throw new Error('Failed to delete notification');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
  });
}

export function useArchiveNotification() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const response = await fetch(`/api/notifications/${id}/archive`, {
        method: 'PATCH',
      });
      if (!response.ok) throw new Error('Failed to archive notification');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
  });
}

export function useCreateNotification() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: {
      title: string;
      message: string;
      type: string;
      priority: string;
      senderId?: string;
      recipientId?: string;
      locationId?: string;
      isGlobal?: boolean;
      expiresAt?: string;
      data?: any;
      actionUrl?: string;
      actionText?: string;
      module?: string;
      attachments?: Array<{
        url: string;
        filename: string;
        contentType?: string;
        size?: number;
      }>;
    }) => {
      const response = await fetch('/api/notifications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error('Failed to create notification');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
  });
}

export function useUpdateNotification() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<{
      title: string;
      message: string;
      type: string;
      priority: string;
      isRead: boolean;
      archivedAt: string | null;
      attachments: Array<{
        url: string;
        filename: string;
        contentType?: string;
        size?: number;
      }>;
    }> }) => {
      const response = await fetch(`/api/notifications/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error('Failed to update notification');
      return response.json();
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      queryClient.invalidateQueries({ queryKey: ['notification', variables.id] });
    },
  });
}
