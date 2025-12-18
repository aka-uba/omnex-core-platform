'use client';

import { Container } from '@mantine/core';
import { IconBuildingWarehouse } from '@tabler/icons-react';
import { CentralPageHeader } from '@/components/headers/CentralPageHeader';
import { StockMovementList } from '@/modules/production/components/StockMovementList';
import { useParams } from 'next/navigation';
import { useTranslation } from '@/lib/i18n/client';

export function StockPageClient({ locale }: { locale: string }) {
  const params = useParams();
  const currentLocale = (params?.locale as string) || locale;
  const { t } = useTranslation('modules/production');

  return (
    <Container size="xl" pt="xl">
      <CentralPageHeader
        title={t('stock.title')}
        description={t('stock.description')}
        namespace="modules/production"
        icon={<IconBuildingWarehouse size={32} />}
        breadcrumbs={[
          { label: 'navigation.dashboard', href: `/${currentLocale}/dashboard`, namespace: 'global' },
          { label: t('title'), href: `/${currentLocale}/modules/production`, namespace: 'modules/production' },
          { label: t('stock.title'), namespace: 'modules/production' },
        ]}
        actions={[
          {
            label: t('stock.title'),
            icon: <IconBuildingWarehouse size={18} />,
            onClick: () => {
              window.location.href = `/${currentLocale}/modules/production/stock/create`;
            },
            variant: 'filled',
          },
        ]}
      />
      <StockMovementList locale={currentLocale} />
    </Container>
  );
}


