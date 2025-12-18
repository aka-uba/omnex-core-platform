'use client';

import { useState } from 'react';
import { useIsomorphicLayoutEffect } from '@/hooks/useIsomorphicLayoutEffect';

interface ClientIconProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

/**
 * ClientIcon - Iconları sadece client-side render eder
 * Hydration mismatch hatalarını önlemek için kullanılır
 * 
 * Optimized: useIsomorphicLayoutEffect kullanarak daha hızlı mount
 * Bu, useEffect'ten daha hızlı çalışır çünkü DOM güncellemelerinden
 * önce senkron olarak çalışır.
 */
export function ClientIcon({ children, fallback = null }: ClientIconProps) {
  const [mounted, setMounted] = useState(false);

  // useIsomorphicLayoutEffect, useEffect'ten daha hızlı çalışır
  // çünkü DOM güncellemelerinden önce senkron olarak çalışır
  useIsomorphicLayoutEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
}









