/**
 * Chat Module - Notification Service Tests (FAZ 3)
 * Unit tests for chat notification service
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { sendChatMessageNotifications } from '../services/chatNotificationService';
import { createNotification } from '@/lib/notifications/notificationService';

// Mock the notification service
vi.mock('@/lib/notifications/notificationService', () => ({
  createNotification: vi.fn(),
}));

describe('Chat Notification Service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should send notifications to all participants except sender', async () => {
    const mockCreateNotification = vi.mocked(createNotification);

    await sendChatMessageNotifications({
      roomId: 'room-1',
      roomName: 'Test Room',
      senderId: 'sender-1',
      senderName: 'John Doe',
      messageContent: 'Hello, this is a test message',
      messageType: 'text',
      participants: ['sender-1', 'recipient-1', 'recipient-2'],
    });

    // Should call createNotification twice (for recipient-1 and recipient-2)
    expect(mockCreateNotification).toHaveBeenCalledTimes(2);
    
    // Check first notification
    expect(mockCreateNotification).toHaveBeenCalledWith(
      expect.objectContaining({
        title: 'Test Room',
        recipientId: 'recipient-1',
        senderId: 'sender-1',
        module: 'chat',
      })
    );
  });

  it('should not send notifications if no recipients', async () => {
    const mockCreateNotification = vi.mocked(createNotification);

    await sendChatMessageNotifications({
      roomId: 'room-1',
      senderId: 'sender-1',
      messageContent: 'Hello',
      messageType: 'text',
      participants: ['sender-1'], // Only sender, no recipients
    });

    expect(mockCreateNotification).not.toHaveBeenCalled();
  });

  it('should handle file type messages correctly', async () => {
    const mockCreateNotification = vi.mocked(createNotification);

    await sendChatMessageNotifications({
      roomId: 'room-1',
      senderId: 'sender-1',
      senderName: 'John Doe',
      messageContent: 'document.pdf',
      messageType: 'file',
      participants: ['sender-1', 'recipient-1'],
    });

    expect(mockCreateNotification).toHaveBeenCalledWith(
      expect.objectContaining({
        message: 'John Doe bir dosya paylaştı',
      })
    );
  });

  it('should handle image type messages correctly', async () => {
    const mockCreateNotification = vi.mocked(createNotification);

    await sendChatMessageNotifications({
      roomId: 'room-1',
      senderId: 'sender-1',
      senderName: 'John Doe',
      messageContent: 'image.jpg',
      messageType: 'image',
      participants: ['sender-1', 'recipient-1'],
    });

    expect(mockCreateNotification).toHaveBeenCalledWith(
      expect.objectContaining({
        message: 'John Doe bir görsel paylaştı',
      })
    );
  });

  it('should truncate long messages', async () => {
    const mockCreateNotification = vi.mocked(createNotification);
    const longMessage = 'A'.repeat(150);

    await sendChatMessageNotifications({
      roomId: 'room-1',
      senderId: 'sender-1',
      senderName: 'John Doe',
      messageContent: longMessage,
      messageType: 'text',
      participants: ['sender-1', 'recipient-1'],
    });

    expect(mockCreateNotification).toHaveBeenCalledWith(
      expect.objectContaining({
        message: expect.stringContaining('...'),
      })
    );
  });

  it('should use default room name if not provided', async () => {
    const mockCreateNotification = vi.mocked(createNotification);

    await sendChatMessageNotifications({
      roomId: 'room-1',
      senderId: 'sender-1',
      messageContent: 'Hello',
      messageType: 'text',
      participants: ['sender-1', 'recipient-1'],
    });

    expect(mockCreateNotification).toHaveBeenCalledWith(
      expect.objectContaining({
        title: 'Yeni Mesaj',
      })
    );
  });

  it('should include action URL in notification data', async () => {
    const mockCreateNotification = vi.mocked(createNotification);

    await sendChatMessageNotifications({
      roomId: 'room-123',
      senderId: 'sender-1',
      messageContent: 'Hello',
      messageType: 'text',
      participants: ['sender-1', 'recipient-1'],
    });

    expect(mockCreateNotification).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          roomId: 'room-123',
          actionUrl: '/modules/chat?roomId=room-123',
          actionText: 'Mesajı Görüntüle',
        }),
      })
    );
  });

  it('should handle errors gracefully', async () => {
    const mockCreateNotification = vi.mocked(createNotification);
    mockCreateNotification.mockRejectedValue(new Error('Notification error'));

    // Should not throw
    await expect(
      sendChatMessageNotifications({
        roomId: 'room-1',
        senderId: 'sender-1',
        messageContent: 'Hello',
        messageType: 'text',
        participants: ['sender-1', 'recipient-1'],
      })
    ).resolves.not.toThrow();
  });
});






