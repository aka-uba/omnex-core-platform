'use client';

import { Container } from '@mantine/core';
import { IconUsers, IconEdit } from '@tabler/icons-react';
import { CentralPageHeader } from '@/components/headers/CentralPageHeader';
import { EmployeeDetail } from '@/modules/hr/components/EmployeeDetail';
import { useParams, useRouter } from 'next/navigation';
import { useTranslation } from '@/lib/i18n/client';

export function EmployeeDetailPageClient({ locale, employeeId }: { locale: string; employeeId: string }) {
  const params = useParams();
  const router = useRouter();
  const currentLocale = (params?.locale as string) || locale;
  const { t } = useTranslation('modules/hr');
  const { t: tGlobal } = useTranslation('global');

  return (
    <Container size="xl" pt="xl">
      <CentralPageHeader
        title={t('employees.detail')}
        description={t('employees.detailDescription')}
        namespace="modules/hr"
        icon={<IconUsers size={32} />}
        breadcrumbs={[
          { label: 'navigation.dashboard', href: `/${currentLocale}/dashboard`, namespace: 'global' },
          { label: 'title', href: `/${currentLocale}/modules/hr`, namespace: 'modules/hr' },
          { label: 'employees.title', href: `/${currentLocale}/modules/hr/employees`, namespace: 'modules/hr' },
          { label: 'employees.detail', namespace: 'modules/hr' },
        ]}
        actions={[
          {
            label: tGlobal('common.edit'),
            icon: <IconEdit size={18} />,
            onClick: () => router.push(`/${currentLocale}/modules/hr/employees/${employeeId}/edit`),
            variant: 'filled',
          },
        ]}
      />
      <EmployeeDetail locale={currentLocale} employeeId={employeeId} />
    </Container>
  );
}







