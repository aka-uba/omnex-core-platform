import { NextRequest, NextResponse } from 'next/server';
import { loginSchema } from '@/lib/schemas/auth';
import bcrypt from 'bcryptjs';
import { corePrisma } from '@/lib/corePrisma';
import { getTenantPrisma } from '@/lib/dbSwitcher';
import { getTenantDbUrl } from '@/lib/services/tenantService';
import { generateAccessToken, generateRefreshToken, type JWTPayload } from '@/lib/auth/jwt';
import { createSession } from '@/lib/auth/session';
import { successResponse, errorResponse, unauthorizedResponse } from '@/lib/api/response';

// Helper to get security settings from tenant's general settings
async function getSecuritySettings(tenantPrisma: any): Promise<{
  sessionTimeout: number;
  rememberMeDuration: number;
}> {
  try {
    const settings = await tenantPrisma.generalSettings.findFirst();
    return {
      sessionTimeout: settings?.sessionTimeout || 30, // default 30 minutes
      rememberMeDuration: settings?.rememberMeDuration || 30, // default 30 days
    };
  } catch {
    return { sessionTimeout: 30, rememberMeDuration: 30 };
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validatedData = loginSchema.parse(body);

    // Tenant slug'ı body'den al (opsiyonel)
    const tenantSlug = body.tenantSlug || null;

    let user = null;
    let tenantContext = null;

    // Eğer tenant slug belirtilmişse, sadece o tenant'ta ara
    if (tenantSlug) {
      const tenant = await corePrisma.tenant.findUnique({
        where: { slug: tenantSlug },
      });

      if (tenant && tenant.status === 'active') {
        const dbUrl = getTenantDbUrl(tenant);
        const tenantPrisma = getTenantPrisma(dbUrl);

        user = await tenantPrisma.user.findFirst({
          where: {
            OR: [
              { username: validatedData.username },
              { email: validatedData.username },
            ],
          },
          select: {
            id: true,
            name: true,
            username: true,
            email: true,
            password: true,
            role: true,
            status: true,
            profilePicture: true,
            emailVerified: true,
          },
        });

        if (user) {
          tenantContext = {
            id: tenant.id,
            slug: tenant.slug,
            name: tenant.name,
            dbUrl,
          };
        }
      }
    } else {
      // Tenant slug yoksa, tüm aktif tenant'larda ara
      // Cache kullanarak performansı artır (tenant context cache zaten var)
      const tenants = await corePrisma.tenant.findMany({
        where: { status: 'active' },
        orderBy: { createdAt: 'asc' }, // İlk oluşturulan tenant'tan başla
        take: 10, // Maksimum 10 tenant'ta ara (performans için)
      });

      if (tenants.length === 0) {
        return unauthorizedResponse(
          'Sistemde aktif tenant bulunamadı. Lütfen önce bir tenant oluşturun veya yönetici ile iletişime geçin.'
        );
      }

      for (const tenant of tenants) {
        try {
          const dbUrl = getTenantDbUrl(tenant);
          const tenantPrisma = getTenantPrisma(dbUrl);

          const foundUser = await tenantPrisma.user.findFirst({
            where: {
              OR: [
                { username: validatedData.username },
                { email: validatedData.username },
              ],
            },
            select: {
              id: true,
              name: true,
              username: true,
              email: true,
              password: true,
              role: true,
              status: true,
              profilePicture: true,
              emailVerified: true,
            },
          });

          if (foundUser) {
            user = foundUser;
            tenantContext = {
              id: tenant.id,
              slug: tenant.slug,
              name: tenant.name,
              dbUrl,
            };
            break; // Kullanıcı bulundu, döngüden çık
          }
        } catch (error) {
          // Tenant DB'ye erişilemiyorsa devam et
          continue;
        }
      }
    }

    if (!user) {
      // Eğer hiç tenant yoksa, daha açıklayıcı mesaj
      if (!tenantSlug) {
        const tenantCount = await corePrisma.tenant.count({ where: { status: 'active' } });

        if (tenantCount === 0) {
          return NextResponse.json(
            {
              success: false,
              message: 'Sistemde aktif tenant bulunamadı. Lütfen önce bir tenant oluşturun veya yönetici ile iletişime geçin.'
            },
            { status: 401 }
          );
        }

        // Tenant'lar var ama kullanıcı bulunamadı
        const tenants = await corePrisma.tenant.findMany({
          where: { status: 'active' },
          select: { slug: true, name: true },
        });

        return NextResponse.json(
          {
            success: false,
            message: `Kullanıcı bulunamadı. ${tenantCount} aktif tenant'ta arama yapıldı: ${tenants.map(t => t.slug).join(', ')}. Lütfen tenant DB'lerinde kullanıcı oluşturduğunuzdan emin olun.`
          },
          { status: 401 }
        );
      }

      return unauthorizedResponse(
        `Kullanıcı "${validatedData.username}" tenant "${tenantSlug}" içinde bulunamadı.`
      );
    }

    // Şifre kontrolü
    if (!user.password) {
      return unauthorizedResponse('Kullanıcı adı veya şifre hatalı');
    }

    const isPasswordValid = await bcrypt.compare(
      validatedData.password,
      user.password
    );

    if (!isPasswordValid) {
      return unauthorizedResponse('Kullanıcı adı veya şifre hatalı');
    }

    // Kullanıcı durumu kontrolü
    if (user.status !== 'active') {
      // Email doğrulanmamışsa aktivasyon bağlantısı hatırlatması
      if (user.status === 'pending' && user.emailVerified === false) {
        return errorResponse(
          'EMAIL_NOT_VERIFIED',
          'E-posta adresiniz henüz doğrulanmamış. Lütfen e-postanıza gönderilen aktivasyon bağlantısını tıklayın.',
          { needsActivation: true },
          403
        );
      }

      return errorResponse(
        'USER_INACTIVE',
        user.status === 'pending'
          ? 'Hesabınız henüz onaylanmamış. Lütfen yönetici onayını bekleyin.'
          : 'Hesabınız aktif değil. Lütfen yönetici ile iletişime geçin.',
        null,
        403
      );
    }

    // Get security settings and update last active
    let securitySettings = { sessionTimeout: 30, rememberMeDuration: 30 };
    if (tenantContext) {
      const tenantPrisma = getTenantPrisma(tenantContext.dbUrl);

      // Get security settings for token expiration
      securitySettings = await getSecuritySettings(tenantPrisma);

      // Update last active time
      await tenantPrisma.user.update({
        where: { id: user.id },
        data: { lastActive: new Date() },
      });
    }

    // Check if rememberMe is enabled
    const rememberMe = body.rememberMe === true;

    // Generate JWT tokens with dynamic expiration from security settings
    const tokenPayload: JWTPayload = {
      userId: user.id,
      tenantSlug: tenantContext?.slug || '',
      role: user.role,
      email: user.email,
      ...(user.username ? { username: user.username } : {}),
    };

    // If rememberMe is true, use rememberMeDuration (days), otherwise use sessionTimeout (minutes)
    const accessToken = rememberMe
      ? generateAccessToken(tokenPayload, securitySettings.rememberMeDuration * 24 * 60) // convert days to minutes
      : generateAccessToken(tokenPayload, securitySettings.sessionTimeout);

    const refreshToken = generateRefreshToken(tokenPayload, securitySettings.rememberMeDuration);

    // Create session
    const sessionId = await createSession(user.id, tenantContext?.slug || '');

    // Calculate cookie maxAge based on rememberMe and security settings
    const accessTokenMaxAge = rememberMe
      ? 60 * 60 * 24 * securitySettings.rememberMeDuration // rememberMeDuration in days
      : 60 * securitySettings.sessionTimeout; // sessionTimeout in minutes
    const refreshTokenMaxAge = 60 * 60 * 24 * securitySettings.rememberMeDuration;

    // Başarılı giriş - kullanıcı bilgilerini ve token'ları döndür
    const response = successResponse({
      user: {
        id: user.id,
        name: user.name,
        username: user.username || undefined,
        email: user.email,
        role: user.role,
        status: user.status,
        profilePicture: user.profilePicture || undefined,
        tenantSlug: tenantContext?.slug,
      },
      accessToken,
      refreshToken,
      sessionId,
      expiresIn: rememberMe ? securitySettings.rememberMeDuration * 24 * 60 : securitySettings.sessionTimeout, // in minutes
    });

    // Set accessToken cookie for server-side auth
    response.cookies.set('accessToken', accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: accessTokenMaxAge,
      path: '/',
    });

    // Set refreshToken cookie
    response.cookies.set('refreshToken', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: refreshTokenMaxAge,
      path: '/',
    });

    // Set tenant slug cookie for development/localhost (when tenant context is available)
    if (tenantContext?.slug) {
      response.cookies.set('tenant-slug', tenantContext.slug, {
        httpOnly: false, // Allow client-side access for debugging
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 60 * 60 * 24 * 7, // 7 days
        path: '/',
      });
    }

    return response;
  } catch (error) {
    if (error instanceof Error && error.name === 'ZodError') {
      return errorResponse('VALIDATION_ERROR', 'Geçersiz form verisi', null, 400);
    }

    console.error('Login error:', error);
    return errorResponse('INTERNAL_ERROR', 'Giriş sırasında bir hata oluştu', null, 500);
  }
}

