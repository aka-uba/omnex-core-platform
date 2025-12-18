'use client';

import { DatesProvider } from '@mantine/dates';
import { useParams } from 'next/navigation';
import dayjs from 'dayjs';
import 'dayjs/locale/tr';
import 'dayjs/locale/de';
import 'dayjs/locale/ar';
import 'dayjs/locale/en';

export function DatesProviderWrapper({ children }: { children: React.ReactNode }) {
  const params = useParams();
  const locale = (params?.locale as string) || 'tr';
  
  // Map locale to dayjs locale
  const dayjsLocale = locale === 'tr' ? 'tr' : locale === 'de' ? 'de' : locale === 'ar' ? 'ar' : 'en';
  
  // Set dayjs locale
  dayjs.locale(dayjsLocale);
  
  return (
    <DatesProvider settings={{ locale: dayjsLocale }}>
      {children}
    </DatesProvider>
  );
}






