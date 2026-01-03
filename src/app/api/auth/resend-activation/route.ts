import { NextRequest, NextResponse } from 'next/server';
import { getTenantPrismaFromRequest, getTenantFromRequest } from '@/lib/api/tenantContext';
import { createEmailService } from '@/lib/email';
import { generateToken, getTokenExpiry, buildActivationUrl, getBaseUrl } from '@/lib/email/tokenUtils';
import { logger } from '@/lib/utils/logger';

/**
 * POST /api/auth/resend-activation
 * Resend activation email to user
 */
export async function POST(request: NextRequest) {
  try {
    const tenantPrisma = await getTenantPrismaFromRequest(request);
    const tenantContext = await getTenantFromRequest(request);

    if (!tenantPrisma || !tenantContext) {
      return NextResponse.json(
        { success: false, message: 'Tenant context is required' },
        { status: 400 }
      );
    }

    const body = await request.json();
    const { email } = body;

    if (!email) {
      return NextResponse.json(
        { success: false, message: 'E-posta adresi gerekli' },
        { status: 400 }
      );
    }

    // Find user by email
    const user = await tenantPrisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      // Don't reveal if email exists or not
      return NextResponse.json({
        success: true,
        message: 'E-posta adresiniz kayıtlıysa aktivasyon bağlantısı gönderildi.',
      });
    }

    // Check if already activated
    if (user.emailVerified && user.status === 'active') {
      return NextResponse.json({
        success: true,
        message: 'Hesabınız zaten aktif. Giriş yapabilirsiniz.',
        alreadyActivated: true,
      });
    }

    // Rate limiting - don't send if sent within last 2 minutes
    if (user.activationSentAt) {
      const minutesSinceLast = (Date.now() - new Date(user.activationSentAt).getTime()) / (1000 * 60);
      if (minutesSinceLast < 2) {
        return NextResponse.json(
          { success: false, message: 'Lütfen yeni aktivasyon bağlantısı göndermek için 2 dakika bekleyin.' },
          { status: 429 }
        );
      }
    }

    // Generate new activation token
    const activationToken = generateToken();
    const activationTokenExpiry = getTokenExpiry(24);

    // Update user with new token
    await tenantPrisma.user.update({
      where: { id: user.id },
      data: {
        activationToken,
        activationTokenExpiry,
        activationSentAt: new Date(),
      },
    });

    // Send activation email
    let emailSent = false;
    try {
      const firstCompany = await tenantPrisma.company.findFirst({
        select: { id: true },
        orderBy: { createdAt: 'asc' },
      });

      if (firstCompany) {
        const emailService = createEmailService(
          tenantPrisma,
          tenantContext.id,
          firstCompany.id
        );

        const smtpSettings = await emailService.getSMTPSettings();

        if (smtpSettings?.enabled) {
          const baseUrl = getBaseUrl(request);
          const activationUrl = buildActivationUrl(baseUrl, activationToken, 'tr');

          const result = await emailService.sendActivationEmail(
            user.email,
            user.name,
            activationUrl,
            24
          );

          emailSent = result.success;
          if (result.success) {
            logger.info('Activation email resent', {
              userId: user.id,
              email: user.email,
            }, 'auth-resend-activation');
          } else {
            logger.warn('Failed to resend activation email', {
              userId: user.id,
              error: result.error,
            }, 'auth-resend-activation');
          }
        } else {
          return NextResponse.json(
            { success: false, message: 'E-posta gönderimi yapılandırılmamış. Yönetici ile iletişime geçin.' },
            { status: 503 }
          );
        }
      }
    } catch (error) {
      logger.error('Error resending activation email', {
        userId: user.id,
        error: error instanceof Error ? error.message : 'Unknown error',
      }, 'auth-resend-activation');
    }

    return NextResponse.json({
      success: true,
      message: emailSent
        ? 'Aktivasyon bağlantısı e-posta adresinize gönderildi.'
        : 'E-posta adresiniz kayıtlıysa aktivasyon bağlantısı gönderildi.',
      emailSent,
    });
  } catch (error) {
    logger.error('Resend activation error', { error }, 'auth-resend-activation');
    return NextResponse.json(
      { success: false, message: 'İşlem sırasında bir hata oluştu' },
      { status: 500 }
    );
  }
}
