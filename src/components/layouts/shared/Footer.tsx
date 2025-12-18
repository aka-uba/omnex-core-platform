/**
 * Footer
 * Ortak footer bileşeni
 * Tüm layout'larda kullanılır
 */

'use client';

import { DynamicFooter } from '@/components/navigation/DynamicFooter';
import { useParams } from 'next/navigation';

export function Footer() {
  const params = useParams();
  const locale = (params?.locale as string) || 'tr';

  return <DynamicFooter locale={locale} />;
}
