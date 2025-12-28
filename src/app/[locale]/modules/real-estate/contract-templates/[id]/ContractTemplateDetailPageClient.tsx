'use client';

import { Container } from '@mantine/core';
import { IconFileText, IconEdit } from '@tabler/icons-react';
import { CentralPageHeader } from '@/components/headers/CentralPageHeader';
import { ContractTemplateDetail } from '@/modules/real-estate/components/ContractTemplateDetail';
import { useParams, useRouter } from 'next/navigation';
import { useTranslation } from '@/lib/i18n/client';

export function ContractTemplateDetailPageClient({ locale, templateId }: { locale: string; templateId: string }) {
  const params = useParams();
  const router = useRouter();
  const currentLocale = (params?.locale as string) || locale;
  const { t } = useTranslation('modules/real-estate');

  return (
    <Container size="xl" pt="xl">
      <CentralPageHeader
        title={t('contracts.templates.detail.title') || t('contracts.templates.title')}
        description={t('contracts.templates.detail.description') || t('contracts.templates.description')}
        namespace="modules/real-estate"
        icon={<IconFileText size={32} />}
        breadcrumbs={[
          { label: 'navigation.dashboard', href: `/${currentLocale}/dashboard`, namespace: 'global' },
          { label: 'menu.label', href: `/${currentLocale}/modules/real-estate/dashboard`, namespace: 'modules/real-estate' },
          { label: 'contracts.templates.title', href: `/${currentLocale}/modules/real-estate/contract-templates`, namespace: 'modules/real-estate' },
          { label: 'contracts.templates.detail.title', namespace: 'modules/real-estate' },
        ]}
        actions={[
          {
            label: t('actions.edit'),
            icon: <IconEdit size={16} />,
            onClick: () => router.push(`/${currentLocale}/modules/real-estate/contract-templates/${templateId}/edit`),
          },
        ]}
      />
      <ContractTemplateDetail locale={currentLocale} templateId={templateId} />
    </Container>
  );
}












