'use client';

import { useMemo, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
  Paper,
  Text,
  Group,
  Stack,
  Grid,
  Badge,
  Tabs,
  Card,
  Title,
  Divider,
  SimpleGrid,
  Box,
  Image,
  Button,
  ActionIcon,
} from '@mantine/core';
import {
  IconUser,
  IconCalendar,
  IconContract,
  IconCurrencyDollar,
  IconCash,
  IconHome,
  IconPhoto,
  IconFile,
  IconBuilding,
  IconMapPin,
  IconPhone,
  IconId,
  IconEye,
  IconEdit,
} from '@tabler/icons-react';
import { useTenant } from '@/hooks/useTenants';
import { useTranslation } from '@/lib/i18n/client';
import { useCurrency } from '@/hooks/useCurrency';
import { TenantAnalytics } from './TenantAnalytics';
import { DetailPageSkeleton } from '@/components/skeletons/DetailPageSkeleton';
import { EntityImagesTab } from '@/components/detail-tabs/EntityImagesTab';
import { EntityFilesTab } from '@/components/detail-tabs/EntityFilesTab';
import { DataTable } from '@/components/tables/DataTable';
import dayjs from 'dayjs';

interface TenantDetailProps {
  tenantId: string;
  locale: string;
}

export function TenantDetail({ tenantId, locale }: TenantDetailProps) {
  const router = useRouter();
  const { t } = useTranslation('modules/real-estate');
  const { t: tGlobal } = useTranslation('global');
  const { formatCurrency } = useCurrency();
  const { data: tenant, isLoading, error } = useTenant(tenantId);

  const [downloadingImages, setDownloadingImages] = useState(false);
  const [downloadingDocs, setDownloadingDocs] = useState(false);

  // Download all images as ZIP
  const handleDownloadAllImages = useCallback(async () => {
    if (!tenant?.images || tenant.images.length === 0) return;
    setDownloadingImages(true);
    try {
      const response = await fetch('/api/core-files/download-zip', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fileIds: tenant.images, filename: `${tenant.firstName}-${tenant.lastName}-images.zip` }),
      });
      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${tenant.firstName}-${tenant.lastName}-images.zip`;
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
  }, [tenant?.images, tenant?.firstName, tenant?.lastName]);

  // Download all documents as ZIP
  const handleDownloadAllDocs = useCallback(async () => {
    if (!tenant?.documents || tenant.documents.length === 0) return;
    setDownloadingDocs(true);
    try {
      const response = await fetch('/api/core-files/download-zip', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fileIds: tenant.documents, filename: `${tenant.firstName}-${tenant.lastName}-documents.zip` }),
      });
      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${tenant.firstName}-${tenant.lastName}-documents.zip`;
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
  }, [tenant?.documents, tenant?.firstName, tenant?.lastName]);

  // Aktif sözleşme ve daire bilgileri
  const activeContract = useMemo(() => {
    if (!tenant?.contracts) return null;
    return tenant.contracts.find((c: any) => c.status === 'active') || null;
  }, [tenant?.contracts]);

  // Yan gider hesaplaması
  const sideCostSummary = useMemo(() => {
    if (!activeContract?.apartment) return null;
    const apt = activeContract.apartment;
    const coldRent = Number(apt.coldRent) || 0;
    const additionalCosts = Number(apt.additionalCosts) || 0;
    const heatingCosts = Number(apt.heatingCosts) || 0;
    const warmRent = coldRent + additionalCosts + heatingCosts;
    const deposit = Number(apt.deposit) || 0;

    return {
      coldRent,
      additionalCosts,
      heatingCosts,
      warmRent,
      deposit,
      apartmentUnit: apt.unitNumber,
      propertyName: apt.property?.name,
      area: Number(apt.area) || 0,
    };
  }, [activeContract]);

  if (isLoading) {
    return <DetailPageSkeleton showTabs />;
  }

  if (error || !tenant) {
    return (
      <Paper shadow="xs" p="md">
        <Text c="red">{tGlobal('common.errorLoading')}</Text>
      </Paper>
    );
  }

  // Kiracı tipi için display name
  const getTenantDisplayName = () => {
    if ((tenant as any).tenantType === 'company') {
      return (tenant as any).companyName || tenant.tenantNumber;
    }
    const firstName = (tenant as any).firstName || '';
    const lastName = (tenant as any).lastName || '';
    if (firstName || lastName) {
      return `${firstName} ${lastName}`.trim();
    }
    return tenant.tenantNumber || tGlobal('common.notApplicable');
  };

  return (
    <Stack gap="md">
      {/* Tenant Info - 2 Column Layout */}
      <Paper shadow="xs" p="md">
        <Grid gutter="xl" align="stretch">
          {/* Left Column: Image */}
          <Grid.Col span={{ base: 12, md: 4 }} style={{ display: 'flex' }}>
            <Box
              style={{
                position: 'relative',
                width: '100%',
                height: '100%',
                minHeight: 300,
              }}
            >
              <Image
                src={
                  (tenant as any).coverImage
                    ? `/api/core-files/${(tenant as any).coverImage}/download?inline=true`
                    : tenant.images && tenant.images.length > 0
                    ? `/api/core-files/${tenant.images[0]}/download?inline=true`
                    : undefined
                }
                alt={getTenantDisplayName()}
                radius="md"
                fit="cover"
                style={{
                  border: '4px solid var(--mantine-color-gray-3)',
                  boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
                  width: '100%',
                  height: '100%',
                  objectFit: 'cover',
                  position: 'absolute',
                  top: 0,
                  left: 0,
                }}
                fallbackSrc={`https://placehold.co/300x400?text=${(tenant as any).tenantType === 'company' ? 'Company' : 'Tenant'}`}
              />
              {tenant.images && tenant.images.length > 1 && (
                <Badge
                  pos="absolute"
                  bottom={16}
                  right={16}
                  size="lg"
                  variant="filled"
                  color="dark"
                  style={{ opacity: 0.8, zIndex: 1 }}
                >
                  <Group gap={4}>
                    <IconPhoto size={14} />
                    {tenant.images.length}
                  </Group>
                </Badge>
              )}
            </Box>
          </Grid.Col>

          {/* Right Column: All Details */}
          <Grid.Col span={{ base: 12, md: 8 }}>
            <Stack gap="md">
              {/* Header */}
              <Group justify="space-between" align="flex-start">
                <div>
                  <Group gap="xs">
                    {(tenant as any).tenantType === 'company' ? (
                      <IconBuilding size={24} />
                    ) : (
                      <IconUser size={24} />
                    )}
                    <Text size="xl" fw={600}>{getTenantDisplayName()}</Text>
                  </Group>
                  <Text size="sm" c="dimmed" mt={4}>
                    {t('form.tenantNumber')}: {tenant.tenantNumber || tGlobal('common.notApplicable')}
                  </Text>
                </div>
                <Group>
                  <Badge color={(tenant as any).tenantType === 'company' ? 'blue' : 'grape'} variant="light">
                    {(tenant as any).tenantType === 'company'
                      ? (t('tenantForm.typeCompany') || 'Company')
                      : (t('tenantForm.typePerson') || 'Person')
                    }
                  </Badge>
                  <Badge color={tenant.isActive ? 'green' : 'red'} variant="light">
                    {tenant.isActive ? t('status.active') : t('status.inactive')}
                  </Badge>
                </Group>
              </Group>

              <Divider />

              {/* Personal/Company Info */}
              {(tenant as any).tenantType !== 'company' && (
                <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="md">
                  {(tenant as any).salutation && (
                    <Stack gap="xs">
                      <Text size="sm" fw={500} c="dimmed">{t('tenantForm.salutation') || 'Salutation'}</Text>
                      <Text>{(tenant as any).salutation}</Text>
                    </Stack>
                  )}
                  {(tenant as any).birthDate && (
                    <Stack gap="xs">
                      <Text size="sm" fw={500} c="dimmed">{t('tenantForm.birthDate') || 'Birth Date'}</Text>
                      <Text>{dayjs((tenant as any).birthDate).format('DD.MM.YYYY')}</Text>
                    </Stack>
                  )}
                  {(tenant as any).birthPlace && (
                    <Stack gap="xs">
                      <Text size="sm" fw={500} c="dimmed">{t('tenantForm.birthPlace') || 'Birth Place'}</Text>
                      <Text>{(tenant as any).birthPlace}</Text>
                    </Stack>
                  )}
                  {(tenant as any).nationality && (
                    <Stack gap="xs">
                      <Text size="sm" fw={500} c="dimmed">{t('tenantForm.nationality') || 'Nationality'}</Text>
                      <Text>{(tenant as any).nationality}</Text>
                    </Stack>
                  )}
                </SimpleGrid>
              )}

              {/* Address */}
              {((tenant as any).street || (tenant as any).city) && (
                <>
                  <Divider label={<Group gap="xs"><IconMapPin size={14} />{t('tenantForm.address') || 'Address'}</Group>} labelPosition="left" />
                  <Group gap="xs">
                    <Text>
                      {[(tenant as any).street, (tenant as any).houseNumber].filter(Boolean).join(' ')}
                      {((tenant as any).street || (tenant as any).houseNumber) && ((tenant as any).postalCode || (tenant as any).city) && ', '}
                      {[(tenant as any).postalCode, (tenant as any).city].filter(Boolean).join(' ')}
                    </Text>
                  </Group>
                </>
              )}

              {/* Contact Info */}
              {((tenant as any).phone || (tenant as any).mobile || (tenant as any).email) && (
                <>
                  <Divider label={<Group gap="xs"><IconPhone size={14} />{t('tenantForm.contactInfo') || 'Contact'}</Group>} labelPosition="left" />
                  <SimpleGrid cols={{ base: 1, sm: 3 }} spacing="md">
                    {(tenant as any).phone && (
                      <Stack gap="xs">
                        <Text size="sm" fw={500} c="dimmed">{t('form.phone') || 'Phone'}</Text>
                        <Text>{(tenant as any).phone}</Text>
                      </Stack>
                    )}
                    {(tenant as any).mobile && (
                      <Stack gap="xs">
                        <Text size="sm" fw={500} c="dimmed">{t('form.mobile') || 'Mobile'}</Text>
                        <Text>{(tenant as any).mobile}</Text>
                      </Stack>
                    )}
                    {(tenant as any).email && (
                      <Stack gap="xs">
                        <Text size="sm" fw={500} c="dimmed">{t('form.email') || 'Email'}</Text>
                        <Text>{(tenant as any).email}</Text>
                      </Stack>
                    )}
                  </SimpleGrid>
                </>
              )}

              <Divider />

              {/* Dates and Tax */}
              <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="md">
                <Stack gap="xs">
                  <Group gap="xs">
                    <IconCalendar size={16} />
                    <Text size="sm" fw={500} c="dimmed">{t('form.moveInDate')}</Text>
                  </Group>
                  <Text>
                    {/* Önce aktif sözleşme başlangıç tarihi, yoksa kiracı giriş tarihi */}
                    {activeContract?.startDate
                      ? dayjs(activeContract.startDate).format('DD.MM.YYYY')
                      : tenant.moveInDate
                      ? dayjs(tenant.moveInDate).format('DD.MM.YYYY')
                      : tGlobal('common.notApplicable')}
                  </Text>
                  {activeContract?.startDate && tenant.moveInDate && activeContract.startDate !== tenant.moveInDate && (
                    <Text size="xs" c="dimmed">
                      ({t('form.originalMoveInDate')}: {dayjs(tenant.moveInDate).format('DD.MM.YYYY')})
                    </Text>
                  )}
                </Stack>

                <Stack gap="xs">
                  <Group gap="xs">
                    <IconCalendar size={16} />
                    <Text size="sm" fw={500} c="dimmed">{t('form.moveOutDate')}</Text>
                  </Group>
                  <Text>
                    {/* Önce aktif sözleşme bitiş tarihi, yoksa kiracı çıkış tarihi */}
                    {activeContract?.endDate
                      ? dayjs(activeContract.endDate).format('DD.MM.YYYY')
                      : tenant.moveOutDate
                      ? dayjs(tenant.moveOutDate).format('DD.MM.YYYY')
                      : tGlobal('common.notApplicable')}
                  </Text>
                  {activeContract?.endDate && tenant.moveOutDate && activeContract.endDate !== tenant.moveOutDate && (
                    <Text size="xs" c="dimmed">
                      ({t('form.originalMoveOutDate')}: {dayjs(tenant.moveOutDate).format('DD.MM.YYYY')})
                    </Text>
                  )}
                </Stack>

                {(tenant as any).taxNumber && (
                  <Stack gap="xs">
                    <Group gap="xs">
                      <IconId size={16} />
                      <Text size="sm" fw={500} c="dimmed">{t('tenantForm.taxNumber') || 'Tax Number'}</Text>
                    </Group>
                    <Text>{(tenant as any).taxNumber}</Text>
                  </Stack>
                )}
              </SimpleGrid>

              {/* Notes */}
              {tenant.notes && (
                <>
                  <Divider />
                  <Stack gap="xs">
                    <Text size="sm" fw={500} c="dimmed">{t('form.notes')}</Text>
                    <Text>{tenant.notes}</Text>
                  </Stack>
                </>
              )}
            </Stack>
          </Grid.Col>
        </Grid>
      </Paper>

      {/* Tabs */}
      <Tabs defaultValue="apartment">
        <Tabs.List>
          <Tabs.Tab value="apartment" leftSection={<IconHome size={18} />}>
            {t('tenants.apartmentInfo') || 'Apartment Info'}
          </Tabs.Tab>
          <Tabs.Tab value="analytics" leftSection={<IconCurrencyDollar size={18} />}>
            {t('analytics.title')}
          </Tabs.Tab>
          <Tabs.Tab value="images" leftSection={<IconPhoto size={18} />}>
            {t('mediaGallery.images')} ({tenant.images?.length || 0})
          </Tabs.Tab>
          <Tabs.Tab value="documents" leftSection={<IconFile size={18} />}>
            {t('mediaGallery.documents')} ({tenant.documents?.length || 0})
          </Tabs.Tab>
          <Tabs.Tab value="sideCosts" leftSection={<IconCash size={18} />}>
            {t('sideCosts.rentAndSideCosts')}
          </Tabs.Tab>
          <Tabs.Tab value="contracts" leftSection={<IconContract size={18} />}>
            {t('contracts.title')} ({tenant.contracts?.length || 0})
          </Tabs.Tab>
          <Tabs.Tab value="payments" leftSection={<IconCurrencyDollar size={18} />}>
            {t('payments.title')} ({tenant.payments?.length || 0})
          </Tabs.Tab>
        </Tabs.List>

        {/* Apartment Info Tab */}
        <Tabs.Panel value="apartment" pt="md">
          {activeContract?.apartment ? (
            <Card withBorder p="md" radius="md">
              <Stack gap="md">
                <Group justify="space-between">
                  <Group gap="xs">
                    <IconHome size={20} />
                    <Title order={4}>{t('tenants.currentApartment') || 'Current Apartment'}</Title>
                  </Group>
                  <Button
                    variant="light"
                    size="sm"
                    leftSection={<IconEye size={16} />}
                    onClick={() => router.push(`/${locale}/modules/real-estate/apartments/${activeContract.apartment.id}`)}
                  >
                    {tGlobal('actions.view')}
                  </Button>
                </Group>

                <Divider />

                <Grid>
                  {/* Apartment Image */}
                  <Grid.Col span={{ base: 12, md: 4 }}>
                    <Image
                      src={
                        activeContract.apartment.coverImage
                          ? `/api/core-files/${activeContract.apartment.coverImage}/download?inline=true`
                          : activeContract.apartment.images && activeContract.apartment.images.length > 0
                          ? `/api/core-files/${activeContract.apartment.images[0]}/download?inline=true`
                          : undefined
                      }
                      alt={activeContract.apartment.unitNumber}
                      radius="md"
                      fit="cover"
                      style={{
                        border: '2px solid var(--mantine-color-gray-3)',
                        aspectRatio: '4/3',
                        width: '100%',
                      }}
                      fallbackSrc="https://placehold.co/400x300?text=Apartment"
                    />
                  </Grid.Col>

                  {/* Apartment Details */}
                  <Grid.Col span={{ base: 12, md: 8 }}>
                    <Stack gap="md">
                      <Group justify="space-between">
                        <div>
                          <Text size="lg" fw={600}>{activeContract.apartment.unitNumber}</Text>
                          {activeContract.apartment.property && (
                            <Text size="sm" c="dimmed">
                              {activeContract.apartment.property.name} - {activeContract.apartment.property.address}
                            </Text>
                          )}
                        </div>
                        <Badge
                          color={
                            activeContract.apartment.status === 'rented' ? 'green' :
                            activeContract.apartment.status === 'empty' ? 'yellow' :
                            activeContract.apartment.status === 'maintenance' ? 'orange' : 'gray'
                          }
                        >
                          {t(`apartments.status.${activeContract.apartment.status}`) || activeContract.apartment.status}
                        </Badge>
                      </Group>

                      <SimpleGrid cols={{ base: 2, md: 3 }} spacing="md">
                        {activeContract.apartment.floor && (
                          <Stack gap="xs">
                            <Text size="sm" fw={500} c="dimmed">{t('apartments.floor')}</Text>
                            <Text>{activeContract.apartment.floor}</Text>
                          </Stack>
                        )}
                        <Stack gap="xs">
                          <Text size="sm" fw={500} c="dimmed">{t('apartments.area')}</Text>
                          <Text>{Number(activeContract.apartment.area).toLocaleString('tr-TR')} m²</Text>
                        </Stack>
                        <Stack gap="xs">
                          <Text size="sm" fw={500} c="dimmed">{t('apartments.roomCount')}</Text>
                          <Text>{activeContract.apartment.roomCount} {t('apartments.rooms')}</Text>
                        </Stack>
                      </SimpleGrid>

                      {/* Contract Info */}
                      <Divider label={t('contracts.title')} labelPosition="left" />
                      <SimpleGrid cols={{ base: 2, md: 3 }} spacing="md">
                        <Stack gap="xs">
                          <Text size="sm" fw={500} c="dimmed">{t('table.contractNumber')}</Text>
                          <Text>{activeContract.contractNumber}</Text>
                        </Stack>
                        <Stack gap="xs">
                          <Text size="sm" fw={500} c="dimmed">{t('form.startDate')}</Text>
                          <Text>{dayjs(activeContract.startDate).format('DD.MM.YYYY')}</Text>
                        </Stack>
                        {activeContract.endDate && (
                          <Stack gap="xs">
                            <Text size="sm" fw={500} c="dimmed">{t('form.endDate')}</Text>
                            <Text>{dayjs(activeContract.endDate).format('DD.MM.YYYY')}</Text>
                          </Stack>
                        )}
                        <Stack gap="xs">
                          <Text size="sm" fw={500} c="dimmed">{t('form.rentAmount')}</Text>
                          <Text fw={500} c="blue">
                            {formatCurrency(Number(activeContract.rentAmount))}
                          </Text>
                        </Stack>
                      </SimpleGrid>
                    </Stack>
                  </Grid.Col>
                </Grid>
              </Stack>
            </Card>
          ) : (
            <Paper shadow="xs" p="md">
              <Stack align="center" gap="md" py="xl">
                <IconHome size={48} color="gray" />
                <Text c="dimmed" ta="center">
                  {t('tenants.noActiveContract') || 'No active contract found'}
                </Text>
                <Text size="sm" c="dimmed" ta="center">
                  {t('tenants.noActiveContractHint') || 'This tenant does not have an active rental contract'}
                </Text>
              </Stack>
            </Paper>
          )}
        </Tabs.Panel>

        <Tabs.Panel value="analytics" pt="md">
          <TenantAnalytics tenantId={tenantId} locale={locale} />
        </Tabs.Panel>

        {/* Images Tab */}
        <Tabs.Panel value="images" pt="md">
          <EntityImagesTab
            images={tenant.images || []}
            coverImage={tenant.coverImage}
            entityName={`${tenant.firstName} ${tenant.lastName}`}
            onDownloadAll={handleDownloadAllImages}
            downloadAllLoading={downloadingImages}
          />
        </Tabs.Panel>

        {/* Documents Tab */}
        <Tabs.Panel value="documents" pt="md">
          <EntityFilesTab
            documents={tenant.documents || []}
            entityName={`${tenant.firstName} ${tenant.lastName}`}
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

                {/* Daire Bilgisi */}
                <Group gap="xs">
                  <IconHome size={16} />
                  <Text size="sm" c="dimmed">
                    {sideCostSummary.propertyName} - {sideCostSummary.apartmentUnit}
                    {sideCostSummary.area > 0 && ` (${sideCostSummary.area} m²)`}
                  </Text>
                </Group>

                <Divider />

                <Grid>
                  <Grid.Col span={{ base: 6, sm: 8 }}>
                    <Text size="sm" c="dimmed">{t('form.coldRent')}</Text>
                  </Grid.Col>
                  <Grid.Col span={{ base: 6, sm: 4 }}>
                    <Text size="sm" ta="right" fw={500}>
                      {sideCostSummary.coldRent.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} ₺
                    </Text>
                  </Grid.Col>

                  <Grid.Col span={{ base: 6, sm: 8 }}>
                    <Text size="sm" c="dimmed">{t('form.additionalCosts')}</Text>
                  </Grid.Col>
                  <Grid.Col span={{ base: 6, sm: 4 }}>
                    <Text size="sm" ta="right" fw={500}>
                      {sideCostSummary.additionalCosts.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} ₺
                    </Text>
                  </Grid.Col>

                  <Grid.Col span={{ base: 6, sm: 8 }}>
                    <Text size="sm" c="dimmed">{t('form.heatingCosts')}</Text>
                  </Grid.Col>
                  <Grid.Col span={{ base: 6, sm: 4 }}>
                    <Text size="sm" ta="right" fw={500}>
                      {sideCostSummary.heatingCosts.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} ₺
                    </Text>
                  </Grid.Col>

                  <Grid.Col span={12}>
                    <Divider my="xs" />
                  </Grid.Col>

                  <Grid.Col span={{ base: 6, sm: 8 }}>
                    <Text size="sm" fw={600}>{t('sideCosts.totalRent')}</Text>
                  </Grid.Col>
                  <Grid.Col span={{ base: 6, sm: 4 }}>
                    <Text size="sm" ta="right" fw={700} c="blue">
                      {sideCostSummary.warmRent.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} ₺
                    </Text>
                  </Grid.Col>

                  {sideCostSummary.deposit > 0 && (
                    <>
                      <Grid.Col span={{ base: 6, sm: 8 }}>
                        <Text size="sm" c="dimmed">{t('form.deposit')}</Text>
                      </Grid.Col>
                      <Grid.Col span={{ base: 6, sm: 4 }}>
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
                  {t('sideCosts.noDataTenantHint') || 'Side cost information is linked to the tenant\'s active contract apartment'}
                </Text>
              </Stack>
            </Paper>
          )}
        </Tabs.Panel>

        <Tabs.Panel value="contracts" pt="md">
          <DataTable
            columns={[
              {
                key: 'contractNumber',
                label: t('table.contractNumber'),
                sortable: true,
                searchable: true,
                render: (value: string) => <Text size="sm" fw={500}>{value}</Text>,
              },
              {
                key: 'type',
                label: t('form.type'),
                sortable: true,
                render: (value: string) => (
                  <Badge variant="light">{t(`types.${value}`) || value}</Badge>
                ),
              },
              {
                key: 'status',
                label: t('table.status'),
                sortable: true,
                render: (value: string) => (
                  <Badge
                    color={
                      value === 'active'
                        ? 'green'
                        : value === 'expired'
                        ? 'gray'
                        : value === 'terminated'
                        ? 'red'
                        : 'yellow'
                    }
                    variant="light"
                  >
                    {t(`contracts.status.${value}`) || value}
                  </Badge>
                ),
              },
              {
                key: 'startDate',
                label: t('form.startDate'),
                sortable: true,
                render: (value: string) => (
                  <Text size="sm">{value ? dayjs(value).format('DD.MM.YYYY') : '-'}</Text>
                ),
              },
              {
                key: 'endDate',
                label: t('form.endDate'),
                sortable: true,
                render: (value: string) => (
                  <Text size="sm">{value ? dayjs(value).format('DD.MM.YYYY') : '-'}</Text>
                ),
              },
              {
                key: 'rentAmount',
                label: t('form.rentAmount'),
                sortable: true,
                align: 'right' as const,
                render: (value: number) => (
                  <Text size="sm">
                    {formatCurrency(Number(value))}
                  </Text>
                ),
              },
              {
                key: 'actions',
                label: tGlobal('table.actions'),
                sortable: false,
                align: 'right' as const,
                render: (_: any, row: any) => (
                  <Group gap="xs" justify="flex-end">
                    <ActionIcon
                      variant="subtle"
                      color="blue"
                      onClick={(e) => {
                        e.stopPropagation();
                        router.push(`/${locale}/modules/real-estate/contracts/${row.id}`);
                      }}
                      title={tGlobal('buttons.view')}
                    >
                      <IconEye size={16} />
                    </ActionIcon>
                    <ActionIcon
                      variant="subtle"
                      color="yellow"
                      onClick={(e) => {
                        e.stopPropagation();
                        router.push(`/${locale}/modules/real-estate/contracts/${row.id}/edit`);
                      }}
                      title={tGlobal('buttons.edit')}
                    >
                      <IconEdit size={16} />
                    </ActionIcon>
                  </Group>
                ),
              },
            ]}
            data={tenant.contracts || []}
            searchable={true}
            sortable={true}
            pageable={true}
            defaultPageSize={10}
            pageSizeOptions={[5, 10, 25]}
            emptyMessage={t('messages.noContracts')}
            showColumnSettings={false}
            onRowClick={(row: Record<string, any>) => router.push(`/${locale}/modules/real-estate/contracts/${row.id}`)}
            showAuditHistory={true}
            auditEntityName="Contract"
            auditIdKey="id"
          />
        </Tabs.Panel>

        <Tabs.Panel value="payments" pt="md">
          <DataTable
            columns={[
              {
                key: 'type',
                label: t('form.type'),
                sortable: true,
                render: (value: string) => (
                  <Badge variant="light">{t(`payments.types.${value}`) || value}</Badge>
                ),
              },
              {
                key: 'amount',
                label: t('form.amount'),
                sortable: true,
                align: 'right' as const,
                render: (value: number) => (
                  <Text size="sm" fw={500}>
                    {formatCurrency(Number(value))}
                  </Text>
                ),
              },
              {
                key: 'status',
                label: t('table.status'),
                sortable: true,
                render: (value: string) => (
                  <Badge
                    color={
                      value === 'paid'
                        ? 'green'
                        : value === 'overdue'
                        ? 'red'
                        : 'yellow'
                    }
                    variant="light"
                  >
                    {t(`payments.status.${value}`) || value}
                  </Badge>
                ),
              },
              {
                key: 'dueDate',
                label: t('form.dueDate'),
                sortable: true,
                render: (value: string) => (
                  <Text size="sm">{value ? dayjs(value).format('DD.MM.YYYY') : '-'}</Text>
                ),
              },
              {
                key: 'paidDate',
                label: t('form.paidDate'),
                sortable: true,
                render: (value: string) => (
                  <Text size="sm">{value ? dayjs(value).format('DD.MM.YYYY') : '-'}</Text>
                ),
              },
              {
                key: 'actions',
                label: tGlobal('table.actions'),
                sortable: false,
                align: 'right' as const,
                render: (_: any, row: any) => (
                  <Group gap="xs" justify="flex-end">
                    <ActionIcon
                      variant="subtle"
                      color="blue"
                      onClick={(e) => {
                        e.stopPropagation();
                        router.push(`/${locale}/modules/real-estate/payments/${row.id}`);
                      }}
                      title={tGlobal('buttons.view')}
                    >
                      <IconEye size={16} />
                    </ActionIcon>
                    <ActionIcon
                      variant="subtle"
                      color="yellow"
                      onClick={(e) => {
                        e.stopPropagation();
                        router.push(`/${locale}/modules/real-estate/payments/${row.id}/edit`);
                      }}
                      title={tGlobal('buttons.edit')}
                    >
                      <IconEdit size={16} />
                    </ActionIcon>
                  </Group>
                ),
              },
            ]}
            data={tenant.payments || []}
            searchable={true}
            sortable={true}
            pageable={true}
            defaultPageSize={10}
            pageSizeOptions={[5, 10, 25]}
            emptyMessage={t('messages.noPayments')}
            showColumnSettings={false}
            onRowClick={(row: Record<string, any>) => router.push(`/${locale}/modules/real-estate/payments/${row.id}`)}
            showAuditHistory={true}
            auditEntityName="Payment"
            auditIdKey="id"
          />
        </Tabs.Panel>
      </Tabs>
    </Stack>
  );
}

