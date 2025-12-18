/**
 * Chat Module Seeder
 */

import { ModuleSeeder, SeederContext, SeederResult, generateDemoId, randomChoice } from './base-seeder';

export class ChatSeeder implements ModuleSeeder {
  moduleSlug = 'chat';
  moduleName = 'Chat';
  description = 'Sohbet ve mesajlaşma demo verileri';
  dependencies = ['hr'];

  async seed(ctx: SeederContext): Promise<SeederResult> {
    const { tenantPrisma, tenantId, companyId, tenantSlug, adminUserId } = ctx;
    let itemsCreated = 0;
    const details: Record<string, number> = {};

    try {
      // Get demo users for participants
      const demoUsers = await tenantPrisma.user.findMany({
        where: { email: { startsWith: 'demo.' } },
        take: 5,
      });

      const participants = [adminUserId];
      if (demoUsers.length > 0) {
        participants.push(...demoUsers.map((u) => u.id));
      }

      // Chat Rooms
      const roomsData = [
        { id: generateDemoId(tenantSlug, 'room', 'general'), name: 'Genel Sohbet', type: 'channel', description: 'Genel iletişim kanalı' },
        { id: generateDemoId(tenantSlug, 'room', 'project'), name: 'Proje Takımı', type: 'group', description: 'Proje ekibi iletişimi' },
        { id: generateDemoId(tenantSlug, 'room', 'support'), name: 'Destek Ekibi', type: 'group', description: 'Teknik destek kanalı' },
      ];

      const chatRooms: any[] = [];
      for (let idx = 0; idx < roomsData.length; idx++) {
        const r = roomsData[idx]!;
        const room = await tenantPrisma.chatRoom.upsert({
          where: { id: r.id },
          update: {},
          create: {
            id: r.id,
            tenantId,
            companyId,
            name: r.name,
            type: r.type,
            participants: idx === 0 ? participants : participants.slice(0, Math.max(2, idx + 2)),
            description: r.description,
            isActive: true,
          },
        });
        chatRooms.push(room);
        itemsCreated++;
      }
      details['chatRooms'] = chatRooms.length;

      // Chat Messages
      const messageContents = [
        '[DEMO] Merhaba ekip! 👋',
        '[DEMO] Bugünkü toplantıyı hatırlatırım.',
        '[DEMO] Rapor hazır, kontrol edebilir misiniz?',
        '[DEMO] Teşekkürler, harika iş çıkardınız! 🎉',
        '[DEMO] Projede güncelleme var, lütfen bakın.',
        '[DEMO] Müşteriden geri dönüş aldık.',
        '[DEMO] Deadline yaklaşıyor, hızlanmalıyız.',
        '[DEMO] Sistem bakımı tamamlandı ✅',
      ];

      let messagesCreated = 0;
      for (const room of chatRooms) {
        for (let i = 0; i < 5; i++) {
          const roomParticipants = room.participants as string[];
          await tenantPrisma.chatMessage.create({
            data: {
              tenantId,
              companyId,
              room: { connect: { id: room.id as string } },
              senderId: roomParticipants[i % roomParticipants.length]!,
              content: randomChoice(messageContents),
              type: 'text',
              isRead: i < 3,
              readAt: i < 3 ? new Date() : null,
            },
          });
          messagesCreated++;
          itemsCreated++;
        }
      }
      details['chatMessages'] = messagesCreated;

      return { success: true, itemsCreated, details };
    } catch (error: any) {
      return { success: false, itemsCreated, error: error.message, details };
    }
  }

  async unseed(ctx: SeederContext): Promise<SeederResult> {
    const { tenantPrisma } = ctx;
    let itemsDeleted = 0;

    try {
      // Delete messages first
      const messageResult = await tenantPrisma.chatMessage.deleteMany({
        where: { content: { startsWith: '[DEMO]' } },
      });
      itemsDeleted += messageResult.count;

      // Delete rooms
      const roomResult = await tenantPrisma.chatRoom.deleteMany({
        where: { id: { contains: '-demo-room-' } },
      });
      itemsDeleted += roomResult.count;

      return { success: true, itemsCreated: 0, itemsDeleted };
    } catch (error: any) {
      return { success: false, itemsCreated: 0, itemsDeleted, error: error.message };
    }
  }

  async checkStatus(ctx: SeederContext): Promise<{ hasData: boolean; count: number }> {
    const { tenantPrisma } = ctx;

    const roomCount = await tenantPrisma.chatRoom.count({
      where: { id: { contains: '-demo-room-' } },
    });

    const messageCount = await tenantPrisma.chatMessage.count({
      where: { content: { startsWith: '[DEMO]' } },
    });

    const count = roomCount + messageCount;
    return { hasData: count > 0, count };
  }
}
