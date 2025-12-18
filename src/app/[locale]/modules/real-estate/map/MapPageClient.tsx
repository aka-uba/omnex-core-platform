'use client';

import { Container, Stack, Text, Grid, Card, Group } from '@mantine/core';
import { IconMap, IconBuilding, IconHome, IconCheck, IconHome2 } from '@tabler/icons-react';
import { CentralPageHeader } from '@/components/headers/CentralPageHeader';
import { PropertyMap } from '@/modules/real-estate/components/PropertyMap';
import { useProperties } from '@/hooks/useProperties';
import { useApartments } from '@/hooks/useApartments';
import { useParams } from 'next/navigation';
import { useTranslation } from '@/lib/i18n/client';
import { useMemo } from 'react';

export function MapPageClient({ locale }: { locale: string }) {
  const params = useParams();
  const { t } = useTranslation('modules/real-estate');
  const currentLocale = (params?.locale as string) || locale;

  const { data: propertiesData } = useProperties({ page: 1, pageSize: 1000 });
  const { data: apartmentsData } = useApartments({ page: 1, pageSize: 1000 });

  const stats = useMemo(() => {
    if (!propertiesData || !apartmentsData) {
      return { totalProperties: 0, totalApartments: 0, rented: 0, empty: 0 };
    }
    const totalProperties = propertiesData.properties.length;
    const totalApartments = apartmentsData.apartments.length;
    const rented = apartmentsData.apartments.filter(a => a.status === 'rented').length;
    const empty = apartmentsData.apartments.filter(a => a.status === 'empty').length;
    return { totalProperties, totalApartments, rented, empty };
  }, [propertiesData, apartmentsData]);

  return (
    <Container size="xl" pt="xl">
      <CentralPageHeader
        title={t('map.title')}
        description={t('map.description')}
        namespace="modules/real-estate"
        icon={<IconMap size={32} />}
        breadcrumbs={[
          { label: 'navigation.dashboard', href: `/${currentLocale}/dashboard`, namespace: 'global' },
          { label: 'title', href: `/${currentLocale}/modules/real-estate`, namespace: 'modules/real-estate' },
          { label: 'map.title', namespace: 'modules/real-estate' },
        ]}
      />

      {/* Stats Cards - Single Row */}
      <Grid mt="md" gutter="md">
        <Grid.Col span={{ base: 6, sm: 3 }}>
          <Card shadow="sm" padding="md" radius="md" withBorder>
            <Group gap="md" align="flex-start">
              <div style={{
                padding: '12px',
                borderRadius: '8px',
                backgroundColor: 'var(--mantine-color-blue-light)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}>
                <IconBuilding size={24} color="var(--mantine-color-blue-6)" />
              </div>
              <Stack gap={4} style={{ flex: 1 }}>
                <Text size="sm" c="dimmed" fw={500}>{t('map.totalProperties')}</Text>
                <Text size="xl" fw={700}>{stats.totalProperties}</Text>
              </Stack>
            </Group>
          </Card>
        </Grid.Col>
        <Grid.Col span={{ base: 6, sm: 3 }}>
          <Card shadow="sm" padding="md" radius="md" withBorder>
            <Group gap="md" align="flex-start">
              <div style={{
                padding: '12px',
                borderRadius: '8px',
                backgroundColor: 'var(--mantine-color-violet-light)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}>
                <IconHome size={24} color="var(--mantine-color-violet-6)" />
              </div>
              <Stack gap={4} style={{ flex: 1 }}>
                <Text size="sm" c="dimmed" fw={500}>{t('map.totalApartments')}</Text>
                <Text size="xl" fw={700}>{stats.totalApartments}</Text>
              </Stack>
            </Group>
          </Card>
        </Grid.Col>
        <Grid.Col span={{ base: 6, sm: 3 }}>
          <Card shadow="sm" padding="md" radius="md" withBorder>
            <Group gap="md" align="flex-start">
              <div style={{
                padding: '12px',
                borderRadius: '8px',
                backgroundColor: 'var(--mantine-color-green-light)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}>
                <IconCheck size={24} color="var(--mantine-color-green-6)" />
              </div>
              <Stack gap={4} style={{ flex: 1 }}>
                <Text size="sm" c="dimmed" fw={500}>{t('map.rented')}</Text>
                <Text size="xl" fw={700} c="green">{stats.rented}</Text>
              </Stack>
            </Group>
          </Card>
        </Grid.Col>
        <Grid.Col span={{ base: 6, sm: 3 }}>
          <Card shadow="sm" padding="md" radius="md" withBorder>
            <Group gap="md" align="flex-start">
              <div style={{
                padding: '12px',
                borderRadius: '8px',
                backgroundColor: 'var(--mantine-color-yellow-light)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}>
                <IconHome2 size={24} color="var(--mantine-color-yellow-6)" />
              </div>
              <Stack gap={4} style={{ flex: 1 }}>
                <Text size="sm" c="dimmed" fw={500}>{t('map.empty')}</Text>
                <Text size="xl" fw={700} c="yellow">{stats.empty}</Text>
              </Stack>
            </Group>
          </Card>
        </Grid.Col>
      </Grid>

      {/* Map - Full Width */}
      <div style={{ marginTop: '1rem' }}>
        <PropertyMap locale={currentLocale} />
      </div>
    </Container>
  );
}




