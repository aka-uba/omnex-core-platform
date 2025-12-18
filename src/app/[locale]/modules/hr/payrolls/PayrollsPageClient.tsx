'use client';

import { Container } from '@mantine/core';
import { IconCurrencyDollar } from '@tabler/icons-react';
import { CentralPageHeader } from '@/components/headers/CentralPageHeader';
import { PayrollList } from '@/modules/hr/components/PayrollList';
import { useParams } from 'next/navigation';
import { useTranslation } from '@/lib/i18n/client';

export function PayrollsPageClient({ locale }: { locale: string }) {
  const params = useParams();
  const currentLocale = (params?.locale as string) || locale;
  const { t } = useTranslation('modules/hr');

  return (
    <Container size="xl" pt="xl">
      <CentralPageHeader
        title={t('payrolls.title')}
        description={t('payrolls.description')}
        namespace="modules/hr"
        icon={<IconCurrencyDollar size={32} />}
        breadcrumbs={[
          { label: 'navigation.dashboard', href: `/${currentLocale}/dashboard`, namespace: 'global' },
          { label: t('title'), href: `/${currentLocale}/modules/hr`, namespace: 'modules/hr' },
          { label: t('payrolls.title'), namespace: 'modules/hr' },
        ]}
      />
      <PayrollList locale={currentLocale} />
    </Container>
  );
}





