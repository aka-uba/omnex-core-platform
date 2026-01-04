import { logger } from '@/lib/utils/logger';

// Use 'any' for PrismaClient to support both core and tenant prisma clients
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyPrismaClient = any;

// Email template types
export type EmailTemplateType =
  | 'user_activation'
  | 'welcome'
  | 'password_reset'
  | 'password_changed'
  | 'real_estate_lease_expiry'
  | 'real_estate_rent_reminder'
  | 'real_estate_payment_received'
  | 'real_estate_tenant_welcome'
  | 'real_estate_maintenance_update'
  | 'task_assignment'
  | 'urgent_alert'
  | 'system_update';

export type EmailTemplateStyle = 'corporate' | 'visionary' | 'elegant' | 'modern';

export interface SMTPConfig {
  host: string;
  port: number;
  secure: boolean;
  auth?: {
    user: string;
    pass: string;
  };
  tls?: {
    rejectUnauthorized: boolean;
  };
  requireTLS?: boolean;
  connectionTimeout?: number;
  greetingTimeout?: number;
  socketTimeout?: number;
}

export interface CompanyInfo {
  name: string;
  logoUrl?: string;
  address?: string;
  phone?: string;
  email?: string;
  website?: string;
  taxId?: string;
}

export interface EmailOptions {
  to: string | string[];
  subject: string;
  html: string;
  text?: string;
  from?: string;
  replyTo?: string;
  attachments?: Array<{
    filename: string;
    content: string | Buffer;
    contentType?: string;
  }>;
}

export interface SendEmailResult {
  success: boolean;
  messageId?: string;
  error?: string;
}

export interface TemplateVariables {
  // User related
  userName?: string;
  userEmail?: string;

  // Activation
  activationUrl?: string;
  activationCode?: string;
  activationExpiry?: string;

  // Password Reset
  resetUrl?: string;
  resetCode?: string;
  resetExpiry?: string;

  // Company
  companyName?: string;
  companyAddress?: string;
  companyPhone?: string;
  companyEmail?: string;
  companyWebsite?: string;
  companyLogo?: string;

  // General
  date?: string;
  year?: string;

  // Real Estate specific
  propertyName?: string;
  propertyAddress?: string;
  unitNumber?: string;
  tenantName?: string;
  rentAmount?: string;
  currency?: string;
  dueDate?: string;
  leaseEndDate?: string;
  daysRemaining?: string;
  paymentAmount?: string;
  paymentDate?: string;
  receiptNumber?: string;
  paymentMethods?: string;
  moveInDate?: string;
  moveInInstructions?: string;
  emergencyContact?: string;
  ticketNumber?: string;
  issueTitle?: string;
  status?: string;
  updateMessage?: string;
  assignedTechnician?: string;

  // Custom
  [key: string]: string | undefined;
}

/**
 * Central Email Service for sending emails using SMTP settings and notification templates
 */
export class EmailService {
  private tenantPrisma: AnyPrismaClient;
  private tenantId: string;
  private companyId: string;
  private nodemailer: typeof import('nodemailer') | null = null;

  constructor(tenantPrisma: AnyPrismaClient, tenantId: string, companyId: string) {
    this.tenantPrisma = tenantPrisma;
    this.tenantId = tenantId;
    this.companyId = companyId;
  }

  /**
   * Load nodemailer dynamically
   */
  private async getNodemailer(): Promise<typeof import('nodemailer')> {
    if (!this.nodemailer) {
      const nodemailerModule = await import('nodemailer');
      this.nodemailer = nodemailerModule.default || nodemailerModule;
    }
    return this.nodemailer;
  }

  /**
   * Get SMTP settings from GeneralSettings
   */
  async getSMTPSettings(): Promise<{
    enabled: boolean;
    host?: string;
    port?: number;
    encryption?: string;
    username?: string;
    password?: string;
    fromName?: string;
    fromEmail?: string;
    timeout?: number;
  } | null> {
    const settings = await this.tenantPrisma.generalSettings.findUnique({
      where: {
        tenantId_companyId: {
          tenantId: this.tenantId,
          companyId: this.companyId,
        },
      },
    });

    if (!settings) {
      return null;
    }

    return {
      enabled: settings.smtpEnabled || false,
      host: settings.smtpHost || undefined,
      port: settings.smtpPort || 587,
      encryption: settings.smtpEncryption || 'TLS',
      username: settings.smtpUsername || undefined,
      password: settings.smtpPassword || undefined,
      fromName: settings.smtpFromName || undefined,
      fromEmail: settings.smtpFromEmail || undefined,
      timeout: settings.smtpTimeout || 30000,
    };
  }

  /**
   * Get company info for templates
   */
  async getCompanyInfo(): Promise<CompanyInfo | null> {
    const company = await this.tenantPrisma.company.findUnique({
      where: { id: this.companyId },
      select: {
        name: true,
        address: true,
        phone: true,
        email: true,
        website: true,
        taxNumber: true,
        logo: true,
      },
    });

    if (!company) {
      return null;
    }

    return {
      name: company.name,
      logoUrl: company.logo || undefined,
      address: company.address || undefined,
      phone: company.phone || undefined,
      email: company.email || undefined,
      website: company.website || undefined,
      taxId: company.taxNumber || undefined,
    };
  }

  /**
   * Get notification template by type
   */
  async getTemplate(
    notificationType: EmailTemplateType,
    channel: 'email' = 'email'
  ): Promise<{
    id: string;
    name: string;
    subject: string;
    htmlTemplate?: string;
    plainText?: string;
    style?: string;
    signatureEnabled?: boolean;
    variables?: Record<string, any>;
  } | null> {
    // First try to find template with defaultForType
    let template = await this.tenantPrisma.notificationTemplate.findFirst({
      where: {
        tenantId: this.tenantId,
        channel,
        notificationType,
        defaultForType: notificationType,
        isActive: true,
      },
    });

    // If not found, try to find any template with this type
    if (!template) {
      template = await this.tenantPrisma.notificationTemplate.findFirst({
        where: {
          tenantId: this.tenantId,
          channel,
          notificationType,
          isActive: true,
        },
        orderBy: {
          isDefault: 'desc',
        },
      });
    }

    // If still not found, try to find the default template
    if (!template) {
      template = await this.tenantPrisma.notificationTemplate.findFirst({
        where: {
          tenantId: this.tenantId,
          channel,
          isDefault: true,
          isActive: true,
        },
      });
    }

    if (!template) {
      return null;
    }

    return {
      id: template.id,
      name: template.name,
      subject: template.emailSubject || '',
      htmlTemplate: template.emailHtmlTemplate || undefined,
      plainText: template.emailPlainText || undefined,
      style: template.emailTemplateStyle || 'corporate',
      signatureEnabled: template.emailSignatureEnabled || false,
      variables: template.templateVariables as Record<string, any> || {},
    };
  }

  /**
   * Replace variables in template string
   */
  replaceVariables(template: string, variables: TemplateVariables): string {
    let result = template;

    // Replace all {{variable}} patterns
    for (const [key, value] of Object.entries(variables)) {
      if (value !== undefined) {
        const regex = new RegExp(`\\{\\{${key}\\}\\}`, 'g');
        result = result.replace(regex, value);
      }
    }

    // Also support common date variables
    const now = new Date();
    result = result.replace(/\{\{date\}\}/g, now.toLocaleDateString('tr-TR'));
    result = result.replace(/\{\{year\}\}/g, now.getFullYear().toString());

    return result;
  }

  /**
   * Build SMTP transporter
   */
  private async buildTransporter(): Promise<any> {
    const settings = await this.getSMTPSettings();

    if (!settings || !settings.enabled) {
      throw new Error('SMTP is not enabled');
    }

    if (!settings.host || !settings.fromEmail) {
      throw new Error('SMTP configuration is incomplete');
    }

    const nodemailer = await this.getNodemailer();

    const isSSL = settings.encryption === 'SSL';
    const isTLS = settings.encryption === 'TLS';
    const port = settings.port || (isSSL ? 465 : 587);

    const config: SMTPConfig = {
      host: settings.host,
      port: port,
      secure: isSSL,
      connectionTimeout: settings.timeout || 30000,
      greetingTimeout: settings.timeout || 30000,
      socketTimeout: settings.timeout || 30000,
    };

    // Add authentication if provided
    if (settings.username && settings.password) {
      config.auth = {
        user: settings.username,
        pass: settings.password,
      };
    }

    // Add TLS configuration
    if (isTLS || isSSL) {
      config.tls = {
        rejectUnauthorized: false,
      };

      if (isTLS) {
        config.requireTLS = true;
      }
    }

    return nodemailer.createTransport(config);
  }

  /**
   * Send email with template
   */
  async sendWithTemplate(
    to: string | string[],
    templateType: EmailTemplateType,
    variables: TemplateVariables
  ): Promise<SendEmailResult> {
    try {
      const settings = await this.getSMTPSettings();
      if (!settings || !settings.enabled) {
        return { success: false, error: 'SMTP is not enabled' };
      }

      const template = await this.getTemplate(templateType);
      if (!template) {
        logger.warn(`No template found for type: ${templateType}`, {}, 'email-service');
        // Fall back to simple email
        return this.sendSimpleEmail(to, templateType, variables);
      }

      // Get company info and add to variables
      const companyInfo = await this.getCompanyInfo();
      const fullVariables: TemplateVariables = {
        ...variables,
        companyName: companyInfo?.name || variables.companyName || 'Company',
        companyAddress: companyInfo?.address || variables.companyAddress,
        companyPhone: companyInfo?.phone || variables.companyPhone,
        companyEmail: companyInfo?.email || variables.companyEmail,
        companyWebsite: companyInfo?.website || variables.companyWebsite,
        companyLogo: companyInfo?.logoUrl || variables.companyLogo,
      };

      // Replace variables in template
      const subject = this.replaceVariables(template.subject, fullVariables);
      let html = template.htmlTemplate || template.plainText || '';
      html = this.replaceVariables(html, fullVariables);

      const text = template.plainText
        ? this.replaceVariables(template.plainText, fullVariables)
        : undefined;

      // If no HTML template, convert plain text to HTML
      if (!template.htmlTemplate && template.plainText) {
        html = this.wrapInEmailTemplate(html, subject, template.style as EmailTemplateStyle);
      }

      return this.send({
        to,
        subject,
        html,
        text,
      });
    } catch (error) {
      logger.error('Failed to send templated email', { error, templateType }, 'email-service');
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to send email',
      };
    }
  }

  /**
   * Send simple email without template
   */
  async sendSimpleEmail(
    to: string | string[],
    subject: string,
    variables: TemplateVariables
  ): Promise<SendEmailResult> {
    const companyInfo = await this.getCompanyInfo();
    const companyName = companyInfo?.name || variables.companyName || 'Company';

    // Build simple email content
    let content = `Sayın ${variables.userName || 'Kullanıcı'},\n\n`;

    if (subject === 'user_activation') {
      content += `Hesabınızı aktifleştirmek için aşağıdaki bağlantıya tıklayın:\n\n${variables.activationUrl}\n\nBu bağlantı ${variables.activationExpiry || '24 saat'} içinde geçerliliğini yitirecektir.`;
    } else if (subject === 'password_reset') {
      content += `Şifre sıfırlama talebiniz alındı. Şifrenizi sıfırlamak için aşağıdaki bağlantıya tıklayın:\n\n${variables.resetUrl}\n\nBu bağlantı ${variables.resetExpiry || '1 saat'} içinde geçerliliğini yitirecektir.`;
    } else if (subject === 'welcome') {
      content += `${companyName} ailesine hoş geldiniz!\n\nHesabınız başarıyla oluşturuldu ve aktifleştirildi.`;
    } else {
      content += variables.userName || '';
    }

    content += `\n\nSaygılarımızla,\n${companyName}`;

    const html = this.wrapInEmailTemplate(content, subject);

    return this.send({
      to,
      subject: subject.includes('activation') ? 'Hesap Aktivasyonu' :
               subject.includes('reset') ? 'Şifre Sıfırlama' :
               subject.includes('welcome') ? 'Hoş Geldiniz' : subject,
      html,
      text: content,
    });
  }

  /**
   * Wrap plain text content in email template
   */
  private wrapInEmailTemplate(
    content: string,
    title: string,
    style: EmailTemplateStyle = 'corporate'
  ): string {
    const colors = {
      corporate: { primary: '#1a1a2e', accent: '#228be6' },
      visionary: { primary: '#4c1d95', accent: '#8b5cf6' },
      elegant: { primary: '#1f2937', accent: '#10b981' },
      modern: { primary: '#0f172a', accent: '#f97316' },
    };

    const { primary } = colors[style] || colors.corporate;

    // Convert plain text to HTML
    const htmlContent = content
      .split('\n')
      .map((line: string) => line.trim() ? `<p style="margin: 0 0 10px 0;">${line}</p>` : '<br/>')
      .join('');

    return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; background-color: #f5f5f5; font-family: Arial, sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f5f5f5; padding: 40px 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
          <!-- Header -->
          <tr>
            <td style="background-color: ${primary}; padding: 30px; border-radius: 8px 8px 0 0;">
              <h1 style="color: #ffffff; margin: 0; font-size: 24px;">${title}</h1>
            </td>
          </tr>
          <!-- Content -->
          <tr>
            <td style="padding: 30px; color: #333333; line-height: 1.6;">
              ${htmlContent}
            </td>
          </tr>
          <!-- Footer -->
          <tr>
            <td style="background-color: #f8f9fa; padding: 20px 30px; border-radius: 0 0 8px 8px; border-top: 1px solid #e9ecef;">
              <p style="margin: 0; color: #868e96; font-size: 12px;">
                Bu e-posta otomatik olarak gönderilmiştir. Lütfen yanıtlamayınız.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
    `.trim();
  }

  /**
   * Send raw email
   */
  async send(options: EmailOptions): Promise<SendEmailResult> {
    try {
      const settings = await this.getSMTPSettings();
      if (!settings || !settings.enabled) {
        return { success: false, error: 'SMTP is not enabled' };
      }

      if (!settings.fromEmail) {
        return { success: false, error: 'SMTP from email is not configured' };
      }

      const transporter = await this.buildTransporter();

      // Verify connection
      try {
        await transporter.verify();
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Connection failed';
        logger.error('SMTP connection verification failed', { error: errorMessage }, 'email-service');
        return { success: false, error: `SMTP connection failed: ${errorMessage}` };
      }

      // Prepare mail options
      const from = options.from || (
        settings.fromName
          ? `${settings.fromName} <${settings.fromEmail}>`
          : settings.fromEmail
      );

      const mailOptions = {
        from,
        to: Array.isArray(options.to) ? options.to.join(', ') : options.to,
        subject: options.subject,
        html: options.html,
        text: options.text || options.html.replace(/<[^>]*>/g, ''),
        replyTo: options.replyTo,
        attachments: options.attachments,
      };

      // Send email
      const info = await transporter.sendMail(mailOptions);

      logger.info('Email sent successfully', {
        messageId: info.messageId,
        to: mailOptions.to,
        subject: mailOptions.subject,
      }, 'email-service');

      return {
        success: true,
        messageId: info.messageId,
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to send email';
      logger.error('Failed to send email', { error: errorMessage }, 'email-service');
      return {
        success: false,
        error: errorMessage,
      };
    }
  }

  // ============================================
  // Convenience methods for specific email types
  // ============================================

  /**
   * Send activation email
   */
  async sendActivationEmail(
    to: string,
    userName: string,
    activationUrl: string,
    expiryHours: number = 24
  ): Promise<SendEmailResult> {
    return this.sendWithTemplate(to, 'user_activation', {
      userName,
      userEmail: to,
      activationUrl,
      activationExpiry: `${expiryHours} saat`,
    });
  }

  /**
   * Send welcome email (after activation)
   */
  async sendWelcomeEmail(
    to: string,
    userName: string
  ): Promise<SendEmailResult> {
    return this.sendWithTemplate(to, 'welcome', {
      userName,
      userEmail: to,
    });
  }

  /**
   * Send password reset email
   */
  async sendPasswordResetEmail(
    to: string,
    userName: string,
    resetUrl: string,
    expiryMinutes: number = 60
  ): Promise<SendEmailResult> {
    return this.sendWithTemplate(to, 'password_reset', {
      userName,
      userEmail: to,
      resetUrl,
      resetExpiry: `${expiryMinutes} dakika`,
    });
  }

  /**
   * Send password changed confirmation
   */
  async sendPasswordChangedEmail(
    to: string,
    userName: string
  ): Promise<SendEmailResult> {
    return this.sendWithTemplate(to, 'password_changed', {
      userName,
      userEmail: to,
    });
  }
}

/**
 * Create EmailService instance
 */
export function createEmailService(
  tenantPrisma: AnyPrismaClient,
  tenantId: string,
  companyId: string
): EmailService {
  return new EmailService(tenantPrisma, tenantId, companyId);
}
