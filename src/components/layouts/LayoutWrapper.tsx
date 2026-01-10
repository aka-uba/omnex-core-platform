/**
 * LayoutWrapper v2
 * Ana layout wrapper - responsive layout seçimi
 * Login/Register/Welcome sayfaları layoutsuz
 * Authentication kontrolü burada yapılır
 */

'use client';

import { useState, useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { Skeleton, Box } from '@mantine/core';
import { LayoutProvider, useLayout } from './core/LayoutProvider';
import { MobileLayout } from './mobile/MobileLayout';
import { SidebarLayout } from './sidebar/SidebarLayout';
import { TopLayout } from './top/TopLayout';
import { useAuth } from '@/hooks/useAuth';
import { useCompany } from '@/context/CompanyContext';
import { SessionTimeoutWarning } from '@/components/auth/SessionTimeoutWarning';
import { rtlLocales } from '@/lib/i18n/config';

interface LayoutWrapperProps {
  children: React.ReactNode;
}

// Auth gerektirmeyen public sayfalar
const PUBLIC_PATHS = [
  '/auth/login',
  '/auth/register',
  '/auth/activate',
  '/auth/forgot-password',
  '/auth/reset-password',
  '/auth/resend-activation',
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

// Layout loading skeleton - beyaz sayfa yerine gösterilir
function LayoutSkeleton({ isRTL }: { isRTL: boolean }) {
  const sidebarWidth = 260;
  return (
    <Box style={{ display: 'flex', minHeight: '100vh' }}>
      {/* Sidebar skeleton */}
      <Box
        style={{
          position: 'fixed',
          top: 0,
          width: sidebarWidth,
          height: '100vh',
          ...(isRTL ? { right: 0, left: 'auto' } : { left: 0, right: 'auto' }),
          padding: '1rem',
          borderRight: isRTL ? 'none' : '1px solid var(--border-color)',
          borderLeft: isRTL ? '1px solid var(--border-color)' : 'none',
          backgroundColor: 'var(--bg-secondary)',
        }}
      >
        <Skeleton height={40} width={120} mb="xl" />
        <Skeleton height={32} mb="sm" />
        <Skeleton height={32} mb="sm" />
        <Skeleton height={32} mb="sm" />
        <Skeleton height={32} mb="sm" />
      </Box>
      {/* Main content skeleton */}
      <Box
        style={{
          flex: 1,
          ...(isRTL
            ? { marginRight: sidebarWidth, marginLeft: 0 }
            : { marginLeft: sidebarWidth, marginRight: 0 }),
        }}
      >
        {/* Header skeleton */}
        <Box
          style={{
            height: 60,
            padding: '0.75rem 1.5rem',
            borderBottom: '1px solid var(--border-color)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <Skeleton height={36} width={180} />
          <Box style={{ display: 'flex', gap: '1rem' }}>
            <Skeleton height={40} width={200} radius="md" />
            <Skeleton height={40} width={40} radius="xl" />
            <Skeleton height={40} width={40} radius="xl" />
          </Box>
        </Box>
        {/* Content skeleton */}
        <Box style={{ padding: '2rem' }}>
          <Skeleton height={40} width="40%" mb="xl" />
          <Skeleton height={200} mb="md" />
          <Skeleton height={100} />
        </Box>
      </Box>
    </Box>
  );
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

  // RTL durumunu pathname'den hesapla (skeleton için)
  const locale = pathname?.split('/')[1] || 'tr';
  const isRTL = rtlLocales.includes(locale);

  // Server-side veya loading: Skeleton göster (beyaz sayfa yerine)
  // Bu, RTL'de çift render görünümünü önler
  if (!mounted || loading) {
    return <LayoutSkeleton isRTL={isRTL} />;
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
  const { company } = useCompany();

  return (
    <LayoutProvider
      {...(user?.id ? { userId: user.id } : {})}
      {...(user?.role ? { userRole: user.role } : {})}
      {...(company?.id ? { companyId: company.id } : {})}
    >
      <SessionTimeoutWarning />
      <LayoutContent>{children}</LayoutContent>
    </LayoutProvider>
  );
}

