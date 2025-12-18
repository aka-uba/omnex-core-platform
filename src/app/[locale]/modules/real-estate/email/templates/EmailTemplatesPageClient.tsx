'use client';

import { Container } from '@mantine/core';
import { IconMail } from '@tabler/icons-react';
import { CentralPageHeader } from '@/components/headers/CentralPageHeader';
import { EmailTemplateList } from '@/modules/real-estate/components/EmailTemplateList';
import { useParams } from 'next/navigation';
import { useTranslation } from '@/lib/i18n/client';

export function EmailTemplatesPageClient({ locale }: { locale: string }) {
  const params = useParams();
  const currentLocale = (params?.locale as string) || locale;
  const { t } = useTranslation('modules/real-estate');

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
            label: t('email.templates.create.title'),
            icon: <IconMail size={18} />,
            onClick: () => {
              window.location.href = `/${currentLocale}/modules/real-estate/email/templates/create`;
            },
            variant: 'filled',
          },
        ]}
      />
      <EmailTemplateList locale={currentLocale} />
    </Container>
  );
}








