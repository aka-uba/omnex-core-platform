'use client';

import { Container, Tabs } from '@mantine/core';
import { IconMail, IconChartBar } from '@tabler/icons-react';
import { CentralPageHeader } from '@/components/headers/CentralPageHeader';
import { EmailCampaignList } from '@/modules/real-estate/components/email/EmailCampaignList';
import { EmailAnalytics } from '@/modules/real-estate/components/email/EmailAnalytics';
import { useTranslation } from '@/lib/i18n/client';

export function EmailCampaignsPageClient({ locale }: { locale: string }) {
  const { t } = useTranslation('modules/real-estate');

  return (
    <Container size="xl" pt="xl">
      <CentralPageHeader
        title={t('email.campaigns.title')}
        description={t('email.campaigns.description')}
        namespace="modules/real-estate"
        icon={<IconMail size={32} />}
        breadcrumbs={[
          { label: 'navigation.dashboard', href: `/${locale}/dashboard`, namespace: 'global' },
          { label: 'email.templates.title', href: `/${locale}/modules/real-estate/email/templates`, namespace: 'modules/real-estate' },
          { label: 'email.campaigns.title', namespace: 'modules/real-estate' },
        ]}
      />

      <Tabs defaultValue="list" mt="md">
        <Tabs.List>
          <Tabs.Tab value="list" leftSection={<IconMail size={16} />}>
            {t('email.campaigns.listTab')}
          </Tabs.Tab>
          <Tabs.Tab value="analytics" leftSection={<IconChartBar size={16} />}>
            {t('email.campaigns.analyticsTab')}
          </Tabs.Tab>
        </Tabs.List>

        <Tabs.Panel value="list" pt="xs">
          <EmailCampaignList locale={locale} />
        </Tabs.Panel>

        <Tabs.Panel value="analytics" pt="xs">
          <EmailAnalytics locale={locale} />
        </Tabs.Panel>
      </Tabs>
    </Container>
  );
}








