// Notification Service for Server-Side Usage (FAZ 2)

/**
 * Create a notification via API
 * This can be used in API routes and server-side code
 */
export async function createNotification(data: {
  title: string;
  message: string;
  type?: string;
  priority?: string;
  recipientId?: string;
  senderId?: string;
  module?: string;
  data?: Record<string, any>;
  actionUrl?: string;
  actionText?: string;
}): Promise<void> {
  try {
    const response = await fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/notifications`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        title: data.title,
        message: data.message,
        type: data.type || 'info',
        priority: data.priority || 'medium',
        recipientId: data.recipientId,
        senderId: data.senderId,
        module: data.module,
        data: data.data,
        actionUrl: data.actionUrl,
        actionText: data.actionText,
      }),
    });

    if (!response.ok) {
      throw new Error('Failed to create notification');
    }
  } catch (error) {
    console.error('Error creating notification:', error);
    // Don't throw - notifications are non-critical
  }
}







