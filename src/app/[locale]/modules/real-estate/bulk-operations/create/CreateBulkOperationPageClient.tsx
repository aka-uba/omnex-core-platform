'use client';

import { Container } from '@mantine/core';
import { IconSettings } from '@tabler/icons-react';
import { CentralPageHeader } from '@/components/headers/CentralPageHeader';
import { BulkOperationForm } from '@/modules/real-estate/components/BulkOperationForm';
import { useParams } from 'next/navigation';
import { useTranslation } from '@/lib/i18n/client';

export function CreateBulkOperationPageClient({ locale }: { locale: string }) {
  const params = useParams();
  const currentLocale = (params?.locale as string) || locale;
  const { t } = useTranslation('modules/real-estate');

  return (
    <Container size="xl" pt="xl">
      <CentralPageHeader
        title={t('bulkOperations.create.title')}
        description={t('bulkOperations.create.description')}
        namespace="modules/real-estate"
        icon={<IconSettings size={32} />}
        breadcrumbs={[
          { label: 'navigation.dashboard', href: `/${currentLocale}/dashboard`, namespace: 'global' },
          { label: 'menu.label', href: `/${currentLocale}/modules/real-estate`, namespace: 'modules/real-estate' },
          { label: t('bulkOperations.title'), href: `/${currentLocale}/modules/real-estate/bulk-operations`, namespace: 'modules/real-estate' },
          { label: t('bulkOperations.create.title'), namespace: 'modules/real-estate' },
        ]}
      />
      <BulkOperationForm locale={currentLocale} />
    </Container>
  );
}

