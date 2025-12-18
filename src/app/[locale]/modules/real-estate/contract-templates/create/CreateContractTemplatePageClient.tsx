'use client';

import { Container } from '@mantine/core';
import { IconFileText } from '@tabler/icons-react';
import { CentralPageHeader } from '@/components/headers/CentralPageHeader';
import { ContractTemplateForm } from '@/modules/real-estate/components/ContractTemplateForm';
import { useParams } from 'next/navigation';
import { useTranslation } from '@/lib/i18n/client';

export function CreateContractTemplatePageClient({ locale }: { locale: string }) {
  const params = useParams();
  const currentLocale = (params?.locale as string) || locale;
  const { t } = useTranslation('modules/real-estate');

  return (
    <Container size="xl" pt="xl">
      <CentralPageHeader
        title={t('contracts.templates.create.title')}
        description={t('contracts.templates.create.description')}
        namespace="modules/real-estate"
        icon={<IconFileText size={32} />}
        breadcrumbs={[
          { label: 'navigation.dashboard', href: `/${currentLocale}/dashboard`, namespace: 'global' },
          { label: 'menu.label', href: `/${currentLocale}/modules/real-estate`, namespace: 'modules/real-estate' },
          { label: 'contracts.templates.title', href: `/${currentLocale}/modules/real-estate/contract-templates`, namespace: 'modules/real-estate' },
          { label: 'contracts.templates.create.title', namespace: 'modules/real-estate' },
        ]}
      />
      <ContractTemplateForm locale={currentLocale} />
    </Container>
  );
}








