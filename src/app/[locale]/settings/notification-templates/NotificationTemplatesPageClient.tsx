'use client';

import { useState } from 'react';
import { Container, Tabs, Stack } from '@mantine/core';
import { IconMail, IconMessage, IconBell, IconBrandWhatsapp, IconBrandTelegram } from '@tabler/icons-react';
import { CentralPageHeader } from '@/components/headers/CentralPageHeader';
import { useTranslation } from '@/lib/i18n/client';
import { useParams } from 'next/navigation';
import { EmailTemplatesTab } from './components/EmailTemplatesTab';
import { SMSTemplatesTab } from './components/SMSTemplatesTab';
import { PushTemplatesTab } from './components/PushTemplatesTab';
import { WhatsAppTemplatesTab } from './components/WhatsAppTemplatesTab';
import { TelegramTemplatesTab } from './components/TelegramTemplatesTab';

export function NotificationTemplatesPageClient({ locale }: { locale: string }) {
  const params = useParams();
  const currentLocale = (params?.locale as string) || locale;
  const { t } = useTranslation('modules/notification-templates');
  const [activeTab, setActiveTab] = useState<string | null>('email');

  return (
    <Container size="xl" pt="xl">
      <CentralPageHeader
        title={t('title')}
        description={t('description')}
        namespace="modules/notification-templates"
        icon={<IconMail size={32} />}
        breadcrumbs={[
          { label: 'navigation.dashboard', href: `/${currentLocale}/dashboard`, namespace: 'global' },
          { label: 'navigation.settings', href: `/${currentLocale}/settings`, namespace: 'global' },
          { label: 'title', namespace: 'modules/notification-templates' },
        ]}
      />

      <Stack gap="md" mt="xl">
        <Tabs value={activeTab} onChange={setActiveTab}>
          <Tabs.List>
            <Tabs.Tab value="email" leftSection={<IconMail size={16} />}>
              {t('tabs.email')}
            </Tabs.Tab>
            <Tabs.Tab value="sms" leftSection={<IconMessage size={16} />}>
              {t('tabs.sms')}
            </Tabs.Tab>
            <Tabs.Tab value="push" leftSection={<IconBell size={16} />}>
              {t('tabs.push')}
            </Tabs.Tab>
            <Tabs.Tab value="whatsapp" leftSection={<IconBrandWhatsapp size={16} />}>
              {t('tabs.whatsapp')}
            </Tabs.Tab>
            <Tabs.Tab value="telegram" leftSection={<IconBrandTelegram size={16} />}>
              {t('tabs.telegram')}
            </Tabs.Tab>
          </Tabs.List>

          <Tabs.Panel value="email" pt="xl">
            <EmailTemplatesTab locale={currentLocale} />
          </Tabs.Panel>

          <Tabs.Panel value="sms" pt="xl">
            <SMSTemplatesTab locale={currentLocale} />
          </Tabs.Panel>

          <Tabs.Panel value="push" pt="xl">
            <PushTemplatesTab locale={currentLocale} />
          </Tabs.Panel>

          <Tabs.Panel value="whatsapp" pt="xl">
            <WhatsAppTemplatesTab locale={currentLocale} />
          </Tabs.Panel>

          <Tabs.Panel value="telegram" pt="xl">
            <TelegramTemplatesTab locale={currentLocale} />
          </Tabs.Panel>
        </Tabs>
      </Stack>
    </Container>
  );
}
















