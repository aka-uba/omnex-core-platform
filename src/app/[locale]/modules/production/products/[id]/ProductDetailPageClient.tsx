'use client';

import { Container, Paper, Group, Text, Badge, Stack, Grid, Tabs } from '@mantine/core';
import { IconPackage, IconEdit, IconList } from '@tabler/icons-react';
import { CentralPageHeader } from '@/components/headers/CentralPageHeader';
import { useProduct } from '@/hooks/useProducts';
import { useParams, useRouter } from 'next/navigation';
import { useTranslation } from '@/lib/i18n/client';
import { DetailPageSkeleton } from '@/components/skeletons/DetailPageSkeleton';
import dayjs from 'dayjs';
import { BOMViewer } from '@/modules/production/components/BOMViewer';

export function ProductDetailPageClient({ locale, productId }: { locale: string; productId: string }) {
  const params = useParams();
  const router = useRouter();
  const currentLocale = (params?.locale as string) || locale;
  const { t } = useTranslation('modules/production');
  const { data: product, isLoading } = useProduct(productId);

  if (isLoading) {
    return <DetailPageSkeleton showTabs />;
  }

  if (!product) {
    return (
      <Container size="xl" pt="xl">
        <Text c="red">{t('common.notFound')}</Text>
      </Container>
    );
  }

  const getTypeBadge = (type: string) => {
    const typeColors: Record<string, string> = {
      hammadde: 'blue',
      yarı_mamul: 'orange',
      mamul: 'green',
    };
    return (
      <Badge color={typeColors[type] || 'gray'}>
        {t(`types.${type}`)}
      </Badge>
    );
  };

  return (
    <Container size="xl" pt="xl">
      <CentralPageHeader
        title={product.name}
        description={product.code}
        namespace="modules/production"
        icon={<IconPackage size={32} />}
        breadcrumbs={[
          { label: 'navigation.dashboard', href: `/${currentLocale}/dashboard`, namespace: 'global' },
          { label: 'menu.label', href: `/${currentLocale}/modules/production`, namespace: 'modules/production' },
          { label: 'products.title', href: `/${currentLocale}/modules/production/products`, namespace: 'modules/production' },
          { label: product.name, namespace: 'modules/production' },
        ]}
        actions={[
          {
            label: t('form.edit'),
            icon: <IconEdit size={18} />,
            onClick: () => {
              router.push(`/${currentLocale}/modules/production/products/${productId}/edit`);
            },
            variant: 'light',
          },
        ]}
      />
      <Paper shadow="xs" p="md" mt="md">
        <Tabs defaultValue="details">
          <Tabs.List>
            <Tabs.Tab value="details" leftSection={<IconPackage size={16} />}>
              {t('tabs.details')}
            </Tabs.Tab>
            {product.isProducible && (
              <Tabs.Tab value="bom" leftSection={<IconList size={16} />}>
                {t('tabs.bom')}
              </Tabs.Tab>
            )}
          </Tabs.List>

          <Tabs.Panel value="details" pt="md">
            <Stack gap="md">
              <Group>
                <Text fw={500} size="lg">{product.name}</Text>
                {getTypeBadge(product.type)}
                <Badge color={product.isActive ? 'green' : 'gray'}>
                  {product.isActive ? t('status.active') : t('status.inactive')}
                </Badge>
              </Group>

              <Grid>
                <Grid.Col span={{ base: 12, md: 6 }}>
                  <Text size="sm" c="dimmed">{t('form.code')}</Text>
                  <Text fw={500}>{product.code}</Text>
                </Grid.Col>
                <Grid.Col span={{ base: 12, md: 6 }}>
                  <Text size="sm" c="dimmed">{t('form.category')}</Text>
                  <Text fw={500}>{product.category}</Text>
                </Grid.Col>
                <Grid.Col span={{ base: 12, md: 6 }}>
                  <Text size="sm" c="dimmed">{t('form.stockQuantity')}</Text>
                  <Text fw={500}>{Number(product.stockQuantity).toLocaleString('tr-TR')} {product.unit}</Text>
                </Grid.Col>
                <Grid.Col span={{ base: 12, md: 6 }}>
                  <Text size="sm" c="dimmed">{t('form.unit')}</Text>
                  <Text fw={500}>{product.unit}</Text>
                </Grid.Col>
                {product.costPrice && (
                  <Grid.Col span={{ base: 12, md: 6 }}>
                    <Text size="sm" c="dimmed">{t('form.costPrice')}</Text>
                    <Text fw={500}>
                      {Number(product.costPrice).toLocaleString('tr-TR', {
                        style: 'currency',
                        currency: product.currency || 'TRY',
                      })}
                    </Text>
                  </Grid.Col>
                )}
                {product.sellingPrice && (
                  <Grid.Col span={{ base: 12, md: 6 }}>
                    <Text size="sm" c="dimmed">{t('form.sellingPrice')}</Text>
                    <Text fw={500}>
                      {Number(product.sellingPrice).toLocaleString('tr-TR', {
                        style: 'currency',
                        currency: product.currency || 'TRY',
                      })}
                    </Text>
                  </Grid.Col>
                )}
                {product.description && (
                  <Grid.Col span={{ base: 12 }}>
                    <Text size="sm" c="dimmed">{t('form.description')}</Text>
                    <Text>{product.description}</Text>
                  </Grid.Col>
                )}
                <Grid.Col span={{ base: 12, md: 6 }}>
                  <Text size="sm" c="dimmed">{t('form.createdAt')}</Text>
                  <Text fw={500}>{dayjs(product.createdAt).format('DD.MM.YYYY HH:mm')}</Text>
                </Grid.Col>
                <Grid.Col span={{ base: 12, md: 6 }}>
                  <Text size="sm" c="dimmed">{t('form.updatedAt')}</Text>
                  <Text fw={500}>{dayjs(product.updatedAt).format('DD.MM.YYYY HH:mm')}</Text>
                </Grid.Col>
              </Grid>
            </Stack>
          </Tabs.Panel>

          {product.isProducible && (
            <Tabs.Panel value="bom" pt="md">
              <BOMViewer
                locale={currentLocale}
                productId={productId}
                onItemChange={() => {
                  // Refresh if needed
                }}
              />
            </Tabs.Panel>
          )}
        </Tabs>
      </Paper>
    </Container>
  );
}


