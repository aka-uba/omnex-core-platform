'use client';

import { Container, Tabs, Stack } from '@mantine/core';
import { IconMail, IconSettings } from '@tabler/icons-react';
import { CentralPageHeader } from '@/components/headers/CentralPageHeader';
import { EmailTemplateList } from '@/modules/real-estate/components/EmailTemplateList';
import { RealEstateNotificationTemplates } from '@/modules/real-estate/components/RealEstateNotificationTemplates';
import { useParams, useRouter } from 'next/navigation';
import { useTranslation } from '@/lib/i18n/client';
import { useState } from 'react';

export function EmailTemplatesPageClient({ locale }: { locale: string }) {
  const params = useParams();
  const router = useRouter();
  const currentLocale = (params?.locale as string) || locale;
  const { t } = useTranslation('modules/real-estate');
  const [activeTab, setActiveTab] = useState<string | null>('notification-templates');

  return (
    <Container size="xl" pt="xl">
      <CentralPageHeader
        title={t('email.templates.title')}
        description={t('email.templates.description')}
        namespace="modules/real-estate"
        icon={<IconMail size={32} />}
        breadcrumbs={[
          { label: 'navigation.dashboard', href: `/${currentLocale}/dashboard`, namespace: 'global' },
          { label: 'menu.label', href: `/${currentLocale}/modules/real-estate`, namespace: 'modules/real-estate' },
          { label: t('email.templates.title'), namespace: 'modules/real-estate' },
        ]}
        actions={[
          {
            label: t('email.allNotificationTemplates'),
            icon: <IconSettings size={18} />,
            onClick: () => {
              router.push(`/${currentLocale}/settings/notification-templates`);
            },
            variant: 'light',
          },
          {
            label: t('email.templates.create.title'),
            icon: <IconMail size={18} />,
            onClick: () => {
              window.location.href = `/${currentLocale}/modules/real-estate/email/templates/create`;
            },
            variant: 'filled',
          },
        ]}
      />

      <Stack gap="md" mt="xl">
        <Tabs value={activeTab} onChange={setActiveTab}>
          <Tabs.List>
            <Tabs.Tab value="notification-templates" leftSection={<IconMail size={16} />}>
              {t('email.notificationTemplates')}
            </Tabs.Tab>
            <Tabs.Tab value="custom-templates" leftSection={<IconMail size={16} />}>
              {t('email.customTemplates')}
            </Tabs.Tab>
          </Tabs.List>

          <Tabs.Panel value="notification-templates" pt="xl">
            <RealEstateNotificationTemplates locale={currentLocale} />
          </Tabs.Panel>

          <Tabs.Panel value="custom-templates" pt="xl">
            <EmailTemplateList locale={currentLocale} />
          </Tabs.Panel>
        </Tabs>
      </Stack>
    </Container>
  );
}








