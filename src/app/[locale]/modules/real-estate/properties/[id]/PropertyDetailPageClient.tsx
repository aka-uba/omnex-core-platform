'use client';

import { useMemo, useState, useCallback } from 'react';
import { Container, Tabs, Paper, Stack, Group, Text, Badge, Grid, Box, Image, Button, Card, Title, Divider, Table, SimpleGrid } from '@mantine/core';
import { useMediaQuery } from '@mantine/hooks';
import { IconBuilding, IconFileText, IconHome, IconEdit, IconEye, IconCash, IconReceipt, IconPhoto, IconFile, IconTool } from '@tabler/icons-react';
import { CentralPageHeader } from '@/components/headers/CentralPageHeader';
import { useProperty } from '@/hooks/useProperties';
import { useParams, useRouter } from 'next/navigation';
import { useTranslation } from '@/lib/i18n/client';
import dayjs from 'dayjs';
import type { PropertyType } from '@/modules/real-estate/types/property';
import { PropertyDetailPageSkeleton } from './PropertyDetailPageSkeleton';
import { PropertyExpenseList } from '@/modules/real-estate/components/PropertyExpenseList';
import { EntityImagesTab } from '@/components/detail-tabs/EntityImagesTab';
import { EntityFilesTab } from '@/components/detail-tabs/EntityFilesTab';
import { PropertyMaintenanceTab } from '@/modules/real-estate/components/PropertyMaintenanceTab';
import { useCompany } from '@/context/CompanyContext';

export function PropertyDetailPageClient({ locale }: { locale: string }) {
  const params = useParams();
  const router = useRouter();
  const { t } = useTranslation('modules/real-estate');
  const { t: tGlobal } = useTranslation('global');
  const currentLocale = (params?.locale as string) || locale;
  const propertyId = params?.id as string;
  const { formatCurrency } = useCompany();

  const { data: property, isLoading } = useProperty(propertyId);
  const isMobile = useMediaQuery('(max-width: 768px)');

  const [downloadingImages, setDownloadingImages] = useState(false);
  const [downloadingDocs, setDownloadingDocs] = useState(false);

  // Download all images as ZIP
  const handleDownloadAllImages = useCallback(async () => {
    if (!property?.images || property.images.length === 0) return;
    setDownloadingImages(true);
    try {
      const response = await fetch('/api/core-files/download-zip', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fileIds: property.images, filename: `${property.name}-images.zip` }),
      });
      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${property.name}-images.zip`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      }
    } catch (error) {
      console.error('Error downloading images:', error);
    } finally {
      setDownloadingImages(false);
    }
  }, [property?.images, property?.name]);

  // Download all documents as ZIP
  const handleDownloadAllDocs = useCallback(async () => {
    if (!property?.documents || property.documents.length === 0) return;
    setDownloadingDocs(true);
    try {
      const response = await fetch('/api/core-files/download-zip', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fileIds: property.documents, filename: `${property.name}-documents.zip` }),
      });
      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${property.name}-documents.zip`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      }
    } catch (error) {
      console.error('Error downloading documents:', error);
    } finally {
      setDownloadingDocs(false);
    }
  }, [property?.documents, property?.name]);

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
            label: t('actions.edit') || tGlobal('actions.edit'),
            icon: <IconEdit size={18} />,
            onClick: () => {
              router.push(`/${currentLocale}/modules/real-estate/properties/${propertyId}/edit`);
            },
            variant: 'filled',
            color: 'blue',
          },
        ]}
      />

          <Tabs defaultValue="details" mt="md">
            <Tabs.List>
              <Tabs.Tab value="details" leftSection={<IconFileText size={20} />}>
                {t('properties.details')}
              </Tabs.Tab>
              <Tabs.Tab value="images" leftSection={<IconPhoto size={20} />}>
                {t('mediaGallery.images')} ({property.images?.length || 0})
              </Tabs.Tab>
              <Tabs.Tab value="documents" leftSection={<IconFile size={20} />}>
                {t('mediaGallery.documents')} ({property.documents?.length || 0})
              </Tabs.Tab>
              {property.apartments && property.apartments.length > 0 && (
                <Tabs.Tab value="apartments" leftSection={<IconHome size={20} />}>
                  {t('apartments.title')} ({property.apartments.length})
                </Tabs.Tab>
              )}
              <Tabs.Tab value="sideCosts" leftSection={<IconCash size={20} />}>
                {t('sideCosts.rentAndSideCosts')}
              </Tabs.Tab>
              <Tabs.Tab value="expenses" leftSection={<IconReceipt size={20} />}>
                {t('propertyExpenses.title')}
              </Tabs.Tab>
              <Tabs.Tab value="maintenance" leftSection={<IconTool size={20} />}>
                {t('maintenance.title') || 'Maintenance'}
              </Tabs.Tab>
            </Tabs.List>

        <Tabs.Panel value="details" pt="md">
          <Paper shadow="xs" p="md">
            <Stack gap="md">
              <Group align="stretch" gap="xl" wrap="wrap" style={{ flexDirection: isMobile ? 'column' : 'row' }}>
                {/* Cover Image */}
                <Box style={{
                  position: 'relative',
                  width: isMobile ? '100%' : 300,
                  minWidth: isMobile ? undefined : 300,
                  minHeight: 300,
                  flexShrink: 0,
                }}>
                  <Image
                    src={
                      property.coverImage
                        ? `/api/core-files/${property.coverImage}/download?inline=true`
                        : property.images && property.images.length > 0
                        ? `/api/core-files/${property.images[0]}/download?inline=true`
                        : undefined
                    }
                    alt={property.name}
                    radius="md"
                    fit="cover"
                    style={{
                      border: '4px solid var(--mantine-color-gray-3)',
                      boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
                      width: '100%',
                      height: isMobile ? 300 : '100%',
                      objectFit: 'cover',
                      position: isMobile ? 'relative' : 'absolute',
                      top: 0,
                      left: 0,
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
                        {formatCurrency(Number(property.monthlyFee))}
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

                {/* Bina Bilgileri */}
                {((property as any).constructionYear || (property as any).floorCount || (property as any).landArea || (property as any).livingArea || (property as any).lastRenovationDate) && (
                  <>
                    <Grid.Col span={12}>
                      <Divider my="xs" label={t('form.buildingInfo') || 'Building Information'} labelPosition="center" />
                    </Grid.Col>
                    {(property as any).constructionYear && (
                      <Grid.Col span={{ base: 12, md: 6 }}>
                        <Stack gap="xs">
                          <Text size="sm" fw={500} c="dimmed">{t('form.constructionYear')}</Text>
                          <Text>{(property as any).constructionYear}</Text>
                        </Stack>
                      </Grid.Col>
                    )}
                    {(property as any).floorCount && (
                      <Grid.Col span={{ base: 12, md: 6 }}>
                        <Stack gap="xs">
                          <Text size="sm" fw={500} c="dimmed">{t('form.floorCount')}</Text>
                          <Text>{(property as any).floorCount}</Text>
                        </Stack>
                      </Grid.Col>
                    )}
                    {(property as any).landArea && (
                      <Grid.Col span={{ base: 12, md: 6 }}>
                        <Stack gap="xs">
                          <Text size="sm" fw={500} c="dimmed">{t('form.landArea')}</Text>
                          <Text>{Number((property as any).landArea).toLocaleString('tr-TR')} m²</Text>
                        </Stack>
                      </Grid.Col>
                    )}
                    {(property as any).livingArea && (
                      <Grid.Col span={{ base: 12, md: 6 }}>
                        <Stack gap="xs">
                          <Text size="sm" fw={500} c="dimmed">{t('form.livingArea')}</Text>
                          <Text>{Number((property as any).livingArea).toLocaleString('tr-TR')} m²</Text>
                        </Stack>
                      </Grid.Col>
                    )}
                    {(property as any).lastRenovationDate && (
                      <Grid.Col span={{ base: 12, md: 6 }}>
                        <Stack gap="xs">
                          <Text size="sm" fw={500} c="dimmed">{t('form.lastRenovationDate')}</Text>
                          <Text>{dayjs((property as any).lastRenovationDate).format('DD.MM.YYYY')}</Text>
                        </Stack>
                      </Grid.Col>
                    )}
                  </>
                )}

                {/* Satın Alma ve Finansman Bilgileri */}
                {((property as any).purchaseDate || (property as any).purchasePrice || (property as any).financingStartDate) && (
                  <>
                    <Grid.Col span={12}>
                      <Divider my="xs" label={t('form.purchaseAndFinancing') || 'Purchase & Financing'} labelPosition="center" />
                    </Grid.Col>
                    {(property as any).purchaseDate && (
                      <Grid.Col span={{ base: 12, md: 6 }}>
                        <Stack gap="xs">
                          <Text size="sm" fw={500} c="dimmed">{t('form.purchaseDate')}</Text>
                          <Text>{dayjs((property as any).purchaseDate).format('DD.MM.YYYY')}</Text>
                        </Stack>
                      </Grid.Col>
                    )}
                    {(property as any).purchasePrice && (
                      <Grid.Col span={{ base: 12, md: 6 }}>
                        <Stack gap="xs">
                          <Text size="sm" fw={500} c="dimmed">{t('form.purchasePrice')}</Text>
                          <Text fw={500}>
                            {formatCurrency(Number((property as any).purchasePrice))}
                          </Text>
                        </Stack>
                      </Grid.Col>
                    )}
                    {(property as any).isPaidOff !== undefined && (
                      <Grid.Col span={{ base: 12, md: 6 }}>
                        <Stack gap="xs">
                          <Text size="sm" fw={500} c="dimmed">{t('form.isPaidOff')}</Text>
                          <Badge color={(property as any).isPaidOff ? 'green' : 'yellow'}>
                            {(property as any).isPaidOff ? t('status.yes') || 'Yes' : t('status.no') || 'No'}
                          </Badge>
                        </Stack>
                      </Grid.Col>
                    )}
                    {(property as any).financingStartDate && (
                      <Grid.Col span={{ base: 12, md: 6 }}>
                        <Stack gap="xs">
                          <Text size="sm" fw={500} c="dimmed">{t('form.financingStartDate')}</Text>
                          <Text>{dayjs((property as any).financingStartDate).format('DD.MM.YYYY')}</Text>
                        </Stack>
                      </Grid.Col>
                    )}
                    {(property as any).financingEndDate && (
                      <Grid.Col span={{ base: 12, md: 6 }}>
                        <Stack gap="xs">
                          <Text size="sm" fw={500} c="dimmed">{t('form.financingEndDate')}</Text>
                          <Text>{dayjs((property as any).financingEndDate).format('DD.MM.YYYY')}</Text>
                        </Stack>
                      </Grid.Col>
                    )}
                    {(property as any).monthlyFinancingRate && (
                      <Grid.Col span={{ base: 12, md: 6 }}>
                        <Stack gap="xs">
                          <Text size="sm" fw={500} c="dimmed">{t('form.monthlyFinancingRate')}</Text>
                          <Text fw={500}>
                            {formatCurrency(Number((property as any).monthlyFinancingRate))}
                          </Text>
                        </Stack>
                      </Grid.Col>
                    )}
                    {(property as any).numberOfInstallments && (
                      <Grid.Col span={{ base: 12, md: 6 }}>
                        <Stack gap="xs">
                          <Text size="sm" fw={500} c="dimmed">{t('form.numberOfInstallments')}</Text>
                          <Text>{(property as any).numberOfInstallments}</Text>
                        </Stack>
                      </Grid.Col>
                    )}
                    {(property as any).financingPaymentDay && (
                      <Grid.Col span={{ base: 12, md: 6 }}>
                        <Stack gap="xs">
                          <Text size="sm" fw={500} c="dimmed">{t('form.financingPaymentDay')}</Text>
                          <Text>{(property as any).financingPaymentDay}</Text>
                        </Stack>
                      </Grid.Col>
                    )}
                  </>
                )}

                {/* Koordinatlar */}
                {(property.latitude || property.longitude) && (
                  <>
                    <Grid.Col span={12}>
                      <Divider my="xs" label={t('form.coordinates') || 'Coordinates'} labelPosition="center" />
                    </Grid.Col>
                    {property.latitude && (
                      <Grid.Col span={{ base: 12, md: 6 }}>
                        <Stack gap="xs">
                          <Text size="sm" fw={500} c="dimmed">{t('form.latitude')}</Text>
                          <Text>{Number(property.latitude).toFixed(6)}</Text>
                        </Stack>
                      </Grid.Col>
                    )}
                    {property.longitude && (
                      <Grid.Col span={{ base: 12, md: 6 }}>
                        <Stack gap="xs">
                          <Text size="sm" fw={500} c="dimmed">{t('form.longitude')}</Text>
                          <Text>{Number(property.longitude).toFixed(6)}</Text>
                        </Stack>
                      </Grid.Col>
                    )}
                  </>
                )}

                <Grid.Col span={12}>
                  <Divider my="xs" />
                </Grid.Col>

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

        {/* Images Tab */}
        <Tabs.Panel value="images" pt="md">
          <EntityImagesTab
            images={property.images || []}
            coverImage={property.coverImage}
            entityName={property.name}
            onDownloadAll={handleDownloadAllImages}
            downloadAllLoading={downloadingImages}
          />
        </Tabs.Panel>

        {/* Documents Tab */}
        <Tabs.Panel value="documents" pt="md">
          <EntityFilesTab
            documents={property.documents || []}
            entityName={property.name}
            onDownloadAll={handleDownloadAllDocs}
            downloadAllLoading={downloadingDocs}
          />
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
                    <Group align="stretch" gap="md" wrap={isMobile ? 'wrap' : 'nowrap'} style={{ flexDirection: isMobile ? 'column' : 'row' }}>
                      {/* Apartment Cover Image - Sol tarafta, sağ içerikle aynı yükseklikte */}
                      <Box
                        style={{
                          width: isMobile ? '100%' : 200,
                          minWidth: isMobile ? undefined : 200,
                          flexShrink: 0,
                          borderRadius: 'var(--mantine-radius-md)',
                          overflow: 'hidden',
                          border: '2px solid var(--mantine-color-gray-3)',
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
                          w="100%"
                          h={isMobile ? 200 : '100%'}
                          fit="cover"
                          fallbackSrc="https://placehold.co/200x200?text=Apartment"
                        />
                      </Box>

                      {/* Açıklama ve Butonlar - Sağ tarafta */}
                      <div style={{ flex: 1, width: isMobile ? '100%' : 'auto' }}>
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
                              {/* Kira ve Yan Gider Bilgileri */}
                              {(apartment.coldRent || apartment.additionalCosts || apartment.heatingCosts || apartment.deposit) && (
                                <Stack gap={4} mt="xs">
                                  {apartment.coldRent && (
                                    <Text size="sm">
                                      <Text span fw={500}>{t('form.coldRent')}: </Text>
                                      {formatCurrency(Number(apartment.coldRent))}
                                    </Text>
                                  )}
                                  {(apartment.additionalCosts || apartment.heatingCosts) && (
                                    <Text size="sm">
                                      <Text span fw={500}>{t('sideCosts.sideCosts')}: </Text>
                                      {formatCurrency(Number(apartment.additionalCosts || 0) + Number(apartment.heatingCosts || 0))}
                                    </Text>
                                  )}
                                  {(apartment.coldRent || apartment.additionalCosts || apartment.heatingCosts) && (
                                    <Text size="sm" fw={600} c="blue">
                                      <Text span fw={600}>{t('sideCosts.totalRent')}: </Text>
                                      {formatCurrency(Number(apartment.coldRent || 0) + Number(apartment.additionalCosts || 0) + Number(apartment.heatingCosts || 0))}
                                    </Text>
                                  )}
                                  {apartment.deposit && (
                                    <Text size="sm">
                                      <Text span fw={500}>{t('form.deposit')}: </Text>
                                      {formatCurrency(Number(apartment.deposit))}
                                    </Text>
                                  )}
                                </Stack>
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
                                      {formatCurrency(Number(apartment.contracts[0].rentAmount))}
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

        {/* Yan Gider Sekmesi - Her zaman görünür */}
        <Tabs.Panel value="sideCosts" pt="md">
          {propertySideCostSummary ? (
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
                        {formatCurrency(propertySideCostSummary.totalColdRent)}
                      </Text>
                    </Grid.Col>
                    <Grid.Col span={6}>
                      <Text size="sm" c="dimmed">{t('form.additionalCosts')} ({t('sideCosts.total')})</Text>
                    </Grid.Col>
                    <Grid.Col span={6}>
                      <Text size="sm" ta="right" fw={500}>
                        {formatCurrency(propertySideCostSummary.totalAdditionalCosts)}
                      </Text>
                    </Grid.Col>
                    <Grid.Col span={6}>
                      <Text size="sm" c="dimmed">{t('form.heatingCosts')} ({t('sideCosts.total')})</Text>
                    </Grid.Col>
                    <Grid.Col span={6}>
                      <Text size="sm" ta="right" fw={500}>
                        {formatCurrency(propertySideCostSummary.totalHeatingCosts)}
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
                        {formatCurrency(propertySideCostSummary.totalWarmRent)}
                      </Text>
                    </Grid.Col>
                  </Grid>
                </Stack>
              </Card>

              {/* Daire Detayları Tablosu */}
              <Paper shadow="xs" p="md">
                <Stack gap="md">
                  <Title order={5}>{t('sideCosts.apartmentBreakdown')}</Title>
                  {isMobile ? (
                    <Stack gap="md">
                      {propertySideCostSummary.apartmentDetails.map((apt: any) => (
                        <Card
                          key={apt.id}
                          withBorder
                          p="md"
                          radius="md"
                          style={{ cursor: 'pointer' }}
                          onClick={() => router.push(`/${currentLocale}/modules/real-estate/apartments/${apt.id}`)}
                        >
                          <Group justify="space-between" mb="xs">
                            <Text fw={600}>{apt.unitNumber}</Text>
                            <Text size="sm" c="dimmed">{apt.area} m²</Text>
                          </Group>
                          <SimpleGrid cols={2} spacing="xs">
                            <div>
                              <Text size="xs" c="dimmed">{t('form.coldRent')}</Text>
                              <Text size="sm">{formatCurrency(apt.coldRent)}</Text>
                            </div>
                            <div>
                              <Text size="xs" c="dimmed">{t('form.additionalCosts')}</Text>
                              <Text size="sm">{formatCurrency(apt.additionalCosts)}</Text>
                            </div>
                            <div>
                              <Text size="xs" c="dimmed">{t('form.heatingCosts')}</Text>
                              <Text size="sm">{formatCurrency(apt.heatingCosts)}</Text>
                            </div>
                            <div>
                              <Text size="xs" c="dimmed">{t('sideCosts.totalRent')}</Text>
                              <Text size="sm" fw={600} c="blue">{formatCurrency(apt.warmRent)}</Text>
                            </div>
                          </SimpleGrid>
                        </Card>
                      ))}
                    </Stack>
                  ) : (
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
                              {formatCurrency(apt.coldRent)}
                            </Table.Td>
                            <Table.Td ta="right">
                              {formatCurrency(apt.additionalCosts)}
                            </Table.Td>
                            <Table.Td ta="right">
                              {formatCurrency(apt.heatingCosts)}
                            </Table.Td>
                            <Table.Td ta="right" fw={600} c="blue">
                              {formatCurrency(apt.warmRent)}
                            </Table.Td>
                          </Table.Tr>
                        ))}
                      </Table.Tbody>
                    </Table>
                  )}
                </Stack>
              </Paper>
            </Stack>
          ) : (
            <Paper shadow="xs" p="md">
              <Stack align="center" gap="md" py="xl">
                <IconCash size={48} color="gray" />
                <Text c="dimmed" ta="center">
                  {t('sideCosts.noData') || 'No side cost data available for this property'}
                </Text>
                <Text size="sm" c="dimmed" ta="center">
                  {t('sideCosts.noDataHint') || 'Add apartments with rent and side cost information to see the summary'}
                </Text>
              </Stack>
            </Paper>
          )}
        </Tabs.Panel>

        {/* Gider Yönetimi Sekmesi */}
        <Tabs.Panel value="expenses" pt="md">
          <PropertyExpenseList
            locale={currentLocale}
            propertyId={propertyId}
            propertyName={property.name}
          />
        </Tabs.Panel>

        {/* Bakım Yönetimi Sekmesi */}
        <Tabs.Panel value="maintenance" pt="md">
          <PropertyMaintenanceTab
            propertyId={propertyId}
            propertyName={property.name}
            locale={currentLocale}
          />
        </Tabs.Panel>
      </Tabs>
    </Container>
  );
}

