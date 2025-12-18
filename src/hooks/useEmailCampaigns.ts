import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { EmailCampaign, EmailCampaignCreateInput, EmailCampaignUpdateInput, EmailCampaignListParams } from '@/modules/real-estate/types/email-campaign';

const API_BASE = '/api/real-estate/email/campaigns';

// Fetch email campaigns list
export function useEmailCampaigns(params?: EmailCampaignListParams) {
  return useQuery({
    queryKey: ['emailCampaigns', params],
    queryFn: async () => {
      const searchParams = new URLSearchParams();
      if (params?.page) searchParams.set('page', params.page.toString());
      if (params?.pageSize) searchParams.set('pageSize', params.pageSize.toString());
      if (params?.search) searchParams.set('search', params.search);
      if (params?.status) searchParams.set('status', params.status);
      if (params?.templateId) searchParams.set('templateId', params.templateId);
      if (params?.apartmentId) searchParams.set('apartmentId', params.apartmentId);

      const response = await fetch(`${API_BASE}?${searchParams.toString()}`);
      if (!response.ok) {
        throw new Error('Failed to fetch email campaigns');
      }
      const data = await response.json();
      return data.data as { campaigns: EmailCampaign[]; total: number; page: number; pageSize: number };
    },
  });
}

// Fetch single email campaign
export function useEmailCampaign(id: string) {
  return useQuery({
    queryKey: ['emailCampaign', id],
    queryFn: async () => {
      const response = await fetch(`${API_BASE}/${id}`);
      if (!response.ok) {
        throw new Error('Failed to fetch email campaign');
      }
      const data = await response.json();
      return data.data.campaign as EmailCampaign;
    },
    enabled: !!id,
  });
}

// Fetch email analytics
export function useEmailCampaignAnalytics(params?: { dateFrom?: string; dateTo?: string; companyId?: string }) {
  return useQuery({
    queryKey: ['emailCampaignAnalytics', params],
    queryFn: async () => {
      const searchParams = new URLSearchParams();
      if (params?.dateFrom) searchParams.set('dateFrom', params.dateFrom);
      if (params?.dateTo) searchParams.set('dateTo', params.dateTo);
      if (params?.companyId) searchParams.set('companyId', params.companyId);

      const response = await fetch(`${API_BASE}/analytics?${searchParams.toString()}`);
      if (!response.ok) {
        throw new Error('Failed to fetch email analytics');
      }
      const data = await response.json();
      return data.data.analytics;
    },
  });
}

// Create email campaign
export function useCreateEmailCampaign() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: EmailCampaignCreateInput) => {
      const response = await fetch(API_BASE, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(input),
      });
      if (!response.ok) {
        throw new Error('Failed to create email campaign');
      }
      const data = await response.json();
      return data.data.campaign as EmailCampaign;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['emailCampaigns'] });
      queryClient.invalidateQueries({ queryKey: ['emailCampaignAnalytics'] });
    },
  });
}

// Update email campaign
export function useUpdateEmailCampaign() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, input }: { id: string; input: EmailCampaignUpdateInput }) => {
      const response = await fetch(`${API_BASE}/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(input),
      });
      if (!response.ok) {
        throw new Error('Failed to update email campaign');
      }
      const data = await response.json();
      return data.data.campaign as EmailCampaign;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['emailCampaigns'] });
      queryClient.invalidateQueries({ queryKey: ['emailCampaign'] });
      queryClient.invalidateQueries({ queryKey: ['emailCampaignAnalytics'] });
    },
  });
}

// Delete email campaign
export function useDeleteEmailCampaign() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const response = await fetch(`${API_BASE}/${id}`, {
        method: 'DELETE',
      });
      if (!response.ok) {
        throw new Error('Failed to delete email campaign');
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['emailCampaigns'] });
      queryClient.invalidateQueries({ queryKey: ['emailCampaignAnalytics'] });
    },
  });
}








