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

    // Only filter by location/company if explicitly provided
    // If not provided, return all templates for this tenant
    if (locationId) {
      where.locationId = locationId;
    } else if (companyId) {
      where.companyId = companyId;
    }
    // else: return all templates regardless of companyId/locationId

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
   * Process placeholders in text
   * Replaces {{companyName}}, {{companyAddress}}, {{pageTitle}}, etc. with actual values
   */
  private processPlaceholders(
    text: string | null | undefined,
    companySettings: {
      logo?: string;
      name: string;
      address?: string;
      phone?: string;
      email?: string;
      website?: string;
      taxId?: string;
    },
    dynamicData?: {
      pageTitle?: string;
    }
  ): string {
    if (!text) return '';

    return text
      .replace(/\{\{companyName\}\}/g, companySettings.name || '')
      .replace(/\{\{companyAddress\}\}/g, companySettings.address || '')
      .replace(/\{\{companyPhone\}\}/g, companySettings.phone || '')
      .replace(/\{\{companyEmail\}\}/g, companySettings.email || '')
      .replace(/\{\{companyWebsite\}\}/g, companySettings.website || '')
      .replace(/\{\{companyTaxId\}\}/g, companySettings.taxId || '')
      .replace(/\{\{companyLogo\}\}/g, companySettings.logo || '')
      .replace(/\{\{pageTitle\}\}/g, dynamicData?.pageTitle || '')
      .replace(/\{\{date\}\}/g, new Date().toLocaleDateString())
      .replace(/\{\{year\}\}/g, new Date().getFullYear().toString());
  }

  /**
   * Process placeholders in customFields (headers, footers, logos arrays)
   */
  private processCustomFieldsPlaceholders(
    customFields: Record<string, any> | undefined,
    companySettings: {
      logo?: string;
      name: string;
      address?: string;
      phone?: string;
      email?: string;
      website?: string;
      taxId?: string;
    },
    dynamicData?: {
      pageTitle?: string;
    }
  ): Record<string, any> | undefined {
    if (!customFields) return undefined;

    const processed: Record<string, any> = {};

    for (const [key, value] of Object.entries(customFields)) {
      if (Array.isArray(value)) {
        // Process arrays (headers, footers, logos)
        processed[key] = value.map((item: any) => {
          if (typeof item === 'object' && item !== null) {
            const processedItem: any = { ...item };
            if (item.text) {
              processedItem.text = this.processPlaceholders(item.text, companySettings, dynamicData);
            }
            return processedItem;
          }
          return item;
        });
      } else if (typeof value === 'string') {
        processed[key] = this.processPlaceholders(value, companySettings, dynamicData);
      } else {
        processed[key] = value;
      }
    }

    return processed;
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
    },
    dynamicData?: {
      pageTitle?: string;
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

    // Process placeholders in template fields
    const processedTitle = this.processPlaceholders(template.title, companySettings, dynamicData);
    const processedSubtitle = this.processPlaceholders(template.subtitle, companySettings, dynamicData);
    const processedAddress = this.processPlaceholders(template.address, companySettings, dynamicData);
    const processedCustomFields = this.processCustomFieldsPlaceholders(
      template.customFields as Record<string, any> | undefined,
      companySettings,
      dynamicData
    );

    // Merge template with company settings (template takes precedence)
    return {
      ...(template.logoUrl || companySettings.logo ? { logoUrl: template.logoUrl || companySettings.logo } : {}),
      title: processedTitle || companySettings.name,
      ...(processedSubtitle ? { subtitle: processedSubtitle } : {}),
      ...(processedAddress || companySettings.address ? { address: processedAddress || companySettings.address } : {}),
      ...(template.phone || companySettings.phone ? { phone: template.phone || companySettings.phone } : {}),
      ...(template.email || companySettings.email ? { email: template.email || companySettings.email } : {}),
      ...(template.website || companySettings.website ? { website: template.website || companySettings.website } : {}),
      ...(template.taxNumber || companySettings.taxId ? { taxNumber: template.taxNumber || companySettings.taxId } : {}),
      ...(processedCustomFields ? { customFields: processedCustomFields } : {}),
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
    const customFields = template.customFields as Record<string, any> || {};
    const logos = customFields.logos || [];
    const headers = customFields.headers || [];
    const footers = customFields.footers || [];

    // Build CSS styles
    let css = `
      * { margin: 0; padding: 0; box-sizing: border-box; }
      body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; margin: 0; padding: 0; background: #fff; }
      .preview-container { max-width: 800px; margin: 0 auto; border: 1px solid #e0e0e0; min-height: 500px; display: flex; flex-direction: column; }
      .header { background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%); padding: 20px; border-bottom: 2px solid #dee2e6; }
      .header-logos { display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px; }
      .header-logos img { max-height: 50px; max-width: 150px; object-fit: contain; }
      .header-logos .left { text-align: left; }
      .header-logos .center { text-align: center; flex: 1; }
      .header-logos .right { text-align: right; }
      .header-text { text-align: center; }
      .header-text .left { text-align: left; }
      .header-text .center { text-align: center; }
      .header-text .right { text-align: right; }
      .header-text h1 { font-size: 24px; color: #212529; margin-bottom: 4px; font-weight: 600; }
      .header-text h2 { font-size: 16px; color: #6c757d; font-weight: 400; }
      .header-contact { display: flex; gap: 16px; justify-content: center; margin-top: 12px; font-size: 12px; color: #6c757d; flex-wrap: wrap; }
      .header-contact span { display: flex; align-items: center; gap: 4px; }
      .content { flex: 1; padding: 24px; background: #fff; }
      .content-placeholder { border: 2px dashed #dee2e6; border-radius: 8px; padding: 40px; text-align: center; color: #adb5bd; }
      .content-placeholder h3 { font-size: 14px; margin-bottom: 8px; }
      .content-placeholder p { font-size: 12px; }
      .sample-table { width: 100%; border-collapse: collapse; margin-top: 16px; }
      .sample-table th, .sample-table td { border: 1px solid #dee2e6; padding: 8px 12px; text-align: left; font-size: 12px; }
      .sample-table th { background: #f8f9fa; font-weight: 600; color: #495057; }
      .sample-table td { color: #6c757d; }
      .footer { background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%); padding: 16px 20px; border-top: 2px solid #dee2e6; }
      .footer-text { margin-bottom: 8px; }
      .footer-text p { font-size: 12px; color: #6c757d; margin-bottom: 4px; }
      .footer-text .left { text-align: left; }
      .footer-text .center { text-align: center; }
      .footer-text .right { text-align: right; }
      .footer-contact { display: flex; gap: 16px; justify-content: center; font-size: 11px; color: #868e96; flex-wrap: wrap; }
    `;

    // Apply custom colors if defined
    if (styles.colors) {
      Object.entries(styles.colors).forEach(([key, value]) => {
        css += `.${key} { color: ${value}; }`;
      });
    }

    let html = `<!DOCTYPE html><html><head><meta charset="UTF-8"><title>Template Preview</title><style>${css}</style></head><body>`;
    html += '<div class="preview-container">';

    // Header section
    if (template.type === 'header' || template.type === 'full') {
      html += '<div class="header">';

      // Logos row
      if (logos.length > 0 || template.logoUrl) {
        html += '<div class="header-logos">';
        if (logos.length > 0) {
          logos.forEach((logo: any) => {
            const pos = logo.position || 'left';
            if (logo.url) {
              html += `<div class="${pos}"><img src="${logo.url}" alt="Logo" /></div>`;
            }
          });
        } else if (template.logoUrl) {
          html += `<div class="left"><img src="${template.logoUrl}" alt="Logo" /></div>`;
        }
        html += '</div>';
      }

      // Header texts
      if (headers.length > 0 || template.title) {
        html += '<div class="header-text">';
        if (headers.length > 0) {
          headers.forEach((header: any, idx: number) => {
            const pos = header.position || 'center';
            if (header.text) {
              if (idx === 0) {
                html += `<h1 class="${pos}">${header.text}</h1>`;
              } else {
                html += `<h2 class="${pos}">${header.text}</h2>`;
              }
            }
          });
        } else {
          if (template.title) html += `<h1>${template.title}</h1>`;
          if (template.subtitle) html += `<h2>${template.subtitle}</h2>`;
        }
        html += '</div>';
      }

      // Contact info in header
      if (template.address || template.phone || template.email) {
        html += '<div class="header-contact">';
        if (template.address) html += `<span>${template.address}</span>`;
        if (template.phone) html += `<span>${template.phone}</span>`;
        if (template.email) html += `<span>${template.email}</span>`;
        html += '</div>';
      }

      html += '</div>';
    }

    // Content section
    html += '<div class="content">';
    if (sampleData && Object.keys(sampleData).length > 0) {
      html += '<table class="sample-table"><thead><tr>';
      Object.keys(sampleData).forEach(key => {
        html += `<th>${key}</th>`;
      });
      html += '</tr></thead><tbody><tr>';
      Object.values(sampleData).forEach(value => {
        html += `<td>${value}</td>`;
      });
      html += '</tr></tbody></table>';
    } else {
      html += '<div class="content-placeholder">';
      html += '<h3>Sample Content Area</h3>';
      html += '<p>Your exported data will appear here</p>';
      html += '<table class="sample-table"><thead><tr><th>Column 1</th><th>Column 2</th><th>Column 3</th></tr></thead>';
      html += '<tbody><tr><td>Sample Data 1</td><td>Sample Data 2</td><td>Sample Data 3</td></tr>';
      html += '<tr><td>Sample Data 4</td><td>Sample Data 5</td><td>Sample Data 6</td></tr></tbody></table>';
      html += '</div>';
    }
    html += '</div>';

    // Footer section
    if (template.type === 'footer' || template.type === 'full') {
      html += '<div class="footer">';

      // Footer texts
      if (footers.length > 0) {
        html += '<div class="footer-text">';
        footers.forEach((footer: any) => {
          const pos = footer.position || 'center';
          if (footer.text) {
            html += `<p class="${pos}">${footer.text}</p>`;
          }
        });
        html += '</div>';
      }

      // Footer contact
      if (template.website || template.taxNumber) {
        html += '<div class="footer-contact">';
        if (template.website) html += `<span>${template.website}</span>`;
        if (template.taxNumber) html += `<span>Tax No: ${template.taxNumber}</span>`;
        html += '</div>';
      }

      html += '</div>';
    }

    html += '</div></body></html>';
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

