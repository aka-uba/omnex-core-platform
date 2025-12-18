// Core AI Service
// FAZ 0.2: Merkezi AI Servisi
// Tüm modüller bu servisi kullanarak AI işlemleri yapacak

import { BaseAIProvider } from './providers/BaseProvider';
import { OpenAIProvider } from './providers/OpenAIProvider';
import { templateRegistry } from './templates/TemplateRegistry';
import {
  AIGenerateOptions,
  AIResponse,
  AIMessage,
  AIChatOptions,
  AIAnalysisResult,
  AIModel,
  PromptTemplate,
  QuotaStatus,
  AIProvider,
} from './types';

export class CoreAIService {
  private providers: Map<AIProvider, BaseAIProvider> = new Map();
  private defaultProvider: AIProvider = 'openai';
  private defaultModel: string = 'gpt-3.5-turbo';

  constructor() {
    // Initialize OpenAI provider if API key is available
    const openaiKey = process.env.OPENAI_API_KEY;
    if (openaiKey) {
      this.registerProvider('openai', new OpenAIProvider({
        apiKey: openaiKey,
        ...(process.env.OPENAI_BASE_URL ? { baseURL: process.env.OPENAI_BASE_URL } : {}),
      }));
    }
  }

  /**
   * Register an AI provider
   */
  registerProvider(name: AIProvider, provider: BaseAIProvider): void {
    if (!provider.validateConfig()) {
      throw new Error(`Invalid configuration for ${name} provider`);
    }
    this.providers.set(name, provider);
  }

  /**
   * Get provider instance
   */
  private getProvider(providerName?: AIProvider): BaseAIProvider {
    const provider = providerName || this.defaultProvider;
    const providerInstance = this.providers.get(provider);
    
    if (!providerInstance) {
      throw new Error(`Provider not found: ${provider}. Available providers: ${Array.from(this.providers.keys()).join(', ')}`);
    }

    return providerInstance;
  }

  /**
   * Generate text from a prompt
   */
  async generate(options: AIGenerateOptions): Promise<AIResponse> {
    const provider = this.getProvider(options.provider);
    const response = await provider.generate(options);

    // Calculate cost
    response.cost = await provider.estimateCost(options, response);

    // Log to AI History (if tenantPrisma provided)
    if (options.tenantId && options.userId) {
      await this.logToHistory({
        tenantId: options.tenantId,
        userId: options.userId,
        generatorType: 'text',
        prompt: options.prompt,
        output: response.content,
        settings: {
          model: response.model,
          provider: response.provider,
          ...(options.temperature !== undefined ? { temperature: options.temperature } : {}),
          ...(options.maxTokens !== undefined ? { maxTokens: options.maxTokens } : {}),
        },
        ...(response.usage ? { usage: response.usage } : {}),
        ...(response.cost !== undefined ? { cost: response.cost } : {}),
        ...(options.module ? { module: options.module } : {}),
      });
    }

    return response;
  }

  /**
   * Generate using a prompt template
   */
  async generateWithTemplate(
    templateId: string,
    variables: Record<string, any>
  ): Promise<AIResponse> {
    const template = templateRegistry.get(templateId);
    if (!template) {
      throw new Error(`Template not found: ${templateId}`);
    }

    // Render template
    const prompt = templateRegistry.render(templateId, variables);

    // Generate with template settings
    return this.generate({
      prompt,
      model: template.defaultModel || this.defaultModel,
      provider: template.defaultProvider || this.defaultProvider,
      ...(template.settings?.temperature !== undefined ? { temperature: template.settings.temperature } : {}),
      ...(template.settings?.maxTokens !== undefined ? { maxTokens: template.settings.maxTokens } : {}),
    });
  }

  /**
   * Analyze data using AI
   */
  async analyze(
    data: any,
    analysisType: string
  ): Promise<AIAnalysisResult> {
    // Build analysis prompt based on type
    const prompt = this.buildAnalysisPrompt(data, analysisType);

    const response = await this.generate({
      prompt,
      model: this.defaultModel,
      temperature: 0.3, // Lower temperature for analysis
    });

    // Parse response as analysis result
    try {
      const result = JSON.parse(response.content);
      return {
        type: analysisType,
        result,
        confidence: result.confidence,
        reasoning: result.reasoning,
        metadata: {
          model: response.model,
          provider: response.provider,
          usage: response.usage,
        },
      };
    } catch {
      // If not JSON, return as text
      return {
        type: analysisType,
        result: response.content,
        metadata: {
          model: response.model,
          provider: response.provider,
          usage: response.usage,
        },
      };
    }
  }

  /**
   * Chat with AI (conversational)
   */
  async chat(
    messages: AIMessage[],
    options?: AIChatOptions
  ): Promise<AIResponse> {
    const provider = this.getProvider(options?.provider);
    const response = await provider.chat(messages, options);

    // Calculate cost
    if (options) {
      response.cost = await provider.estimateCost(
        {
          prompt: messages.map(m => m.content).join('\n'),
          model: options.model || this.defaultModel,
        },
        response
      );
    }

    // Log to AI History (if tenantPrisma provided)
    if (options?.tenantId && options?.userId) {
      await this.logToHistory({
        tenantId: options.tenantId,
        userId: options.userId,
        generatorType: 'chat',
        prompt: messages.map(m => `${m.role}: ${m.content}`).join('\n'),
        output: response.content,
        settings: {
          model: response.model,
          provider: response.provider,
          ...(options.temperature !== undefined ? { temperature: options.temperature } : {}),
          ...(options.maxTokens !== undefined ? { maxTokens: options.maxTokens } : {}),
          ...(options.systemPrompt ? { systemPrompt: options.systemPrompt } : {}),
        },
        ...(response.usage ? { usage: response.usage } : {}),
        ...(response.cost !== undefined ? { cost: response.cost } : {}),
        ...(options.module ? { module: options.module } : {}),
      });
    }

    return response;
  }

  /**
   * Get available models
   */
  async getAvailableModels(): Promise<AIModel[]> {
    const allModels: AIModel[] = [];

    for (const provider of this.providers.values()) {
      try {
        const models = await provider.getModels();
        allModels.push(...models);
      } catch (error) {
        // Skip providers that fail to load models
      }
    }

    return allModels;
  }

  /**
   * Register a model (for custom models)
   */
  registerModel(model: AIModel): void {
    // This would typically be stored in a database
    // For now, we'll just validate the model
    if (!model.id || !model.name || !model.provider) {
      throw new Error('Invalid model configuration');
    }
  }

  /**
   * Check quota status
   */
  async checkQuota(tenantId: string, userId: string): Promise<QuotaStatus> {
    // TODO: Implement quota checking from database
    // For now, return unlimited quota
    return {
      tenantId,
      userId,
      limit: {
        daily: 1000000, // 1M tokens per day
        monthly: 30000000, // 30M tokens per month
        perRequest: 100000, // 100K tokens per request
      },
      used: {
        daily: 0,
        monthly: 0,
      },
      remaining: {
        daily: 1000000,
        monthly: 30000000,
      },
      resetAt: {
        daily: new Date(Date.now() + 24 * 60 * 60 * 1000),
        monthly: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      },
    };
  }

  /**
   * Register a prompt template
   */
  registerTemplate(template: PromptTemplate): void {
    templateRegistry.register(template);
  }

  /**
   * Get template by ID
   */
  getTemplate(templateId: string): PromptTemplate | undefined {
    return templateRegistry.get(templateId);
  }

  /**
   * Build analysis prompt based on type
   */
  private buildAnalysisPrompt(data: any, analysisType: string): string {
    const dataStr = typeof data === 'string' ? data : JSON.stringify(data, null, 2);

    const prompts: Record<string, string> = {
      'invoice-categorization': `Analyze the following invoice data and categorize it. Return JSON with category, subcategory, and confidence score.
      
Data:
${dataStr}

Return format:
{
  "category": "string",
  "subcategory": "string",
  "confidence": 0.0-1.0,
  "reasoning": "string"
}`,
      'text-summarization': `Summarize the following text in 2-3 sentences:
      
${dataStr}`,
      'sentiment-analysis': `Analyze the sentiment of the following text. Return JSON with sentiment (positive/negative/neutral), score, and reasoning.
      
Text:
${dataStr}

Return format:
{
  "sentiment": "positive|negative|neutral",
  "score": 0.0-1.0,
  "reasoning": "string"
}`,
    };

      return prompts[analysisType] || `Analyze the following data for ${analysisType}:
      
${dataStr}`;
  }

  /**
   * Log AI generation to history
   */
  private async logToHistory(data: {
    tenantId: string;
    userId: string;
    companyId?: string;
    generatorType: string;
    prompt: string;
    output: string;
    settings?: any;
    usage?: {
      promptTokens: number;
      completionTokens: number;
      totalTokens: number;
    };
    cost?: number;
    module?: string;
  }): Promise<void> {
    // This would typically use tenantPrisma to save to database
    // For now, we'll just log (can be implemented later with tenantPrisma injection)
    // The AIGeneration and AIHistory models already exist in the schema
    // This method can be called with tenantPrisma when available
  }

  /**
   * Set tenant Prisma client for history logging
   */
  setTenantPrisma(tenantPrisma: any): void {
    // Store tenantPrisma for history logging
    // This will be used in logToHistory method
    (this as any).tenantPrisma = tenantPrisma;
  }
}

// Global service instance
export const coreAIService = new CoreAIService();

