import { NextRequest, NextResponse } from 'next/server';
import { verifyAccessToken } from '@/lib/auth/jwt';
import { cookies } from 'next/headers';

/**
 * Check if setup page should be accessible
 * Production'da sadece SuperAdmin erişebilir
 */
export async function GET(request: NextRequest) {
  try {
    const isProduction = process.env.NODE_ENV === 'production';
    const isDevelopment = process.env.NODE_ENV === 'development';

    // Development modda her zaman erişilebilir
    if (isDevelopment) {
      return NextResponse.json({
        allowed: true,
        environment: 'development',
      });
    }

    // Production'da SuperAdmin kontrolü yap
    if (isProduction) {
      // Cookie'den token al
      const cookieStore = await cookies();
      const token = cookieStore.get('accessToken')?.value;

      if (!token) {
        return NextResponse.json({
          allowed: false,
          reason: 'Bu sayfaya erişmek için SuperAdmin olarak giriş yapmalısınız.',
          requiresAuth: true,
        }, { status: 401 });
      }

      // Token'ı doğrula
      const payload = await verifyAccessToken(token);

      if (!payload || payload.role !== 'SuperAdmin') {
        return NextResponse.json({
          allowed: false,
          reason: 'Bu sayfaya sadece SuperAdmin erişebilir.',
          requiresAuth: true,
        }, { status: 403 });
      }

      // SuperAdmin ise erişime izin ver
      return NextResponse.json({
        allowed: true,
        environment: 'production',
        user: {
          email: payload.email,
          role: payload.role,
        },
      });
    }

    // Diğer ortamlarda (staging vb.) ALLOW_SETUP_PAGE kontrolü
    if (process.env.ALLOW_SETUP_PAGE === 'true') {
      return NextResponse.json({
        allowed: true,
        environment: process.env.NODE_ENV || 'unknown',
      });
    }

    return NextResponse.json({
      allowed: false,
      reason: 'Setup sayfası bu ortamda devre dışı.',
    }, { status: 403 });
  } catch (error: any) {
    return NextResponse.json({
      allowed: false,
      reason: 'Yetkilendirme hatası. Lütfen tekrar giriş yapın.',
      requiresAuth: true,
      error: error.message,
    }, { status: 401 });
  }
}
