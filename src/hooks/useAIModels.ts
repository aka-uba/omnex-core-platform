// AI Models Hook
// FAZ 0.2: Merkezi AI Servisi

import { useQuery } from '@tanstack/react-query';
import { AIModel } from '@/lib/core-ai/types';

/**
 * Hook to get available AI models
 */
export function useAIModels() {
  return useQuery<AIModel[]>({
    queryKey: ['ai-models'],
    queryFn: async () => {
      const response = await fetch('/api/core-ai/models');
      if (!response.ok) {
        throw new Error('Failed to fetch AI models');
      }

      const result = await response.json();
      return result.data?.models || [];
    },
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
  });
}









