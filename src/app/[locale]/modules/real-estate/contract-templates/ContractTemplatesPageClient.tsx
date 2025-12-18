'use client';

import { Container } from '@mantine/core';
import { IconFileText } from '@tabler/icons-react';
import { CentralPageHeader } from '@/components/headers/CentralPageHeader';
import { ContractTemplateList } from '@/modules/real-estate/components/ContractTemplateList';
import { useParams } from 'next/navigation';
import { useTranslation } from '@/lib/i18n/client';

export function ContractTemplatesPageClient({ locale }: { locale: string }) {
  const params = useParams();
  const currentLocale = (params?.locale as string) || locale;
  const { t } = useTranslation('modules/real-estate');

  return (
    <Container size="xl" pt="xl">
      <CentralPageHeader
        title={t('contracts.templates.title')}
        description={t('contracts.templates.description')}
        namespace="modules/real-estate"
        icon={<IconFileText size={32} />}
        breadcrumbs={[
          { label: 'navigation.dashboard', href: `/${currentLocale}/dashboard`, namespace: 'global' },
          { label: 'menu.label', href: `/${currentLocale}/modules/real-estate`, namespace: 'modules/real-estate' },
          { label: t('contracts.templates.title'), namespace: 'modules/real-estate' },
        ]}
        actions={[
          {
            label: t('contracts.templates.create.title'),
            icon: <IconFileText size={18} />,
            onClick: () => {
              window.location.href = `/${currentLocale}/modules/real-estate/contract-templates/create`;
            },
            variant: 'filled',
          },
        ]}
      />
      <ContractTemplateList locale={currentLocale} />
    </Container>
  );
}






