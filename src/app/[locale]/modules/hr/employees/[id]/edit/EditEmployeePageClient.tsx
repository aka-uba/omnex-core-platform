'use client';

import { Container } from '@mantine/core';
import { IconUsers } from '@tabler/icons-react';
import { CentralPageHeader } from '@/components/headers/CentralPageHeader';
import { EmployeeForm } from '@/modules/hr/components/EmployeeForm';
import { useParams } from 'next/navigation';
import { useTranslation } from '@/lib/i18n/client';

export function EditEmployeePageClient({ locale, employeeId }: { locale: string; employeeId: string }) {
  const params = useParams();
  const currentLocale = (params?.locale as string) || locale;
  const { t } = useTranslation('modules/hr');

  return (
    <Container size="xl" pt="xl">
      <CentralPageHeader
        title={t('employees.edit')}
        description={t('employees.editDescription')}
        namespace="modules/hr"
        icon={<IconUsers size={32} />}
        breadcrumbs={[
          { label: 'navigation.dashboard', href: `/${currentLocale}/dashboard`, namespace: 'global' },
          { label: 'title', href: `/${currentLocale}/modules/hr`, namespace: 'modules/hr' },
          { label: 'employees.title', href: `/${currentLocale}/modules/hr/employees`, namespace: 'modules/hr' },
          { label: 'employees.edit', namespace: 'modules/hr' },
        ]}
      />
      <EmployeeForm locale={currentLocale} employeeId={employeeId} />
    </Container>
  );
}







