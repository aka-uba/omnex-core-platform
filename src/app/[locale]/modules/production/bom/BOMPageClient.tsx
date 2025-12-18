'use client';

import { useState } from 'react';
import { Container, Paper, Text } from '@mantine/core';
import { IconList } from '@tabler/icons-react';
import { CentralPageHeader } from '@/components/headers/CentralPageHeader';
import { BOMViewer } from '@/modules/production/components/BOMViewer';
import { useParams } from 'next/navigation';
import { useTranslation } from '@/lib/i18n/client';
import { useProducts } from '@/hooks/useProducts';
import { Select } from '@mantine/core';

export function BOMPageClient({ params }: { params: Promise<{ locale: string }> }) {
  const urlParams = useParams();
  const currentLocale = (urlParams?.locale as string) || 'tr';
  const { t } = useTranslation('modules/production');
  const [selectedProductId, setSelectedProductId] = useState<string | undefined>();
  const { data: productsData } = useProducts({ page: 1, pageSize: 1000 });

  const products = productsData?.products || [];

  return (
    <Container size="xl" pt="xl">
      <CentralPageHeader
        title={t('bom.title')}
        description={t('bom.description')}
        namespace="modules/production"
        icon={<IconList size={32} />}
        breadcrumbs={[
          { label: 'navigation.dashboard', href: `/${currentLocale}/dashboard`, namespace: 'global' },
          { label: t('title'), href: `/${currentLocale}/modules/production`, namespace: 'modules/production' },
          { label: t('bom.title'), namespace: 'modules/production' },
        ]}
      />
      <Paper shadow="xs" p="md" mt="md">
        <Select
          label={t('bom.selectProduct')}
          placeholder={t('bom.selectProductPlaceholder')}
          data={products.map((p) => ({ value: p.id, label: `${p.name} (${p.code})` }))}
          {...(selectedProductId ? { value: selectedProductId } : {})}
          onChange={(value) => setSelectedProductId(value || undefined)}
          clearable
          searchable
          mb="md"
        />
        {selectedProductId ? (
          <BOMViewer
            locale={currentLocale}
            productId={selectedProductId}
            onItemChange={() => {
              // Refresh if needed
            }}
          />
        ) : (
          <Text c="dimmed" ta="center" py="xl">
            {t('bom.selectProductFirst')}
          </Text>
        )}
      </Paper>
    </Container>
  );
}





