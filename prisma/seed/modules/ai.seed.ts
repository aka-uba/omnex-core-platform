/**
 * AI Module Seeder
 */

import { ModuleSeeder, SeederContext, SeederResult, randomChoice } from './base-seeder';

export class AISeeder implements ModuleSeeder {
  moduleSlug = 'ai';
  moduleName = 'AI';
  description = 'Yapay zeka modülü demo verileri';

  async seed(ctx: SeederContext): Promise<SeederResult> {
    const { tenantPrisma, tenantId, companyId, adminUserId } = ctx;
    let itemsCreated = 0;

    try {
      const aiGenerationTypes = ['text', 'code', 'image'];
      const aiPrompts = [
        '[DEMO] Blog yazısı için SEO uyumlu başlık öner',
        '[DEMO] Müşteri hizmetleri için otomatik yanıt oluştur',
        '[DEMO] React component kodu yaz',
        '[DEMO] Ürün tanıtım metni hazırla',
        '[DEMO] Sosyal medya paylaşımı için metin oluştur',
      ];

      for (const prompt of aiPrompts) {
        await tenantPrisma.aIGeneration.create({
          data: {
            tenantId,
            userId: adminUserId,
            companyId,
            generatorType: randomChoice(aiGenerationTypes),
            prompt,
            output: `Demo AI çıktısı: ${prompt.replace('[DEMO] ', '')} için üretilen içerik.`,
            settings: JSON.stringify({
              model: 'gpt-4',
              temperature: 0.7,
              maxTokens: 1000,
            }),
          },
        });
        itemsCreated++;
      }

      return { success: true, itemsCreated };
    } catch (error: any) {
      return { success: false, itemsCreated, error: error.message };
    }
  }

  async unseed(ctx: SeederContext): Promise<SeederResult> {
    const { tenantPrisma } = ctx;

    try {
      const result = await tenantPrisma.aIGeneration.deleteMany({
        where: { prompt: { startsWith: '[DEMO]' } },
      });

      return { success: true, itemsCreated: 0, itemsDeleted: result.count };
    } catch (error: any) {
      return { success: false, itemsCreated: 0, itemsDeleted: 0, error: error.message };
    }
  }

  async checkStatus(ctx: SeederContext): Promise<{ hasData: boolean; count: number }> {
    const { tenantPrisma } = ctx;

    const count = await tenantPrisma.aIGeneration.count({
      where: { prompt: { startsWith: '[DEMO]' } },
    });

    return { hasData: count > 0, count };
  }
}
