'use client';

import { Container } from '@mantine/core';
import { IconUsers } from '@tabler/icons-react';
import { CentralPageHeader } from '@/components/headers/CentralPageHeader';
import { RealEstateStaffList } from '@/modules/real-estate/components/RealEstateStaffList';
import { useTranslation } from '@/lib/i18n/client';

export function StaffPageClient({ locale }: { locale: string }) {
  const { t } = useTranslation('modules/real-estate');

  return (
    <Container size="xl" pt="xl">
      <CentralPageHeader
        title={t('staff.title')}
        description={t('staff.description')}
        namespace="modules/real-estate"
        icon={<IconUsers size={32} />}
        breadcrumbs={[
          { label: 'navigation.dashboard', href: `/${locale}/dashboard`, namespace: 'global' },
          { label: 'menu.label', href: `/${locale}/modules/real-estate`, namespace: 'modules/real-estate' },
          { label: t('staff.title'), namespace: 'modules/real-estate' },
        ]}
        actions={[
          {
            label: t('staff.create.title'),
            icon: <IconUsers size={18} />,
            onClick: () => {
              window.location.href = `/${locale}/modules/real-estate/staff/create`;
            },
            variant: 'filled',
          },
        ]}
      />

      <RealEstateStaffList locale={locale} />
    </Container>
  );
}






