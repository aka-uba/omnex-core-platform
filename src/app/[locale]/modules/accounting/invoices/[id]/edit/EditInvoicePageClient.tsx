'use client';

import { Container } from '@mantine/core';
import { IconFileText } from '@tabler/icons-react';
import { CentralPageHeader } from '@/components/headers/CentralPageHeader';
import { InvoiceForm } from '@/modules/accounting/components/InvoiceForm';
import { useParams } from 'next/navigation';
import { useTranslation } from '@/lib/i18n/client';

export function EditInvoicePageClient({ locale, invoiceId }: { locale: string; invoiceId: string }) {
  const params = useParams();
  const currentLocale = (params?.locale as string) || locale;
  const { t } = useTranslation('modules/accounting');

  return (
    <Container size="xl" pt="xl">
      <CentralPageHeader
        title={t('templates.edit.invoice.title')}
        description={t('templates.edit.invoice.description')}
        namespace="modules/accounting"
        icon={<IconFileText size={32} />}
        breadcrumbs={[
          { label: 'navigation.dashboard', href: `/${currentLocale}/dashboard`, namespace: 'global' },
          { label: 'menu.label', href: `/${currentLocale}/modules/accounting`, namespace: 'modules/accounting' },
          { label: 'invoices.title', href: `/${currentLocale}/modules/accounting/invoices`, namespace: 'modules/accounting' },
          { label: t('form.edit'), namespace: 'modules/accounting' },
        ]}
      />
      <InvoiceForm locale={currentLocale} invoiceId={invoiceId} />
    </Container>
  );
}








