import { NextRequest, NextResponse } from 'next/server';
import { getTenantPrismaFromRequest, getTenantFromRequest } from '@/lib/api/tenantContext';
import { createEmailService } from '@/lib/email';
import { isTokenExpired } from '@/lib/email/tokenUtils';
import { logger } from '@/lib/utils/logger';

/**
 * POST /api/auth/activate
 * Activate user account using activation token
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
    const { token } = body;

    if (!token) {
      return NextResponse.json(
        { success: false, message: 'Aktivasyon token gerekli' },
        { status: 400 }
      );
    }

    // Find user with this activation token
    const user = await tenantPrisma.user.findFirst({
      where: {
        activationToken: token,
      },
    });

    if (!user) {
      return NextResponse.json(
        { success: false, message: 'Geçersiz aktivasyon bağlantısı' },
        { status: 400 }
      );
    }

    // Check if already activated
    if (user.emailVerified && user.status === 'active') {
      return NextResponse.json(
        { success: true, message: 'Hesabınız zaten aktif', alreadyActivated: true },
        { status: 200 }
      );
    }

    // Check if token is expired
    if (isTokenExpired(user.activationTokenExpiry)) {
      return NextResponse.json(
        { success: false, message: 'Aktivasyon bağlantısının süresi dolmuş. Yeni bağlantı talep edin.', expired: true },
        { status: 400 }
      );
    }

    // Activate user
    const updatedUser = await tenantPrisma.user.update({
      where: { id: user.id },
      data: {
        emailVerified: true,
        status: 'active',
        activatedAt: new Date(),
        activationToken: null,
        activationTokenExpiry: null,
      },
    });

    logger.info('User activated', {
      userId: user.id,
      email: user.email,
    }, 'auth-activate');

    // Send welcome email
    let welcomeEmailSent = false;
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
          const result = await emailService.sendWelcomeEmail(
            user.email,
            user.name
          );

          welcomeEmailSent = result.success;
          if (result.success) {
            logger.info('Welcome email sent', {
              userId: user.id,
              email: user.email,
            }, 'auth-activate');
          }
        }
      }
    } catch (error) {
      logger.warn('Failed to send welcome email', {
        userId: user.id,
        error: error instanceof Error ? error.message : 'Unknown error',
      }, 'auth-activate');
    }

    return NextResponse.json({
      success: true,
      message: 'Hesabınız başarıyla aktifleştirildi. Giriş yapabilirsiniz.',
      user: {
        id: updatedUser.id,
        name: updatedUser.name,
        email: updatedUser.email,
        status: updatedUser.status,
        emailVerified: updatedUser.emailVerified,
      },
      welcomeEmailSent,
    });
  } catch (error) {
    logger.error('Activation error', { error }, 'auth-activate');
    return NextResponse.json(
      { success: false, message: 'Aktivasyon sırasında bir hata oluştu' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/auth/activate?token=xxx
 * Check activation token validity
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
        { success: false, message: 'Aktivasyon token gerekli' },
        { status: 400 }
      );
    }

    // Find user with this activation token
    const user = await tenantPrisma.user.findFirst({
      where: {
        activationToken: token,
      },
      select: {
        id: true,
        name: true,
        email: true,
        emailVerified: true,
        status: true,
        activationTokenExpiry: true,
      },
    });

    if (!user) {
      return NextResponse.json({
        success: false,
        valid: false,
        message: 'Geçersiz aktivasyon bağlantısı',
      });
    }

    // Check if already activated
    if (user.emailVerified && user.status === 'active') {
      return NextResponse.json({
        success: true,
        valid: true,
        alreadyActivated: true,
        message: 'Hesabınız zaten aktif',
      });
    }

    // Check if token is expired
    if (isTokenExpired(user.activationTokenExpiry)) {
      return NextResponse.json({
        success: false,
        valid: false,
        expired: true,
        message: 'Aktivasyon bağlantısının süresi dolmuş',
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
    logger.error('Activation check error', { error }, 'auth-activate');
    return NextResponse.json(
      { success: false, message: 'Kontrol sırasında bir hata oluştu' },
      { status: 500 }
    );
  }
}
