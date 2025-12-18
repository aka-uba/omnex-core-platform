import { PrismaClient as TenantPrismaClient } from '@prisma/tenant-client';
import { Prisma } from '@prisma/tenant-client';

export interface NotificationTemplate {
  id: string;
  tenantId: string;
  companyId?: string | null;
  locationId?: string | null;
  name: string;
  channel: 'email' | 'sms' | 'push' | 'whatsapp' | 'telegram';
  category?: string | null;
  notificationType?: string | null;
  description?: string | null;
  emailSubject?: string | null;
  emailPlainText?: string | null;
  emailHtmlTemplate?: string | null;
  emailTemplateStyle?: string | null;
  emailSignatureEnabled: boolean;
  emailSignatureUserInfo: boolean;
  emailSignatureUserAvatar: boolean;
  emailSignatureCompanyLogo: boolean;
  emailSignatureCompanyInfo: boolean;
  smsSubject?: string | null;
  smsContent?: string | null;
  socialImageUrl?: string | null;
  socialImageDescription?: string | null;
  socialContent?: string | null;
  pushTitle?: string | null;
  pushBody?: string | null;
  pushIcon?: string | null;
  pushImage?: string | null;
  defaultMessagePrefix?: string | null;
  defaultMessageSuffix?: string | null;
  templateVariables?: Record<string, any> | null;
  templateContent?: Record<string, any> | null;
  variables?: Record<string, any> | null;
  designStyle?: string | null;
  layout?: Record<string, any> | null;
  styles?: Record<string, any> | null;
  isDefault: boolean;
  isActive: boolean;
  isPublished: boolean;
  version: number;
  previewImage?: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateNotificationTemplateData {
  name: string;
  channel: 'email' | 'sms' | 'push' | 'whatsapp' | 'telegram';
  category?: string;
  notificationType?: string;
  description?: string;
  emailSubject?: string;
  emailPlainText?: string;
  emailHtmlTemplate?: string;
  emailTemplateStyle?: 'corporate' | 'visionary' | 'elegant' | 'modern';
  emailSignatureEnabled?: boolean;
  emailSignatureUserInfo?: boolean;
  emailSignatureUserAvatar?: boolean;
  emailSignatureCompanyLogo?: boolean;
  emailSignatureCompanyInfo?: boolean;
  smsSubject?: string;
  smsContent?: string;
  socialImageUrl?: string;
  socialImageDescription?: string;
  socialContent?: string;
  pushTitle?: string;
  pushBody?: string;
  pushIcon?: string;
  pushImage?: string;
  defaultMessagePrefix?: string;
  defaultMessageSuffix?: string;
  templateVariables?: Record<string, any>;
  templateContent?: Record<string, any>;
  variables?: Record<string, any>;
  designStyle?: string;
  layout?: Record<string, any>;
  styles?: Record<string, any>;
  isDefault?: boolean;
  isActive?: boolean;
  isPublished?: boolean;
  previewImage?: string;
}

export class NotificationTemplateService {
  private tenantPrisma: TenantPrismaClient;

  constructor(tenantPrisma: TenantPrismaClient) {
    this.tenantPrisma = tenantPrisma;
  }

  /**
   * Get template by ID
   */
  async getTemplate(templateId: string): Promise<NotificationTemplate | null> {
    const template = await this.tenantPrisma.notificationTemplate.findUnique({
      where: { id: templateId },
    });

    return template as NotificationTemplate | null;
  }

  /**
   * Get default template for channel and notification type
   */
  async getDefaultTemplate(
    tenantId: string,
    channel: 'email' | 'sms' | 'push' | 'whatsapp' | 'telegram',
    notificationType?: string,
    companyId?: string,
    locationId?: string
  ): Promise<NotificationTemplate | null> {
    const where: any = {
      tenantId,
      channel,
      isDefault: true,
      isActive: true,
      isPublished: true,
    };

    if (notificationType) where.notificationType = notificationType;
    if (locationId) {
      where.locationId = locationId;
    } else if (companyId) {
      where.companyId = companyId;
    } else {
      where.companyId = null;
      where.locationId = null;
    }

    let template = await this.tenantPrisma.notificationTemplate.findFirst({
      where,
      orderBy: { createdAt: 'desc' },
    });

    if (!template && (companyId || locationId)) {
      // Fallback to company-level default
      template = await this.tenantPrisma.notificationTemplate.findFirst({
        where: {
          tenantId,
          channel,
          isDefault: true,
          isActive: true,
          isPublished: true,
          companyId: companyId || null,
          locationId: null,
          ...(notificationType && { notificationType }),
        },
        orderBy: { createdAt: 'desc' },
      });
    }

    if (!template) {
      // Fallback to global default
      template = await this.tenantPrisma.notificationTemplate.findFirst({
        where: {
          tenantId,
          channel,
          isDefault: true,
          isActive: true,
          isPublished: true,
          companyId: null,
          locationId: null,
          ...(notificationType && { notificationType }),
        },
        orderBy: { createdAt: 'desc' },
      });
    }

    return template as NotificationTemplate | null;
  }

  /**
   * Get templates by channel
   */
  async getTemplates(
    tenantId: string,
    channel?: 'email' | 'sms' | 'push' | 'whatsapp' | 'telegram',
    notificationType?: string,
    companyId?: string,
    locationId?: string
  ): Promise<NotificationTemplate[]> {
    const where: any = {
      tenantId,
      isActive: true,
    };

    if (channel) where.channel = channel;
    if (notificationType) where.notificationType = notificationType;

    if (locationId) {
      where.locationId = locationId;
    } else if (companyId) {
      where.companyId = companyId;
    } else {
      where.companyId = null;
      where.locationId = null;
    }

    const templates = await this.tenantPrisma.notificationTemplate.findMany({
      where,
      orderBy: [
        { isDefault: 'desc' },
        { createdAt: 'desc' },
      ],
    });

    return templates as NotificationTemplate[];
  }

  /**
   * Create template
   */
  async createTemplate(
    tenantId: string,
    data: CreateNotificationTemplateData,
    companyId?: string,
    locationId?: string
  ): Promise<NotificationTemplate> {
    // If this is default, unset other defaults
    if (data.isDefault) {
      await this.tenantPrisma.notificationTemplate.updateMany({
        where: {
          tenantId,
          channel: data.channel,
          companyId: companyId || null,
          locationId: locationId || null,
          notificationType: data.notificationType || null,
          isDefault: true,
        },
        data: { isDefault: false },
      });
    }

    const template = await this.tenantPrisma.notificationTemplate.create({
      data: {
        tenantId,
        companyId: companyId || null,
        locationId: locationId || null,
        name: data.name,
        channel: data.channel,
        category: data.category || null,
        notificationType: data.notificationType || null,
        description: data.description || null,
        emailSubject: data.emailSubject || null,
        emailPlainText: data.emailPlainText || null,
        emailHtmlTemplate: data.emailHtmlTemplate || null,
        emailTemplateStyle: data.emailTemplateStyle || null,
        emailSignatureEnabled: data.emailSignatureEnabled ?? true,
        emailSignatureUserInfo: data.emailSignatureUserInfo ?? true,
        emailSignatureUserAvatar: data.emailSignatureUserAvatar ?? true,
        emailSignatureCompanyLogo: data.emailSignatureCompanyLogo ?? true,
        emailSignatureCompanyInfo: data.emailSignatureCompanyInfo ?? true,
        smsSubject: data.smsSubject || null,
        smsContent: data.smsContent || null,
        socialImageUrl: data.socialImageUrl || null,
        socialImageDescription: data.socialImageDescription || null,
        socialContent: data.socialContent || null,
        pushTitle: data.pushTitle || null,
        pushBody: data.pushBody || null,
        pushIcon: data.pushIcon || null,
        pushImage: data.pushImage || null,
        defaultMessagePrefix: data.defaultMessagePrefix || null,
        defaultMessageSuffix: data.defaultMessageSuffix || null,
        templateVariables: data.templateVariables ? (data.templateVariables as Prisma.InputJsonValue) : Prisma.JsonNull,
        templateContent: data.templateContent ? (data.templateContent as Prisma.InputJsonValue) : Prisma.JsonNull,
        variables: data.variables ? (data.variables as Prisma.InputJsonValue) : Prisma.JsonNull,
        designStyle: data.designStyle || null,
        layout: data.layout ? (data.layout as Prisma.InputJsonValue) : Prisma.JsonNull,
        styles: data.styles ? (data.styles as Prisma.InputJsonValue) : Prisma.JsonNull,
        isDefault: data.isDefault || false,
        isActive: data.isActive ?? true,
        isPublished: data.isPublished ?? true,
        previewImage: data.previewImage || null,
      },
    });

    return template as NotificationTemplate;
  }

  /**
   * Update template
   */
  async updateTemplate(
    templateId: string,
    data: Partial<CreateNotificationTemplateData>
  ): Promise<NotificationTemplate> {
    // If setting as default, unset other defaults
    if (data.isDefault) {
      const template = await this.getTemplate(templateId);
      if (template) {
        await this.tenantPrisma.notificationTemplate.updateMany({
          where: {
            tenantId: template.tenantId,
            channel: template.channel,
            ...(template.companyId ? { companyId: template.companyId } : {}),
            ...(template.locationId ? { locationId: template.locationId } : {}),
            ...(template.notificationType ? { notificationType: template.notificationType } : {}),
            isDefault: true,
            id: { not: templateId },
          },
          data: { isDefault: false },
        });
      }
    }

    const updateData: any = {};
    if (data.name !== undefined) updateData.name = data.name;
    if (data.channel !== undefined) updateData.channel = data.channel;
    if (data.category !== undefined) updateData.category = data.category;
    if (data.notificationType !== undefined) updateData.notificationType = data.notificationType;
    if (data.description !== undefined) updateData.description = data.description;
    if (data.emailSubject !== undefined) updateData.emailSubject = data.emailSubject;
    if (data.emailPlainText !== undefined) updateData.emailPlainText = data.emailPlainText;
    if (data.emailHtmlTemplate !== undefined) updateData.emailHtmlTemplate = data.emailHtmlTemplate;
    if (data.emailTemplateStyle !== undefined) updateData.emailTemplateStyle = data.emailTemplateStyle;
    if (data.emailSignatureEnabled !== undefined) updateData.emailSignatureEnabled = data.emailSignatureEnabled;
    if (data.emailSignatureUserInfo !== undefined) updateData.emailSignatureUserInfo = data.emailSignatureUserInfo;
    if (data.emailSignatureUserAvatar !== undefined) updateData.emailSignatureUserAvatar = data.emailSignatureUserAvatar;
    if (data.emailSignatureCompanyLogo !== undefined) updateData.emailSignatureCompanyLogo = data.emailSignatureCompanyLogo;
    if (data.emailSignatureCompanyInfo !== undefined) updateData.emailSignatureCompanyInfo = data.emailSignatureCompanyInfo;
    if (data.smsSubject !== undefined) updateData.smsSubject = data.smsSubject;
    if (data.smsContent !== undefined) updateData.smsContent = data.smsContent;
    if (data.socialImageUrl !== undefined) updateData.socialImageUrl = data.socialImageUrl;
    if (data.socialImageDescription !== undefined) updateData.socialImageDescription = data.socialImageDescription;
    if (data.socialContent !== undefined) updateData.socialContent = data.socialContent;
    if (data.pushTitle !== undefined) updateData.pushTitle = data.pushTitle;
    if (data.pushBody !== undefined) updateData.pushBody = data.pushBody;
    if (data.pushIcon !== undefined) updateData.pushIcon = data.pushIcon;
    if (data.pushImage !== undefined) updateData.pushImage = data.pushImage;
    if (data.defaultMessagePrefix !== undefined) updateData.defaultMessagePrefix = data.defaultMessagePrefix;
    if (data.defaultMessageSuffix !== undefined) updateData.defaultMessageSuffix = data.defaultMessageSuffix;
    if (data.templateVariables !== undefined) updateData.templateVariables = data.templateVariables ? (data.templateVariables as Prisma.InputJsonValue) : Prisma.JsonNull;
    if (data.templateContent !== undefined) updateData.templateContent = data.templateContent ? (data.templateContent as Prisma.InputJsonValue) : Prisma.JsonNull;
    if (data.variables !== undefined) updateData.variables = data.variables ? (data.variables as Prisma.InputJsonValue) : Prisma.JsonNull;
    if (data.designStyle !== undefined) updateData.designStyle = data.designStyle;
    if (data.layout !== undefined) updateData.layout = data.layout ? (data.layout as Prisma.InputJsonValue) : Prisma.JsonNull;
    if (data.styles !== undefined) updateData.styles = data.styles ? (data.styles as Prisma.InputJsonValue) : Prisma.JsonNull;
    if (data.isDefault !== undefined) updateData.isDefault = data.isDefault;
    if (data.isActive !== undefined) updateData.isActive = data.isActive;
    if (data.isPublished !== undefined) updateData.isPublished = data.isPublished;
    if (data.previewImage !== undefined) updateData.previewImage = data.previewImage;
    if (Object.keys(updateData).length > 0) {
      updateData.version = { increment: 1 };
    }

    const template = await this.tenantPrisma.notificationTemplate.update({
      where: { id: templateId },
      data: updateData,
    });

    return template as NotificationTemplate;
  }

  /**
   * Delete template
   */
  async deleteTemplate(templateId: string): Promise<void> {
    await this.tenantPrisma.notificationTemplate.delete({
      where: { id: templateId },
    });
  }

  /**
   * Replace template variables with actual values
   */
  replaceVariables(
    template: NotificationTemplate,
    variables: Record<string, any>
  ): {
    emailSubject?: string;
    emailPlainText?: string;
    emailHtmlTemplate?: string;
    smsContent?: string;
    pushTitle?: string;
    pushBody?: string;
    socialContent?: string;
  } {
    const replace = (text: string | null | undefined): string => {
      if (!text) return '';
      let result = text;
      const allVariables = { ...variables, ...(template.variables || {}) };
      Object.keys(allVariables).forEach((key) => {
        const value = allVariables[key];
        const regex = new RegExp(`\\{\\{${key}\\}\\}`, 'g');
        result = result.replace(regex, String(value ?? ''));
      });
      return result;
    };

    const result: {
      emailSubject?: string;
      emailPlainText?: string;
      emailHtmlTemplate?: string;
      smsContent?: string;
      pushTitle?: string;
      pushBody?: string;
      socialContent?: string;
    } = {};
    
    if (template.emailSubject) {
      const replaced = replace(template.emailSubject);
      if (replaced) result.emailSubject = replaced;
    }
    if (template.emailPlainText) {
      const replaced = replace(template.emailPlainText);
      if (replaced) result.emailPlainText = replaced;
    }
    if (template.emailHtmlTemplate) {
      const replaced = replace(template.emailHtmlTemplate);
      if (replaced) result.emailHtmlTemplate = replaced;
    }
    if (template.smsContent) {
      const replaced = replace(template.smsContent);
      if (replaced) result.smsContent = replaced;
    }
    if (template.pushTitle) {
      const replaced = replace(template.pushTitle);
      if (replaced) result.pushTitle = replaced;
    }
    if (template.pushBody) {
      const replaced = replace(template.pushBody);
      if (replaced) result.pushBody = replaced;
    }
    if (template.socialContent) {
      const replaced = replace(template.socialContent);
      if (replaced) result.socialContent = replaced;
    }
    
    return result;
  }
}








