'use client';

import { useState } from 'react';
import { Container, Tabs } from '@mantine/core';
import { IconCurrencyDollar, IconChartBar, IconList, IconCalendarStats } from '@tabler/icons-react';
import { CentralPageHeader } from '@/components/headers/CentralPageHeader';
import { PaymentList } from '@/modules/real-estate/components/PaymentList';
import { PaymentAnalytics } from '@/modules/real-estate/components/PaymentAnalytics';
import { PaymentQuickBoard } from '@/modules/real-estate/components/PaymentQuickBoard';
import { PaymentMonthlyTracker } from '@/modules/real-estate/components/PaymentMonthlyTracker';
import { useParams, useRouter } from 'next/navigation';
import { useTranslation } from '@/lib/i18n/client';

export function PaymentsPageClient({ locale }: { locale: string }) {
  const params = useParams();
  const router = useRouter();
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
              router.push(`/${currentLocale}/modules/real-estate/payments/create`);
            },
            variant: 'filled',
          },
        ]}
      />

      {/* Quick Board - Upcoming & Overdue Payments */}
      <div className="mt-6">
        <PaymentQuickBoard locale={currentLocale} />
      </div>

      <Tabs value={activeTab} onChange={setActiveTab}>
        <Tabs.List>
          <Tabs.Tab value="list" leftSection={<IconList size={16} />}>
            {t('payments.list')}
          </Tabs.Tab>
          <Tabs.Tab value="monthly" leftSection={<IconCalendarStats size={16} />}>
            {t('payments.monthlyTracker.tab')}
          </Tabs.Tab>
          <Tabs.Tab value="analytics" leftSection={<IconChartBar size={16} />}>
            {t('payments.analytics')}
          </Tabs.Tab>
        </Tabs.List>

        <Tabs.Panel value="list" pt="md">
          <PaymentList locale={currentLocale} />
        </Tabs.Panel>

        <Tabs.Panel value="monthly" pt="md">
          <PaymentMonthlyTracker locale={currentLocale} />
        </Tabs.Panel>

        <Tabs.Panel value="analytics" pt="md">
          <PaymentAnalytics locale={currentLocale} />
        </Tabs.Panel>
      </Tabs>
    </Container>
  );
}

