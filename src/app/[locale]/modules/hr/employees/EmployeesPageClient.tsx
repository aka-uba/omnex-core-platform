'use client';

import { Container } from '@mantine/core';
import { IconUsers } from '@tabler/icons-react';
import { CentralPageHeader } from '@/components/headers/CentralPageHeader';
import { EmployeeList } from '@/modules/hr/components/EmployeeList';
import { useParams } from 'next/navigation';
import { useTranslation } from '@/lib/i18n/client';

export function EmployeesPageClient({ locale }: { locale: string }) {
  const params = useParams();
  const currentLocale = (params?.locale as string) || locale;
  const { t } = useTranslation('modules/hr');

  return (
    <Container size="xl" pt="xl">
      <CentralPageHeader
        title={t('employees.title')}
        description={t('employees.description')}
        namespace="modules/hr"
        icon={<IconUsers size={32} />}
        breadcrumbs={[
          { label: 'navigation.dashboard', href: `/${currentLocale}/dashboard`, namespace: 'global' },
          { label: t('title'), href: `/${currentLocale}/modules/hr`, namespace: 'modules/hr' },
          { label: t('employees.title'), namespace: 'modules/hr' },
        ]}
      />
      <EmployeeList locale={currentLocale} />
    </Container>
  );
}





