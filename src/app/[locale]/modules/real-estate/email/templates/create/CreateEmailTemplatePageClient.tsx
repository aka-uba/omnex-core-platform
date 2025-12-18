'use client';

import { Container } from '@mantine/core';
import { IconMail } from '@tabler/icons-react';
import { CentralPageHeader } from '@/components/headers/CentralPageHeader';
import { EmailTemplateForm } from '@/modules/real-estate/components/EmailTemplateForm';
import { useParams } from 'next/navigation';
import { useTranslation } from '@/lib/i18n/client';

export function CreateEmailTemplatePageClient({ locale }: { locale: string }) {
  const params = useParams();
  const currentLocale = (params?.locale as string) || locale;
  const { t } = useTranslation('modules/real-estate');

  return (
    <Container size="xl" pt="xl">
      <CentralPageHeader
        title={t('email.templates.create.title')}
        description={t('email.templates.create.description')}
        namespace="modules/real-estate"
        icon={<IconMail size={32} />}
        breadcrumbs={[
          { label: 'navigation.dashboard', href: `/${currentLocale}/dashboard`, namespace: 'global' },
          { label: 'menu.label', href: `/${currentLocale}/modules/real-estate`, namespace: 'modules/real-estate' },
          { label: 'email.templates.title', href: `/${currentLocale}/modules/real-estate/email/templates`, namespace: 'modules/real-estate' },
          { label: 'email.templates.create.title', namespace: 'modules/real-estate' },
        ]}
      />
      <EmailTemplateForm locale={currentLocale} />
    </Container>
  );
}








