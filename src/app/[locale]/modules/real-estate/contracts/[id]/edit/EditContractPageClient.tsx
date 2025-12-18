'use client';

import { Container } from '@mantine/core';
import { IconContract } from '@tabler/icons-react';
import { CentralPageHeader } from '@/components/headers/CentralPageHeader';
import { ContractForm } from '@/modules/real-estate/components/ContractForm';
import { useParams } from 'next/navigation';
import { useTranslation } from '@/lib/i18n/client';

export function EditContractPageClient({ locale }: { locale: string }) {
  const params = useParams();
  const currentLocale = (params?.locale as string) || locale;
  const contractId = params?.id as string;
  const { t } = useTranslation('modules/real-estate');

  return (
    <Container size="xl" pt="xl">
      <CentralPageHeader
        title={t('contracts.edit.title')}
        description={t('contracts.edit.description')}
        namespace="modules/real-estate"
        icon={<IconContract size={32} />}
        breadcrumbs={[
          { label: 'navigation.dashboard', href: `/${currentLocale}/dashboard`, namespace: 'global' },
          { label: 'menu.label', href: `/${currentLocale}/modules/real-estate`, namespace: 'modules/real-estate' },
          { label: t('contracts.title'), href: `/${currentLocale}/modules/real-estate/contracts`, namespace: 'modules/real-estate' },
          { label: t('contracts.edit.title'), namespace: 'modules/real-estate' },
        ]}
      />
      <ContractForm locale={currentLocale} contractId={contractId} />
    </Container>
  );
}






