/**
 * Chat Module - Types Tests (FAZ 3)
 * Unit tests for chat type definitions
 */

import { describe, it, expect } from 'vitest';
import type {
  ChatRoom,
  ChatMessage,
  ChatRoomType,
  ChatMessageType,
  ChatRoomCreateInput,
  ChatMessageCreateInput,
} from '../types/chat';

describe('Chat Type Definitions', () => {
  it('should have correct ChatRoomType values', () => {
    const validTypes: ChatRoomType[] = ['direct', 'group', 'channel'];
    validTypes.forEach((type) => {
      expect(['direct', 'group', 'channel']).toContain(type);
    });
  });

  it('should have correct ChatMessageType values', () => {
    const validTypes: ChatMessageType[] = ['text', 'file', 'image', 'system'];
    validTypes.forEach((type) => {
      expect(['text', 'file', 'image', 'system']).toContain(type);
    });
  });

  it('should match ChatRoom interface structure', () => {
    const room: ChatRoom = {
      id: '550e8400-e29b-41d4-a716-446655440000',
      tenantId: '550e8400-e29b-41d4-a716-446655440001',
      name: 'Test Room',
      type: 'direct',
      participants: ['550e8400-e29b-41d4-a716-446655440002'],
      description: 'Test description',
      avatarUrl: 'https://example.com/avatar.jpg',
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    expect(room.id).toBeDefined();
    expect(room.tenantId).toBeDefined();
    expect(room.type).toBe('direct');
    expect(Array.isArray(room.participants)).toBe(true);
  });

  it('should match ChatMessage interface structure', () => {
    const message: ChatMessage = {
      id: '550e8400-e29b-41d4-a716-446655440000',
      tenantId: '550e8400-e29b-41d4-a716-446655440001',
      roomId: '550e8400-e29b-41d4-a716-446655440002',
      senderId: '550e8400-e29b-41d4-a716-446655440003',
      content: 'Test message',
      type: 'text',
      fileId: null,
      fileName: null,
      fileSize: null,
      fileType: null,
      isRead: false,
      readAt: null,
      metadata: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    expect(message.id).toBeDefined();
    expect(message.roomId).toBeDefined();
    expect(message.senderId).toBeDefined();
    expect(message.content).toBe('Test message');
    expect(message.type).toBe('text');
  });

  it('should match ChatRoomCreateInput interface structure', () => {
    const createInput: ChatRoomCreateInput = {
      name: 'Test Room',
      type: 'group',
      participants: ['550e8400-e29b-41d4-a716-446655440000'],
      description: 'Test',
      avatarUrl: 'https://example.com/avatar.jpg',
    };

    expect(createInput.participants.length).toBeGreaterThan(0);
    expect(['direct', 'group', 'channel']).toContain(createInput.type);
  });

  it('should match ChatMessageCreateInput interface structure', () => {
    const createInput: ChatMessageCreateInput = {
      roomId: '550e8400-e29b-41d4-a716-446655440000',
      content: 'Test message',
      type: 'text',
      fileId: '550e8400-e29b-41d4-a716-446655440001',
      fileName: 'test.pdf',
      fileSize: 1024,
      fileType: 'application/pdf',
      metadata: { key: 'value' },
    };

    expect(createInput.roomId).toBeDefined();
    expect(createInput.content.length).toBeGreaterThan(0);
    expect(['text', 'file', 'image', 'system']).toContain(createInput.type);
  });
});







