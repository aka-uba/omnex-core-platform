// AI Analyze Hook
// FAZ 0.2: Merkezi AI Servisi

import { useMutation } from '@tanstack/react-query';
import { AIAnalysisResult } from '@/lib/core-ai/types';

interface AnalyzeOptions {
  data: any;
  analysisType: string;
}

/**
 * Hook for AI data analysis
 */
export function useAIAnalyze() {
  return useMutation<AIAnalysisResult, Error, AnalyzeOptions>({
    mutationFn: async (options) => {
      const response = await fetch('/api/core-ai/analyze', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(options),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'AI analysis failed');
      }

      const result = await response.json();
      return result.data?.analysis;
    },
  });
}









