'use client';

import { Container } from '@mantine/core';
import { IconRepeat } from '@tabler/icons-react';
import { CentralPageHeader } from '@/components/headers/CentralPageHeader';
import { SubscriptionList } from '@/modules/accounting/components/SubscriptionList';
import { useParams } from 'next/navigation';
import { useTranslation } from '@/lib/i18n/client';

export function SubscriptionsPageClient({ locale }: { locale: string }) {
  const params = useParams();
  const currentLocale = (params?.locale as string) || locale;
  const { t } = useTranslation('modules/accounting');

  return (
    <Container size="xl" pt="xl">
      <CentralPageHeader
        title={t('subscriptions.title')}
        description={t('subscriptions.description')}
        namespace="modules/accounting"
        icon={<IconRepeat size={32} />}
        breadcrumbs={[
          { label: 'navigation.dashboard', href: `/${currentLocale}/dashboard`, namespace: 'global' },
          { label: 'menu.label', href: `/${currentLocale}/modules/accounting`, namespace: 'modules/accounting' },
          { label: 'subscriptions.title', namespace: 'modules/accounting' },
        ]}
        actions={[
          {
            label: t('actions.newSubscription'),
            icon: <IconRepeat size={18} />,
            onClick: () => {
              window.location.href = `/${currentLocale}/modules/accounting/subscriptions/create`;
            },
            variant: 'filled',
          },
        ]}
      />
      <SubscriptionList locale={currentLocale} />
    </Container>
  );
}








