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
  Table,
  Tabs,
  Card,
  Title,
  Divider,
  SimpleGrid,
  Box,
  Image,
  Button,
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
  IconMail,
  IconId,
  IconEye,
} from '@tabler/icons-react';
import { useTenant } from '@/hooks/useTenants';
import { useTranslation } from '@/lib/i18n/client';
import { TenantAnalytics } from './TenantAnalytics';
import { DetailPageSkeleton } from '@/components/skeletons/DetailPageSkeleton';
import { EntityImagesTab } from '@/components/detail-tabs/EntityImagesTab';
import { EntityFilesTab } from '@/components/detail-tabs/EntityFilesTab';
import dayjs from 'dayjs';

interface TenantDetailProps {
  tenantId: string;
  locale: string;
}

export function TenantDetail({ tenantId, locale }: TenantDetailProps) {
  const router = useRouter();
  const { t } = useTranslation('modules/real-estate');
  const { t: tGlobal } = useTranslation('global');
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
        <Grid gutter="xl">
          {/* Left Column: Image */}
          <Grid.Col span={{ base: 12, md: 4 }}>
            <Box
              style={{
                position: 'sticky',
                top: 20,
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
                  aspectRatio: '3/4',
                  width: '100%',
                  maxHeight: 300,
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
                  style={{ opacity: 0.8 }}
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
                    {tenant.moveInDate
                      ? dayjs(tenant.moveInDate).format('DD.MM.YYYY')
                      : tGlobal('common.notApplicable')}
                  </Text>
                </Stack>

                <Stack gap="xs">
                  <Group gap="xs">
                    <IconCalendar size={16} />
                    <Text size="sm" fw={500} c="dimmed">{t('form.moveOutDate')}</Text>
                  </Group>
                  <Text>
                    {tenant.moveOutDate
                      ? dayjs(tenant.moveOutDate).format('DD.MM.YYYY')
                      : tGlobal('common.notApplicable')}
                  </Text>
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
                            {Number(activeContract.rentAmount).toLocaleString('tr-TR', {
                              style: 'currency',
                              currency: 'TRY',
                            })}
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
                  <Grid.Col span={8}>
                    <Text size="sm" c="dimmed">{t('form.coldRent')}</Text>
                  </Grid.Col>
                  <Grid.Col span={4}>
                    <Text size="sm" ta="right" fw={500}>
                      {sideCostSummary.coldRent.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} ₺
                    </Text>
                  </Grid.Col>

                  <Grid.Col span={8}>
                    <Text size="sm" c="dimmed">{t('form.additionalCosts')}</Text>
                  </Grid.Col>
                  <Grid.Col span={4}>
                    <Text size="sm" ta="right" fw={500}>
                      {sideCostSummary.additionalCosts.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} ₺
                    </Text>
                  </Grid.Col>

                  <Grid.Col span={8}>
                    <Text size="sm" c="dimmed">{t('form.heatingCosts')}</Text>
                  </Grid.Col>
                  <Grid.Col span={4}>
                    <Text size="sm" ta="right" fw={500}>
                      {sideCostSummary.heatingCosts.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} ₺
                    </Text>
                  </Grid.Col>

                  <Grid.Col span={12}>
                    <Divider my="xs" />
                  </Grid.Col>

                  <Grid.Col span={8}>
                    <Text size="sm" fw={600}>{t('sideCosts.totalRent')}</Text>
                  </Grid.Col>
                  <Grid.Col span={4}>
                    <Text size="sm" ta="right" fw={700} c="blue">
                      {sideCostSummary.warmRent.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} ₺
                    </Text>
                  </Grid.Col>

                  {sideCostSummary.deposit > 0 && (
                    <>
                      <Grid.Col span={8}>
                        <Text size="sm" c="dimmed">{t('form.deposit')}</Text>
                      </Grid.Col>
                      <Grid.Col span={4}>
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
          <Paper shadow="xs" p="md">
            {tenant.contracts && tenant.contracts.length > 0 ? (
              <Table striped highlightOnHover>
                <Table.Thead>
                  <Table.Tr>
                    <Table.Th>{t('table.contractNumber')}</Table.Th>
                    <Table.Th>{t('form.type')}</Table.Th>
                    <Table.Th>{t('table.status')}</Table.Th>
                    <Table.Th>{t('form.startDate')}</Table.Th>
                    <Table.Th>{t('form.endDate')}</Table.Th>
                    <Table.Th>{t('form.rentAmount')}</Table.Th>
                  </Table.Tr>
                </Table.Thead>
                <Table.Tbody>
                  {tenant.contracts.map((contract: any) => (
                    <Table.Tr
                      key={contract.id}
                      style={{ cursor: 'pointer' }}
                      onClick={() => router.push(`/${locale}/modules/real-estate/contracts/${contract.id}`)}
                    >
                      <Table.Td>{contract.contractNumber}</Table.Td>
                      <Table.Td>
                        <Badge variant="light">{contract.type}</Badge>
                      </Table.Td>
                      <Table.Td>
                        <Badge
                          color={
                            contract.status === 'active'
                              ? 'green'
                              : contract.status === 'expired'
                              ? 'gray'
                              : contract.status === 'terminated'
                              ? 'red'
                              : 'yellow'
                          }
                          variant="light"
                        >
                          {contract.status}
                        </Badge>
                      </Table.Td>
                      <Table.Td>
                        {contract.startDate ? dayjs(contract.startDate).format('DD.MM.YYYY') : '-'}
                      </Table.Td>
                      <Table.Td>
                        {contract.endDate ? dayjs(contract.endDate).format('DD.MM.YYYY') : '-'}
                      </Table.Td>
                      <Table.Td>
                        {Number(contract.rentAmount).toLocaleString('tr-TR', {
                          style: 'currency',
                          currency: 'TRY',
                        })}
                      </Table.Td>
                    </Table.Tr>
                  ))}
                </Table.Tbody>
              </Table>
            ) : (
              <Text c="dimmed" ta="center" py="xl">
                {t('messages.noContracts')}
              </Text>
            )}
          </Paper>
        </Tabs.Panel>

        <Tabs.Panel value="payments" pt="md">
          <Paper shadow="xs" p="md">
            {tenant.payments && tenant.payments.length > 0 ? (
              <Table striped highlightOnHover>
                <Table.Thead>
                  <Table.Tr>
                    <Table.Th>{t('form.type')}</Table.Th>
                    <Table.Th>{t('form.amount')}</Table.Th>
                    <Table.Th>{t('table.status')}</Table.Th>
                    <Table.Th>{t('form.dueDate')}</Table.Th>
                    <Table.Th>{t('form.paidDate')}</Table.Th>
                  </Table.Tr>
                </Table.Thead>
                <Table.Tbody>
                  {tenant.payments.map((payment: any) => (
                    <Table.Tr key={payment.id}>
                      <Table.Td>
                        <Badge variant="light">{payment.type}</Badge>
                      </Table.Td>
                      <Table.Td>
                        {Number(payment.amount).toLocaleString('tr-TR', {
                          style: 'currency',
                          currency: 'TRY',
                        })}
                      </Table.Td>
                      <Table.Td>
                        <Badge
                          color={
                            payment.status === 'paid'
                              ? 'green'
                              : payment.status === 'overdue'
                              ? 'red'
                              : 'yellow'
                          }
                          variant="light"
                        >
                          {payment.status}
                        </Badge>
                      </Table.Td>
                      <Table.Td>
                        {payment.dueDate ? dayjs(payment.dueDate).format('DD.MM.YYYY') : '-'}
                      </Table.Td>
                      <Table.Td>
                        {payment.paidDate ? dayjs(payment.paidDate).format('DD.MM.YYYY') : '-'}
                      </Table.Td>
                    </Table.Tr>
                  ))}
                </Table.Tbody>
              </Table>
            ) : (
              <Text c="dimmed" ta="center" py="xl">
                {t('messages.noPayments')}
              </Text>
            )}
          </Paper>
        </Tabs.Panel>
      </Tabs>
    </Stack>
  );
}

