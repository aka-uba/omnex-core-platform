// Base AI Provider Interface
// FAZ 0.2: Merkezi AI Servisi

import { AIGenerateOptions, AIResponse, AIMessage, AIChatOptions, AIModel } from '../types';

/**
 * Base class for all AI providers
 * Each provider (OpenAI, Anthropic, Google) should extend this class
 */
export abstract class BaseAIProvider {
  protected providerName: string;
  protected config: any;

  constructor(providerName: string, config: any) {
    this.providerName = providerName;
    this.config = config;
  }

  /**
   * Generate text from a prompt
   */
  abstract generate(options: AIGenerateOptions): Promise<AIResponse>;

  /**
   * Chat with the AI (conversational)
   */
  abstract chat(messages: AIMessage[], options?: AIChatOptions): Promise<AIResponse>;

  /**
   * Get available models for this provider
   */
  abstract getModels(): Promise<AIModel[]>;

  /**
   * Validate configuration
   */
  abstract validateConfig(): boolean;

  /**
   * Estimate cost for a request
   */
  abstract estimateCost(options: AIGenerateOptions, response: AIResponse): Promise<number>;

  /**
   * Get provider name
   */
  getName(): string {
    return this.providerName;
  }
}

