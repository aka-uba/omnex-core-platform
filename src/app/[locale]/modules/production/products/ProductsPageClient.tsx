'use client';

import { Container } from '@mantine/core';
import { IconPackage } from '@tabler/icons-react';
import { CentralPageHeader } from '@/components/headers/CentralPageHeader';
import { ProductList } from '@/modules/production/components/ProductList';
import { useParams } from 'next/navigation';
import { useTranslation } from '@/lib/i18n/client';

export function ProductsPageClient({ locale }: { locale: string }) {
  const params = useParams();
  const currentLocale = (params?.locale as string) || locale;
  const { t } = useTranslation('modules/production');

  return (
    <Container size="xl" pt="xl">
      <CentralPageHeader
        title={t('products.title')}
        description={t('products.description')}
        namespace="modules/production"
        icon={<IconPackage size={32} />}
        breadcrumbs={[
          { label: 'navigation.dashboard', href: `/${currentLocale}/dashboard`, namespace: 'global' },
          { label: t('title'), href: `/${currentLocale}/modules/production`, namespace: 'modules/production' },
          { label: t('products.title'), namespace: 'modules/production' },
        ]}
        actions={[
          {
            label: t('actions.newProduct'),
            icon: <IconPackage size={18} />,
            onClick: () => {
              window.location.href = `/${currentLocale}/modules/production/products/create`;
            },
            variant: 'filled',
          },
        ]}
      />
      <ProductList locale={currentLocale} />
    </Container>
  );
}






