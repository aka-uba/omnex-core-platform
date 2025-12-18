'use client';

import { Container } from '@mantine/core';
import { IconCurrencyDollar } from '@tabler/icons-react';
import { CentralPageHeader } from '@/components/headers/CentralPageHeader';
import { PayrollDetail } from '@/modules/hr/components/PayrollDetail';
import { useParams } from 'next/navigation';
import { useTranslation } from '@/lib/i18n/client';

export function PayrollDetailPageClient({ locale, payrollId }: { locale: string; payrollId: string }) {
  const params = useParams();
  const currentLocale = (params?.locale as string) || locale;
  const { t } = useTranslation('modules/hr');

  return (
    <Container size="xl" pt="xl">
      <CentralPageHeader
        title={t('payrolls.detail')}
        description={t('payrolls.detailDescription')}
        namespace="modules/hr"
        icon={<IconCurrencyDollar size={32} />}
        breadcrumbs={[
          { label: 'navigation.dashboard', href: `/${currentLocale}/dashboard`, namespace: 'global' },
          { label: 'title', href: `/${currentLocale}/modules/hr`, namespace: 'modules/hr' },
          { label: 'payrolls.title', href: `/${currentLocale}/modules/hr/payrolls`, namespace: 'modules/hr' },
          { label: 'payrolls.detail', namespace: 'modules/hr' },
        ]}
      />
      <PayrollDetail locale={currentLocale} payrollId={payrollId} />
    </Container>
  );
}







