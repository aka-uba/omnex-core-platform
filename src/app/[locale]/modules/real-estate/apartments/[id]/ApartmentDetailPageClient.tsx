'use client';

import { useMemo, useState, useCallback } from 'react';
import { Container, Tabs, Paper, Stack, Group, Text, Badge, Grid, Card, Box, Image, SimpleGrid, Table, Button, Divider, Title } from '@mantine/core';
import { IconHome, IconQrcode, IconFileText, IconArrowLeft, IconEdit, IconPhoto, IconUsers, IconTool, IconEye, IconCash, IconFile, IconCheck, IconX } from '@tabler/icons-react';
import { CentralPageHeader } from '@/components/headers/CentralPageHeader';
import { ApartmentQRCode } from '@/modules/real-estate/components/ApartmentQRCode';
import { useApartment } from '@/hooks/useApartments';
import { useParams, useRouter } from 'next/navigation';
import { useTranslation } from '@/lib/i18n/client';
import dayjs from 'dayjs';
import type { ApartmentStatus } from '@/modules/real-estate/types/apartment';
import { ApartmentDetailPageSkeleton } from './ApartmentDetailPageSkeleton';
import { EntityImagesTab } from '@/components/detail-tabs/EntityImagesTab';
import { EntityFilesTab } from '@/components/detail-tabs/EntityFilesTab';

export function ApartmentDetailPageClient({ locale }: { locale: string }) {
  const params = useParams();
  const router = useRouter();
  const { t } = useTranslation('modules/real-estate');
  const { t: tGlobal } = useTranslation('global');
  const currentLocale = (params?.locale as string) || locale;
  const apartmentId = params?.id as string;

  const { data: apartment, isLoading } = useApartment(apartmentId);

  const [downloadingImages, setDownloadingImages] = useState(false);
  const [downloadingDocs, setDownloadingDocs] = useState(false);

  // Download all images as ZIP
  const handleDownloadAllImages = useCallback(async () => {
    if (!apartment?.images || apartment.images.length === 0) return;
    setDownloadingImages(true);
    try {
      const response = await fetch('/api/core-files/download-zip', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fileIds: apartment.images, filename: `${apartment.unitNumber}-images.zip` }),
      });
      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${apartment.unitNumber}-images.zip`;
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
  }, [apartment?.images, apartment?.unitNumber]);

  // Download all documents as ZIP
  const handleDownloadAllDocs = useCallback(async () => {
    if (!apartment?.documents || apartment.documents.length === 0) return;
    setDownloadingDocs(true);
    try {
      const response = await fetch('/api/core-files/download-zip', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fileIds: apartment.documents, filename: `${apartment.unitNumber}-documents.zip` }),
      });
      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${apartment.unitNumber}-documents.zip`;
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
  }, [apartment?.documents, apartment?.unitNumber]);

  // Yan gider hesaplaması
  const sideCostSummary = useMemo(() => {
    if (!apartment) return null;
    const coldRent = Number(apartment.coldRent) || 0;
    const additionalCosts = Number(apartment.additionalCosts) || 0;
    const heatingCosts = Number(apartment.heatingCosts) || 0;
    const warmRent = coldRent + additionalCosts + heatingCosts;
    const deposit = Number(apartment.deposit) || 0;

    // Eğer hiçbir değer yoksa null döndür
    if (coldRent === 0 && additionalCosts === 0 && heatingCosts === 0) return null;

    return { coldRent, additionalCosts, heatingCosts, warmRent, deposit };
  }, [apartment]);

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
          <Tabs.Tab value="images" leftSection={<IconPhoto size={16} />}>
            {t('mediaGallery.images')} ({apartment.images?.length || 0})
          </Tabs.Tab>
          <Tabs.Tab value="documents" leftSection={<IconFile size={16} />}>
            {t('mediaGallery.documents')} ({apartment.documents?.length || 0})
          </Tabs.Tab>
          <Tabs.Tab value="sideCosts" leftSection={<IconCash size={16} />}>
            {t('sideCosts.rentAndSideCosts')}
          </Tabs.Tab>
          <Tabs.Tab value="qrcode" leftSection={<IconQrcode size={16} />}>
            {t('qrCode.title')}
          </Tabs.Tab>
          {apartment.contracts && apartment.contracts.length > 0 && (
            <Tabs.Tab value="tenantHistory" leftSection={<IconUsers size={16} />}>
              {t('apartments.tenantHistory')} ({apartment.contracts.length})
            </Tabs.Tab>
          )}
          <Tabs.Tab value="maintenance" leftSection={<IconTool size={16} />}>
            {t('apartments.maintenance')}
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

                {apartment.bathroomCount && (
                  <Grid.Col span={{ base: 12, md: 6 }}>
                    <Stack gap="xs">
                      <Text size="sm" fw={500} c="dimmed">
                        {t('form.bathroomCount')}
                      </Text>
                      <Text>{apartment.bathroomCount}</Text>
                    </Stack>
                  </Grid.Col>
                )}

                {/* Özellikler */}
                <Grid.Col span={12}>
                  <Group gap="md" mt="xs">
                    {apartment.livingRoom !== undefined && (
                      <Badge
                        variant="light"
                        color={apartment.livingRoom ? 'green' : 'gray'}
                        leftSection={apartment.livingRoom ? <IconCheck size={12} /> : <IconX size={12} />}
                      >
                        {t('form.livingRoom')}
                      </Badge>
                    )}
                    {apartment.balcony !== undefined && (
                      <Badge
                        variant="light"
                        color={apartment.balcony ? 'green' : 'gray'}
                        leftSection={apartment.balcony ? <IconCheck size={12} /> : <IconX size={12} />}
                      >
                        {t('form.balcony')}
                      </Badge>
                    )}
                  </Group>
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

                {/* Kullanım Hakları (Usage Rights) */}
                {(apartment as any).usageRights && Array.isArray((apartment as any).usageRights) && (apartment as any).usageRights.filter((r: any) => r.active).length > 0 && (
                  <Grid.Col span={12}>
                    <Divider my="xs" label={t('usageRights.title')} labelPosition="center" />
                    <Group gap="xs" mt="xs" wrap="wrap">
                      {(apartment as any).usageRights
                        .filter((r: any) => r.active)
                        .map((r: any) => (
                          <Badge key={r.id} variant="light" color="blue">
                            {r.name}
                          </Badge>
                        ))}
                    </Group>
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

        {/* Images Tab */}
        <Tabs.Panel value="images" pt="md">
          <EntityImagesTab
            images={apartment.images || []}
            coverImage={apartment.coverImage}
            entityName={apartment.unitNumber}
            onDownloadAll={handleDownloadAllImages}
            downloadAllLoading={downloadingImages}
          />
        </Tabs.Panel>

        {/* Documents Tab */}
        <Tabs.Panel value="documents" pt="md">
          <EntityFilesTab
            documents={apartment.documents || []}
            entityName={apartment.unitNumber}
            onDownloadAll={handleDownloadAllDocs}
            downloadAllLoading={downloadingDocs}
          />
        </Tabs.Panel>

        {/* Side Costs Tab */}
        <Tabs.Panel value="sideCosts" pt="md">
          {sideCostSummary ? (
            <Card withBorder p="md" radius="md">
              <Stack gap="md">
                <Group gap="xs">
                  <IconCash size={20} />
                  <Title order={4}>{t('sideCosts.rentAndSideCosts')}</Title>
                </Group>
                <Divider />
                <Grid>
                  <Grid.Col span={6}>
                    <Text size="sm" c="dimmed">{t('form.coldRent')}</Text>
                  </Grid.Col>
                  <Grid.Col span={6}>
                    <Text size="sm" ta="right" fw={500}>
                      {sideCostSummary.coldRent.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} ₺
                    </Text>
                  </Grid.Col>
                  <Grid.Col span={6}>
                    <Text size="sm" c="dimmed">{t('form.additionalCosts')}</Text>
                  </Grid.Col>
                  <Grid.Col span={6}>
                    <Text size="sm" ta="right" fw={500}>
                      {sideCostSummary.additionalCosts.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} ₺
                    </Text>
                  </Grid.Col>
                  <Grid.Col span={6}>
                    <Text size="sm" c="dimmed">{t('form.heatingCosts')}</Text>
                  </Grid.Col>
                  <Grid.Col span={6}>
                    <Text size="sm" ta="right" fw={500}>
                      {sideCostSummary.heatingCosts.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} ₺
                    </Text>
                  </Grid.Col>
                  <Grid.Col span={12}>
                    <Divider my="xs" />
                  </Grid.Col>
                  <Grid.Col span={6}>
                    <Text size="sm" fw={600}>{t('sideCosts.totalRent')}</Text>
                  </Grid.Col>
                  <Grid.Col span={6}>
                    <Text size="sm" ta="right" fw={700} c="blue">
                      {sideCostSummary.warmRent.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} ₺
                    </Text>
                  </Grid.Col>
                  {sideCostSummary.deposit > 0 && (
                    <>
                      <Grid.Col span={6}>
                        <Text size="sm" c="dimmed">{t('form.deposit')}</Text>
                      </Grid.Col>
                      <Grid.Col span={6}>
                        <Text size="sm" ta="right" fw={500}>
                          {sideCostSummary.deposit.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} ₺
                        </Text>
                      </Grid.Col>
                    </>
                  )}
                </Grid>
              </Stack>
            </Card>
          ) : (
            <Paper shadow="xs" p="md">
              <Stack align="center" gap="md" py="xl">
                <IconCash size={48} color="gray" />
                <Text c="dimmed" ta="center">
                  {t('sideCosts.noData') || 'No side cost data available'}
                </Text>
                <Text size="sm" c="dimmed" ta="center">
                  {t('sideCosts.noDataApartmentHint') || 'Add rent and side cost information in edit mode'}
                </Text>
              </Stack>
            </Paper>
          )}
        </Tabs.Panel>

        <Tabs.Panel value="qrcode" pt="md">
          <ApartmentQRCode
            apartmentId={apartmentId}
            locale={currentLocale}
            size={300}
            showActions={true}
          />
        </Tabs.Panel>

        {apartment.contracts && apartment.contracts.length > 0 && (
          <Tabs.Panel value="tenantHistory" pt="md">
            <Paper shadow="xs" p="md">
              <Stack gap="md">
                <Text size="lg" fw={600}>
                  {t('apartments.tenantHistory')}
                </Text>
                <Table striped highlightOnHover>
                  <Table.Thead>
                    <Table.Tr>
                      <Table.Th>{t('tenants.title')}</Table.Th>
                      <Table.Th>{t('form.startDate')}</Table.Th>
                      <Table.Th>{t('form.endDate')}</Table.Th>
                      <Table.Th>{t('form.rentAmount')}</Table.Th>
                      <Table.Th>{t('table.status')}</Table.Th>
                      <Table.Th>{tGlobal('actions.actions')}</Table.Th>
                    </Table.Tr>
                  </Table.Thead>
                  <Table.Tbody>
                    {apartment.contracts.map((contract: any) => (
                      <Table.Tr key={contract.id}>
                        <Table.Td>
                          {contract.tenantRecord ? (
                            <Group gap="xs">
                              <Text size="sm" fw={500}>
                                {contract.tenantRecord.firstName} {contract.tenantRecord.lastName}
                              </Text>
                              {contract.tenantRecord.email && (
                                <Text size="xs" c="dimmed">({contract.tenantRecord.email})</Text>
                              )}
                            </Group>
                          ) : (
                            <Text size="sm" c="dimmed">{tGlobal('common.notApplicable')}</Text>
                          )}
                        </Table.Td>
                        <Table.Td>
                          {contract.startDate ? dayjs(contract.startDate).format('DD.MM.YYYY') : '-'}
                        </Table.Td>
                        <Table.Td>
                          {contract.endDate ? dayjs(contract.endDate).format('DD.MM.YYYY') : '-'}
                        </Table.Td>
                        <Table.Td>
                          {contract.rentAmount ? Number(contract.rentAmount).toLocaleString('tr-TR', {
                            style: 'currency',
                            currency: 'TRY',
                          }) : '-'}
                        </Table.Td>
                        <Table.Td>
                          <Badge
                            color={
                              contract.status === 'active' ? 'green' :
                              contract.status === 'expired' ? 'gray' :
                              contract.status === 'terminated' ? 'red' : 'yellow'
                            }
                          >
                            {t(`contracts.status.${contract.status}`) || contract.status}
                          </Badge>
                        </Table.Td>
                        <Table.Td>
                          <Group gap="xs">
                            <Button
                              size="xs"
                              variant="subtle"
                              leftSection={<IconEye size={14} />}
                              onClick={() => router.push(`/${currentLocale}/modules/real-estate/contracts/${contract.id}`)}
                            >
                              {tGlobal('actions.view')}
                            </Button>
                            {contract.tenantRecord && (
                              <Button
                                size="xs"
                                variant="subtle"
                                leftSection={<IconUsers size={14} />}
                                onClick={() => router.push(`/${currentLocale}/modules/real-estate/tenants/${contract.tenantRecord.id}`)}
                              >
                                {t('tenants.detail.title')}
                              </Button>
                            )}
                          </Group>
                        </Table.Td>
                      </Table.Tr>
                    ))}
                  </Table.Tbody>
                </Table>
              </Stack>
            </Paper>
          </Tabs.Panel>
        )}

        <Tabs.Panel value="maintenance" pt="md">
          <Paper shadow="xs" p="md">
            <Stack gap="md">
              <Group justify="space-between">
                <Text size="lg" fw={600}>
                  {t('apartments.maintenance')}
                </Text>
                <Button
                  size="sm"
                  leftSection={<IconTool size={16} />}
                  onClick={() => router.push(`/${currentLocale}/modules/real-estate/maintenance?apartmentId=${apartmentId}`)}
                >
                  {t('maintenance.viewAll')}
                </Button>
              </Group>
              <Text c="dimmed" ta="center" py="xl">
                {t('apartments.maintenanceDescription')}
              </Text>
            </Stack>
          </Paper>
        </Tabs.Panel>
      </Tabs>
    </Container>
  );
}






