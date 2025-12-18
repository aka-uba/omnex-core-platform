'use client';

import { Container } from '@mantine/core';
import { IconRepeat } from '@tabler/icons-react';
import { CentralPageHeader } from '@/components/headers/CentralPageHeader';
import { SubscriptionForm } from '@/modules/accounting/components/SubscriptionForm';
import { useParams } from 'next/navigation';
import { useTranslation } from '@/lib/i18n/client';

export function CreateSubscriptionPageClient({ locale }: { locale: string }) {
  const params = useParams();
  const currentLocale = (params?.locale as string) || locale;
  const { t } = useTranslation('modules/accounting');

  return (
    <Container size="xl" pt="xl">
      <CentralPageHeader
        title={t('templates.create.subscription.title')}
        description={t('templates.create.subscription.description')}
        namespace="modules/accounting"
        icon={<IconRepeat size={32} />}
        breadcrumbs={[
          { label: 'navigation.dashboard', href: `/${currentLocale}/dashboard`, namespace: 'global' },
          { label: 'menu.label', href: `/${currentLocale}/modules/accounting`, namespace: 'modules/accounting' },
          { label: 'subscriptions.title', href: `/${currentLocale}/modules/accounting/subscriptions`, namespace: 'modules/accounting' },
          { label: t('form.create'), namespace: 'modules/accounting' },
        ]}
      />
      <SubscriptionForm locale={currentLocale} />
    </Container>
  );
}








