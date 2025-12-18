// OpenAI Provider
// FAZ 0.2: Merkezi AI Servisi

import { BaseAIProvider } from './BaseProvider';
import { AIGenerateOptions, AIResponse, AIMessage, AIChatOptions, AIModel } from '../types';

interface OpenAIConfig {
  apiKey: string;
  baseURL?: string;
  timeout?: number;
  maxRetries?: number;
}

export class OpenAIProvider extends BaseAIProvider {
  private apiKey: string;
  private baseURL: string;

  constructor(config: OpenAIConfig) {
    super('openai', config);
    this.apiKey = config.apiKey;
    this.baseURL = config.baseURL || 'https://api.openai.com/v1';
  }

  validateConfig(): boolean {
    return !!this.apiKey && this.apiKey.startsWith('sk-');
  }

  async generate(options: AIGenerateOptions): Promise<AIResponse> {
    if (!this.validateConfig()) {
      throw new Error('OpenAI configuration is invalid');
    }

    const model = options.model || 'gpt-3.5-turbo';
    const url = `${this.baseURL}/chat/completions`;

    const requestBody = {
      model,
      messages: [
        {
          role: 'user',
          content: options.prompt,
        },
      ],
      max_tokens: options.maxTokens || 1000,
      temperature: options.temperature ?? 0.7,
      top_p: options.topP,
      frequency_penalty: options.frequencyPenalty,
      presence_penalty: options.presencePenalty,
      stop: options.stop,
      stream: options.stream || false,
    };

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error?.message || 'OpenAI API error');
      }

      const data = await response.json();
      const choice = data.choices[0];

      return {
        id: data.id,
        content: choice.message.content,
        model: data.model,
        provider: 'openai',
        usage: {
          promptTokens: data.usage.prompt_tokens,
          completionTokens: data.usage.completion_tokens,
          totalTokens: data.usage.total_tokens,
        },
        finishReason: choice.finish_reason,
        createdAt: new Date(),
        metadata: {
          systemFingerprint: data.system_fingerprint,
        },
      };
    } catch (error) {
      throw new Error(`OpenAI API error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async chat(messages: AIMessage[], options?: AIChatOptions): Promise<AIResponse> {
    if (!this.validateConfig()) {
      throw new Error('OpenAI configuration is invalid');
    }

    const model = options?.model || 'gpt-3.5-turbo';
    const url = `${this.baseURL}/chat/completions`;

    // Add system prompt if provided
    const chatMessages = options?.systemPrompt
      ? [{ role: 'system' as const, content: options.systemPrompt }, ...messages]
      : messages;

    const requestBody = {
      model,
      messages: chatMessages.map(msg => ({
        role: msg.role,
        content: msg.content,
        ...(msg.name && { name: msg.name }),
      })),
      max_tokens: options?.maxTokens || 1000,
      temperature: options?.temperature ?? 0.7,
      stream: options?.stream || false,
    };

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error?.message || 'OpenAI API error');
      }

      const data = await response.json();
      const choice = data.choices[0];

      return {
        id: data.id,
        content: choice.message.content,
        model: data.model,
        provider: 'openai',
        usage: {
          promptTokens: data.usage.prompt_tokens,
          completionTokens: data.usage.completion_tokens,
          totalTokens: data.usage.total_tokens,
        },
        finishReason: choice.finish_reason,
        createdAt: new Date(),
        metadata: {
          systemFingerprint: data.system_fingerprint,
        },
      };
    } catch (error) {
      throw new Error(`OpenAI API error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async getModels(): Promise<AIModel[]> {
    // Return common OpenAI models
    return [
      {
        id: 'gpt-4-turbo',
        name: 'GPT-4 Turbo',
        provider: 'openai',
        model: 'gpt-4-turbo-preview',
        maxTokens: 128000,
        supportsStreaming: true,
        costPerToken: {
          input: 0.01, // $0.01 per 1K tokens
          output: 0.03, // $0.03 per 1K tokens
        },
        isActive: true,
      },
      {
        id: 'gpt-4',
        name: 'GPT-4',
        provider: 'openai',
        model: 'gpt-4',
        maxTokens: 8192,
        supportsStreaming: true,
        costPerToken: {
          input: 0.03,
          output: 0.06,
        },
        isActive: true,
      },
      {
        id: 'gpt-3.5-turbo',
        name: 'GPT-3.5 Turbo',
        provider: 'openai',
        model: 'gpt-3.5-turbo',
        maxTokens: 16385,
        supportsStreaming: true,
        costPerToken: {
          input: 0.0015,
          output: 0.002,
        },
        isActive: true,
      },
    ];
  }

  async estimateCost(options: AIGenerateOptions, response: AIResponse): Promise<number> {
    const models = await this.getModels();
    const model = models.find(m => m.id === options.model || m.model === options.model);
    if (!model || !model.costPerToken) {
      return 0;
    }

    const inputCost = (response.usage.promptTokens / 1000) * model.costPerToken.input;
    const outputCost = (response.usage.completionTokens / 1000) * model.costPerToken.output;
    return inputCost + outputCost;
  }
}

