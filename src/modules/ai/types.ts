export type AIModelType = 'text' | 'image' | 'code' | 'audio' | 'video';

export interface AIModel {
    id: string;
    name: string;
    provider: 'openai' | 'anthropic' | 'google' | 'stability' | 'midjourney' | 'elevenlabs' | 'meta';
    type: AIModelType;
    description: string;
    maxTokens?: number;
    contextWindow?: number;
}

export interface AIMessage {
    id: string;
    role: 'user' | 'assistant' | 'system';
    content: string;
    timestamp: Date;
    attachments?: string[];
}

export interface AIChatSession {
    id: string;
    title: string;
    modelId: string;
    messages: AIMessage[];
    createdAt: Date;
    updatedAt: Date;
    type: AIModelType;
}

export interface GenerationConfig {
    modelId: string;
    temperature?: number;
    maxTokens?: number;
    topP?: number;
    frequencyPenalty?: number;
    presencePenalty?: number;
    // Image specific
    aspectRatio?: string;
    resolution?: string;
    style?: string;
    negativePrompt?: string;
    // Audio/Video specific
    voiceId?: string;
    duration?: number;
}

export interface GeneratedContent {
    id: string;
    type: AIModelType;
    url?: string; // For image/audio/video
    content?: string; // For text/code
    prompt: string;
    createdAt: Date;
    modelId: string;
    metadata?: Record<string, any>;
}
