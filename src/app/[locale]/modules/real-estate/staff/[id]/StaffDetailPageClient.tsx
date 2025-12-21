'use client';

import { Container, Paper, Stack, Group, Text, Badge, Grid, Title, Divider, Avatar, Box, Tabs, Table, Button } from '@mantine/core';
import { IconUsers, IconArrowLeft, IconEdit, IconChartBar, IconUser, IconHome, IconBuilding, IconFileText, IconEye } from '@tabler/icons-react';
import { CentralPageHeader } from '@/components/headers/CentralPageHeader';
import { useRealEstateStaffMember } from '@/hooks/useRealEstateStaff';
import { useTranslation } from '@/lib/i18n/client';
import { useRouter } from 'next/navigation';
import { DetailPageSkeleton } from '@/components/skeletons/DetailPageSkeleton';
import dayjs from 'dayjs';

interface StaffDetailPageClientProps {
  locale: string;
  staffId: string;
}

export function StaffDetailPageClient({ locale, staffId }: StaffDetailPageClientProps) {
  const router = useRouter();
  const { t } = useTranslation('modules/real-estate');
  const { data: staff, isLoading, error } = useRealEstateStaffMember(staffId);

  const getStaffTypeBadge = (staffType: string) => {
    return (
      <Badge color={staffType === 'internal' ? 'blue' : 'gray'}>
        {t(`staff.types.${staffType}`) || staffType}
      </Badge>
    );
  };

  const getRoleBadge = (role: string) => {
    const roleColors: Record<string, string> = {
      manager: 'violet',
      agent: 'blue',
      accountant: 'green',
      maintenance: 'orange',
      observer: 'gray',
    };
    return (
      <Badge color={roleColors[role] || 'gray'}>
        {t(`staff.roles.${role}`) || role}
      </Badge>
    );
  };

  if (isLoading) {
    return <DetailPageSkeleton />;
  }

  if (error || !staff) {
    return (
      <Container size="xl" pt="xl">
        <Text c="red">{t('common.errorLoading')}</Text>
      </Container>
    );
  }

  return (
    <Container size="xl" pt="xl">
      <CentralPageHeader
        title={t('staff.detail.title')}
        description={t('staff.detail.description')}
        namespace="modules/real-estate"
        icon={<IconUsers size={32} />}
        breadcrumbs={[
          { label: 'navigation.dashboard', href: `/${locale}/dashboard`, namespace: 'global' },
          { label: 'staff.title', href: `/${locale}/modules/real-estate/staff`, namespace: 'modules/real-estate' },
          { label: 'staff.detail.title', namespace: 'modules/real-estate' },
        ]}
        actions={[
          {
            label: t('actions.back'),
            icon: <IconArrowLeft size={16} />,
            onClick: () => router.push(`/${locale}/modules/real-estate/staff`),
            variant: 'subtle',
          },
          {
            label: t('staff.performance.title'),
            icon: <IconChartBar size={16} />,
            onClick: () => router.push(`/${locale}/modules/real-estate/staff/${staffId}/performance`),
          },
          {
            label: t('actions.edit'),
            icon: <IconEdit size={16} />,
            onClick: () => router.push(`/${locale}/modules/real-estate/staff/${staffId}/edit`),
          },
        ]}
      />

      <Stack gap="md">
        {/* Staff Info */}
        <Paper p="md" withBorder>
          <Stack gap="md">
            <Group align="flex-start" gap="xl">
              {/* Profile Image */}
              <Box>
                <Avatar
                  {...(staff.profileImage ? { src: `/api/core-files/${staff.profileImage}/download?inline=true` } : {})}
                  size={200}
                  radius="md"
                  style={{
                    border: '4px solid var(--mantine-color-gray-3)',
                    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
                  }}
                >
                  <IconUser size={100} />
                </Avatar>
              </Box>

              {/* Staff Details */}
              <div style={{ flex: 1 }}>
                <Group justify="space-between" align="flex-start" mb="md">
                  <div>
                    <Title order={3}>{staff.name}</Title>
                    <Text size="sm" c="dimmed" mt={4}>
                      {t('staff.detail.createdAt')}: {dayjs(staff.createdAt).format('DD.MM.YYYY HH:mm')}
                    </Text>
                  </div>
                  <Group>
                    {getStaffTypeBadge(staff.staffType)}
                    {getRoleBadge(staff.role)}
                    <Badge color={staff.isActive ? 'green' : 'gray'}>
                      {staff.isActive ? t('common.active') : t('common.inactive')}
                    </Badge>
                  </Group>
                </Group>

                <Divider />

                <Grid>
              {staff.email && (
                <Grid.Col span={6}>
                  <Text size="sm" c="dimmed">
                    {t('form.email')}
                  </Text>
                  <Text fw={500}>{staff.email}</Text>
                </Grid.Col>
              )}
              {staff.phone && (
                <Grid.Col span={6}>
                  <Text size="sm" c="dimmed">
                    {t('form.phone')}
                  </Text>
                  <Text fw={500}>{staff.phone}</Text>
                </Grid.Col>
              )}
              <Grid.Col span={6}>
                <Text size="sm" c="dimmed">
                  {t('table.assignedUnits')}
                </Text>
                <Text fw={500}>{staff.assignedUnits}</Text>
              </Grid.Col>
              {staff.collectionRate !== null && staff.collectionRate !== undefined && (
                <Grid.Col span={6}>
                  <Text size="sm" c="dimmed">
                    {t('table.collectionRate')}
                  </Text>
                  <Text fw={500}>{Number(staff.collectionRate).toFixed(1)}%</Text>
                </Grid.Col>
              )}
              {staff.averageVacancyDays !== null && staff.averageVacancyDays !== undefined && (
                <Grid.Col span={6}>
                  <Text size="sm" c="dimmed">
                    {t('table.averageVacancyDays')}
                  </Text>
                  <Text fw={500}>{Number(staff.averageVacancyDays).toFixed(1)} days</Text>
                </Grid.Col>
              )}
              {staff.customerSatisfaction !== null && staff.customerSatisfaction !== undefined && (
                <Grid.Col span={6}>
                  <Text size="sm" c="dimmed">
                    {t('table.customerSatisfaction')}
                  </Text>
                  <Text fw={500}>{Number(staff.customerSatisfaction).toFixed(1)}/100</Text>
                </Grid.Col>
              )}
              {staff.notes && (
                <Grid.Col span={12}>
                  <Text size="sm" c="dimmed">
                    {t('form.notes')}
                  </Text>
                  <Text fw={500}>{staff.notes}</Text>
                </Grid.Col>
              )}
                </Grid>
              </div>
            </Group>
          </Stack>
        </Paper>

        {/* Tabs for Assignments */}
        <Tabs defaultValue="details" mt="md">
          <Tabs.List>
            <Tabs.Tab value="details" leftSection={<IconFileText size={16} />}>
              {t('staff.tabs.details')}
            </Tabs.Tab>
            {staff.properties && staff.properties.length > 0 && (
              <Tabs.Tab value="properties" leftSection={<IconBuilding size={16} />}>
                {t('properties.title')} ({staff.properties.length})
              </Tabs.Tab>
            )}
            {staff.apartments && staff.apartments.length > 0 && (
              <Tabs.Tab value="apartments" leftSection={<IconHome size={16} />}>
                {t('apartments.title')} ({staff.apartments.length})
              </Tabs.Tab>
            )}
          </Tabs.List>

          <Tabs.Panel value="details" pt="md">
            <Paper shadow="xs" p="md">
              <Text c="dimmed">{t('staff.tabs.detailsDescription')}</Text>
            </Paper>
          </Tabs.Panel>

          {staff.properties && staff.properties.length > 0 && (
            <Tabs.Panel value="properties" pt="md">
              <Paper shadow="xs" p="md">
                <Stack gap="md">
                  <Text size="lg" fw={600}>
                    {t('staff.tabs.assignedProperties')}
                  </Text>
                  <Table striped highlightOnHover>
                    <Table.Thead>
                      <Table.Tr>
                        <Table.Th>{t('table.name')}</Table.Th>
                        <Table.Th>{t('table.address')}</Table.Th>
                        <Table.Th>{t('table.units')}</Table.Th>
                        <Table.Th>{t('table.actions')}</Table.Th>
                      </Table.Tr>
                    </Table.Thead>
                    <Table.Tbody>
                      {staff.properties.map((property: any) => (
                        <Table.Tr key={property.id}>
                          <Table.Td>
                            <Text size="sm" fw={500}>{property.name}</Text>
                          </Table.Td>
                          <Table.Td>
                            <Text size="sm">{property.address}, {property.city}</Text>
                          </Table.Td>
                          <Table.Td>
                            <Text size="sm">{property.totalUnits || 0}</Text>
                          </Table.Td>
                          <Table.Td>
                            <Button
                              size="xs"
                              variant="subtle"
                              leftSection={<IconEye size={14} />}
                              onClick={() => router.push(`/${locale}/modules/real-estate/properties/${property.id}`)}
                            >
                              {t('actions.view')}
                            </Button>
                          </Table.Td>
                        </Table.Tr>
                      ))}
                    </Table.Tbody>
                  </Table>
                </Stack>
              </Paper>
            </Tabs.Panel>
          )}

          {staff.apartments && staff.apartments.length > 0 && (
            <Tabs.Panel value="apartments" pt="md">
              <Paper shadow="xs" p="md">
                <Stack gap="md">
                  <Text size="lg" fw={600}>
                    {t('staff.tabs.assignedApartments')}
                  </Text>
                  <Table striped highlightOnHover>
                    <Table.Thead>
                      <Table.Tr>
                        <Table.Th>{t('table.unitNumber')}</Table.Th>
                        <Table.Th>{t('table.property')}</Table.Th>
                        <Table.Th>{t('table.status')}</Table.Th>
                        <Table.Th>{t('table.actions')}</Table.Th>
                      </Table.Tr>
                    </Table.Thead>
                    <Table.Tbody>
                      {staff.apartments.map((apartment: any) => (
                        <Table.Tr key={apartment.id}>
                          <Table.Td>
                            <Text size="sm" fw={500}>{apartment.unitNumber}</Text>
                          </Table.Td>
                          <Table.Td>
                            <Text size="sm">{apartment.property?.name || '-'}</Text>
                          </Table.Td>
                          <Table.Td>
                            <Badge
                              color={
                                apartment.status === 'rented' ? 'green' :
                                apartment.status === 'empty' ? 'yellow' :
                                apartment.status === 'maintenance' ? 'orange' : 'gray'
                              }
                            >
                              {t(`apartments.status.${apartment.status}`) || apartment.status}
                            </Badge>
                          </Table.Td>
                          <Table.Td>
                            <Button
                              size="xs"
                              variant="subtle"
                              leftSection={<IconEye size={14} />}
                              onClick={() => router.push(`/${locale}/modules/real-estate/apartments/${apartment.id}`)}
                            >
                              {t('actions.view')}
                            </Button>
                          </Table.Td>
                        </Table.Tr>
                      ))}
                    </Table.Tbody>
                  </Table>
                </Stack>
              </Paper>
            </Tabs.Panel>
          )}
        </Tabs>
      </Stack>
    </Container>
  );
}








