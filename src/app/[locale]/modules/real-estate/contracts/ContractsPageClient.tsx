'use client';

import { Container } from '@mantine/core';
import { IconContract } from '@tabler/icons-react';
import { CentralPageHeader } from '@/components/headers/CentralPageHeader';
import { ContractList } from '@/modules/real-estate/components/ContractList';
import { useParams } from 'next/navigation';
import { useTranslation } from '@/lib/i18n/client';

export function ContractsPageClient({ locale }: { locale: string }) {
  const params = useParams();
  const currentLocale = (params?.locale as string) || locale;
  const { t } = useTranslation('modules/real-estate');

  return (
    <Container size="xl" pt="xl">
      <CentralPageHeader
        title={t('contracts.title')}
        description={t('contracts.description')}
        namespace="modules/real-estate"
        icon={<IconContract size={32} />}
        breadcrumbs={[
          { label: 'navigation.dashboard', href: `/${currentLocale}/dashboard`, namespace: 'global' },
          { label: 'menu.label', href: `/${currentLocale}/modules/real-estate`, namespace: 'modules/real-estate' },
          { label: t('contracts.title'), namespace: 'modules/real-estate' },
        ]}
        actions={[
          {
            label: t('contracts.create.title'),
            icon: <IconContract size={18} />,
            onClick: () => {
              window.location.href = `/${currentLocale}/modules/real-estate/contracts/create`;
            },
            variant: 'filled',
          },
        ]}
      />
      <ContractList locale={currentLocale} />
    </Container>
  );
}






