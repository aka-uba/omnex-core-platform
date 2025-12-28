/**
 * LayoutWrapper v2
 * Ana layout wrapper - responsive layout seçimi
 * Login/Register/Welcome sayfaları layoutsuz
 * Authentication kontrolü burada yapılır
 */

'use client';

import { useState, useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { LayoutProvider, useLayout } from './core/LayoutProvider';
import { MobileLayout } from './mobile/MobileLayout';
import { SidebarLayout } from './sidebar/SidebarLayout';
import { TopLayout } from './top/TopLayout';
import { useAuth } from '@/hooks/useAuth';

interface LayoutWrapperProps {
  children: React.ReactNode;
}

// Auth gerektirmeyen public sayfalar
const PUBLIC_PATHS = [
  '/auth/login',
  '/auth/register',
  '/login',
  '/register',
  '/welcome',
  '/setup',
  '/public/',
  '/share-files',
];

// Path'in public olup olmadığını kontrol et
function isPublicPath(pathname: string): boolean {
  return PUBLIC_PATHS.some(path => pathname.includes(path));
}

function LayoutContent({ children }: LayoutWrapperProps) {
  const { currentLayout } = useLayout();
  const pathname = usePathname();
  const router = useRouter();
  const { user, loading } = useAuth();
  const [mounted, setMounted] = useState(false);

  // Client-side mount
  useEffect(() => {
    setMounted(true);
  }, []);

  // Auth kontrolü - login olmamış kullanıcıları login sayfasına yönlendir
  useEffect(() => {
    if (!mounted || loading) return;

    const isPublic = isPublicPath(pathname || '');

    // Login olmamış ve public sayfa değilse -> login'e yönlendir
    if (!user && !isPublic) {
      const locale = pathname?.split('/')[1] || 'tr';
      // Mevcut URL'i returnUrl olarak kaydet
      const returnUrl = encodeURIComponent(pathname || '/');
      router.replace(`/${locale}/auth/login?returnUrl=${returnUrl}`);
    }
  }, [mounted, loading, user, pathname, router]);

  // Login, Register, Welcome sayfaları layoutsuz
  const isAuthPage =
    pathname?.includes('/login') ||
    pathname?.includes('/register') ||
    pathname?.includes('/welcome');

  if (isAuthPage) {
    return <>{children}</>;
  }

  // Server-side: render nothing to prevent hydration mismatch
  // Client-side: render correct layout from localStorage
  if (!mounted) {
    return null;
  }

  // Loading state - auth henüz kontrol ediliyor
  if (loading) {
    return null;
  }

  // Login olmamış ve public sayfa değilse -> hiçbir şey gösterme (redirect olacak)
  if (!user && !isPublicPath(pathname || '')) {
    return null;
  }

  // Responsive layout seçimi
  return (
    <>
      {currentLayout === 'mobile' ? (
        <MobileLayout>{children}</MobileLayout>
      ) : currentLayout === 'top' ? (
        <TopLayout>{children}</TopLayout>
      ) : (
        <SidebarLayout>{children}</SidebarLayout>
      )}
    </>
  );
}

export function LayoutWrapper({ children }: LayoutWrapperProps) {
  const { user } = useAuth();

  return (
    <LayoutProvider
      {...(user?.id ? { userId: user.id } : {})}
      {...(user?.role ? { userRole: user.role } : {})}
    >
      <LayoutContent>{children}</LayoutContent>
    </LayoutProvider>
  );
}

