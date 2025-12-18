// AI Chat Hook
// FAZ 0.2: Merkezi AI Servisi

import { useMutation } from '@tanstack/react-query';
import { AIResponse, AIMessage } from '@/lib/core-ai/types';

interface ChatOptions {
  messages: AIMessage[];
  model?: string;
  provider?: 'openai' | 'anthropic' | 'google' | 'local';
  temperature?: number;
  maxTokens?: number;
  systemPrompt?: string;
  module?: string;
}

/**
 * Hook for AI chat (conversational)
 */
export function useAIChat() {
  return useMutation<AIResponse, Error, ChatOptions>({
    mutationFn: async (options) => {
      const response = await fetch('/api/core-ai/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(options),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'AI chat failed');
      }

      const result = await response.json();
      return result.data?.response;
    },
  });
}









