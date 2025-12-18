'use client';

import { Container } from '@mantine/core';
import { IconTools } from '@tabler/icons-react';
import { CentralPageHeader } from '@/components/headers/CentralPageHeader';
import { MaintenanceRecordList } from '@/modules/real-estate/components/MaintenanceRecordList';
import { useParams } from 'next/navigation';
import { useTranslation } from '@/lib/i18n/client';

export function MaintenanceRecordsPageClient({ locale }: { locale: string }) {
  const params = useParams();
  const currentLocale = (params?.locale as string) || locale;
  const { t } = useTranslation('modules/real-estate');

  return (
    <Container size="xl" pt="xl">
      <CentralPageHeader
        title={t('maintenance.title')}
        description={t('maintenance.description')}
        namespace="modules/real-estate"
        icon={<IconTools size={32} />}
        breadcrumbs={[
          { label: 'navigation.dashboard', href: `/${currentLocale}/dashboard`, namespace: 'global' },
          { label: 'menu.label', href: `/${currentLocale}/modules/real-estate`, namespace: 'modules/real-estate' },
          { label: t('maintenance.title'), namespace: 'modules/real-estate' },
        ]}
        actions={[
          {
            label: t('maintenance.create.title'),
            icon: <IconTools size={18} />,
            onClick: () => {
              window.location.href = `/${currentLocale}/modules/real-estate/maintenance/create`;
            },
            variant: 'filled',
          },
        ]}
      />
      <MaintenanceRecordList locale={currentLocale} />
    </Container>
  );
}

