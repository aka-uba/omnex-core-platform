'use client';

import { useMemo } from 'react';
import { Container, Paper, Stack, Group, Text, Badge, Grid, Card, SimpleGrid, Image, Box, Title, Button } from '@mantine/core';
import { IconHome, IconMapPin } from '@tabler/icons-react';
import { useRouter } from 'next/navigation';
import { useTranslation } from '@/lib/i18n/client';
import { useQuery } from '@tanstack/react-query';
import type { ApartmentStatus } from '@/modules/real-estate/types/apartment';

interface PublicApartmentViewClientProps {
  apartmentId: string;
  locale: string;
}

export function PublicApartmentViewClient({ apartmentId, locale }: PublicApartmentViewClientProps) {
  const router = useRouter();
  const { t } = useTranslation('modules/real-estate');
  const { t: tGlobal } = useTranslation('global');

  // Fetch apartment data from public API
  const { data: apartmentData, isLoading, error } = useQuery({
    queryKey: ['public-apartment', apartmentId],
    queryFn: async () => {
      const response = await fetch(`/api/public/apartments/${apartmentId}`);
      if (!response.ok) {
        throw new Error('Failed to fetch apartment');
      }
      const data = await response.json();
      return data.data.apartment;
    },
    enabled: !!apartmentId,
  });

  const getStatusBadge = useMemo(() => {
    const statusColors: Record<ApartmentStatus, string> = {
      empty: 'yellow',
      rented: 'green',
      sold: 'blue',
      maintenance: 'orange',
    };
    return (status: ApartmentStatus) => (
      <Badge color={statusColors[status] || 'gray'}>
        {t(`apartments.status.${status}`)}
      </Badge>
    );
  }, [t]);

  if (isLoading) {
    return (
      <Container size="xl" pt="xl">
        <Paper p="xl">
          <Stack align="center" gap="md">
            <Text>{tGlobal('common.loading')}</Text>
          </Stack>
        </Paper>
      </Container>
    );
  }

  if (error || !apartmentData) {
    return (
      <Container size="xl" pt="xl">
        <Paper p="xl">
          <Stack align="center" gap="md">
            <Text c="red">{tGlobal('common.notFound')}</Text>
            <Button onClick={() => router.push('/')} variant="light">
              {tGlobal('common.back')}
            </Button>
          </Stack>
        </Paper>
      </Container>
    );
  }

  const apartment = apartmentData;
  const property = apartment.property;

  // Build full address
  const fullAddress = useMemo(() => {
    const parts: string[] = [];
    if (property?.address) parts.push(property.address);
    if (property?.district) parts.push(property.district);
    if (property?.city) parts.push(property.city);
    return parts.join(', ') || undefined;
  }, [property]);

  // Get image URL
  const getImageUrl = (fileId: string) => {
    return `/api/core-files/${fileId}/download`;
  };

  return (
    <Container size="xl" pt="xl">
      <Paper shadow="sm" p="xl" radius="md">
        <Stack gap="xl">
          {/* Header */}
          <Group justify="space-between" align="flex-start">
            <Stack gap="xs">
              <Title order={1}>
                {property?.name ? `${property.name} - ${apartment.unitNumber}` : apartment.unitNumber}
              </Title>
              {fullAddress && (
                <Group gap="xs" c="dimmed">
                  <IconMapPin size={16} />
                  <Text size="sm">{fullAddress}</Text>
                </Group>
              )}
            </Stack>
            {getStatusBadge(apartment.status)}
          </Group>

          {/* Images */}
          {apartment.images && apartment.images.length > 0 && (
            <Box>
              <Text size="lg" fw={500} mb="md">
                {t('apartments.images')}
              </Text>
              <SimpleGrid cols={{ base: 1, sm: 2, md: 3 }} spacing="md">
                {apartment.images.map((imageId: string) => (
                  <Card key={imageId} padding="xs" radius="md" withBorder>
                    <Card.Section>
                      <Image
                        src={getImageUrl(imageId)}
                        alt="Apartment image"
                        height={200}
                        fit="cover"
                        fallbackSrc="https://placehold.co/400x300?text=Image"
                      />
                    </Card.Section>
                  </Card>
                ))}
              </SimpleGrid>
            </Box>
          )}

          {/* Details */}
          <Grid>
            <Grid.Col span={{ base: 12, md: 6 }}>
              <Card padding="md" radius="md" withBorder>
                <Stack gap="md">
                  <Text size="lg" fw={500}>
                    {t('apartments.details')}
                  </Text>
                  <Group justify="space-between">
                    <Text size="sm" c="dimmed">{t('apartments.fields.area')}</Text>
                    <Text fw={500}>{apartment.area} m²</Text>
                  </Group>
                  <Group justify="space-between">
                    <Text size="sm" c="dimmed">{t('apartments.fields.roomCount')}</Text>
                    <Text fw={500}>{apartment.roomCount}</Text>
                  </Group>
                  <Group justify="space-between">
                    <Text size="sm" c="dimmed">{t('apartments.fields.bathroomCount')}</Text>
                    <Text fw={500}>{apartment.bathroomCount}</Text>
                  </Group>
                  {apartment.floor !== null && (
                    <Group justify="space-between">
                      <Text size="sm" c="dimmed">{t('apartments.fields.floor')}</Text>
                      <Text fw={500}>{apartment.floor}</Text>
                    </Group>
                  )}
                  {apartment.block && (
                    <Group justify="space-between">
                      <Text size="sm" c="dimmed">{t('apartments.fields.block')}</Text>
                      <Text fw={500}>{apartment.block}</Text>
                    </Group>
                  )}
                  <Group justify="space-between">
                    <Text size="sm" c="dimmed">{t('apartments.fields.balcony')}</Text>
                    <Badge color={apartment.balcony ? 'green' : 'gray'}>
                      {apartment.balcony ? tGlobal('common.yes') : tGlobal('common.no')}
                    </Badge>
                  </Group>
                  <Group justify="space-between">
                    <Text size="sm" c="dimmed">{t('apartments.fields.livingRoom')}</Text>
                    <Badge color={apartment.livingRoom ? 'green' : 'gray'}>
                      {apartment.livingRoom ? tGlobal('common.yes') : tGlobal('common.no')}
                    </Badge>
                  </Group>
                </Stack>
              </Card>
            </Grid.Col>

            <Grid.Col span={{ base: 12, md: 6 }}>
              <Card padding="md" radius="md" withBorder>
                <Stack gap="md">
                  <Text size="lg" fw={500}>
                    {t('properties.title')}
                  </Text>
                  {property && (
                    <>
                      <Group gap="xs">
                        <IconHome size={16} />
                        <Text fw={500}>{property.name}</Text>
                      </Group>
                      {property.type && (
                        <Group justify="space-between">
                          <Text size="sm" c="dimmed">{t('properties.fields.type')}</Text>
                          <Text fw={500}>{t(`properties.types.${property.type}`)}</Text>
                        </Group>
                      )}
                    </>
                  )}
                </Stack>
              </Card>
            </Grid.Col>
          </Grid>

          {/* Description */}
          {apartment.description && (
            <Card padding="md" radius="md" withBorder>
              <Stack gap="md">
                <Text size="lg" fw={500}>
                  {t('apartments.fields.description')}
                </Text>
                <Text>{apartment.description}</Text>
              </Stack>
            </Card>
          )}

          {/* Contact Button */}
          <Group justify="center">
            <Button
              size="lg"
              onClick={() => router.push(`/${locale}/auth/login`)}
            >
              {t('apartments.contactForDetails')}
            </Button>
          </Group>
        </Stack>
      </Paper>
    </Container>
  );
}

