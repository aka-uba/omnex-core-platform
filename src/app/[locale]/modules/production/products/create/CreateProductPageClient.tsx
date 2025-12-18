'use client';

import { Container } from '@mantine/core';
import { IconPackage } from '@tabler/icons-react';
import { CentralPageHeader } from '@/components/headers/CentralPageHeader';
import { ProductForm } from '@/modules/production/components/ProductForm';
import { useParams } from 'next/navigation';
import { useTranslation } from '@/lib/i18n/client';

export function CreateProductPageClient({ locale }: { locale: string }) {
  const params = useParams();
  const currentLocale = (params?.locale as string) || locale;
  const { t } = useTranslation('modules/production');

  return (
    <Container size="xl" pt="xl">
      <CentralPageHeader
        title={t('templates.create.product.title')}
        description={t('templates.create.product.description')}
        namespace="modules/production"
        icon={<IconPackage size={32} />}
        breadcrumbs={[
          { label: 'navigation.dashboard', href: `/${currentLocale}/dashboard`, namespace: 'global' },
          { label: 'menu.label', href: `/${currentLocale}/modules/production`, namespace: 'modules/production' },
          { label: 'products.title', href: `/${currentLocale}/modules/production/products`, namespace: 'modules/production' },
          { label: t('form.create'), namespace: 'modules/production' },
        ]}
      />
      <ProductForm locale={currentLocale} />
    </Container>
  );
}








