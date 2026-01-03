import { NextRequest, NextResponse } from 'next/server';
import { getTenantPrismaFromRequest, getTenantFromRequest } from '@/lib/api/tenantContext';
import { createEmailService } from '@/lib/email';
import { isTokenExpired } from '@/lib/email/tokenUtils';
import { logger } from '@/lib/utils/logger';
import bcrypt from 'bcryptjs';
import { z } from 'zod';

// Password validation schema
const resetPasswordSchema = z.object({
  token: z.string().min(1, 'Token gerekli'),
  password: z.string()
    .min(8, 'Şifre en az 8 karakter olmalıdır')
    .regex(/[A-Z]/, 'Şifre en az bir büyük harf içermelidir')
    .regex(/[a-z]/, 'Şifre en az bir küçük harf içermelidir')
    .regex(/[0-9]/, 'Şifre en az bir rakam içermelidir'),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: 'Şifreler eşleşmiyor',
  path: ['confirmPassword'],
});

/**
 * POST /api/auth/reset-password
 * Reset password using token
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

    // Validate input
    let validatedData;
    try {
      validatedData = resetPasswordSchema.parse(body);
    } catch (error) {
      if (error instanceof z.ZodError) {
        const firstError = error.errors[0];
        return NextResponse.json(
          { success: false, message: firstError.message },
          { status: 400 }
        );
      }
      return NextResponse.json(
        { success: false, message: 'Geçersiz istek' },
        { status: 400 }
      );
    }

    const { token, password } = validatedData;

    // Find user with this reset token
    const user = await tenantPrisma.user.findFirst({
      where: {
        passwordResetToken: token,
      },
    });

    if (!user) {
      return NextResponse.json(
        { success: false, message: 'Geçersiz veya süresi dolmuş şifre sıfırlama bağlantısı' },
        { status: 400 }
      );
    }

    // Check if token is expired
    if (isTokenExpired(user.passwordResetTokenExpiry)) {
      return NextResponse.json(
        { success: false, message: 'Şifre sıfırlama bağlantısının süresi dolmuş. Yeni bağlantı talep edin.', expired: true },
        { status: 400 }
      );
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(password, 12);

    // Update user password and clear reset token
    await tenantPrisma.user.update({
      where: { id: user.id },
      data: {
        password: hashedPassword,
        passwordResetToken: null,
        passwordResetTokenExpiry: null,
        passwordResetSentAt: null,
      },
    });

    logger.info('Password reset successful', {
      userId: user.id,
      email: user.email,
    }, 'auth-reset-password');

    // Send password changed confirmation email
    let confirmationSent = false;
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
          const result = await emailService.sendPasswordChangedEmail(
            user.email,
            user.name
          );

          confirmationSent = result.success;
          if (result.success) {
            logger.info('Password changed confirmation sent', {
              userId: user.id,
              email: user.email,
            }, 'auth-reset-password');
          }
        }
      }
    } catch (error) {
      logger.warn('Failed to send password changed confirmation', {
        userId: user.id,
        error: error instanceof Error ? error.message : 'Unknown error',
      }, 'auth-reset-password');
    }

    return NextResponse.json({
      success: true,
      message: 'Şifreniz başarıyla değiştirildi. Yeni şifrenizle giriş yapabilirsiniz.',
    });
  } catch (error) {
    logger.error('Reset password error', { error }, 'auth-reset-password');
    return NextResponse.json(
      { success: false, message: 'Şifre sıfırlama sırasında bir hata oluştu' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/auth/reset-password?token=xxx
 * Validate password reset token
 */
export async function GET(request: NextRequest) {
  try {
    const tenantPrisma = await getTenantPrismaFromRequest(request);

    if (!tenantPrisma) {
      return NextResponse.json(
        { success: false, message: 'Tenant context is required' },
        { status: 400 }
      );
    }

    const searchParams = request.nextUrl.searchParams;
    const token = searchParams.get('token');

    if (!token) {
      return NextResponse.json(
        { success: false, valid: false, message: 'Token gerekli' },
        { status: 400 }
      );
    }

    // Find user with this reset token
    const user = await tenantPrisma.user.findFirst({
      where: {
        passwordResetToken: token,
      },
      select: {
        id: true,
        name: true,
        email: true,
        passwordResetTokenExpiry: true,
      },
    });

    if (!user) {
      return NextResponse.json({
        success: false,
        valid: false,
        message: 'Geçersiz şifre sıfırlama bağlantısı',
      });
    }

    // Check if token is expired
    if (isTokenExpired(user.passwordResetTokenExpiry)) {
      return NextResponse.json({
        success: false,
        valid: false,
        expired: true,
        message: 'Şifre sıfırlama bağlantısının süresi dolmuş',
      });
    }

    return NextResponse.json({
      success: true,
      valid: true,
      user: {
        name: user.name,
        email: user.email,
      },
    });
  } catch (error) {
    logger.error('Reset password token check error', { error }, 'auth-reset-password');
    return NextResponse.json(
      { success: false, message: 'Kontrol sırasında bir hata oluştu' },
      { status: 500 }
    );
  }
}
