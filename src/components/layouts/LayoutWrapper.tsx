/**
 * LayoutWrapper v2
 * Ana layout wrapper - responsive layout seçimi
 * Login/Register/Welcome sayfaları layoutsuz
 */

'use client';

import { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { LayoutProvider, useLayout } from './core/LayoutProvider';
import { MobileLayout } from './mobile/MobileLayout';
import { SidebarLayout } from './sidebar/SidebarLayout';
import { TopLayout } from './top/TopLayout';
import { useAuth } from '@/hooks/useAuth';
import { SessionTimeoutWarning } from '@/components/auth/SessionTimeoutWarning';

interface LayoutWrapperProps {
  children: React.ReactNode;
}

function LayoutContent({ children }: LayoutWrapperProps) {
  const { currentLayout } = useLayout();
  const pathname = usePathname();
  const [mounted, setMounted] = useState(false);

  // Client-side mount
  useEffect(() => {
    setMounted(true);
  }, []);

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
      <SessionTimeoutWarning />
      <LayoutContent>{children}</LayoutContent>
    </LayoutProvider>
  );
}

