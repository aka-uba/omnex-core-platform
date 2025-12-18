'use client';

import { Container } from '@mantine/core';
import { IconUsers } from '@tabler/icons-react';
import { CentralPageHeader } from '@/components/headers/CentralPageHeader';
import { RealEstateStaffForm } from '@/modules/real-estate/components/RealEstateStaffForm';
import { EditStaffPageSkeleton } from './EditStaffPageSkeleton';
import { useTranslation } from '@/lib/i18n/client';
import { useRealEstateStaffMember } from '@/hooks/useRealEstateStaff';

export function EditStaffPageClient({ locale, staffId }: { locale: string; staffId: string }) {
  const { t } = useTranslation('modules/real-estate');
  const { isLoading } = useRealEstateStaffMember(staffId);
  
  if (isLoading) {
    return (
      <Container size="xl" pt="xl">
        <CentralPageHeader
          title={t('staff.edit.title')}
          description={t('staff.edit.description')}
          namespace="modules/real-estate"
          icon={<IconUsers size={32} />}
          breadcrumbs={[
            { label: 'navigation.dashboard', href: `/${locale}/dashboard`, namespace: 'global' },
            { label: 'staff.title', href: `/${locale}/modules/real-estate/staff`, namespace: 'modules/real-estate' },
            { label: 'staff.edit.title', namespace: 'modules/real-estate' },
          ]}
        />
        <EditStaffPageSkeleton />
      </Container>
    );
  }
  
  return (
    <Container size="xl" pt="xl">
      <CentralPageHeader
        title={t('staff.edit.title')}
        description={t('staff.edit.description')}
        namespace="modules/real-estate"
        icon={<IconUsers size={32} />}
        breadcrumbs={[
          { label: 'navigation.dashboard', href: `/${locale}/dashboard`, namespace: 'global' },
          { label: 'staff.title', href: `/${locale}/modules/real-estate/staff`, namespace: 'modules/real-estate' },
          { label: 'staff.edit.title', namespace: 'modules/real-estate' },
        ]}
      />

      <RealEstateStaffForm locale={locale} staffId={staffId} />
    </Container>
  );
}








