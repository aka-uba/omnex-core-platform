'use client';

import { Container } from '@mantine/core';
import { IconSettings } from '@tabler/icons-react';
import { CentralPageHeader } from '@/components/headers/CentralPageHeader';
import { BulkOperationList } from '@/modules/real-estate/components/BulkOperationList';
import { useParams } from 'next/navigation';
import { useTranslation } from '@/lib/i18n/client';

export function BulkOperationsPageClient({ locale }: { locale: string }) {
  const params = useParams();
  const currentLocale = (params?.locale as string) || locale;
  const { t } = useTranslation('modules/real-estate');

  return (
    <Container size="xl" pt="xl">
      <CentralPageHeader
        title={t('bulkOperations.title')}
        description={t('bulkOperations.description')}
        namespace="modules/real-estate"
        icon={<IconSettings size={32} />}
        breadcrumbs={[
          { label: 'navigation.dashboard', href: `/${currentLocale}/dashboard`, namespace: 'global' },
          { label: 'menu.label', href: `/${currentLocale}/modules/real-estate`, namespace: 'modules/real-estate' },
          { label: t('bulkOperations.title'), namespace: 'modules/real-estate' },
        ]}
        actions={[
          {
            label: t('bulkOperations.create.title'),
            icon: <IconSettings size={18} />,
            onClick: () => {
              window.location.href = `/${currentLocale}/modules/real-estate/bulk-operations/create`;
            },
            variant: 'filled',
          },
        ]}
      />
      <BulkOperationList locale={currentLocale} />
    </Container>
  );
}

