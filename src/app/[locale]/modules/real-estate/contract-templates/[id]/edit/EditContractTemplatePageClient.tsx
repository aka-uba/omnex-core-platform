'use client';

import { Container } from '@mantine/core';
import { IconFileText } from '@tabler/icons-react';
import { CentralPageHeader } from '@/components/headers/CentralPageHeader';
import { ContractTemplateForm } from '@/modules/real-estate/components/ContractTemplateForm';
import { useParams } from 'next/navigation';
import { useTranslation } from '@/lib/i18n/client';
import { useContractTemplate } from '@/hooks/useContractTemplates';
import { DetailPageSkeleton } from '@/components/skeletons/DetailPageSkeleton';

export function EditContractTemplatePageClient({ locale }: { locale: string }) {
  const params = useParams();
  const currentLocale = (params?.locale as string) || locale;
  const templateId = params?.id as string;
  const { t } = useTranslation('modules/real-estate');
  const { isLoading } = useContractTemplate(templateId || '');

  return (
    <Container size="xl" pt="xl">
      <CentralPageHeader
        title={t('contracts.templates.edit.title')}
        description={t('contracts.templates.edit.description')}
        namespace="modules/real-estate"
        icon={<IconFileText size={32} />}
        breadcrumbs={[
          { label: 'navigation.dashboard', href: `/${currentLocale}/dashboard`, namespace: 'global' },
          { label: 'menu.label', href: `/${currentLocale}/modules/real-estate/dashboard`, namespace: 'modules/real-estate' },
          { label: 'contracts.templates.title', href: `/${currentLocale}/modules/real-estate/contract-templates`, namespace: 'modules/real-estate' },
          { label: 'contracts.templates.edit.title', namespace: 'modules/real-estate' },
        ]}
      />
      {isLoading ? (
        <DetailPageSkeleton />
      ) : (
        <ContractTemplateForm locale={currentLocale} templateId={templateId} />
      )}
    </Container>
  );
}








