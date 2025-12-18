/**
 * Chat Module - Schema Tests (FAZ 3)
 * Unit tests for chat schema validation
 */

import { describe, it, expect } from 'vitest';
import {
  chatRoomCreateSchema,
  chatRoomUpdateSchema,
  chatMessageCreateSchema,
  chatMessageUpdateSchema,
  chatRoomTypeSchema,
  chatMessageTypeSchema,
} from '../schemas/chat.schema';

describe('Chat Room Schema Validation', () => {
  it('should validate a valid chat room create input', () => {
    const validInput = {
      name: 'Test Room',
      type: 'direct' as const,
      participants: ['550e8400-e29b-41d4-a716-446655440000', '550e8400-e29b-41d4-a716-446655440001'],
      description: 'Test description',
      avatarUrl: 'https://example.com/avatar.jpg',
    };

    const result = chatRoomCreateSchema.safeParse(validInput);
    expect(result.success).toBe(true);
  });

  it('should validate chat room with minimal required fields', () => {
    const validInput = {
      participants: ['550e8400-e29b-41d4-a716-446655440000'],
    };

    const result = chatRoomCreateSchema.safeParse(validInput);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.type).toBe('direct'); // Default value
    }
  });

  it('should reject chat room without participants', () => {
    const invalidInput = {
      name: 'Test Room',
      type: 'direct' as const,
      participants: [],
    };

    const result = chatRoomCreateSchema.safeParse(invalidInput);
    expect(result.success).toBe(false);
  });

  it('should reject invalid participant UUID', () => {
    const invalidInput = {
      participants: ['invalid-uuid'],
    };

    const result = chatRoomCreateSchema.safeParse(invalidInput);
    expect(result.success).toBe(false);
  });

  it('should reject invalid room type', () => {
    const invalidInput = {
      type: 'invalid_type',
      participants: ['550e8400-e29b-41d4-a716-446655440000'],
    };

    const result = chatRoomCreateSchema.safeParse(invalidInput);
    expect(result.success).toBe(false);
  });

  it('should reject invalid avatar URL', () => {
    const invalidInput = {
      participants: ['550e8400-e29b-41d4-a716-446655440000'],
      avatarUrl: 'not-a-valid-url',
    };

    const result = chatRoomCreateSchema.safeParse(invalidInput);
    expect(result.success).toBe(false);
  });

  it('should validate chat room update input', () => {
    const validUpdate = {
      name: 'Updated Room',
      isActive: false,
    };

    const result = chatRoomUpdateSchema.safeParse(validUpdate);
    expect(result.success).toBe(true);
  });
});

describe('Chat Message Schema Validation', () => {
  it('should validate a valid chat message create input', () => {
    const validInput = {
      roomId: '550e8400-e29b-41d4-a716-446655440000',
      content: 'Hello, this is a test message',
      type: 'text' as const,
      fileId: '550e8400-e29b-41d4-a716-446655440001',
      fileName: 'document.pdf',
      fileSize: 1024,
      fileType: 'application/pdf',
      metadata: { key: 'value' },
    };

    const result = chatMessageCreateSchema.safeParse(validInput);
    expect(result.success).toBe(true);
  });

  it('should validate chat message with minimal required fields', () => {
    const validInput = {
      roomId: '550e8400-e29b-41d4-a716-446655440000',
      content: 'Hello',
    };

    const result = chatMessageCreateSchema.safeParse(validInput);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.type).toBe('text'); // Default value
    }
  });

  it('should reject empty message content', () => {
    const invalidInput = {
      roomId: '550e8400-e29b-41d4-a716-446655440000',
      content: '',
    };

    const result = chatMessageCreateSchema.safeParse(invalidInput);
    expect(result.success).toBe(false);
  });

  it('should reject invalid room ID UUID', () => {
    const invalidInput = {
      roomId: 'invalid-uuid',
      content: 'Hello',
    };

    const result = chatMessageCreateSchema.safeParse(invalidInput);
    expect(result.success).toBe(false);
  });

  it('should reject invalid message type', () => {
    const invalidInput = {
      roomId: '550e8400-e29b-41d4-a716-446655440000',
      content: 'Hello',
      type: 'invalid_type',
    };

    const result = chatMessageCreateSchema.safeParse(invalidInput);
    expect(result.success).toBe(false);
  });

  it('should reject negative file size', () => {
    const invalidInput = {
      roomId: '550e8400-e29b-41d4-a716-446655440000',
      content: 'Hello',
      fileSize: -100,
    };

    const result = chatMessageCreateSchema.safeParse(invalidInput);
    expect(result.success).toBe(false);
  });

  it('should validate chat message update input', () => {
    const validUpdate = {
      content: 'Updated message',
      isRead: true,
      metadata: { updated: true },
    };

    const result = chatMessageUpdateSchema.safeParse(validUpdate);
    expect(result.success).toBe(true);
  });
});

describe('Chat Type Enums', () => {
  it('should validate all chat room types', () => {
    const validTypes = ['direct', 'group', 'channel'];
    validTypes.forEach((type) => {
      const result = chatRoomTypeSchema.safeParse(type);
      expect(result.success).toBe(true);
    });
  });

  it('should validate all chat message types', () => {
    const validTypes = ['text', 'file', 'image', 'system'];
    validTypes.forEach((type) => {
      const result = chatMessageTypeSchema.safeParse(type);
      expect(result.success).toBe(true);
    });
  });

  it('should reject invalid room type', () => {
    const result = chatRoomTypeSchema.safeParse('invalid');
    expect(result.success).toBe(false);
  });

  it('should reject invalid message type', () => {
    const result = chatMessageTypeSchema.safeParse('invalid');
    expect(result.success).toBe(false);
  });
});






