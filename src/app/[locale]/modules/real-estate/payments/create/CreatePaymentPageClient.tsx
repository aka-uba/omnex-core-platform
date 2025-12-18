'use client';

import { Container } from '@mantine/core';
import { IconCurrencyDollar } from '@tabler/icons-react';
import { CentralPageHeader } from '@/components/headers/CentralPageHeader';
import { PaymentForm } from '@/modules/real-estate/components/PaymentForm';
import { useParams } from 'next/navigation';
import { useTranslation } from '@/lib/i18n/client';

export function CreatePaymentPageClient({ locale }: { locale: string }) {
  const params = useParams();
  const currentLocale = (params?.locale as string) || locale;
  const { t } = useTranslation('modules/real-estate');

  return (
    <Container size="xl" pt="xl">
      <CentralPageHeader
        title={t('payments.create.title')}
        description={t('payments.create.description')}
        namespace="modules/real-estate"
        icon={<IconCurrencyDollar size={32} />}
        breadcrumbs={[
          { label: 'navigation.dashboard', href: `/${currentLocale}/dashboard`, namespace: 'global' },
          { label: 'menu.label', href: `/${currentLocale}/modules/real-estate`, namespace: 'modules/real-estate' },
          { label: t('payments.title'), href: `/${currentLocale}/modules/real-estate/payments`, namespace: 'modules/real-estate' },
          { label: t('payments.create.title'), namespace: 'modules/real-estate' },
        ]}
      />
      <PaymentForm locale={currentLocale} />
    </Container>
  );
}






