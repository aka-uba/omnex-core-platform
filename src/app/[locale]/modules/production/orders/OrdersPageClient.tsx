'use client';

import { Container } from '@mantine/core';
import { IconClipboardList } from '@tabler/icons-react';
import { CentralPageHeader } from '@/components/headers/CentralPageHeader';
import { ProductionOrderList } from '@/modules/production/components/ProductionOrderList';
import { useParams } from 'next/navigation';
import { useTranslation } from '@/lib/i18n/client';

export function OrdersPageClient({ locale }: { locale: string }) {
  const params = useParams();
  const currentLocale = (params?.locale as string) || locale;
  const { t } = useTranslation('modules/production');

  return (
    <Container size="xl" pt="xl">
      <CentralPageHeader
        title={t('orders.title')}
        description={t('orders.description')}
        namespace="modules/production"
        icon={<IconClipboardList size={32} />}
        breadcrumbs={[
          { label: 'navigation.dashboard', href: `/${currentLocale}/dashboard`, namespace: 'global' },
          { label: t('title'), href: `/${currentLocale}/modules/production`, namespace: 'modules/production' },
          { label: t('orders.title'), namespace: 'modules/production' },
        ]}
        actions={[
          {
            label: t('actions.newOrder'),
            icon: <IconClipboardList size={18} />,
            onClick: () => {
              window.location.href = `/${currentLocale}/modules/production/orders/create`;
            },
            variant: 'filled',
          },
        ]}
      />
      <ProductionOrderList locale={currentLocale} />
    </Container>
  );
}






