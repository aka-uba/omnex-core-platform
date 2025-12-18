// Chat Notification Service (FAZ 3)
// Handles notifications for chat messages

import { createNotification } from '@/lib/notifications/notificationService';

export interface ChatNotificationData {
  roomId: string;
  roomName?: string | null;
  senderId: string;
  senderName?: string;
  messageContent: string;
  messageType: 'text' | 'file' | 'image' | 'system';
  participants: string[];
}

/**
 * Send notifications to chat room participants when a new message is created
 * Excludes the sender from notifications
 */
export async function sendChatMessageNotifications(
  data: ChatNotificationData
): Promise<void> {
  try {
    const { roomId, roomName, senderId, senderName, messageContent, messageType, participants } = data;

    // Filter out the sender from participants
    const recipients = participants.filter((participantId) => participantId !== senderId);

    if (recipients.length === 0) {
      return; // No recipients to notify
    }

    // Prepare notification content
    const notificationTitle = roomName || 'Yeni Mesaj';
    const notificationMessage = messageType === 'file' 
      ? `${senderName || 'Birisi'} bir dosya paylaştı`
      : messageType === 'image'
      ? `${senderName || 'Birisi'} bir görsel paylaştı`
      : messageContent.length > 100
      ? `${senderName || 'Birisi'}: ${messageContent.substring(0, 100)}...`
      : `${senderName || 'Birisi'}: ${messageContent}`;

    // Send notification to each recipient
    const notificationPromises = recipients.map((recipientId) =>
      createNotification({
        title: notificationTitle,
        message: notificationMessage,
        type: 'info',
        priority: 'medium',
        recipientId,
        senderId,
        module: 'chat',
        data: {
          roomId,
          roomName,
          messageType,
          actionUrl: `/modules/chat?roomId=${roomId}`,
          actionText: 'Mesajı Görüntüle',
        },
      })
    );

    // Send all notifications in parallel (non-blocking)
    await Promise.allSettled(notificationPromises);
  } catch (error) {
    // Log error but don't throw - notifications are non-critical
    console.error('Error sending chat notifications:', error);
  }
}







