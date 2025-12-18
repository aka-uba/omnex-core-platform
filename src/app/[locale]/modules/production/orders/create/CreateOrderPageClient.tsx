'use client';

import { Container } from '@mantine/core';
import { IconClipboardList } from '@tabler/icons-react';
import { CentralPageHeader } from '@/components/headers/CentralPageHeader';
import { ProductionOrderForm } from '@/modules/production/components/ProductionOrderForm';
import { useParams } from 'next/navigation';
import { useTranslation } from '@/lib/i18n/client';

export function CreateOrderPageClient({ locale }: { locale: string }) {
  const params = useParams();
  const currentLocale = (params?.locale as string) || locale;
  const { t } = useTranslation('modules/production');

  return (
    <Container size="xl" pt="xl">
      <CentralPageHeader
        title={t('templates.create.order.title')}
        description={t('templates.create.order.description')}
        namespace="modules/production"
        icon={<IconClipboardList size={32} />}
        breadcrumbs={[
          { label: 'navigation.dashboard', href: `/${currentLocale}/dashboard`, namespace: 'global' },
          { label: 'menu.label', href: `/${currentLocale}/modules/production`, namespace: 'modules/production' },
          { label: 'orders.title', href: `/${currentLocale}/modules/production/orders`, namespace: 'modules/production' },
          { label: t('form.create'), namespace: 'modules/production' },
        ]}
      />
      <ProductionOrderForm locale={currentLocale} />
    </Container>
  );
}








