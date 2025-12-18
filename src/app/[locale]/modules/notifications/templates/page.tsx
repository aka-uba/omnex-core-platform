'use client';

import { Container, Stack } from '@mantine/core';
import { IconBell } from '@tabler/icons-react';
import { CentralPageHeader } from '@/components/headers/CentralPageHeader';
import { useTranslation } from '@/lib/i18n/client';
import { useParams } from 'next/navigation';
import { PushTemplatesTab } from '@/app/[locale]/settings/notification-templates/components/PushTemplatesTab';

export default function NotificationsTemplatesPage() {
  const params = useParams();
  const currentLocale = (params?.locale as string) || 'tr';
  const { t } = useTranslation('modules/notification-templates');

  return (
    <Container size="xl" pt="xl">
      <CentralPageHeader
        title={t('title')}
        description={t('description')}
        namespace="modules/notification-templates"
        icon={<IconBell size={32} />}
        breadcrumbs={[
          { label: 'navigation.dashboard', href: `/${currentLocale}/dashboard`, namespace: 'global' },
          { label: 'menu.label', href: `/${currentLocale}/modules/notifications/dashboard`, namespace: 'modules/notifications' },
          { label: 'tabs.push', namespace: 'modules/notification-templates' },
        ]}
      />

      <Stack gap="md" mt="xl">
        <PushTemplatesTab locale={currentLocale} />
      </Stack>
    </Container>
  );
}
