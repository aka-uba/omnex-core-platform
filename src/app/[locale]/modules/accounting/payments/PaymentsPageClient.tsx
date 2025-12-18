'use client';

import { Container } from '@mantine/core';
import { IconCreditCard } from '@tabler/icons-react';
import { CentralPageHeader } from '@/components/headers/CentralPageHeader';
import { PaymentList } from '@/modules/accounting/components/PaymentList';
import { useParams } from 'next/navigation';
import { useTranslation } from '@/lib/i18n/client';

export function PaymentsPageClient({ locale }: { locale: string }) {
  const params = useParams();
  const currentLocale = (params?.locale as string) || locale;
  const { t } = useTranslation('modules/accounting');

  return (
    <Container size="xl" pt="xl">
      <CentralPageHeader
        title={t('payments.title')}
        description={t('payments.description')}
        namespace="modules/accounting"
        icon={<IconCreditCard size={32} />}
        breadcrumbs={[
          { label: 'navigation.dashboard', href: `/${currentLocale}/dashboard`, namespace: 'global' },
          { label: 'menu.label', href: `/${currentLocale}/modules/accounting`, namespace: 'modules/accounting' },
          { label: 'payments.title', namespace: 'modules/accounting' },
        ]}
      />
      <PaymentList locale={currentLocale} />
    </Container>
  );
}








