// Export Template Service
// FAZ 0.3: Merkezi Export Sistemi

import { PrismaClient as TenantPrismaClient } from '@prisma/tenant-client';
import { ExportTemplate, ExportTemplateData } from './types';

export class ExportTemplateService {
  private tenantPrisma: TenantPrismaClient;

  constructor(tenantPrisma: TenantPrismaClient) {
    this.tenantPrisma = tenantPrisma;
  }

  /**
   * Get template by ID
   */
  async getTemplate(templateId: string): Promise<ExportTemplate | null> {
    const template = await this.tenantPrisma.exportTemplate.findUnique({
      where: { id: templateId },
    });

    return template as ExportTemplate | null;
  }

  /**
   * Get default template for company
   */
  async getDefaultTemplate(
    tenantId: string,
    companyId?: string,
    locationId?: string,
    category?: string,
    type?: 'header' | 'footer' | 'full'
  ): Promise<ExportTemplate | null> {
    // Try to find default template
    const where: any = {
      tenantId,
      isDefault: true,
      isActive: true,
    };

    if (category) where.category = category;
    if (type) where.type = type;

    if (locationId) {
      where.locationId = locationId;
    } else if (companyId) {
      where.companyId = companyId;
    } else {
      where.companyId = null;
      where.locationId = null;
    }

    let template = await this.tenantPrisma.exportTemplate.findFirst({
      where,
      orderBy: { createdAt: 'desc' },
    });

    // If not found, try without location/company filter
    if (!template) {
      template = await this.tenantPrisma.exportTemplate.findFirst({
        where: {
          tenantId,
          isDefault: true,
          isActive: true,
          companyId: null,
          locationId: null,
          ...(category && { category }),
          ...(type && { type }),
        },
        orderBy: { createdAt: 'desc' },
      });
    }

    return template as ExportTemplate | null;
  }

  /**
   * Get templates for company
   */
  async getTemplates(
    tenantId: string,
    companyId?: string,
    locationId?: string,
    type?: 'header' | 'footer' | 'full'
  ): Promise<ExportTemplate[]> {
    const where: any = {
      tenantId,
      isActive: true,
    };

    if (type) {
      where.type = type;
    }

    if (locationId) {
      where.locationId = locationId;
    } else if (companyId) {
      where.companyId = companyId;
    } else {
      where.companyId = null;
      where.locationId = null;
    }

    const templates = await this.tenantPrisma.exportTemplate.findMany({
      where,
      orderBy: [
        { isDefault: 'desc' },
        { createdAt: 'desc' },
      ],
    });

    return templates as ExportTemplate[];
  }

  /**
   * Create template
   */
  async createTemplate(
    tenantId: string,
    data: {
      companyId?: string;
      locationId?: string;
      name: string;
      type: 'header' | 'footer' | 'full';
      category?: 'export' | 'notification';
      description?: string;
      templateData: ExportTemplateData;
      isDefault?: boolean;
    }
  ): Promise<ExportTemplate> {
    // If this is default, unset other defaults
    if (data.isDefault) {
      await this.tenantPrisma.exportTemplate.updateMany({
        where: {
          tenantId,
          companyId: data.companyId || null,
          locationId: data.locationId || null,
          type: data.type,
          isDefault: true,
        },
        data: { isDefault: false },
      });
    }

    const template = await this.tenantPrisma.exportTemplate.create({
      data: {
        tenantId,
        companyId: data.companyId || null,
        locationId: data.locationId || null,
        name: data.name,
        type: data.type,
        category: data.category || 'export',
        description: data.description || null,
        logoUrl: data.templateData.logoUrl || null,
        title: data.templateData.title || null,
        subtitle: data.templateData.subtitle || null,
        address: data.templateData.address || null,
        phone: data.templateData.phone || null,
        email: data.templateData.email || null,
        website: data.templateData.website || null,
        taxNumber: data.templateData.taxNumber || null,
        customFields: data.templateData.customFields ? (data.templateData.customFields as any) : null,
        layout: data.templateData.layout ? (data.templateData.layout as any) : null,
        styles: data.templateData.styles ? (data.templateData.styles as any) : null,
        design: data.templateData.design ? (data.templateData.design as any) : null,
        isDefault: data.isDefault || false,
        isActive: true,
      },
    });

    return template as ExportTemplate;
  }

  /**
   * Update template
   */
  async updateTemplate(
    templateId: string,
    data: Partial<{
      name: string;
      templateData: ExportTemplateData;
      isDefault: boolean;
      isActive: boolean;
    }>
  ): Promise<ExportTemplate> {
    // If setting as default, unset other defaults
    if (data.isDefault) {
      const template = await this.getTemplate(templateId);
      if (template) {
        await this.tenantPrisma.exportTemplate.updateMany({
          where: {
            tenantId: template.tenantId,
            ...(template.companyId ? { companyId: template.companyId } : {}),
            ...(template.locationId ? { locationId: template.locationId } : {}),
            type: template.type,
            isDefault: true,
            id: { not: templateId },
          },
          data: { isDefault: false },
        });
      }
    }

    const updateData: any = {};
    if (data.name) updateData.name = data.name;
    if (data.templateData) {
      if (data.templateData.logoUrl !== undefined) updateData.logoUrl = data.templateData.logoUrl || null;
      if (data.templateData.title !== undefined) updateData.title = data.templateData.title || null;
      if (data.templateData.subtitle !== undefined) updateData.subtitle = data.templateData.subtitle || null;
      if (data.templateData.address !== undefined) updateData.address = data.templateData.address || null;
      if (data.templateData.phone !== undefined) updateData.phone = data.templateData.phone || null;
      if (data.templateData.email !== undefined) updateData.email = data.templateData.email || null;
      if (data.templateData.website !== undefined) updateData.website = data.templateData.website || null;
      if (data.templateData.taxNumber !== undefined) updateData.taxNumber = data.templateData.taxNumber || null;
      if (data.templateData.customFields !== undefined) updateData.customFields = data.templateData.customFields || null;
      if (data.templateData.layout !== undefined) updateData.layout = data.templateData.layout || null;
      if (data.templateData.styles !== undefined) updateData.styles = data.templateData.styles || null;
      if (data.templateData.design !== undefined) updateData.design = data.templateData.design || null;
    }
    if (data.isDefault !== undefined) updateData.isDefault = data.isDefault;
    if (data.isActive !== undefined) updateData.isActive = data.isActive;

    const template = await this.tenantPrisma.exportTemplate.update({
      where: { id: templateId },
      data: updateData,
    });

    return template as ExportTemplate;
  }

  /**
   * Delete template
   */
  async deleteTemplate(templateId: string): Promise<void> {
    await this.tenantPrisma.exportTemplate.delete({
      where: { id: templateId },
    });
  }

  /**
   * Merge template data with company settings
   */
  mergeWithCompanySettings(
    template: ExportTemplate | null,
    companySettings: {
      logo?: string;
      name: string;
      address?: string;
      phone?: string;
      email?: string;
      website?: string;
      taxId?: string;
    }
  ): ExportTemplateData {
    if (!template) {
      // Return default from company settings
      return {
        ...(companySettings.logo ? { logoUrl: companySettings.logo } : {}),
        title: companySettings.name,
        ...(companySettings.address ? { address: companySettings.address } : {}),
        ...(companySettings.phone ? { phone: companySettings.phone } : {}),
        ...(companySettings.email ? { email: companySettings.email } : {}),
        ...(companySettings.website ? { website: companySettings.website } : {}),
        ...(companySettings.taxId ? { taxNumber: companySettings.taxId } : {}),
      };
    }

    // Merge template with company settings (template takes precedence)
    return {
      ...(template.logoUrl || companySettings.logo ? { logoUrl: template.logoUrl || companySettings.logo } : {}),
      title: template.title || companySettings.name,
      ...(template.subtitle ? { subtitle: template.subtitle } : {}),
      ...(template.address || companySettings.address ? { address: template.address || companySettings.address } : {}),
      ...(template.phone || companySettings.phone ? { phone: template.phone || companySettings.phone } : {}),
      ...(template.email || companySettings.email ? { email: template.email || companySettings.email } : {}),
      ...(template.website || companySettings.website ? { website: template.website || companySettings.website } : {}),
      ...(template.taxNumber || companySettings.taxId ? { taxNumber: template.taxNumber || companySettings.taxId } : {}),
      ...(template.customFields ? { customFields: template.customFields as Record<string, any> } : {}),
      ...(template.layout ? { layout: template.layout as Record<string, any> } : {}),
      ...(template.styles ? { styles: template.styles as Record<string, any> } : {}),
    };
  }

  /**
   * Export template to JSON (for import/export)
   */
  async exportTemplate(templateId: string): Promise<Record<string, any>> {
    const template = await this.getTemplate(templateId);
    if (!template) {
      throw new Error('Template not found');
    }

    // Export template data (excluding tenant-specific fields)
    return {
      name: template.name,
      type: template.type,
      category: (template as any).category || 'export',
      description: (template as any).description || null,
      logoUrl: template.logoUrl,
      title: template.title,
      subtitle: template.subtitle,
      address: template.address,
      phone: template.phone,
      email: template.email,
      website: template.website,
      taxNumber: template.taxNumber,
      customFields: template.customFields,
      layout: template.layout,
      styles: template.styles,
      design: (template as any).design || null,
      version: (template as any).version || 1,
      exportedAt: new Date().toISOString(),
    };
  }

  /**
   * Import template from JSON
   */
  async importTemplate(
    tenantId: string,
    templateData: Record<string, any>,
    companyId?: string,
    locationId?: string,
    isDefault?: boolean
  ): Promise<ExportTemplate> {
    const { name, type, category, description, ...data } = templateData;

    return await this.createTemplate(tenantId, {
      name: name || `Imported Template ${Date.now()}`,
      type: type || 'full',
      ...(companyId ? { companyId } : {}),
      ...(locationId ? { locationId } : {}),
      templateData: {
        logoUrl: data.logoUrl,
        title: data.title,
        subtitle: data.subtitle,
        address: data.address,
        phone: data.phone,
        email: data.email,
        website: data.website,
        taxNumber: data.taxNumber,
        customFields: data.customFields,
        layout: data.layout,
        styles: data.styles,
        design: data.design,
      },
      isDefault: isDefault || false,
    });
  }

  /**
   * Generate preview HTML for template
   */
  async generatePreview(
    templateId: string,
    sampleData?: Record<string, any>
  ): Promise<string> {
    const template = await this.getTemplate(templateId);
    if (!template) {
      throw new Error('Template not found');
    }

    // Generate HTML preview based on template design
    const styles = template.styles as Record<string, any> || {};

    // This is a simplified preview - in production, use a proper template engine
    let html = '<!DOCTYPE html><html><head><meta charset="UTF-8">';
    html += '<style>';
    html += 'body { font-family: Arial, sans-serif; margin: 0; padding: 20px; }';
    if (styles.colors) {
      Object.entries(styles.colors).forEach(([key, value]) => {
        html += `.${key} { color: ${value}; }`;
      });
    }
    html += '</style></head><body>';

    // Header
    if (template.type === 'header' || template.type === 'full') {
      html += '<div class="header">';
      if (template.logoUrl) {
        html += `<img src="${template.logoUrl}" alt="Logo" style="max-height: 60px;" />`;
      }
      if (template.title) {
        html += `<h1>${template.title}</h1>`;
      }
      if (template.subtitle) {
        html += `<h2>${template.subtitle}</h2>`;
      }
      html += '</div>';
    }

    // Body (sample data)
    if (sampleData) {
      html += '<div class="body">';
      Object.entries(sampleData).forEach(([key, value]) => {
        html += `<p><strong>${key}:</strong> ${value}</p>`;
      });
      html += '</div>';
    }

    // Footer
    if (template.type === 'footer' || template.type === 'full') {
      html += '<div class="footer">';
      if (template.address) html += `<p>${template.address}</p>`;
      if (template.phone) html += `<p>Phone: ${template.phone}</p>`;
      if (template.email) html += `<p>Email: ${template.email}</p>`;
      html += '</div>';
    }

    html += '</body></html>';
    return html;
  }

  /**
   * Update template export timestamp
   */
  async markExported(templateId: string): Promise<void> {
    await this.tenantPrisma.exportTemplate.update({
      where: { id: templateId },
      data: { exportedAt: new Date() } as any,
    });
  }

  /**
   * Get templates by category
   */
  async getTemplatesByCategory(
    tenantId: string,
    category: 'export' | 'notification',
    companyId?: string,
    locationId?: string
  ): Promise<ExportTemplate[]> {
    const where: any = {
      tenantId,
      isActive: true,
      category: category,
    };

    if (locationId) {
      where.locationId = locationId;
    } else if (companyId) {
      where.companyId = companyId;
    } else {
      where.companyId = null;
      where.locationId = null;
    }

    return await this.tenantPrisma.exportTemplate.findMany({
      where,
      orderBy: [
        { isDefault: 'desc' },
        { createdAt: 'desc' },
      ],
    }) as ExportTemplate[];
  }
}

