'use client';

import { Container, Paper, Stack, Group, Text, Badge, Grid, Title, Divider, Avatar, Box, Tabs, Table, Button, Alert } from '@mantine/core';
import { IconUsers, IconArrowLeft, IconEdit, IconChartBar, IconUser, IconHome, IconBuilding, IconFileText, IconEye, IconUserCircle, IconBriefcase, IconPhone, IconSettings, IconInfoCircle } from '@tabler/icons-react';
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
  const { t: tUsers } = useTranslation('modules/users');
  const { data: staff, isLoading, error } = useRealEstateStaffMember(staffId);

  // Get linked user data for internal staff
  const linkedUser = staff?.linkedUser;

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
        <Tabs defaultValue={linkedUser ? 'userInfo' : 'details'} mt="md">
          <Tabs.List>
            {linkedUser && (
              <Tabs.Tab value="userInfo" leftSection={<IconUserCircle size={16} />}>
                {t('staff.tabs.userInfo')}
              </Tabs.Tab>
            )}
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

          {/* User Info Tab for Internal Staff */}
          {linkedUser && (
            <Tabs.Panel value="userInfo" pt="md">
              <Stack gap="md">
                {/* Internal Staff Alert */}
                <Alert icon={<IconInfoCircle size={16} />} color="blue" variant="light">
                  {t('staff.internalStaffInfo')}
                </Alert>

                {/* Personal Information */}
                <Paper shadow="xs" p="md">
                  <Stack gap="md">
                    <Group gap="xs">
                      <IconUserCircle size={20} />
                      <Text size="lg" fw={600}>{tUsers('tabs.personal')}</Text>
                    </Group>
                    <Divider />
                    <Grid gutter="md">
                      <Grid.Col span={{ base: 12, sm: 6, lg: 4 }}>
                        <Text size="sm" c="dimmed">{tUsers('form.personal.fullName')}</Text>
                        <Text fw={500}>{linkedUser.name || '-'}</Text>
                      </Grid.Col>
                      <Grid.Col span={{ base: 12, sm: 6, lg: 4 }}>
                        <Text size="sm" c="dimmed">{tUsers('form.personal.email')}</Text>
                        <Text fw={500}>{linkedUser.email || '-'}</Text>
                      </Grid.Col>
                      <Grid.Col span={{ base: 12, sm: 6, lg: 4 }}>
                        <Text size="sm" c="dimmed">{tUsers('form.personal.phone')}</Text>
                        <Text fw={500}>{linkedUser.phone || '-'}</Text>
                      </Grid.Col>
                      <Grid.Col span={{ base: 12, sm: 6, lg: 4 }}>
                        <Text size="sm" c="dimmed">{tUsers('table.role')}</Text>
                        <Badge color="blue">{linkedUser.role || '-'}</Badge>
                      </Grid.Col>
                      <Grid.Col span={{ base: 12, sm: 6, lg: 4 }}>
                        <Text size="sm" c="dimmed">{tUsers('table.status')}</Text>
                        <Badge color={linkedUser.status === 'active' ? 'green' : 'gray'}>
                          {linkedUser.status === 'active' ? tUsers('status.active') : tUsers('status.inactive')}
                        </Badge>
                      </Grid.Col>
                      <Grid.Col span={{ base: 12, sm: 6, lg: 4 }}>
                        <Text size="sm" c="dimmed">{tUsers('table.lastActive')}</Text>
                        <Text fw={500}>{linkedUser.lastActiveAt ? dayjs(linkedUser.lastActiveAt).format('DD.MM.YYYY HH:mm') : '-'}</Text>
                      </Grid.Col>
                    </Grid>
                  </Stack>
                </Paper>

                {/* Work Information */}
                <Paper shadow="xs" p="md">
                  <Stack gap="md">
                    <Group gap="xs">
                      <IconBriefcase size={20} />
                      <Text size="lg" fw={600}>{tUsers('tabs.work')}</Text>
                    </Group>
                    <Divider />
                    <Grid gutter="md">
                      <Grid.Col span={{ base: 12, sm: 6, lg: 4 }}>
                        <Text size="sm" c="dimmed">{tUsers('form.work.department')}</Text>
                        <Text fw={500}>{linkedUser.department ? tUsers(`departments.${linkedUser.department.toLowerCase()}`) : '-'}</Text>
                      </Grid.Col>
                      <Grid.Col span={{ base: 12, sm: 6, lg: 4 }}>
                        <Text size="sm" c="dimmed">{tUsers('form.work.position')}</Text>
                        <Text fw={500}>{linkedUser.position || '-'}</Text>
                      </Grid.Col>
                      <Grid.Col span={{ base: 12, sm: 6, lg: 4 }}>
                        <Text size="sm" c="dimmed">{tUsers('form.work.employeeId')}</Text>
                        <Text fw={500}>{linkedUser.employeeId || '-'}</Text>
                      </Grid.Col>
                      <Grid.Col span={{ base: 12, sm: 6, lg: 4 }}>
                        <Text size="sm" c="dimmed">{tUsers('form.work.hireDate')}</Text>
                        <Text fw={500}>{linkedUser.hireDate ? dayjs(linkedUser.hireDate).format('DD.MM.YYYY') : '-'}</Text>
                      </Grid.Col>
                      <Grid.Col span={{ base: 12, sm: 6, lg: 4 }}>
                        <Text size="sm" c="dimmed">{tUsers('form.work.manager')}</Text>
                        <Text fw={500}>{linkedUser.manager || '-'}</Text>
                      </Grid.Col>
                    </Grid>
                  </Stack>
                </Paper>

                {/* Contact Information */}
                <Paper shadow="xs" p="md">
                  <Stack gap="md">
                    <Group gap="xs">
                      <IconPhone size={20} />
                      <Text size="lg" fw={600}>{tUsers('tabs.contact')}</Text>
                    </Group>
                    <Divider />
                    <Grid gutter="md">
                      <Grid.Col span={{ base: 12, lg: 8 }}>
                        <Text size="sm" c="dimmed">{tUsers('form.contact.address')}</Text>
                        <Text fw={500}>{linkedUser.address || '-'}</Text>
                      </Grid.Col>
                      <Grid.Col span={{ base: 12, sm: 6, lg: 4 }}>
                        <Text size="sm" c="dimmed">{tUsers('form.contact.postalCode')}</Text>
                        <Text fw={500}>{linkedUser.postalCode || '-'}</Text>
                      </Grid.Col>
                      <Grid.Col span={{ base: 12, sm: 6 }}>
                        <Text size="sm" c="dimmed">{tUsers('form.contact.city')}</Text>
                        <Text fw={500}>{linkedUser.city || '-'}</Text>
                      </Grid.Col>
                      <Grid.Col span={{ base: 12, sm: 6 }}>
                        <Text size="sm" c="dimmed">{tUsers('form.contact.country')}</Text>
                        <Text fw={500}>{linkedUser.country || '-'}</Text>
                      </Grid.Col>
                      <Grid.Col span={{ base: 12 }}>
                        <Divider my="sm" label={tUsers('form.contact.emergencySection')} labelPosition="left" />
                      </Grid.Col>
                      <Grid.Col span={{ base: 12, sm: 6 }}>
                        <Text size="sm" c="dimmed">{tUsers('form.contact.emergencyContact')}</Text>
                        <Text fw={500}>{linkedUser.emergencyContact || '-'}</Text>
                      </Grid.Col>
                      <Grid.Col span={{ base: 12, sm: 6 }}>
                        <Text size="sm" c="dimmed">{tUsers('form.contact.emergencyPhone')}</Text>
                        <Text fw={500}>{linkedUser.emergencyPhone || '-'}</Text>
                      </Grid.Col>
                    </Grid>
                  </Stack>
                </Paper>

                {/* Preferences */}
                <Paper shadow="xs" p="md">
                  <Stack gap="md">
                    <Group gap="xs">
                      <IconSettings size={20} />
                      <Text size="lg" fw={600}>{tUsers('tabs.preferences')}</Text>
                    </Group>
                    <Divider />
                    <Grid gutter="md">
                      <Grid.Col span={{ base: 12, sm: 6, lg: 4 }}>
                        <Text size="sm" c="dimmed">{tUsers('form.preferences.defaultLanguage')}</Text>
                        <Text fw={500}>{linkedUser.defaultLanguage === 'tr' ? 'Türkçe' : linkedUser.defaultLanguage === 'en' ? 'English' : linkedUser.defaultLanguage || '-'}</Text>
                      </Grid.Col>
                      <Grid.Col span={{ base: 12, sm: 6, lg: 4 }}>
                        <Text size="sm" c="dimmed">{tUsers('form.preferences.defaultTheme')}</Text>
                        <Text fw={500}>{linkedUser.defaultTheme === 'auto' ? tUsers('form.preferences.themeAuto') : linkedUser.defaultTheme === 'light' ? tUsers('form.preferences.themeLight') : linkedUser.defaultTheme === 'dark' ? tUsers('form.preferences.themeDark') : '-'}</Text>
                      </Grid.Col>
                      <Grid.Col span={{ base: 12, sm: 6, lg: 4 }}>
                        <Text size="sm" c="dimmed">{tUsers('form.preferences.defaultLayout')}</Text>
                        <Text fw={500}>{linkedUser.defaultLayout === 'sidebar' ? tUsers('form.preferences.layoutSidebar') : linkedUser.defaultLayout === 'top' ? tUsers('form.preferences.layoutTopHeader') : '-'}</Text>
                      </Grid.Col>
                    </Grid>
                  </Stack>
                </Paper>

                {/* Edit User Button */}
                <Group justify="flex-end">
                  <Button
                    leftSection={<IconEdit size={16} />}
                    onClick={() => router.push(`/${locale}/management/users/${linkedUser.id}/edit`)}
                  >
                    {t('staff.editUserInfo')}
                  </Button>
                </Group>
              </Stack>
            </Tabs.Panel>
          )}

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








