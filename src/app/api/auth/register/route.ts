import { NextRequest, NextResponse } from 'next/server';
import { getTenantPrismaFromRequest, getTenantFromRequest } from '@/lib/api/tenantContext';
import { registerSchema } from '@/lib/schemas/auth';
import bcrypt from 'bcryptjs';
import { createEmailService } from '@/lib/email';
import { generateToken, getTokenExpiry, buildActivationUrl, getBaseUrl } from '@/lib/email/tokenUtils';
import { logger } from '@/lib/utils/logger';
import { ZodError } from 'zod';

export async function POST(request: NextRequest) {
  try {
    const tenantPrisma = await getTenantPrismaFromRequest(request);
    const tenantContext = await getTenantFromRequest(request);

    if (!tenantPrisma || !tenantContext) {
      return NextResponse.json(
        { success: false, message: 'Tenant context is required for registration' },
        { status: 400 }
      );
    }

    const body = await request.json();
    const validatedData = registerSchema.parse(body);

    // Kullanıcı adı kontrolü
    const existingUsername = await tenantPrisma.user.findUnique({
      where: { username: validatedData.username },
    });

    if (existingUsername) {
      return NextResponse.json(
        { success: false, message: 'Bu kullanıcı adı zaten kullanılıyor' },
        { status: 400 }
      );
    }

    // Email kontrolü
    const existingEmail = await tenantPrisma.user.findUnique({
      where: { email: validatedData.email },
    });

    if (existingEmail) {
      return NextResponse.json(
        { success: false, message: 'Bu e-posta adresi zaten kayıtlı' },
        { status: 400 }
      );
    }

    // Şifreyi hashle
    const hashedPassword = await bcrypt.hash(validatedData.password, 10);

    // Aktivasyon token oluştur
    const activationToken = generateToken();
    const activationTokenExpiry = getTokenExpiry(24); // 24 saat geçerli

    // Yeni kullanıcı oluştur
    const newUser = await tenantPrisma.user.create({
      data: {
        name: validatedData.name,
        username: validatedData.username,
        email: validatedData.email,
        password: hashedPassword,
        role: 'ClientUser',
        status: 'pending',
        emailVerified: false,
        activationToken,
        activationTokenExpiry,
        activationSentAt: new Date(),
      },
    });

    // Aktivasyon maili gönder
    let emailSent = false;
    let emailError: string | undefined;

    try {
      // Get first company for SMTP settings
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

        // Check if SMTP is enabled
        const smtpSettings = await emailService.getSMTPSettings();

        if (smtpSettings?.enabled) {
          const baseUrl = getBaseUrl(request);
          const activationUrl = buildActivationUrl(baseUrl, activationToken, 'tr');

          const result = await emailService.sendActivationEmail(
            newUser.email,
            newUser.name,
            activationUrl,
            24
          );

          emailSent = result.success;
          if (!result.success) {
            emailError = result.error;
            logger.warn('Failed to send activation email', {
              userId: newUser.id,
              email: newUser.email,
              error: result.error,
            }, 'auth-register');
          } else {
            logger.info('Activation email sent', {
              userId: newUser.id,
              email: newUser.email,
              messageId: result.messageId,
            }, 'auth-register');
          }
        } else {
          logger.info('SMTP not enabled, skipping activation email', {
            userId: newUser.id,
          }, 'auth-register');
        }
      }
    } catch (error) {
      emailError = error instanceof Error ? error.message : 'Unknown error';
      logger.error('Error sending activation email', {
        userId: newUser.id,
        error: emailError,
      }, 'auth-register');
    }

    return NextResponse.json({
      success: true,
      message: emailSent
        ? 'Kayıt başarılı. Aktivasyon bağlantısı e-posta adresinize gönderildi.'
        : 'Kayıt başarılı. Hesabınız yönetici onayı beklemektedir.',
      user: {
        id: newUser.id,
        name: newUser.name,
        username: newUser.username || undefined,
        email: newUser.email,
        role: newUser.role,
        status: newUser.status,
        emailVerified: newUser.emailVerified,
      },
      emailSent,
      ...(emailError && process.env.NODE_ENV === 'development' ? { emailError } : {}),
    });
  } catch (error) {
    if (error instanceof ZodError) {
      // Zod validation hatasını detaylı göster
      const issues = error.issues || [];
      const firstError = issues[0];
      const fieldName = firstError?.path?.join('.') || 'form';
      const message = firstError?.message || 'Geçersiz veri';

      logger.warn('Registration validation error', {
        issues,
        fieldName,
        message,
      }, 'auth-register');

      return NextResponse.json(
        {
          success: false,
          message: `${message}`,
          field: fieldName,
          errors: issues.map(e => ({
            field: e.path.join('.'),
            message: e.message,
          })),
        },
        { status: 400 }
      );
    }

    logger.error('Register error', { error }, 'auth-register');
    return NextResponse.json(
      { success: false, message: 'Kayıt sırasında bir hata oluştu' },
      { status: 500 }
    );
  }
}




