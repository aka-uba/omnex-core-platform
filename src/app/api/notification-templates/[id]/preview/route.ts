import { NextRequest, NextResponse } from 'next/server';
import { NotificationTemplateService } from '@/lib/notifications/NotificationTemplateService';
import { getTenantPrismaFromRequest } from '@/lib/api/tenantContext';
import { logger } from '@/lib/utils/logger';

/**
 * Email Template Styles - Inline HTML generators
 */
const EMAIL_STYLES = {
  corporate: {
    wrapper: 'background-color: #f5f5f5; padding: 40px 20px;',
    container: 'background-color: #ffffff; max-width: 600px; margin: 0 auto; border-radius: 4px; box-shadow: 0 2px 8px rgba(0,0,0,0.1);',
    header: 'background-color: #1a365d; color: #ffffff; padding: 30px; text-align: center;',
    headerTitle: 'margin: 0; font-size: 24px; font-weight: 600;',
    body: 'padding: 30px; color: #333333; line-height: 1.6;',
    footer: 'background-color: #f8f9fa; padding: 20px 30px; text-align: center; color: #666666; font-size: 12px; border-top: 1px solid #e9ecef;',
  },
  modern: {
    wrapper: 'background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 40px 20px;',
    container: 'background-color: #ffffff; max-width: 600px; margin: 0 auto; border-radius: 16px; overflow: hidden; box-shadow: 0 10px 40px rgba(0,0,0,0.2);',
    header: 'background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: #ffffff; padding: 40px; text-align: center;',
    headerTitle: 'margin: 0; font-size: 28px; font-weight: 700;',
    body: 'padding: 40px; color: #333333; line-height: 1.8;',
    footer: 'background-color: #f8f9fa; padding: 25px 40px; text-align: center; color: #888888; font-size: 13px;',
  },
  elegant: {
    wrapper: 'background-color: #faf9f7; padding: 40px 20px;',
    container: 'background-color: #ffffff; max-width: 600px; margin: 0 auto; border: 1px solid #d4af37; box-shadow: 0 4px 20px rgba(0,0,0,0.08);',
    header: 'background-color: #ffffff; color: #1a1a1a; padding: 40px; text-align: center; border-bottom: 2px solid #d4af37;',
    headerTitle: 'margin: 0; font-size: 26px; font-weight: 400; font-family: Georgia, serif; letter-spacing: 2px;',
    body: 'padding: 40px; color: #333333; line-height: 1.8; font-family: Georgia, serif;',
    footer: 'background-color: #1a1a1a; padding: 25px 40px; text-align: center; color: #d4af37; font-size: 12px;',
  },
  visionary: {
    wrapper: 'background-color: #0a0a0a; padding: 40px 20px;',
    container: 'background-color: #1a1a1a; max-width: 600px; margin: 0 auto; border-radius: 8px; border: 1px solid #333333;',
    header: 'background: linear-gradient(90deg, #00d4ff 0%, #7c3aed 100%); color: #ffffff; padding: 35px; text-align: center;',
    headerTitle: 'margin: 0; font-size: 26px; font-weight: 700; text-transform: uppercase; letter-spacing: 3px;',
    body: 'padding: 35px; color: #e0e0e0; line-height: 1.7; background-color: #1a1a1a;',
    footer: 'background-color: #0a0a0a; padding: 25px 35px; text-align: center; color: #666666; font-size: 12px; border-top: 1px solid #333333;',
  },
};

/**
 * Generate email HTML based on style and content
 */
function generateEmailHtml(
  style: keyof typeof EMAIL_STYLES,
  subject: string,
  content: string,
  prefix: string,
  suffix: string,
  signature: {
    enabled: boolean;
    userInfo: boolean;
    userAvatar: boolean;
    companyLogo: boolean;
    companyInfo: boolean;
  },
  company: {
    name?: string;
    logo?: string;
    address?: string;
    phone?: string;
    email?: string;
    website?: string;
  },
  user: {
    name?: string;
    email?: string;
    avatar?: string;
  }
): string {
  const s = EMAIL_STYLES[style] || EMAIL_STYLES.corporate;

  // Build content with prefix and suffix
  let bodyContent = '';
  if (prefix) {
    bodyContent += `<p style="margin-bottom: 20px;">${prefix}</p>`;
  }
  bodyContent += content || '<p>{{message}}</p>';
  if (suffix) {
    bodyContent += `<p style="margin-top: 20px;">${suffix}</p>`;
  }

  // Build signature
  let signatureHtml = '';
  if (signature.enabled) {
    signatureHtml = '<div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e0e0e0;">';

    if (signature.userInfo || signature.userAvatar) {
      signatureHtml += '<div style="display: flex; align-items: center; gap: 12px; margin-bottom: 15px;">';
      if (signature.userAvatar && user.avatar) {
        signatureHtml += `<img src="${user.avatar}" alt="${user.name || 'User'}" style="width: 48px; height: 48px; border-radius: 50%; object-fit: cover;" />`;
      } else if (signature.userAvatar) {
        signatureHtml += `<div style="width: 48px; height: 48px; border-radius: 50%; background-color: #667eea; color: white; display: flex; align-items: center; justify-content: center; font-weight: 600; font-size: 18px;">${(user.name || 'U').charAt(0).toUpperCase()}</div>`;
      }
      if (signature.userInfo) {
        signatureHtml += `<div><strong>${user.name || '{{userName}}'}</strong><br/><span style="color: #666; font-size: 13px;">${user.email || '{{userEmail}}'}</span></div>`;
      }
      signatureHtml += '</div>';
    }

    if (signature.companyLogo || signature.companyInfo) {
      signatureHtml += '<div style="margin-top: 15px;">';
      if (signature.companyLogo && company.logo) {
        signatureHtml += `<img src="${company.logo}" alt="${company.name || 'Company'}" style="max-height: 40px; margin-bottom: 10px;" />`;
      }
      if (signature.companyInfo) {
        signatureHtml += `<div style="color: #666; font-size: 12px;">`;
        if (company.name) signatureHtml += `<strong>${company.name}</strong><br/>`;
        if (company.address) signatureHtml += `${company.address}<br/>`;
        if (company.phone) signatureHtml += `Tel: ${company.phone}<br/>`;
        if (company.email) signatureHtml += `E-posta: ${company.email}<br/>`;
        if (company.website) signatureHtml += `<a href="${company.website}" style="color: #667eea;">${company.website}</a>`;
        signatureHtml += '</div>';
      }
      signatureHtml += '</div>';
    }

    signatureHtml += '</div>';
  }

  return `
<!DOCTYPE html>
<html lang="tr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${subject}</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">
  <div style="${s.wrapper}">
    <div style="${s.container}">
      <div style="${s.header}">
        ${company.logo && signature.companyLogo ? `<img src="${company.logo}" alt="${company.name || 'Logo'}" style="max-height: 50px; margin-bottom: 15px;" />` : ''}
        <h1 style="${s.headerTitle}">${subject || '{{subject}}'}</h1>
      </div>
      <div style="${s.body}">
        ${bodyContent}
        ${signatureHtml}
      </div>
      <div style="${s.footer}">
        <p style="margin: 0 0 10px 0;">${company.name || '{{companyName}}'}</p>
        <p style="margin: 0;">&copy; ${new Date().getFullYear()} Tüm hakları saklıdır.</p>
      </div>
    </div>
  </div>
</body>
</html>`;
}

/**
 * POST /api/notification-templates/[id]/preview
 * Generate preview HTML for an email template
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const tenantPrisma = await getTenantPrismaFromRequest(request);

    if (!tenantPrisma) {
      return NextResponse.json(
        { success: false, error: 'Tenant context not found' },
        { status: 400 }
      );
    }

    const service = new NotificationTemplateService(tenantPrisma);
    const template = await service.getTemplate(id);

    if (!template) {
      return NextResponse.json(
        { success: false, error: 'Template not found' },
        { status: 404 }
      );
    }

    // Get company info
    let company: {
      name?: string;
      logo?: string;
      address?: string;
      phone?: string;
      email?: string;
      website?: string;
    } = {};

    if (template.companyId) {
      const companyData = await tenantPrisma.company.findUnique({
        where: { id: template.companyId },
        select: {
          name: true,
          logo: true,
          address: true,
          phone: true,
          email: true,
          website: true,
        },
      });
      if (companyData) {
        company = {
          name: companyData.name || undefined,
          logo: companyData.logo || undefined,
          address: companyData.address || undefined,
          phone: companyData.phone || undefined,
          email: companyData.email || undefined,
          website: companyData.website || undefined,
        };
      }
    }

    // Sample user data for preview
    const user = {
      name: 'Ahmet Yılmaz',
      email: 'ahmet.yilmaz@ornek.com',
      avatar: undefined,
    };

    // Generate HTML
    const style = (template.emailTemplateStyle as keyof typeof EMAIL_STYLES) || 'corporate';
    const html = generateEmailHtml(
      style,
      template.emailSubject || 'E-posta Konusu',
      template.emailPlainText || template.emailHtmlTemplate || 'Merhaba {{userName}},\n\nBu bir örnek e-posta içeriğidir.\n\nSaygılarımızla.',
      template.defaultMessagePrefix || '',
      template.defaultMessageSuffix || '',
      {
        enabled: template.emailSignatureEnabled,
        userInfo: template.emailSignatureUserInfo,
        userAvatar: template.emailSignatureUserAvatar,
        companyLogo: template.emailSignatureCompanyLogo,
        companyInfo: template.emailSignatureCompanyInfo,
      },
      company,
      user
    );

    // Replace sample variables for preview
    const previewHtml = html
      .replace(/\{\{userName\}\}/g, user.name)
      .replace(/\{\{userEmail\}\}/g, user.email)
      .replace(/\{\{companyName\}\}/g, company.name || 'Demo Şirket')
      .replace(/\{\{subject\}\}/g, template.emailSubject || 'E-posta Konusu')
      .replace(/\{\{message\}\}/g, 'Bu bir örnek mesaj içeriğidir. Gerçek kullanımda bu alan dinamik olarak doldurulacaktır.')
      .replace(/\{\{date\}\}/g, new Date().toLocaleDateString('tr-TR'))
      .replace(/\{\{time\}\}/g, new Date().toLocaleTimeString('tr-TR'));

    return NextResponse.json({
      success: true,
      data: {
        html: previewHtml,
        style: style,
        subject: template.emailSubject,
      },
    });
  } catch (error: unknown) {
    logger.error('Failed to generate template preview', error, 'api-notification-templates');
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to generate preview',
      },
      { status: 500 }
    );
  }
}

/**
 * GET /api/notification-templates/[id]/preview
 * Generate preview HTML for an email template (using template data from DB)
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  // Redirect to POST for consistency
  return POST(request, { params });
}
