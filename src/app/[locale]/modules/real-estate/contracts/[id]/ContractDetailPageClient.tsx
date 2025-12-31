'use client';

import { useRouter } from 'next/navigation';
import { IconEdit } from '@tabler/icons-react';
import { ContractDetail } from '@/modules/real-estate/components/ContractDetail';
import { CentralPageHeader } from '@/components/headers/CentralPageHeader';
import { IconContract } from '@tabler/icons-react';
import { Container } from '@mantine/core';
import { useTranslation } from '@/lib/i18n/client';

interface ContractDetailPageClientProps {
  locale: string;
  contractId: string;
}

export function ContractDetailPageClient({ locale, contractId }: ContractDetailPageClientProps) {
  const router = useRouter();
  const { t } = useTranslation('modules/real-estate');

  return (
    <Container size="xl" pt="xl">
      <CentralPageHeader
        title={t('contracts.detail.title') || t('contracts.title')}
        description={t('contracts.detail.description') || t('contracts.description')}
        namespace="modules/real-estate"
        icon={<IconContract size={32} />}
        breadcrumbs={[
          { label: 'navigation.dashboard', href: `/${locale}/dashboard`, namespace: 'global' },
          { label: 'menu.label', href: `/${locale}/modules/real-estate/dashboard`, namespace: 'modules/real-estate' },
          { label: 'contracts.title', href: `/${locale}/modules/real-estate/contracts`, namespace: 'modules/real-estate' },
          { label: 'contracts.detail.title', namespace: 'modules/real-estate' },
        ]}
        actions={[
          {
            label: t('actions.edit'),
            icon: <IconEdit size={18} />,
            onClick: () => router.push(`/${locale}/modules/real-estate/contracts/${contractId}/edit`),
            variant: 'filled',
            color: 'blue',
          },
        ]}
      />
      <ContractDetail locale={locale} contractId={contractId} />
    </Container>
  );
}

