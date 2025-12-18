// Core AI Service Types
// FAZ 0.2: Merkezi AI Servisi

export type AIProvider = 'openai' | 'anthropic' | 'google' | 'local';

export interface AIModel {
  id: string;
  name: string;
  provider: AIProvider;
  model: string; // Provider-specific model name (e.g., 'gpt-4', 'claude-3-opus')
  maxTokens?: number;
  supportsStreaming?: boolean;
  costPerToken?: {
    input: number; // Cost per 1K input tokens
    output: number; // Cost per 1K output tokens
  };
  isActive: boolean;
}

export interface AIGenerateOptions {
  prompt: string;
  model?: string; // Model ID or provider-specific model name
  provider?: AIProvider;
  maxTokens?: number;
  temperature?: number;
  topP?: number;
  frequencyPenalty?: number;
  presencePenalty?: number;
  stop?: string[];
  stream?: boolean;
  tenantId?: string;
  userId?: string;
  module?: string;
}

export interface AIResponse {
  id: string;
  content: string;
  model: string;
  provider: AIProvider;
  usage: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
  cost?: number; // Estimated cost in USD
  finishReason?: string;
  createdAt: Date;
  metadata?: Record<string, any>;
}

export interface AIMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
  name?: string;
}

export interface AIChatOptions {
  model?: string;
  provider?: AIProvider;
  temperature?: number;
  maxTokens?: number;
  stream?: boolean;
  systemPrompt?: string;
  tenantId?: string;
  userId?: string;
  module?: string;
}

export interface AIAnalysisResult {
  type: string;
  result: any;
  confidence?: number;
  reasoning?: string;
  metadata?: Record<string, any>;
}

export interface PromptTemplate {
  id: string;
  name: string;
  description?: string;
  module?: string;
  template: string; // Template string with {{variable}} placeholders
  variables: string[]; // List of required variables
  defaultModel?: string;
  defaultProvider?: AIProvider;
  settings?: {
    temperature?: number;
    maxTokens?: number;
  };
}

export interface QuotaStatus {
  tenantId: string;
  userId: string;
  limit: {
    daily?: number; // Daily token limit
    monthly?: number; // Monthly token limit
    perRequest?: number; // Per-request token limit
  };
  used: {
    daily: number;
    monthly: number;
  };
  remaining: {
    daily: number;
    monthly: number;
  };
  resetAt: {
    daily: Date;
    monthly: Date;
  };
}

export interface AIProviderConfig {
  apiKey: string;
  baseURL?: string;
  timeout?: number;
  maxRetries?: number;
}









