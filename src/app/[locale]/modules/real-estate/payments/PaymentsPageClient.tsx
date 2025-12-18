'use client';

import { useState } from 'react';
import { Container, Tabs } from '@mantine/core';
import { IconCurrencyDollar, IconChartBar, IconList } from '@tabler/icons-react';
import { CentralPageHeader } from '@/components/headers/CentralPageHeader';
import { PaymentList } from '@/modules/real-estate/components/PaymentList';
import { PaymentAnalytics } from '@/modules/real-estate/components/PaymentAnalytics';
import { useParams } from 'next/navigation';
import { useTranslation } from '@/lib/i18n/client';

export function PaymentsPageClient({ locale }: { locale: string }) {
  const params = useParams();
  const currentLocale = (params?.locale as string) || locale;
  const { t } = useTranslation('modules/real-estate');
  const [activeTab, setActiveTab] = useState<string | null>('list');

  return (
    <Container size="xl" pt="xl">
      <CentralPageHeader
        title={t('payments.title')}
        description={t('payments.description')}
        namespace="modules/real-estate"
        icon={<IconCurrencyDollar size={32} />}
        breadcrumbs={[
          { label: 'navigation.dashboard', href: `/${currentLocale}/dashboard`, namespace: 'global' },
          { label: 'menu.label', href: `/${currentLocale}/modules/real-estate`, namespace: 'modules/real-estate' },
          { label: t('payments.title'), namespace: 'modules/real-estate' },
        ]}
        actions={[
          {
            label: t('payments.create.title'),
            icon: <IconCurrencyDollar size={18} />,
            onClick: () => {
              window.location.href = `/${currentLocale}/modules/real-estate/payments/create`;
            },
            variant: 'filled',
          },
        ]}
      />
      <Tabs value={activeTab} onChange={setActiveTab} mt="md">
        <Tabs.List>
          <Tabs.Tab value="list" leftSection={<IconList size={16} />}>
            {t('payments.list')}
          </Tabs.Tab>
          <Tabs.Tab value="analytics" leftSection={<IconChartBar size={16} />}>
            {t('payments.analytics')}
          </Tabs.Tab>
        </Tabs.List>

        <Tabs.Panel value="list" pt="md">
          <PaymentList locale={currentLocale} />
        </Tabs.Panel>

        <Tabs.Panel value="analytics" pt="md">
          <PaymentAnalytics locale={currentLocale} />
        </Tabs.Panel>
      </Tabs>
    </Container>
  );
}

