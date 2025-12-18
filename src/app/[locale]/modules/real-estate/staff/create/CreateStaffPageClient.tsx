'use client';

import { Container } from '@mantine/core';
import { IconUsers } from '@tabler/icons-react';
import { CentralPageHeader } from '@/components/headers/CentralPageHeader';
import { RealEstateStaffForm } from '@/modules/real-estate/components/RealEstateStaffForm';
import { useTranslation } from '@/lib/i18n/client';

export function CreateStaffPageClient({ locale }: { locale: string }) {
  const { t } = useTranslation('modules/real-estate');
  
  return (
    <Container size="xl" pt="xl">
      <CentralPageHeader
        title={t('staff.create.title')}
        description={t('staff.create.description')}
        namespace="modules/real-estate"
        icon={<IconUsers size={32} />}
        breadcrumbs={[
          { label: 'navigation.dashboard', href: `/${locale}/dashboard`, namespace: 'global' },
          { label: 'staff.title', href: `/${locale}/modules/real-estate/staff`, namespace: 'modules/real-estate' },
          { label: 'staff.create.title', namespace: 'modules/real-estate' },
        ]}
      />

      <RealEstateStaffForm locale={locale} />
    </Container>
  );
}








