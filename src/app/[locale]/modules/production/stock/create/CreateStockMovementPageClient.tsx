'use client';

import { Container } from '@mantine/core';
import { IconBuildingWarehouse } from '@tabler/icons-react';
import { CentralPageHeader } from '@/components/headers/CentralPageHeader';
import { StockMovementForm } from '@/modules/production/components/StockMovementForm';
import { useParams } from 'next/navigation';

export function CreateStockMovementPageClient({ locale }: { locale: string }) {
  const params = useParams();
  const currentLocale = (params?.locale as string) || locale;

  return (
    <Container size="xl" pt="xl">
      <CentralPageHeader
        title="Create Stock Movement"
        description="Add a new stock movement"
        namespace="modules/production"
        icon={<IconBuildingWarehouse size={32} />}
        breadcrumbs={[
          { label: 'navigation.dashboard', href: `/${currentLocale}/dashboard`, namespace: 'global' },
          { label: 'Production', href: `/${currentLocale}/modules/production`, namespace: 'modules/production' },
          { label: 'Stock', href: `/${currentLocale}/modules/production/stock`, namespace: 'modules/production' },
          { label: 'Create', namespace: 'modules/production' },
        ]}
      />
      <StockMovementForm locale={currentLocale} />
    </Container>
  );
}


