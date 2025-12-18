// AI Quota Hook
// FAZ 0.2: Merkezi AI Servisi

import { useQuery } from '@tanstack/react-query';
import { QuotaStatus } from '@/lib/core-ai/types';

/**
 * Hook to get AI quota status
 */
export function useAIQuota() {
  return useQuery<QuotaStatus>({
    queryKey: ['ai-quota'],
    queryFn: async () => {
      const response = await fetch('/api/core-ai/quota');
      if (!response.ok) {
        throw new Error('Failed to fetch quota status');
      }

      const result = await response.json();
      const quota = result.data?.quota;
      
      // Convert ISO strings back to Date objects
      return {
        ...quota,
        resetAt: {
          daily: new Date(quota.resetAt.daily),
          monthly: new Date(quota.resetAt.monthly),
        },
      };
    },
    refetchInterval: 60000, // Refetch every minute
  });
}









