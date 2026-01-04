import { NextRequest, NextResponse } from 'next/server';
import { getTenantPrismaFromRequest, getTenantFromRequest } from '@/lib/api/tenantContext';
import { createEmailService } from '@/lib/email';
import { generateToken, getTokenExpiryMinutes, buildPasswordResetUrl, getBaseUrl } from '@/lib/email/tokenUtils';
import { logger } from '@/lib/utils/logger';

/**
 * POST /api/auth/forgot-password
 * Request password reset email
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

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { success: false, message: 'Geçersiz e-posta adresi' },
        { status: 400 }
      );
    }

    // Find user by email
    const user = await tenantPrisma.user.findUnique({
      where: { email },
    });

    // Always return success to prevent email enumeration
    const successMessage = 'E-posta adresiniz kayıtlıysa şifre sıfırlama bağlantısı gönderildi.';

    if (!user) {
      return NextResponse.json({
        success: true,
        message: successMessage,
      });
    }

    // Check if user account is active
    if (user.status !== 'active') {
      // If pending activation, suggest resending activation email
      if (user.status === 'pending' && !user.emailVerified) {
        return NextResponse.json({
          success: false,
          message: 'Hesabınız henüz aktifleştirilmemiş. Önce hesabınızı aktifleştirin.',
          needsActivation: true,
        });
      }
      return NextResponse.json({
        success: true,
        message: successMessage,
      });
    }

    // Rate limiting - don't send if sent within last 2 minutes
    if (user.passwordResetSentAt) {
      const minutesSinceLast = (Date.now() - new Date(user.passwordResetSentAt).getTime()) / (1000 * 60);
      if (minutesSinceLast < 2) {
        return NextResponse.json(
          { success: false, message: 'Lütfen yeni şifre sıfırlama bağlantısı göndermek için 2 dakika bekleyin.' },
          { status: 429 }
        );
      }
    }

    // Generate password reset token (valid for 60 minutes)
    const passwordResetToken = generateToken();
    const passwordResetTokenExpiry = getTokenExpiryMinutes(60);

    // Update user with reset token
    await tenantPrisma.user.update({
      where: { id: user.id },
      data: {
        passwordResetToken,
        passwordResetTokenExpiry,
        passwordResetSentAt: new Date(),
      },
    });

    // Send password reset email
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
          const resetUrl = buildPasswordResetUrl(baseUrl, passwordResetToken, 'tr');

          const result = await emailService.sendPasswordResetEmail(
            user.email,
            user.name,
            resetUrl,
            60
          );

          if (result.success) {
            logger.info('Password reset email sent', {
              userId: user.id,
              email: user.email,
            }, 'auth-forgot-password');
          } else {
            logger.warn('Failed to send password reset email', {
              userId: user.id,
              error: result.error,
            }, 'auth-forgot-password');
          }
        } else {
          logger.warn('SMTP not enabled for password reset', {
            userId: user.id,
          }, 'auth-forgot-password');
        }
      }
    } catch (error) {
      logger.error('Error sending password reset email', {
        userId: user.id,
        error: error instanceof Error ? error.message : 'Unknown error',
      }, 'auth-forgot-password');
    }

    return NextResponse.json({
      success: true,
      message: successMessage,
    });
  } catch (error) {
    logger.error('Forgot password error', { error }, 'auth-forgot-password');
    return NextResponse.json(
      { success: false, message: 'İşlem sırasında bir hata oluştu' },
      { status: 500 }
    );
  }
}
