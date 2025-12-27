'use client';

import { useState, useCallback } from 'react';
import { Container, Paper, Stack, Group, Text, Badge, Grid, Title, Divider, Avatar, Box, Tabs, Table, Button, Alert, Progress, ActionIcon } from '@mantine/core';
import { IconUsers, IconArrowLeft, IconEdit, IconChartBar, IconUser, IconHome, IconBuilding, IconFileText, IconEye, IconUserCircle, IconBriefcase, IconPhone, IconSettings, IconInfoCircle, IconFolder, IconDownload } from '@tabler/icons-react';
import { EntityFilesTab } from '@/components/detail-tabs/EntityFilesTab';
import { CentralPageHeader } from '@/components/headers/CentralPageHeader';
import { FilePreviewModal } from '@/modules/file-manager/components/FilePreviewModal';
import { FileItem } from '@/modules/file-manager/types/file';
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

  // File preview modal state
  const [previewFile, setPreviewFile] = useState<FileItem | null>(null);
  const [previewModalOpened, setPreviewModalOpened] = useState(false);
  const [downloadingDocs, setDownloadingDocs] = useState(false);

  // Get linked user data for internal staff
  const linkedUser = staff?.linkedUser;

  // Convert document to FileItem for preview modal
  const openDocumentPreview = (doc: { name: string; url: string; type: string }) => {
    // Extract extension from URL first, then from name as fallback
    const urlExtension = doc.url.split('.').pop()?.toLowerCase().split('?')[0] || '';
    const nameExtension = doc.name.split('.').pop()?.toLowerCase() || '';
    const extension = urlExtension || nameExtension;

    // Determine mime type based on extension
    const mimeTypeMap: Record<string, string> = {
      'pdf': 'application/pdf',
      'png': 'image/png',
      'jpg': 'image/jpeg',
      'jpeg': 'image/jpeg',
      'gif': 'image/gif',
      'webp': 'image/webp',
      'svg': 'image/svg+xml',
      'doc': 'application/msword',
      'docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'xls': 'application/vnd.ms-excel',
      'xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'txt': 'text/plain',
      'mp4': 'video/mp4',
      'mp3': 'audio/mpeg',
    };

    // Get filename from URL if name doesn't have extension
    const urlFilename = doc.url.split('/').pop()?.split('?')[0] || doc.name;
    const displayName = doc.name.includes('.') ? doc.name : urlFilename;

    const fileItem: FileItem = {
      id: doc.url,
      name: displayName,
      path: doc.url, // The URL will be used as the path for preview
      extension: extension,
      mimeType: mimeTypeMap[extension] || 'application/octet-stream',
      size: 0,
      type: 'file',
      isDirectory: false,
      createdAt: new Date(),
      modifiedAt: new Date(),
    };

    console.log('Opening document preview:', { doc, fileItem, extension, mimeType: mimeTypeMap[extension] });

    setPreviewFile(fileItem);
    setPreviewModalOpened(true);
  };

  // Handle document download
  const handleDocumentDownload = (file: FileItem) => {
    const link = document.createElement('a');
    // Use storage API for /storage/ paths
    link.href = file.path.startsWith('/storage/') ? `/api${file.path}` : file.path;
    link.download = file.name;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Download all documents as ZIP
  const handleDownloadAllDocs = useCallback(async () => {
    if (!staff?.documents || staff.documents.length === 0) return;
    setDownloadingDocs(true);
    try {
      // Extract file IDs from document URLs
      const fileIds = staff.documents.map((doc: { url: string }) => {
        if (doc.url.includes('/api/core-files/')) {
          return doc.url.split('/api/core-files/')[1]?.split('/')[0];
        }
        if (doc.url.startsWith('/storage/')) {
          const parts = doc.url.split('/');
          return parts[parts.length - 1]?.split('.')[0];
        }
        return null;
      }).filter(Boolean);

      if (fileIds.length > 0) {
        const response = await fetch('/api/core-files/download-zip', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ fileIds, filename: `${staff.name}-documents.zip` }),
        });
        if (response.ok) {
          const blob = await response.blob();
          const url = window.URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = `${staff.name}-documents.zip`;
          document.body.appendChild(a);
          a.click();
          window.URL.revokeObjectURL(url);
          document.body.removeChild(a);
        }
      }
    } catch (error) {
      console.error('Error downloading documents:', error);
    } finally {
      setDownloadingDocs(false);
    }
  }, [staff?.documents, staff?.name]);

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
            {/* Mobile: Stack layout, Desktop: Group layout */}
            <Box hiddenFrom="sm">
              {/* Mobile Layout - Image on top */}
              <Stack align="center" gap="md">
                <Avatar
                  src={staff.profileImage || undefined}
                  size={150}
                  radius="md"
                  style={{
                    border: '4px solid var(--mantine-color-gray-3)',
                    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
                  }}
                >
                  <IconUser size={75} />
                </Avatar>
                <Stack align="center" gap={4}>
                  <Title order={3} ta="center">{staff.name}</Title>
                  <Text size="sm" c="dimmed">
                    {t('staff.detail.createdAt')}: {dayjs(staff.createdAt).format('DD.MM.YYYY HH:mm')}
                  </Text>
                  <Group gap="xs" mt="xs">
                    {getStaffTypeBadge(staff.staffType)}
                    {getRoleBadge(staff.role)}
                    <Badge color={staff.isActive ? 'green' : 'gray'}>
                      {staff.isActive ? t('common.active') : t('common.inactive')}
                    </Badge>
                  </Group>
                </Stack>
              </Stack>
              <Divider my="md" />
            </Box>

            {/* Desktop Layout - Side by side */}
            <Group align="flex-start" gap="xl" visibleFrom="sm">
              {/* Profile Image */}
              <Box>
                <Avatar
                  src={staff.profileImage || undefined}
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

                <Grid mt="md">
                  {staff.email && (
                    <Grid.Col span={{ base: 12, sm: 6 }}>
                      <Text size="sm" c="dimmed">
                        {t('form.email')}
                      </Text>
                      <Text fw={500} style={{ wordBreak: 'break-word' }}>{staff.email}</Text>
                    </Grid.Col>
                  )}
                  {staff.phone && (
                    <Grid.Col span={{ base: 12, sm: 6 }}>
                      <Text size="sm" c="dimmed">
                        {t('form.phone')}
                      </Text>
                      <Text fw={500}>{staff.phone}</Text>
                    </Grid.Col>
                  )}
                  <Grid.Col span={{ base: 12, sm: 6 }}>
                    <Text size="sm" c="dimmed">
                      {t('table.assignedUnits')}
                    </Text>
                    <Text fw={500}>{staff.assignedUnits}</Text>
                  </Grid.Col>
                  {staff.collectionRate !== null && staff.collectionRate !== undefined && (
                    <Grid.Col span={{ base: 12, sm: 6 }}>
                      <Text size="sm" c="dimmed">
                        {t('table.collectionRate')}
                      </Text>
                      <Text fw={500}>{Number(staff.collectionRate).toFixed(1)}%</Text>
                    </Grid.Col>
                  )}
                  {staff.averageVacancyDays !== null && staff.averageVacancyDays !== undefined && (
                    <Grid.Col span={{ base: 12, sm: 6 }}>
                      <Text size="sm" c="dimmed">
                        {t('table.averageVacancyDays')}
                      </Text>
                      <Text fw={500}>{Number(staff.averageVacancyDays).toFixed(1)} days</Text>
                    </Grid.Col>
                  )}
                  {staff.customerSatisfaction !== null && staff.customerSatisfaction !== undefined && (
                    <Grid.Col span={{ base: 12, sm: 6 }}>
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

            {/* Mobile Grid - shown below image */}
            <Box hiddenFrom="sm">
              <Grid>
                {staff.email && (
                  <Grid.Col span={12}>
                    <Text size="sm" c="dimmed">
                      {t('form.email')}
                    </Text>
                    <Text fw={500} style={{ wordBreak: 'break-word' }}>{staff.email}</Text>
                  </Grid.Col>
                )}
                {staff.phone && (
                  <Grid.Col span={12}>
                    <Text size="sm" c="dimmed">
                      {t('form.phone')}
                    </Text>
                    <Text fw={500}>{staff.phone}</Text>
                  </Grid.Col>
                )}
                <Grid.Col span={12}>
                  <Text size="sm" c="dimmed">
                    {t('table.assignedUnits')}
                  </Text>
                  <Text fw={500}>{staff.assignedUnits}</Text>
                </Grid.Col>
                {staff.collectionRate !== null && staff.collectionRate !== undefined && (
                  <Grid.Col span={12}>
                    <Text size="sm" c="dimmed">
                      {t('table.collectionRate')}
                    </Text>
                    <Text fw={500}>{Number(staff.collectionRate).toFixed(1)}%</Text>
                  </Grid.Col>
                )}
                {staff.averageVacancyDays !== null && staff.averageVacancyDays !== undefined && (
                  <Grid.Col span={12}>
                    <Text size="sm" c="dimmed">
                      {t('table.averageVacancyDays')}
                    </Text>
                    <Text fw={500}>{Number(staff.averageVacancyDays).toFixed(1)} days</Text>
                  </Grid.Col>
                )}
                {staff.customerSatisfaction !== null && staff.customerSatisfaction !== undefined && (
                  <Grid.Col span={12}>
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
            </Box>
          </Stack>
        </Paper>

        {/* Tabs for Assignments */}
        <Tabs defaultValue={linkedUser ? 'userInfo' : 'performance'} mt="md">
          <Tabs.List>
            {linkedUser && (
              <Tabs.Tab value="userInfo" leftSection={<IconUserCircle size={16} />}>
                {t('staff.tabs.userInfo')}
              </Tabs.Tab>
            )}
            <Tabs.Tab value="performance" leftSection={<IconChartBar size={16} />}>
              {t('staff.tabs.performance')}
            </Tabs.Tab>
            <Tabs.Tab value="documents" leftSection={<IconFolder size={16} />}>
              {t('staff.tabs.documents')}
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
                        <Text fw={500}>{linkedUser.lastActive ? dayjs(linkedUser.lastActive).format('DD.MM.YYYY HH:mm') : '-'}</Text>
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

          {/* Performance Tab */}
          <Tabs.Panel value="performance" pt="md">
            <Stack gap="md">
              <Paper shadow="xs" p="md">
                <Stack gap="md">
                  <Group gap="xs">
                    <IconChartBar size={20} />
                    <Text size="lg" fw={600}>{t('staff.performance.title')}</Text>
                  </Group>
                  <Divider />
                  <Grid gutter="md">
                    <Grid.Col span={{ base: 12, sm: 6, lg: 3 }}>
                      <Paper p="md" withBorder>
                        <Text size="sm" c="dimmed">{t('table.assignedUnits')}</Text>
                        <Text size="xl" fw={700}>{staff.assignedUnits || 0}</Text>
                      </Paper>
                    </Grid.Col>
                    <Grid.Col span={{ base: 12, sm: 6, lg: 3 }}>
                      <Paper p="md" withBorder>
                        <Text size="sm" c="dimmed">{t('table.collectionRate')}</Text>
                        <Group gap="xs" align="flex-end">
                          <Text size="xl" fw={700}>{staff.collectionRate ? Number(staff.collectionRate).toFixed(1) : 0}%</Text>
                        </Group>
                        <Progress
                          value={staff.collectionRate ? Number(staff.collectionRate) : 0}
                          color={Number(staff.collectionRate || 0) > 80 ? 'green' : Number(staff.collectionRate || 0) > 50 ? 'yellow' : 'red'}
                          size="sm"
                          mt="xs"
                        />
                      </Paper>
                    </Grid.Col>
                    <Grid.Col span={{ base: 12, sm: 6, lg: 3 }}>
                      <Paper p="md" withBorder>
                        <Text size="sm" c="dimmed">{t('table.averageVacancyDays')}</Text>
                        <Text size="xl" fw={700}>{staff.averageVacancyDays ? Number(staff.averageVacancyDays).toFixed(1) : '-'}</Text>
                        <Text size="xs" c="dimmed">{t('staff.performance.days')}</Text>
                      </Paper>
                    </Grid.Col>
                    <Grid.Col span={{ base: 12, sm: 6, lg: 3 }}>
                      <Paper p="md" withBorder>
                        <Text size="sm" c="dimmed">{t('table.customerSatisfaction')}</Text>
                        <Group gap="xs" align="flex-end">
                          <Text size="xl" fw={700}>{staff.customerSatisfaction ? Number(staff.customerSatisfaction).toFixed(1) : '-'}</Text>
                          <Text size="xs" c="dimmed">/100</Text>
                        </Group>
                        {staff.customerSatisfaction && (
                          <Progress
                            value={Number(staff.customerSatisfaction)}
                            color={Number(staff.customerSatisfaction) > 80 ? 'green' : Number(staff.customerSatisfaction) > 50 ? 'yellow' : 'red'}
                            size="sm"
                            mt="xs"
                          />
                        )}
                      </Paper>
                    </Grid.Col>
                  </Grid>
                  {staff.notes && (
                    <>
                      <Divider />
                      <div>
                        <Text size="sm" c="dimmed" mb="xs">{t('form.notes')}</Text>
                        <Text>{staff.notes}</Text>
                      </div>
                    </>
                  )}
                </Stack>
              </Paper>
            </Stack>
          </Tabs.Panel>

          {/* Documents Tab */}
          <Tabs.Panel value="documents" pt="md">
            <Paper shadow="xs" p="md">
              <Stack gap="md">
                <Group justify="space-between">
                  <Group gap="xs">
                    <IconFolder size={20} />
                    <Text size="lg" fw={600}>{t('staff.tabs.documents')}</Text>
                  </Group>
                  {staff.documents && staff.documents.length > 0 && (
                    <Button
                      variant="light"
                      leftSection={<IconDownload size={16} />}
                      onClick={handleDownloadAllDocs}
                      loading={downloadingDocs}
                      size="sm"
                    >
                      {t('actions.downloadAll') || 'Tümünü İndir (ZIP)'}
                    </Button>
                  )}
                </Group>
                <Divider />
                {staff.documents && staff.documents.length > 0 ? (
                  <Grid>
                    {staff.documents.map((doc: { name: string; url: string; type: string }, index: number) => (
                      <Grid.Col span={{ base: 12, sm: 6, md: 4 }} key={index}>
                        <Paper p="md" withBorder>
                          <Group justify="space-between">
                            <Group gap="sm">
                              <IconFileText size={24} color="gray" />
                              <div>
                                <Text size="sm" fw={500}>{doc.name}</Text>
                                <Text size="xs" c="dimmed">{doc.type}</Text>
                              </div>
                            </Group>
                            <Group gap="xs">
                              <ActionIcon
                                variant="light"
                                color="blue"
                                onClick={() => openDocumentPreview(doc)}
                                title={t('actions.view')}
                              >
                                <IconEye size={16} />
                              </ActionIcon>
                              <ActionIcon
                                variant="light"
                                color="green"
                                component="a"
                                href={doc.url.startsWith('/storage/') ? `/api${doc.url}` : doc.url}
                                download
                                title={t('actions.download')}
                              >
                                <IconDownload size={16} />
                              </ActionIcon>
                            </Group>
                          </Group>
                        </Paper>
                      </Grid.Col>
                    ))}
                  </Grid>
                ) : (
                  <Text c="dimmed" ta="center" py="xl">
                    {t('staff.noDocuments')}
                  </Text>
                )}
              </Stack>
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

      {/* File Preview Modal */}
      <FilePreviewModal
        opened={previewModalOpened}
        onClose={() => {
          setPreviewModalOpened(false);
          setPreviewFile(null);
        }}
        file={previewFile}
        onDownload={handleDocumentDownload}
      />
    </Container>
  );
}








