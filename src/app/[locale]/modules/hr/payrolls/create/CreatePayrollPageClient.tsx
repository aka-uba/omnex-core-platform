'use client';

import { Container } from '@mantine/core';
import { IconCurrencyDollar } from '@tabler/icons-react';
import { CentralPageHeader } from '@/components/headers/CentralPageHeader';
import { PayrollForm } from '@/modules/hr/components/PayrollForm';
import { useParams } from 'next/navigation';
import { useTranslation } from '@/lib/i18n/client';

export function CreatePayrollPageClient({ locale }: { locale: string }) {
  const params = useParams();
  const currentLocale = (params?.locale as string) || locale;
  const { t } = useTranslation('modules/hr');

  return (
    <Container size="xl" pt="xl">
      <CentralPageHeader
        title={t('payrolls.create')}
        description={t('payrolls.createDescription')}
        namespace="modules/hr"
        icon={<IconCurrencyDollar size={32} />}
        breadcrumbs={[
          { label: 'navigation.dashboard', href: `/${currentLocale}/dashboard`, namespace: 'global' },
          { label: 'title', href: `/${currentLocale}/modules/hr`, namespace: 'modules/hr' },
          { label: 'payrolls.title', href: `/${currentLocale}/modules/hr/payrolls`, namespace: 'modules/hr' },
          { label: 'payrolls.create', namespace: 'modules/hr' },
        ]}
      />
      <PayrollForm locale={currentLocale} />
    </Container>
  );
}







