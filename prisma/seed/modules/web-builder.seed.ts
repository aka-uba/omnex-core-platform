/**
 * Web Builder Module Seeder
 */

import { ModuleSeeder, SeederContext, SeederResult, generateDemoId, randomChoice } from './base-seeder';

export class WebBuilderSeeder implements ModuleSeeder {
  moduleSlug = 'web-builder';
  moduleName = 'Web Builder';
  description = 'Web sitesi oluşturucu demo verileri';

  async seed(ctx: SeederContext): Promise<SeederResult> {
    const { tenantPrisma, tenantId, companyId, tenantSlug } = ctx;
    let itemsCreated = 0;
    const details: Record<string, number> = {};

    try {
      // Theme
      const theme = await tenantPrisma.theme.upsert({
        where: { id: generateDemoId(tenantSlug, 'theme', 'default') },
        update: {},
        create: {
          id: generateDemoId(tenantSlug, 'theme', 'default'),
          tenantId,
          companyId,
          name: '[DEMO] Modern Business',
          description: 'Modern ve profesyonel iş teması',
          config: {
            colors: {
              primary: '#3B82F6',
              secondary: '#8B5CF6',
              accent: '#10B981',
              background: '#FFFFFF',
              text: '#1F2937',
            },
            typography: {
              headingFont: 'Inter',
              bodyFont: 'Inter',
              baseFontSize: 16,
            },
            spacing: {
              containerMaxWidth: 1200,
              sectionPadding: 80,
            },
          },
          isSystem: false,
        },
      });
      itemsCreated++;
      details['themes'] = 1;

      // Website
      const website = await tenantPrisma.website.upsert({
        where: { id: generateDemoId(tenantSlug, 'website', 'main') },
        update: {},
        create: {
          id: generateDemoId(tenantSlug, 'website', 'main'),
          tenantId,
          companyId,
          name: `[DEMO] ${tenantSlug} Kurumsal Web Sitesi`,
          domain: `demo.${tenantSlug}.com`,
          status: 'published',
          themeId: theme.id,
          settings: {
            seo: {
              title: `${tenantSlug} - Kurumsal Web Sitesi`,
              description: 'Demo kurumsal web sitesi',
              keywords: ['kurumsal', 'demo', 'iş'],
            },
          },
        },
      });
      itemsCreated++;
      details['websites'] = 1;

      // Pages
      const pagesData = [
        { title: 'Ana Sayfa', slug: 'demo-ana-sayfa', description: 'Web sitesinin ana sayfası', isHome: true, order: 0 },
        { title: 'Hakkımızda', slug: 'demo-hakkimizda', description: 'Şirket hakkında bilgiler', isHome: false, order: 1 },
        { title: 'Hizmetlerimiz', slug: 'demo-hizmetler', description: 'Sunduğumuz hizmetler', isHome: false, order: 2 },
        { title: 'İletişim', slug: 'demo-iletisim', description: 'İletişim bilgileri ve form', isHome: false, order: 3 },
      ];

      const pages: any[] = [];
      for (const p of pagesData) {
        const page = await tenantPrisma.page.upsert({
          where: {
            websiteId_slug: {
              websiteId: website.id,
              slug: p.slug,
            },
          },
          update: {},
          create: {
            tenantId,
            companyId,
            websiteId: website.id,
            title: `[DEMO] ${p.title}`,
            slug: p.slug,
            description: p.description,
            status: 'published',
            isHome: p.isHome,
            metaTitle: p.title,
            metaDescription: `Demo - ${p.description}`,
            order: p.order,
          },
        });
        pages.push(page);
        itemsCreated++;
      }
      details['pages'] = pages.length;

      // Page Sections
      for (const page of pages) {
        await tenantPrisma.pageSection.create({
          data: {
            tenantId,
            companyId,
            pageId: page.id,
            type: 'hero',
            order: 0,
            settings: {
              background: 'gradient',
              height: 'full',
            },
            content: {
              title: page.title,
              subtitle: page.description,
            },
          },
        });
        itemsCreated++;
      }
      details['pageSections'] = pages.length;

      // Form
      const contactForm = await tenantPrisma.form.create({
        data: {
          tenantId,
          companyId,
          websiteId: website.id,
          name: '[DEMO] İletişim Formu',
          fields: [
            { name: 'name', type: 'text', label: 'Adınız', required: true },
            { name: 'email', type: 'email', label: 'E-posta', required: true },
            { name: 'phone', type: 'tel', label: 'Telefon', required: false },
            { name: 'message', type: 'textarea', label: 'Mesajınız', required: true },
          ],
          settings: {
            successMessage: 'Mesajınız başarıyla gönderildi!',
            emailNotification: true,
          },
        },
      });
      itemsCreated++;
      details['forms'] = 1;

      // Form Submissions
      for (let i = 0; i < 5; i++) {
        await tenantPrisma.formSubmission.create({
          data: {
            tenantId,
            companyId,
            formId: contactForm.id,
            data: {
              name: `Demo Kullanıcı ${i + 1}`,
              email: `demo${i + 1}@example.com`,
              phone: `053${i} 123 4567`,
              message: '[DEMO] Bu bir demo form gönderisidir.',
            },
            status: randomChoice(['new', 'read']),
          },
        });
        itemsCreated++;
      }
      details['formSubmissions'] = 5;

      return { success: true, itemsCreated, details };
    } catch (error: any) {
      return { success: false, itemsCreated, error: error.message, details };
    }
  }

  async unseed(ctx: SeederContext): Promise<SeederResult> {
    const { tenantPrisma } = ctx;
    let itemsDeleted = 0;

    try {
      // Delete form submissions (through demo forms)
      const demoForms = await tenantPrisma.form.findMany({
        where: { name: { startsWith: '[DEMO]' } },
        select: { id: true },
      });
      if (demoForms.length > 0) {
        const submissionResult = await tenantPrisma.formSubmission.deleteMany({
          where: { formId: { in: demoForms.map((f) => f.id) } },
        });
        itemsDeleted += submissionResult.count;
      }

      // Delete forms
      const formResult = await tenantPrisma.form.deleteMany({
        where: { name: { startsWith: '[DEMO]' } },
      });
      itemsDeleted += formResult.count;

      // Delete page sections (through pages)
      const pages = await tenantPrisma.page.findMany({
        where: { slug: { startsWith: 'demo-' } },
        select: { id: true },
      });
      if (pages.length > 0) {
        const sectionResult = await tenantPrisma.pageSection.deleteMany({
          where: { pageId: { in: pages.map((p) => p.id) } },
        });
        itemsDeleted += sectionResult.count;
      }

      // Delete pages
      const pageResult = await tenantPrisma.page.deleteMany({
        where: { slug: { startsWith: 'demo-' } },
      });
      itemsDeleted += pageResult.count;

      // Delete websites
      const websiteResult = await tenantPrisma.website.deleteMany({
        where: { id: { contains: '-demo-website-' } },
      });
      itemsDeleted += websiteResult.count;

      // Delete themes
      const themeResult = await tenantPrisma.theme.deleteMany({
        where: { id: { contains: '-demo-theme-' } },
      });
      itemsDeleted += themeResult.count;

      return { success: true, itemsCreated: 0, itemsDeleted };
    } catch (error: any) {
      return { success: false, itemsCreated: 0, itemsDeleted, error: error.message };
    }
  }

  async checkStatus(ctx: SeederContext): Promise<{ hasData: boolean; count: number }> {
    const { tenantPrisma } = ctx;

    const websiteCount = await tenantPrisma.website.count({
      where: { id: { contains: '-demo-website-' } },
    });

    const pageCount = await tenantPrisma.page.count({
      where: { slug: { startsWith: 'demo-' } },
    });

    const count = websiteCount + pageCount;
    return { hasData: count > 0, count };
  }
}
