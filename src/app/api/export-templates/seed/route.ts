import { NextRequest, NextResponse } from 'next/server';
import { ExportTemplateService } from '@/lib/export/ExportTemplateService';
import { getTenantPrismaFromRequest, getTenantFromRequest } from '@/lib/api/tenantContext';
import { getCompanyIdFromRequest } from '@/lib/api/companyContext';
import { logger } from '@/lib/utils/logger';
/**
 * POST /api/export-templates/seed
 * Create default export templates
 */
export async function POST(request: NextRequest) {
  try {
    const tenantPrisma = await getTenantPrismaFromRequest(request);
    const tenantContext = await getTenantFromRequest(request);
    
    if (!tenantPrisma || !tenantContext) {
      return NextResponse.json(
        { success: false, error: 'Tenant context not found' },
        { status: 400 }
      );
    }

    const companyId = await getCompanyIdFromRequest(request, tenantPrisma);
    if (!companyId) {
      return NextResponse.json(
        { success: false, message: 'Company ID is required' },
        { status: 400 }
      );
    }
    const service = new ExportTemplateService(tenantPrisma);
    const tenantId = tenantContext.id;

    // Check if templates already exist
    const existingTemplates = await service.getTemplates(tenantId, companyId);
    if (existingTemplates.length > 0) {
      return NextResponse.json({
        success: false,
        message: 'Templates already exist. Delete existing templates first.',
        data: { count: existingTemplates.length },
      });
    }

    const templates = [];

    // ============================================
    // MODERN PROFESSIONAL TEMPLATES
    // ============================================

    // 1. Modern Blue Professional
    templates.push(await service.createTemplate(tenantId, {
      name: 'Modern Blue Professional',
      type: 'full',
      category: 'export',
      description: 'Modern ve profesyonel mavi tema ile kurumsal görünüm',
      companyId,
      templateData: {
        title: '{{companyName}}',
        subtitle: 'Professional Report',
        layout: {
          header: { alignment: 'center', logoPosition: 'top' },
          footer: { alignment: 'center', showDate: true },
        },
        styles: {
          colors: {
            primary: '#4472C4',
            secondary: '#70AD47',
            text: '#212529',
            background: '#FFFFFF',
          },
          fonts: {
            header: { family: 'Arial', size: 18, weight: 'bold' },
            body: { family: 'Arial', size: 10 },
          },
        },
        design: {
          header: {
            logo: { position: 'center', size: 'medium' },
            title: { style: 'bold', size: 'large' },
            subtitle: { style: 'normal', size: 'medium' },
          },
          footer: {
            showCompanyInfo: true,
            showGeneratedDate: true,
          },
        },
      },
      isDefault: true,
    }));

    // 2. Classic Corporate
    templates.push(await service.createTemplate(tenantId, {
      name: 'Classic Corporate',
      type: 'full',
      category: 'export',
      description: 'Klasik kurumsal tasarım, geleneksel ve güvenilir görünüm',
      companyId,
      templateData: {
        title: '{{companyName}}',
        subtitle: 'Corporate Report',
        layout: {
          header: { alignment: 'left', logoPosition: 'left' },
          footer: { alignment: 'left', showDate: true },
        },
        styles: {
          colors: {
            primary: '#2C3E50',
            secondary: '#34495E',
            text: '#212529',
            background: '#FFFFFF',
          },
          fonts: {
            header: { family: 'Times New Roman', size: 16, weight: 'bold' },
            body: { family: 'Times New Roman', size: 11 },
          },
        },
        design: {
          header: {
            logo: { position: 'left', size: 'small' },
            title: { style: 'bold', size: 'medium' },
            subtitle: { style: 'italic', size: 'small' },
          },
        },
      },
    }));

    // 3. Minimal Clean
    templates.push(await service.createTemplate(tenantId, {
      name: 'Minimal Clean',
      type: 'full',
      category: 'export',
      description: 'Minimalist ve temiz tasarım, sade görünüm',
      companyId,
      templateData: {
        title: '{{companyName}}',
        layout: {
          header: { alignment: 'center', logoPosition: 'top' },
          footer: { alignment: 'center', showDate: false },
        },
        styles: {
          colors: {
            primary: '#000000',
            secondary: '#666666',
            text: '#333333',
            background: '#FFFFFF',
          },
          fonts: {
            header: { family: 'Helvetica', size: 16, weight: 'normal' },
            body: { family: 'Helvetica', size: 10 },
          },
        },
        design: {
          header: {
            logo: { position: 'center', size: 'small' },
            title: { style: 'normal', size: 'medium' },
          },
        },
      },
    }));

    // 4. Elegant Gold
    templates.push(await service.createTemplate(tenantId, {
      name: 'Elegant Gold',
      type: 'full',
      category: 'export',
      description: 'Zarif altın tonları ile lüks görünüm',
      companyId,
      templateData: {
        title: '{{companyName}}',
        subtitle: 'Executive Report',
        layout: {
          header: { alignment: 'center', logoPosition: 'top' },
          footer: { alignment: 'center', showDate: true },
        },
        styles: {
          colors: {
            primary: '#D4AF37',
            secondary: '#B8860B',
            text: '#212529',
            background: '#FFFFFF',
          },
          fonts: {
            header: { family: 'Georgia', size: 18, weight: 'bold' },
            body: { family: 'Georgia', size: 11 },
          },
        },
        design: {
          header: {
            logo: { position: 'center', size: 'medium' },
            title: { style: 'bold', size: 'large' },
            subtitle: { style: 'italic', size: 'medium' },
          },
        },
      },
    }));

    // 5. Tech Modern
    templates.push(await service.createTemplate(tenantId, {
      name: 'Tech Modern',
      type: 'full',
      category: 'export',
      description: 'Teknoloji odaklı modern tasarım, dinamik görünüm',
      companyId,
      templateData: {
        title: '{{companyName}}',
        subtitle: 'Technology Report',
        layout: {
          header: { alignment: 'center', logoPosition: 'top' },
          footer: { alignment: 'center', showDate: true },
        },
        styles: {
          colors: {
            primary: '#00BCD4',
            secondary: '#0097A7',
            text: '#212529',
            background: '#FFFFFF',
          },
          fonts: {
            header: { family: 'Roboto', size: 18, weight: 'bold' },
            body: { family: 'Roboto', size: 10 },
          },
        },
        design: {
          header: {
            logo: { position: 'center', size: 'medium' },
            title: { style: 'bold', size: 'large' },
            subtitle: { style: 'normal', size: 'small' },
          },
        },
      },
    }));

    // 6. Green Eco
    templates.push(await service.createTemplate(tenantId, {
      name: 'Green Eco',
      type: 'full',
      category: 'export',
      description: 'Çevre dostu yeşil tema, doğal görünüm',
      companyId,
      templateData: {
        title: '{{companyName}}',
        subtitle: 'Sustainability Report',
        layout: {
          header: { alignment: 'center', logoPosition: 'top' },
          footer: { alignment: 'center', showDate: true },
        },
        styles: {
          colors: {
            primary: '#4CAF50',
            secondary: '#388E3C',
            text: '#212529',
            background: '#FFFFFF',
          },
          fonts: {
            header: { family: 'Arial', size: 18, weight: 'bold' },
            body: { family: 'Arial', size: 10 },
          },
        },
        design: {
          header: {
            logo: { position: 'center', size: 'medium' },
            title: { style: 'bold', size: 'large' },
            subtitle: { style: 'normal', size: 'small' },
          },
        },
      },
    }));

    // 7. Red Energy
    templates.push(await service.createTemplate(tenantId, {
      name: 'Red Energy',
      type: 'full',
      category: 'export',
      description: 'Enerjik kırmızı tema, dinamik ve güçlü görünüm',
      companyId,
      templateData: {
        title: '{{companyName}}',
        subtitle: 'Performance Report',
        layout: {
          header: { alignment: 'center', logoPosition: 'top' },
          footer: { alignment: 'center', showDate: true },
        },
        styles: {
          colors: {
            primary: '#E53935',
            secondary: '#C62828',
            text: '#212529',
            background: '#FFFFFF',
          },
          fonts: {
            header: { family: 'Arial', size: 18, weight: 'bold' },
            body: { family: 'Arial', size: 10 },
          },
        },
        design: {
          header: {
            logo: { position: 'center', size: 'medium' },
            title: { style: 'bold', size: 'large' },
            subtitle: { style: 'normal', size: 'small' },
          },
        },
      },
    }));

    // 8. Purple Creative
    templates.push(await service.createTemplate(tenantId, {
      name: 'Purple Creative',
      type: 'full',
      category: 'export',
      description: 'Yaratıcı mor tema, yenilikçi görünüm',
      companyId,
      templateData: {
        title: '{{companyName}}',
        subtitle: 'Creative Report',
        layout: {
          header: { alignment: 'center', logoPosition: 'top' },
          footer: { alignment: 'center', showDate: true },
        },
        styles: {
          colors: {
            primary: '#9C27B0',
            secondary: '#7B1FA2',
            text: '#212529',
            background: '#FFFFFF',
          },
          fonts: {
            header: { family: 'Arial', size: 18, weight: 'bold' },
            body: { family: 'Arial', size: 10 },
          },
        },
        design: {
          header: {
            logo: { position: 'center', size: 'medium' },
            title: { style: 'bold', size: 'large' },
            subtitle: { style: 'normal', size: 'small' },
          },
        },
      },
    }));

    // 9. Orange Vibrant
    templates.push(await service.createTemplate(tenantId, {
      name: 'Orange Vibrant',
      type: 'full',
      category: 'export',
      description: 'Canlı turuncu tema, enerjik ve dinamik görünüm',
      companyId,
      templateData: {
        title: '{{companyName}}',
        subtitle: 'Vibrant Report',
        layout: {
          header: { alignment: 'center', logoPosition: 'top' },
          footer: { alignment: 'center', showDate: true },
        },
        styles: {
          colors: {
            primary: '#FF9800',
            secondary: '#F57C00',
            text: '#212529',
            background: '#FFFFFF',
          },
          fonts: {
            header: { family: 'Arial', size: 18, weight: 'bold' },
            body: { family: 'Arial', size: 10 },
          },
        },
        design: {
          header: {
            logo: { position: 'center', size: 'medium' },
            title: { style: 'bold', size: 'large' },
            subtitle: { style: 'normal', size: 'small' },
          },
        },
      },
    }));

    // 10. Gray Professional
    templates.push(await service.createTemplate(tenantId, {
      name: 'Gray Professional',
      type: 'full',
      category: 'export',
      description: 'Profesyonel gri tema, nötr ve dengeli görünüm',
      companyId,
      templateData: {
        title: '{{companyName}}',
        subtitle: 'Professional Report',
        layout: {
          header: { alignment: 'center', logoPosition: 'top' },
          footer: { alignment: 'center', showDate: true },
        },
        styles: {
          colors: {
            primary: '#607D8B',
            secondary: '#455A64',
            text: '#212529',
            background: '#FFFFFF',
          },
          fonts: {
            header: { family: 'Arial', size: 18, weight: 'bold' },
            body: { family: 'Arial', size: 10 },
          },
        },
        design: {
          header: {
            logo: { position: 'center', size: 'medium' },
            title: { style: 'bold', size: 'large' },
            subtitle: { style: 'normal', size: 'small' },
          },
        },
      },
    }));

    // ============================================
    // HEADER ONLY TEMPLATES
    // ============================================

    // 11. Header - Modern Blue
    templates.push(await service.createTemplate(tenantId, {
      name: 'Header - Modern Blue',
      type: 'header',
      category: 'export',
      description: 'Modern mavi tema başlık şablonu',
      companyId,
      templateData: {
        title: '{{companyName}}',
        subtitle: 'Report Header',
        layout: {
          header: { alignment: 'center', logoPosition: 'top' },
        },
        styles: {
          colors: {
            primary: '#4472C4',
            text: '#212529',
          },
          fonts: {
            header: { family: 'Arial', size: 18, weight: 'bold' },
          },
        },
        design: {
          header: {
            logo: { position: 'center', size: 'medium' },
            title: { style: 'bold', size: 'large' },
          },
        },
      },
    }));

    // 12. Header - Classic
    templates.push(await service.createTemplate(tenantId, {
      name: 'Header - Classic',
      type: 'header',
      category: 'export',
      description: 'Klasik başlık şablonu',
      companyId,
      templateData: {
        title: '{{companyName}}',
        layout: {
          header: { alignment: 'left', logoPosition: 'left' },
        },
        styles: {
          colors: {
            primary: '#2C3E50',
            text: '#212529',
          },
          fonts: {
            header: { family: 'Times New Roman', size: 16, weight: 'bold' },
          },
        },
        design: {
          header: {
            logo: { position: 'left', size: 'small' },
            title: { style: 'bold', size: 'medium' },
          },
        },
      },
    }));

    // ============================================
    // FOOTER ONLY TEMPLATES
    // ============================================

    // 13. Footer - Modern
    templates.push(await service.createTemplate(tenantId, {
      name: 'Footer - Modern',
      type: 'footer',
      category: 'export',
      description: 'Modern alt bilgi şablonu',
      companyId,
      templateData: {
        layout: {
          footer: { alignment: 'center', showDate: true },
        },
        styles: {
          colors: {
            primary: '#4472C4',
            text: '#666666',
          },
          fonts: {
            footer: { family: 'Arial', size: 9 },
          },
        },
        design: {
          footer: {
            showCompanyInfo: true,
            showGeneratedDate: true,
          },
        },
      },
    }));

    // 14. Footer - Classic
    templates.push(await service.createTemplate(tenantId, {
      name: 'Footer - Classic',
      type: 'footer',
      category: 'export',
      description: 'Klasik alt bilgi şablonu',
      companyId,
      templateData: {
        layout: {
          footer: { alignment: 'left', showDate: true },
        },
        styles: {
          colors: {
            primary: '#2C3E50',
            text: '#666666',
          },
          fonts: {
            footer: { family: 'Times New Roman', size: 9 },
          },
        },
        design: {
          footer: {
            showCompanyInfo: true,
            showGeneratedDate: true,
          },
        },
      },
    }));

    // ============================================
    // SPECIALIZED TEMPLATES
    // ============================================

    // 15. Financial Report
    templates.push(await service.createTemplate(tenantId, {
      name: 'Financial Report',
      type: 'full',
      category: 'export',
      description: 'Finansal raporlar için özel tasarım',
      companyId,
      templateData: {
        title: '{{companyName}}',
        subtitle: 'Financial Report',
        layout: {
          header: { alignment: 'center', logoPosition: 'top' },
          footer: { alignment: 'center', showDate: true },
        },
        styles: {
          colors: {
            primary: '#2C3E50',
            secondary: '#34495E',
            text: '#212529',
            background: '#FFFFFF',
          },
          fonts: {
            header: { family: 'Arial', size: 18, weight: 'bold' },
            body: { family: 'Arial', size: 10 },
          },
        },
        design: {
          header: {
            logo: { position: 'center', size: 'medium' },
            title: { style: 'bold', size: 'large' },
            subtitle: { style: 'normal', size: 'small' },
          },
          footer: {
            showCompanyInfo: true,
            showGeneratedDate: true,
            showPageNumbers: true,
          },
        },
      },
    }));

    // 16. Sales Report
    templates.push(await service.createTemplate(tenantId, {
      name: 'Sales Report',
      type: 'full',
      category: 'export',
      description: 'Satış raporları için dinamik tasarım',
      companyId,
      templateData: {
        title: '{{companyName}}',
        subtitle: 'Sales Report',
        layout: {
          header: { alignment: 'center', logoPosition: 'top' },
          footer: { alignment: 'center', showDate: true },
        },
        styles: {
          colors: {
            primary: '#E53935',
            secondary: '#C62828',
            text: '#212529',
            background: '#FFFFFF',
          },
          fonts: {
            header: { family: 'Arial', size: 18, weight: 'bold' },
            body: { family: 'Arial', size: 10 },
          },
        },
        design: {
          header: {
            logo: { position: 'center', size: 'medium' },
            title: { style: 'bold', size: 'large' },
            subtitle: { style: 'normal', size: 'small' },
          },
        },
      },
    }));

    // 17. HR Report
    templates.push(await service.createTemplate(tenantId, {
      name: 'HR Report',
      type: 'full',
      category: 'export',
      description: 'İnsan kaynakları raporları için profesyonel tasarım',
      companyId,
      templateData: {
        title: '{{companyName}}',
        subtitle: 'Human Resources Report',
        layout: {
          header: { alignment: 'center', logoPosition: 'top' },
          footer: { alignment: 'center', showDate: true },
        },
        styles: {
          colors: {
            primary: '#4CAF50',
            secondary: '#388E3C',
            text: '#212529',
            background: '#FFFFFF',
          },
          fonts: {
            header: { family: 'Arial', size: 18, weight: 'bold' },
            body: { family: 'Arial', size: 10 },
          },
        },
        design: {
          header: {
            logo: { position: 'center', size: 'medium' },
            title: { style: 'bold', size: 'large' },
            subtitle: { style: 'normal', size: 'small' },
          },
        },
      },
    }));

    // 18. Inventory Report
    templates.push(await service.createTemplate(tenantId, {
      name: 'Inventory Report',
      type: 'full',
      category: 'export',
      description: 'Envanter raporları için düzenli tasarım',
      companyId,
      templateData: {
        title: '{{companyName}}',
        subtitle: 'Inventory Report',
        layout: {
          header: { alignment: 'center', logoPosition: 'top' },
          footer: { alignment: 'center', showDate: true },
        },
        styles: {
          colors: {
            primary: '#FF9800',
            secondary: '#F57C00',
            text: '#212529',
            background: '#FFFFFF',
          },
          fonts: {
            header: { family: 'Arial', size: 18, weight: 'bold' },
            body: { family: 'Arial', size: 10 },
          },
        },
        design: {
          header: {
            logo: { position: 'center', size: 'medium' },
            title: { style: 'bold', size: 'large' },
            subtitle: { style: 'normal', size: 'small' },
          },
        },
      },
    }));

    // 19. Executive Summary
    templates.push(await service.createTemplate(tenantId, {
      name: 'Executive Summary',
      type: 'full',
      category: 'export',
      description: 'Yönetici özeti için lüks tasarım',
      companyId,
      templateData: {
        title: '{{companyName}}',
        subtitle: 'Executive Summary',
        layout: {
          header: { alignment: 'center', logoPosition: 'top' },
          footer: { alignment: 'center', showDate: true },
        },
        styles: {
          colors: {
            primary: '#D4AF37',
            secondary: '#B8860B',
            text: '#212529',
            background: '#FFFFFF',
          },
          fonts: {
            header: { family: 'Georgia', size: 20, weight: 'bold' },
            body: { family: 'Georgia', size: 11 },
          },
        },
        design: {
          header: {
            logo: { position: 'center', size: 'large' },
            title: { style: 'bold', size: 'xlarge' },
            subtitle: { style: 'italic', size: 'medium' },
          },
        },
      },
    }));

    // 20. Annual Report
    templates.push(await service.createTemplate(tenantId, {
      name: 'Annual Report',
      type: 'full',
      category: 'export',
      description: 'Yıllık raporlar için kapsamlı tasarım',
      companyId,
      templateData: {
        title: '{{companyName}}',
        subtitle: 'Annual Report {{year}}',
        layout: {
          header: { alignment: 'center', logoPosition: 'top' },
          footer: { alignment: 'center', showDate: true },
        },
        styles: {
          colors: {
            primary: '#2C3E50',
            secondary: '#34495E',
            text: '#212529',
            background: '#FFFFFF',
          },
          fonts: {
            header: { family: 'Arial', size: 20, weight: 'bold' },
            body: { family: 'Arial', size: 11 },
          },
        },
        design: {
          header: {
            logo: { position: 'center', size: 'large' },
            title: { style: 'bold', size: 'xlarge' },
            subtitle: { style: 'normal', size: 'large' },
          },
          footer: {
            showCompanyInfo: true,
            showGeneratedDate: true,
            showPageNumbers: true,
          },
        },
      },
    }));

    logger.info('Default export templates created', { count: templates.length }, 'api-export-templates-seed');

    return NextResponse.json({
      success: true,
      message: `${templates.length} templates created successfully`,
      data: { templates: templates.map(t => ({ id: t.id, name: t.name, type: t.type })) },
    });
  } catch (error: any) {
    logger.error('Failed to seed export templates', error, 'api-export-templates-seed');
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to seed export templates',
      },
      { status: 500 }
    );
  }
}

