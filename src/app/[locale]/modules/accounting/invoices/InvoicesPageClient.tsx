'use client';

import { Container } from '@mantine/core';
import { IconFileText } from '@tabler/icons-react';
import { CentralPageHeader } from '@/components/headers/CentralPageHeader';
import { InvoiceList } from '@/modules/accounting/components/InvoiceList';
import { useParams } from 'next/navigation';
import { useTranslation } from '@/lib/i18n/client';

export function InvoicesPageClient({ locale }: { locale: string }) {
  const params = useParams();
  const currentLocale = (params?.locale as string) || locale;
  const { t } = useTranslation('modules/accounting');

  return (
    <Container size="xl" pt="xl">
      <CentralPageHeader
        title={t('invoices.title')}
        description={t('invoices.description')}
        namespace="modules/accounting"
        icon={<IconFileText size={32} />}
        breadcrumbs={[
          { label: 'navigation.dashboard', href: `/${currentLocale}/dashboard`, namespace: 'global' },
          { label: 'menu.label', href: `/${currentLocale}/modules/accounting`, namespace: 'modules/accounting' },
          { label: 'invoices.title', namespace: 'modules/accounting' },
        ]}
        actions={[
          {
            label: t('actions.newInvoice'),
            icon: <IconFileText size={18} />,
            onClick: () => {
              window.location.href = `/${currentLocale}/modules/accounting/invoices/create`;
            },
            variant: 'filled',
          },
        ]}
      />
      <InvoiceList locale={currentLocale} />
    </Container>
  );
}








