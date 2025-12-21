'use client';

import { useMemo } from 'react';
import { Container, Tabs, Paper, Stack, Group, Text, Badge, Grid, Box, Image, Button, Card, Title, Divider, Table } from '@mantine/core';
import { IconBuilding, IconFileText, IconHome, IconArrowLeft, IconEdit, IconEye, IconCash } from '@tabler/icons-react';
import { CentralPageHeader } from '@/components/headers/CentralPageHeader';
import { useProperty } from '@/hooks/useProperties';
import { useParams, useRouter } from 'next/navigation';
import { useTranslation } from '@/lib/i18n/client';
import dayjs from 'dayjs';
import type { PropertyType } from '@/modules/real-estate/types/property';
import { PropertyDetailPageSkeleton } from './PropertyDetailPageSkeleton';

export function PropertyDetailPageClient({ locale }: { locale: string }) {
  const params = useParams();
  const router = useRouter();
  const { t } = useTranslation('modules/real-estate');
  const { t: tGlobal } = useTranslation('global');
  const currentLocale = (params?.locale as string) || locale;
  const propertyId = params?.id as string;

  const { data: property, isLoading } = useProperty(propertyId);

  // Bina seviyesinde yan gider özeti hesaplaması
  const propertySideCostSummary = useMemo(() => {
    if (!property?.apartments || property.apartments.length === 0) return null;

    let totalColdRent = 0;
    let totalAdditionalCosts = 0;
    let totalHeatingCosts = 0;
    let apartmentsWithSideCosts = 0;

    const apartmentDetails = property.apartments.map((apt: any) => {
      const coldRent = Number(apt.coldRent) || 0;
      const additionalCosts = Number(apt.additionalCosts) || 0;
      const heatingCosts = Number(apt.heatingCosts) || 0;
      const warmRent = coldRent + additionalCosts + heatingCosts;

      if (warmRent > 0) apartmentsWithSideCosts++;

      totalColdRent += coldRent;
      totalAdditionalCosts += additionalCosts;
      totalHeatingCosts += heatingCosts;

      return {
        id: apt.id,
        unitNumber: apt.unitNumber,
        coldRent,
        additionalCosts,
        heatingCosts,
        warmRent,
        area: Number(apt.area) || 0,
      };
    });

    const totalWarmRent = totalColdRent + totalAdditionalCosts + totalHeatingCosts;

    if (totalWarmRent === 0) return null;

    return {
      totalColdRent,
      totalAdditionalCosts,
      totalHeatingCosts,
      totalWarmRent,
      apartmentCount: property.apartments.length,
      apartmentsWithSideCosts,
      apartmentDetails: apartmentDetails.filter((a: any) => a.warmRent > 0),
    };
  }, [property]);

  if (isLoading) {
    return <PropertyDetailPageSkeleton />;
  }

  if (!property) {
    return (
      <Container size="xl" pt="xl">
        <Text c="red">{tGlobal('common.notFound')}</Text>
      </Container>
    );
  }

  const getTypeBadge = (type: PropertyType) => {
    const typeColors: Record<PropertyType, string> = {
      apartment: 'blue',
      complex: 'green',
      building: 'orange',
    };
    return (
      <Badge color={typeColors[type] || 'gray'}>
        {t(`types.${type}`) || type}
      </Badge>
    );
  };

  return (
    <Container size="xl" pt="xl">
      <CentralPageHeader
        title={property.name}
        description={t('properties.detail.description')}
        namespace="modules/real-estate"
        icon={<IconBuilding size={32} />}
        breadcrumbs={[
          { label: 'navigation.dashboard', href: `/${currentLocale}/dashboard`, namespace: 'global' },
          { label: 'menu.label', href: `/${currentLocale}/modules/real-estate`, namespace: 'modules/real-estate' },
          { label: t('properties.title'), href: `/${currentLocale}/modules/real-estate/properties`, namespace: 'modules/real-estate' },
          { label: property.name, namespace: 'modules/real-estate' },
        ]}
        actions={[
          {
            label: t('actions.back') || tGlobal('actions.back'),
            icon: <IconArrowLeft size={16} />,
            onClick: () => router.push(`/${currentLocale}/modules/real-estate/properties`),
            variant: 'subtle',
          },
          {
            label: t('actions.edit') || tGlobal('actions.edit'),
            icon: <IconEdit size={16} />,
            onClick: () => {
              router.push(`/${currentLocale}/modules/real-estate/properties/${propertyId}/edit`);
            },
          },
        ]}
      />

          <Tabs defaultValue="details" mt="md">
            <Tabs.List>
              <Tabs.Tab value="details" leftSection={<IconFileText size={20} />}>
                {t('properties.details')}
              </Tabs.Tab>
              {property.apartments && property.apartments.length > 0 && (
                <Tabs.Tab value="apartments" leftSection={<IconHome size={20} />}>
                  {t('apartments.title')} ({property.apartments.length})
                </Tabs.Tab>
              )}
              {propertySideCostSummary && (
                <Tabs.Tab value="sideCosts" leftSection={<IconCash size={20} />}>
                  {t('sideCosts.rentAndSideCosts')}
                </Tabs.Tab>
              )}
            </Tabs.List>

        <Tabs.Panel value="details" pt="md">
          <Paper shadow="xs" p="md">
            <Stack gap="md">
              <Group align="flex-start" gap="xl">
                {/* Cover Image */}
                <Box>
                  <Image
                    src={
                      property.coverImage
                        ? `/api/core-files/${property.coverImage}/download?inline=true`
                        : property.images && property.images.length > 0
                        ? `/api/core-files/${property.images[0]}/download?inline=true`
                        : undefined
                    }
                    alt={property.name}
                    width={300}
                    height={200}
                    radius="md"
                    fit="cover"
                    style={{
                      border: '4px solid var(--mantine-color-gray-3)',
                      boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
                    }}
                    fallbackSrc="https://placehold.co/300x200?text=Property"
                  />
                </Box>

                {/* Property Info */}
                <div style={{ flex: 1 }}>
                  <Group justify="space-between" align="flex-start" mb="md">
                    <div>
                      <Text size="xl" fw={600}>{property.name}</Text>
                      {property.code && (
                        <Text size="sm" c="dimmed" mt={4}>
                          {t('form.code')}: {property.code}
                        </Text>
                      )}
                    </div>
                    <Group>
                      {getTypeBadge(property.type)}
                      {property.isActive ? (
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
                      {t('table.type')}
                    </Text>
                    <Text>{t(`types.${property.type}`) || property.type}</Text>
                  </Stack>
                </Grid.Col>

                <Grid.Col span={{ base: 12, md: 6 }}>
                  <Stack gap="xs">
                    <Text size="sm" fw={500} c="dimmed">
                      {t('table.units')}
                    </Text>
                    <Text>{property.totalUnits}</Text>
                  </Stack>
                </Grid.Col>

                <Grid.Col span={12}>
                  <Stack gap="xs">
                    <Text size="sm" fw={500} c="dimmed">
                      {t('table.address')}
                    </Text>
                    <Text>{property.address}</Text>
                  </Stack>
                </Grid.Col>

                <Grid.Col span={{ base: 12, md: 6 }}>
                  <Stack gap="xs">
                    <Text size="sm" fw={500} c="dimmed">
                      {t('table.city')}
                    </Text>
                    <Text>{property.city}</Text>
                  </Stack>
                </Grid.Col>

                {property.district && (
                  <Grid.Col span={{ base: 12, md: 6 }}>
                    <Stack gap="xs">
                      <Text size="sm" fw={500} c="dimmed">
                        {t('table.district')}
                      </Text>
                      <Text>{property.district}</Text>
                    </Stack>
                  </Grid.Col>
                )}

                {property.neighborhood && (
                  <Grid.Col span={{ base: 12, md: 6 }}>
                    <Stack gap="xs">
                      <Text size="sm" fw={500} c="dimmed">
                        {t('form.neighborhood')}
                      </Text>
                      <Text>{property.neighborhood}</Text>
                    </Stack>
                  </Grid.Col>
                )}

                {property.postalCode && (
                  <Grid.Col span={{ base: 12, md: 6 }}>
                    <Stack gap="xs">
                      <Text size="sm" fw={500} c="dimmed">
                        {t('form.postalCode')}
                      </Text>
                      <Text>{property.postalCode}</Text>
                    </Stack>
                  </Grid.Col>
                )}

                {property.monthlyFee && (
                  <Grid.Col span={{ base: 12, md: 6 }}>
                    <Stack gap="xs">
                      <Text size="sm" fw={500} c="dimmed">
                        {t('form.monthlyFee')}
                      </Text>
                      <Text fw={500}>
                        {Number(property.monthlyFee).toLocaleString('tr-TR', {
                          style: 'currency',
                          currency: 'TRY',
                        })}
                      </Text>
                    </Stack>
                  </Grid.Col>
                )}

                {property.paymentDay && (
                  <Grid.Col span={{ base: 12, md: 6 }}>
                    <Stack gap="xs">
                      <Text size="sm" fw={500} c="dimmed">
                        {t('form.paymentDay')}
                      </Text>
                      <Text>{property.paymentDay}</Text>
                    </Stack>
                  </Grid.Col>
                )}

                {property.description && (
                  <Grid.Col span={12}>
                    <Stack gap="xs">
                      <Text size="sm" fw={500} c="dimmed">
                        {t('form.description')}
                      </Text>
                      <Text>{property.description}</Text>
                    </Stack>
                  </Grid.Col>
                )}

                <Grid.Col span={{ base: 12, md: 6 }}>
                  <Stack gap="xs">
                    <Text size="sm" fw={500} c="dimmed">
                      {tGlobal('common.createdAt')}
                    </Text>
                    <Text>{dayjs(property.createdAt).format('DD.MM.YYYY HH:mm')}</Text>
                  </Stack>
                </Grid.Col>

                <Grid.Col span={{ base: 12, md: 6 }}>
                  <Stack gap="xs">
                    <Text size="sm" fw={500} c="dimmed">
                      {tGlobal('common.updatedAt')}
                    </Text>
                    <Text>{dayjs(property.updatedAt).format('DD.MM.YYYY HH:mm')}</Text>
                  </Stack>
                </Grid.Col>
              </Grid>
                </div>
              </Group>
            </Stack>
          </Paper>
        </Tabs.Panel>

        {property.apartments && property.apartments.length > 0 && (
          <Tabs.Panel value="apartments" pt="md">
            <Paper shadow="xs" p="md">
              <Stack gap="md">
                {property.apartments.map((apartment) => (
                  <Paper 
                    key={apartment.id} 
                    p="md" 
                    withBorder
                  >
                    <Group align="flex-start" gap="md">
                      {/* Apartment Cover Image - Sol tarafta */}
                      <Box
                        style={{
                          width: 256,
                          height: 256,
                          flexShrink: 0,
                        }}
                      >
                        <Image
                          src={
                            apartment.coverImage
                              ? `/api/core-files/${apartment.coverImage}/download?inline=true`
                              : apartment.images && apartment.images.length > 0
                              ? `/api/core-files/${apartment.images[0]}/download?inline=true`
                              : undefined
                          }
                          alt={apartment.unitNumber}
                          width={256}
                          height={256}
                          radius="md"
                          fit="cover"
                          style={{
                            width: '100%',
                            height: '100%',
                            border: '2px solid var(--mantine-color-gray-3)',
                            objectFit: 'cover',
                          }}
                          fallbackSrc="https://placehold.co/256x256?text=Apartment"
                        />
                      </Box>
                      
                      {/* Açıklama ve Butonlar - Sağ tarafta */}
                      <div style={{ flex: 1 }}>
                        <Stack gap="xs">
                          <Group justify="space-between" align="flex-start">
                            <div>
                              <Text fw={500} size="lg" mb={4}>{apartment.unitNumber}</Text>
                              <Group gap="xs" mb="xs">
                                {apartment.floor && (
                                  <Text size="sm" c="dimmed">
                                    {t('apartments.floor')}: {apartment.floor}
                                  </Text>
                                )}
                                {apartment.block && (
                                  <Text size="sm" c="dimmed">
                                    {t('apartments.block')}: {apartment.block}
                                  </Text>
                                )}
                              </Group>
                              {apartment.area && (
                                <Text size="sm" c="dimmed" mb="xs">
                                  {t('apartments.area')}: {Number(apartment.area).toLocaleString('tr-TR')} m²
                                </Text>
                              )}
                              {/* Ekstra Bilgiler */}
                              {apartment.contracts && apartment.contracts.length > 0 && (
                                <Stack gap={4} mt="xs">
                                  {apartment.contracts[0].tenantRecord && (
                                    <Text size="sm">
                                      <Text span fw={500}>{t('apartments.currentTenant')}: </Text>
                                      {apartment.contracts[0].tenantRecord.firstName} {apartment.contracts[0].tenantRecord.lastName}
                                      {apartment.contracts[0].tenantRecord.email && (
                                        <Text span c="dimmed" size="xs" ml="xs">
                                          ({apartment.contracts[0].tenantRecord.email})
                                        </Text>
                                      )}
                                    </Text>
                                  )}
                                  {apartment.contracts[0].rentAmount && (
                                    <Text size="sm">
                                      <Text span fw={500}>{t('apartments.currentRent')}: </Text>
                                      {Number(apartment.contracts[0].rentAmount).toLocaleString('tr-TR', {
                                        style: 'currency',
                                        currency: 'TRY',
                                      })}
                                    </Text>
                                  )}
                                  {apartment.contracts[0].payments && apartment.contracts[0].payments.length > 0 && (
                                    <Text size="sm">
                                      <Text span fw={500}>{t('apartments.nextPaymentDate')}: </Text>
                                      {dayjs(apartment.contracts[0].payments[0].dueDate).format('DD.MM.YYYY')}
                                    </Text>
                                  )}
                                  {property.managerId && property.staff && property.staff.length > 0 && (
                                    <Text size="sm">
                                      <Text span fw={500}>{t('apartments.managedBy')}: </Text>
                                      {property.staff.find((s: any) => s.staff?.id === property.managerId)?.staff?.name || t('apartments.propertyManager')}
                                    </Text>
                                  )}
                                </Stack>
                              )}
                            </div>
                            <Badge color={apartment.isActive ? 'green' : 'gray'}>
                              {apartment.isActive ? t('status.active') : t('status.inactive')}
                            </Badge>
                          </Group>
                          <Group gap="xs" mt="auto">
                            <Button
                              size="sm"
                              variant="filled"
                              leftSection={<IconEye size={16} />}
                              onClick={() => {
                                router.push(`/${currentLocale}/modules/real-estate/apartments/${apartment.id}`);
                              }}
                            >
                              {tGlobal('buttons.view') || t('actions.view')}
                            </Button>
                            <Button
                              size="sm"
                              variant="filled"
                              leftSection={<IconEdit size={16} />}
                              onClick={() => {
                                router.push(`/${currentLocale}/modules/real-estate/apartments/${apartment.id}/edit`);
                              }}
                            >
                              {tGlobal('buttons.edit') || t('actions.edit')}
                            </Button>
                          </Group>
                        </Stack>
                      </div>
                    </Group>
                  </Paper>
                ))}
              </Stack>
            </Paper>
          </Tabs.Panel>
        )}

        {/* Yan Gider Sekmesi */}
        {propertySideCostSummary && (
          <Tabs.Panel value="sideCosts" pt="md">
            <Stack gap="md">
              {/* Özet Kart */}
              <Card withBorder p="md" radius="md">
                <Stack gap="md">
                  <Group gap="xs">
                    <IconCash size={20} />
                    <Title order={4}>{t('sideCosts.rentAndSideCosts')}</Title>
                    <Badge variant="light" color="blue">
                      {propertySideCostSummary.apartmentsWithSideCosts} / {propertySideCostSummary.apartmentCount} {t('apartments.title')}
                    </Badge>
                  </Group>
                  <Divider />
                  <Grid>
                    <Grid.Col span={6}>
                      <Text size="sm" c="dimmed">{t('form.coldRent')} ({t('sideCosts.total')})</Text>
                    </Grid.Col>
                    <Grid.Col span={6}>
                      <Text size="sm" ta="right" fw={500}>
                        {propertySideCostSummary.totalColdRent.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} ₺
                      </Text>
                    </Grid.Col>
                    <Grid.Col span={6}>
                      <Text size="sm" c="dimmed">{t('form.additionalCosts')} ({t('sideCosts.total')})</Text>
                    </Grid.Col>
                    <Grid.Col span={6}>
                      <Text size="sm" ta="right" fw={500}>
                        {propertySideCostSummary.totalAdditionalCosts.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} ₺
                      </Text>
                    </Grid.Col>
                    <Grid.Col span={6}>
                      <Text size="sm" c="dimmed">{t('form.heatingCosts')} ({t('sideCosts.total')})</Text>
                    </Grid.Col>
                    <Grid.Col span={6}>
                      <Text size="sm" ta="right" fw={500}>
                        {propertySideCostSummary.totalHeatingCosts.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} ₺
                      </Text>
                    </Grid.Col>
                    <Grid.Col span={12}>
                      <Divider my="xs" />
                    </Grid.Col>
                    <Grid.Col span={6}>
                      <Text size="sm" fw={600}>{t('sideCosts.totalRent')} ({t('sideCosts.total')})</Text>
                    </Grid.Col>
                    <Grid.Col span={6}>
                      <Text size="sm" ta="right" fw={700} c="blue">
                        {propertySideCostSummary.totalWarmRent.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} ₺
                      </Text>
                    </Grid.Col>
                  </Grid>
                </Stack>
              </Card>

              {/* Daire Detayları Tablosu */}
              <Paper shadow="xs" p="md">
                <Stack gap="md">
                  <Title order={5}>{t('sideCosts.apartmentBreakdown')}</Title>
                  <Table striped highlightOnHover>
                    <Table.Thead>
                      <Table.Tr>
                        <Table.Th>{t('table.unitNumber')}</Table.Th>
                        <Table.Th ta="right">{t('apartments.area')}</Table.Th>
                        <Table.Th ta="right">{t('form.coldRent')}</Table.Th>
                        <Table.Th ta="right">{t('form.additionalCosts')}</Table.Th>
                        <Table.Th ta="right">{t('form.heatingCosts')}</Table.Th>
                        <Table.Th ta="right">{t('sideCosts.totalRent')}</Table.Th>
                      </Table.Tr>
                    </Table.Thead>
                    <Table.Tbody>
                      {propertySideCostSummary.apartmentDetails.map((apt: any) => (
                        <Table.Tr
                          key={apt.id}
                          style={{ cursor: 'pointer' }}
                          onClick={() => router.push(`/${currentLocale}/modules/real-estate/apartments/${apt.id}`)}
                        >
                          <Table.Td>{apt.unitNumber}</Table.Td>
                          <Table.Td ta="right">{apt.area} m²</Table.Td>
                          <Table.Td ta="right">
                            {apt.coldRent.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} ₺
                          </Table.Td>
                          <Table.Td ta="right">
                            {apt.additionalCosts.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} ₺
                          </Table.Td>
                          <Table.Td ta="right">
                            {apt.heatingCosts.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} ₺
                          </Table.Td>
                          <Table.Td ta="right" fw={600} c="blue">
                            {apt.warmRent.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} ₺
                          </Table.Td>
                        </Table.Tr>
                      ))}
                    </Table.Tbody>
                  </Table>
                </Stack>
              </Paper>
            </Stack>
          </Tabs.Panel>
        )}
      </Tabs>
    </Container>
  );
}

