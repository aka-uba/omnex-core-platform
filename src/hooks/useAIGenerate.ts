// AI Generate Hook
// FAZ 0.2: Merkezi AI Servisi

import { useMutation } from '@tanstack/react-query';
import { AIResponse } from '@/lib/core-ai/types';

interface GenerateOptions {
  prompt: string;
  model?: string;
  provider?: 'openai' | 'anthropic' | 'google' | 'local';
  maxTokens?: number;
  temperature?: number;
  topP?: number;
  frequencyPenalty?: number;
  presencePenalty?: number;
  stop?: string[];
  module?: string;
}

/**
 * Hook for AI text generation
 */
export function useAIGenerate() {
  return useMutation<AIResponse, Error, GenerateOptions>({
    mutationFn: async (options) => {
      const response = await fetch('/api/core-ai/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(options),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'AI generation failed');
      }

      const result = await response.json();
      return result.data?.response;
    },
  });
}









