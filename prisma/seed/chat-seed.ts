import { Prisma } from '@prisma/tenant-client';
import type { TenantPrismaClient } from '@/lib/api/tenantContext';

/**
 * Chat Module Demo Seeder
 * Creates demo chat rooms, messages, and file attachments
 */
export async function seedChatData(
  tenantPrisma: TenantPrismaClient,
  tenantId: string,
  companyId: string,
  userIds: string[]
) {
  console.log('💬 Creating Chat Data...');
  
  try {
    if (userIds.length < 2) {
      console.log('⚠️ Skipping chat data - need at least 2 users');
      return;
    }

    // Create Chat Rooms
    const rooms = await Promise.all([
      // Direct message room
      tenantPrisma.chatRoom.create({
        data: {
          tenantId,
          name: null,
          type: 'direct',
          participants: [userIds[0], userIds[1]],
          description: null,
          avatarUrl: null,
          isActive: true,
        },
      }),
      // Group chat
      tenantPrisma.chatRoom.create({
        data: {
          tenantId,
          name: 'Marketing Team',
          type: 'group',
          participants: userIds.slice(0, 3),
          description: 'Marketing team discussion',
          avatarUrl: null,
          isActive: true,
        },
      }),
      // Channel
      tenantPrisma.chatRoom.create({
        data: {
          tenantId,
          name: 'General',
          type: 'channel',
          participants: userIds,
          description: 'General discussion channel',
          avatarUrl: null,
          isActive: true,
        },
      }),
      // Another direct message
      tenantPrisma.chatRoom.create({
        data: {
          tenantId,
          name: null,
          type: 'direct',
          participants: [userIds[0], userIds[2]],
          description: null,
          avatarUrl: null,
          isActive: true,
        },
      }),
    ]);

    // Helper function to create messages
    const createMessage = async (
      roomId: string,
      senderId: string,
      content: string,
      type: 'text' | 'file' | 'image' = 'text',
      fileId?: string,
      fileName?: string,
      fileSize?: number,
      fileType?: string
    ) => {
      return tenantPrisma.chatMessage.create({
        data: {
          tenantId,
          roomId,
          senderId,
          content,
          type,
          fileId: fileId || null,
          fileName: fileName || null,
          fileSize: fileSize || null,
          fileType: fileType || null,
          isRead: Math.random() > 0.3, // 70% read
          readAt: Math.random() > 0.3 ? new Date() : null,
          metadata: null,
        },
      });
    };

    // Create messages for each room
    const messages: any[] = [];

    // Room 1: Direct message conversation
    messages.push(
      await createMessage(
        rooms[0].id,
        userIds[0],
        'Hey, have you had a chance to look at the latest designs I sent over? I\'m eager to get your feedback.',
        'text'
      )
    );
    messages.push(
      await createMessage(
        rooms[0].id,
        userIds[1],
        'Hi! Yes, just finished reviewing them. They look fantastic! I have a couple of minor suggestions.',
        'text'
      )
    );
    messages.push(
      await createMessage(
        rooms[0].id,
        userIds[0],
        'Sounds good, I\'ll review the latest mockups and get back to you with my thoughts by EOD.',
        'text'
      )
    );

    // Room 2: Group chat messages
    messages.push(
      await createMessage(
        rooms[1].id,
        userIds[0],
        'Can you send over the final assets?',
        'text'
      )
    );
    messages.push(
      await createMessage(
        rooms[1].id,
        userIds[1],
        'Sure, I\'ll prepare them and send by tomorrow.',
        'text'
      )
    );
    messages.push(
      await createMessage(
        rooms[1].id,
        userIds[2],
        'Great, thanks for the update!',
        'text'
      )
    );

    // Room 3: Channel messages
    messages.push(
      await createMessage(
        rooms[2].id,
        userIds[0],
        'Welcome everyone to the General channel!',
        'text'
      )
    );
    messages.push(
      await createMessage(
        rooms[2].id,
        userIds[1],
        'Thanks! Looking forward to working with everyone.',
        'text'
      )
    );
    messages.push(
      await createMessage(
        rooms[2].id,
        userIds[2],
        'Let\'s sync up tomorrow morning for the project kickoff.',
        'text'
      )
    );

    // Room 4: Another direct conversation
    messages.push(
      await createMessage(
        rooms[3].id,
        userIds[0],
        'Hi, how are you doing?',
        'text'
      )
    );
    messages.push(
      await createMessage(
        rooms[3].id,
        userIds[2],
        'I\'m doing great, thanks for asking! How about you?',
        'text'
      )
    );

    // Add some file messages (these will reference CoreFile records if they exist)
    // Note: In a real scenario, you'd upload files first and get their IDs
    // For demo purposes, we'll create text messages that mention files
    messages.push(
      await createMessage(
        rooms[0].id,
        userIds[0],
        'I\'ve attached the design mockup. Let me know what you think!',
        'file',
        undefined, // fileId would be set after actual file upload
        'design_mockup_v3.png',
        1258291, // 1.2 MB
        'image/png'
      )
    );

    messages.push(
      await createMessage(
        rooms[1].id,
        userIds[1],
        'Here\'s the project brief document.',
        'file',
        undefined,
        'project_brief.pdf',
        460800, // 450 KB
        'application/pdf'
      )
    );

    console.log(`✅ Created ${rooms.length} chat rooms and ${messages.length} messages`);
    return { rooms, messages };
  } catch (error: any) {
    console.error('❌ Error creating chat data:', error);
    throw error;
  }
}



















