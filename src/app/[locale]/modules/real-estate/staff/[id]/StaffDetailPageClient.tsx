'use client';

import { Container, Paper, Stack, Group, Text, Badge, Grid, Title, Divider, Avatar, Box } from '@mantine/core';
import { IconUsers, IconArrowLeft, IconEdit, IconChartBar, IconUser } from '@tabler/icons-react';
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
      </Stack>
    </Container>
  );
}








