'use client';

import { Container, Tabs, Paper, Stack, Group, Text, Badge, Grid, Card, Box, Image, SimpleGrid } from '@mantine/core';
import { IconHome, IconQrcode, IconFileText, IconArrowLeft, IconEdit, IconPhoto } from '@tabler/icons-react';
import { CentralPageHeader } from '@/components/headers/CentralPageHeader';
import { ApartmentQRCode } from '@/modules/real-estate/components/ApartmentQRCode';
import { useApartment } from '@/hooks/useApartments';
import { useParams, useRouter } from 'next/navigation';
import { useTranslation } from '@/lib/i18n/client';
import dayjs from 'dayjs';
import type { ApartmentStatus } from '@/modules/real-estate/types/apartment';
import { ApartmentDetailPageSkeleton } from './ApartmentDetailPageSkeleton';

export function ApartmentDetailPageClient({ locale }: { locale: string }) {
  const params = useParams();
  const router = useRouter();
  const { t } = useTranslation('modules/real-estate');
  const { t: tGlobal } = useTranslation('global');
  const currentLocale = (params?.locale as string) || locale;
  const apartmentId = params?.id as string;

  const { data: apartment, isLoading } = useApartment(apartmentId);

  if (isLoading) {
    return <ApartmentDetailPageSkeleton />;
  }

  if (!apartment) {
    return (
      <Container size="xl" pt="xl">
        <Text c="red">{tGlobal('common.notFound')}</Text>
      </Container>
    );
  }

  const getStatusBadge = (status: ApartmentStatus) => {
    const statusColors: Record<ApartmentStatus, string> = {
      empty: 'yellow',
      rented: 'green',
      sold: 'blue',
      maintenance: 'orange',
    };
    return (
      <Badge color={statusColors[status] || 'gray'}>
        {t(`apartments.status.${status}`)}
      </Badge>
    );
  };

  return (
    <Container size="xl" pt="xl">
      <CentralPageHeader
        title={apartment.unitNumber}
        description={t('apartments.details')}
        namespace="modules/real-estate"
        icon={<IconHome size={32} />}
        breadcrumbs={[
          { label: 'navigation.dashboard', href: `/${currentLocale}/dashboard`, namespace: 'global' },
          { label: 'menu.label', href: `/${currentLocale}/modules/real-estate`, namespace: 'modules/real-estate' },
          { label: t('apartments.title'), href: `/${currentLocale}/modules/real-estate/apartments`, namespace: 'modules/real-estate' },
          { label: apartment.unitNumber, namespace: 'modules/real-estate' },
        ]}
        actions={[
          {
            label: t('actions.back') || tGlobal('actions.back'),
            icon: <IconArrowLeft size={16} />,
            onClick: () => router.push(`/${currentLocale}/modules/real-estate/apartments`),
            variant: 'subtle',
          },
          {
            label: t('actions.edit') || tGlobal('actions.edit'),
            icon: <IconEdit size={16} />,
            onClick: () => {
              router.push(`/${currentLocale}/modules/real-estate/apartments/${apartmentId}/edit`);
            },
          },
        ]}
      />

      <Tabs defaultValue="details" mt="md">
        <Tabs.List>
          <Tabs.Tab value="details" leftSection={<IconFileText size={16} />}>
            {t('apartments.details')}
          </Tabs.Tab>
          {apartment.images && apartment.images.length > 0 && (
            <Tabs.Tab value="images" leftSection={<IconPhoto size={16} />}>
              {t('apartments.images')} ({apartment.images.length})
            </Tabs.Tab>
          )}
          <Tabs.Tab value="qrcode" leftSection={<IconQrcode size={16} />}>
            {t('qrCode.title')}
          </Tabs.Tab>
        </Tabs.List>

        <Tabs.Panel value="details" pt="md">
          <Paper shadow="xs" p="md">
            <Stack gap="md">
              <Group align="flex-start" gap="xl">
                {/* Cover Image */}
                <Box>
                  <Image
                    src={
                      apartment.coverImage
                        ? `/api/core-files/${apartment.coverImage}/download?inline=true`
                        : apartment.images && apartment.images.length > 0
                        ? `/api/core-files/${apartment.images[0]}/download?inline=true`
                        : undefined
                    }
                    alt={apartment.unitNumber}
                    width={300}
                    height={200}
                    radius="md"
                    fit="cover"
                    style={{
                      border: '4px solid var(--mantine-color-gray-3)',
                      boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
                    }}
                    fallbackSrc="https://placehold.co/300x200?text=Apartment"
                  />
                </Box>

                {/* Apartment Info */}
                <div style={{ flex: 1 }}>
                  <Group justify="space-between" align="flex-start" mb="md">
                    <div>
                      <Text size="xl" fw={600}>{apartment.unitNumber}</Text>
                      {apartment.property && (
                        <Text size="sm" c="dimmed" mt={4}>
                          {apartment.property.name}
                        </Text>
                      )}
                    </div>
                    <Group>
                      {getStatusBadge(apartment.status)}
                      {apartment.isActive ? (
                        <Badge color="green">{t('status.active')}</Badge>
                      ) : (
                        <Badge color="gray">{t('status.inactive')}</Badge>
                      )}
                    </Group>
                  </Group>

              <Grid>
                <Grid.Col span={{ base: 12, md: 6 }}>
                  <Stack gap="xs">
                    <Text size="sm" fw={500} c="dimmed">
                      {t('table.unitNumber')}
                    </Text>
                    <Text>{apartment.unitNumber}</Text>
                  </Stack>
                </Grid.Col>

                {apartment.floor && (
                  <Grid.Col span={{ base: 12, md: 6 }}>
                    <Stack gap="xs">
                      <Text size="sm" fw={500} c="dimmed">
                        {t('apartments.floor')}
                      </Text>
                      <Text>{apartment.floor}</Text>
                    </Stack>
                  </Grid.Col>
                )}

                {apartment.block && (
                  <Grid.Col span={{ base: 12, md: 6 }}>
                    <Stack gap="xs">
                      <Text size="sm" fw={500} c="dimmed">
                        {t('apartments.block')}
                      </Text>
                      <Text>{apartment.block}</Text>
                    </Stack>
                  </Grid.Col>
                )}

                <Grid.Col span={{ base: 12, md: 6 }}>
                  <Stack gap="xs">
                    <Text size="sm" fw={500} c="dimmed">
                      {t('apartments.area')}
                    </Text>
                    <Text>{Number(apartment.area).toLocaleString('tr-TR')} m²</Text>
                  </Stack>
                </Grid.Col>

                <Grid.Col span={{ base: 12, md: 6 }}>
                  <Stack gap="xs">
                    <Text size="sm" fw={500} c="dimmed">
                      {t('apartments.roomCount')}
                    </Text>
                    <Text>{apartment.roomCount} {t('apartments.rooms')}</Text>
                  </Stack>
                </Grid.Col>

                {apartment.rentPrice && (
                  <Grid.Col span={{ base: 12, md: 6 }}>
                    <Stack gap="xs">
                      <Text size="sm" fw={500} c="dimmed">
                        {t('apartments.rentPrice')}
                      </Text>
                      <Text fw={500}>
                        {Number(apartment.rentPrice).toLocaleString('tr-TR', {
                          style: 'currency',
                          currency: 'TRY',
                        })}
                      </Text>
                    </Stack>
                  </Grid.Col>
                )}

                {apartment.salePrice && (
                  <Grid.Col span={{ base: 12, md: 6 }}>
                    <Stack gap="xs">
                      <Text size="sm" fw={500} c="dimmed">
                        {t('apartments.salePrice')}
                      </Text>
                      <Text fw={500}>
                        {Number(apartment.salePrice).toLocaleString('tr-TR', {
                          style: 'currency',
                          currency: 'TRY',
                        })}
                      </Text>
                    </Stack>
                  </Grid.Col>
                )}

                {apartment.deliveryDate && (
                  <Grid.Col span={{ base: 12, md: 6 }}>
                    <Stack gap="xs">
                      <Text size="sm" fw={500} c="dimmed">
                        {t('apartments.deliveryDate')}
                      </Text>
                      <Text>{dayjs(apartment.deliveryDate).format('DD.MM.YYYY')}</Text>
                    </Stack>
                  </Grid.Col>
                )}

                {apartment.description && (
                  <Grid.Col span={12}>
                    <Stack gap="xs">
                      <Text size="sm" fw={500} c="dimmed">
                        {t('form.description')}
                      </Text>
                      <Text>{apartment.description}</Text>
                    </Stack>
                  </Grid.Col>
                )}

                <Grid.Col span={{ base: 12, md: 6 }}>
                  <Stack gap="xs">
                    <Text size="sm" fw={500} c="dimmed">
                      {tGlobal('common.createdAt')}
                    </Text>
                    <Text>{dayjs(apartment.createdAt).format('DD.MM.YYYY HH:mm')}</Text>
                  </Stack>
                </Grid.Col>

                <Grid.Col span={{ base: 12, md: 6 }}>
                  <Stack gap="xs">
                    <Text size="sm" fw={500} c="dimmed">
                      {tGlobal('common.updatedAt')}
                    </Text>
                    <Text>{dayjs(apartment.updatedAt).format('DD.MM.YYYY HH:mm')}</Text>
                  </Stack>
                </Grid.Col>
              </Grid>
                </div>
              </Group>
            </Stack>
          </Paper>
        </Tabs.Panel>

        {apartment.images && apartment.images.length > 0 && (
          <Tabs.Panel value="images" pt="md">
            <Paper shadow="xs" p="md">
              <Stack gap="md">
                <Text size="lg" fw={600}>
                  {t('apartments.images')}
                </Text>
                <SimpleGrid cols={{ base: 1, sm: 2, md: 3, lg: 4 }} spacing="md">
                  {apartment.images.map((imageId) => (
                    <Card key={imageId} padding="xs" radius="md" withBorder>
                      <Card.Section>
                        <Box style={{ aspectRatio: '16/9', position: 'relative' }}>
                          <Image
                            src={`/api/core-files/${imageId}/download?inline=true`}
                            alt="Apartment image"
                            height={200}
                            fit="cover"
                            fallbackSrc="https://placehold.co/300x200?text=Image"
                          />
                          {apartment.coverImage === imageId && (
                            <Badge
                              pos="absolute"
                              top={8}
                              left={8}
                              color="yellow"
                              variant="filled"
                              size="sm"
                            >
                              {t('form.coverImage')}
                            </Badge>
                          )}
                        </Box>
                      </Card.Section>
                    </Card>
                  ))}
                </SimpleGrid>
              </Stack>
            </Paper>
          </Tabs.Panel>
        )}

        <Tabs.Panel value="qrcode" pt="md">
          <ApartmentQRCode
            apartmentId={apartmentId}
            locale={currentLocale}
            size={300}
            showActions={true}
          />
        </Tabs.Panel>
      </Tabs>
    </Container>
  );
}






