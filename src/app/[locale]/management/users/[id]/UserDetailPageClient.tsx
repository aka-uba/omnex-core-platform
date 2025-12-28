'use client';

import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
  Container,
  Paper,
  Group,
  Stack,
  Text,
  Badge,
  Avatar,
  Grid,
  Divider,
  Tabs,
  ActionIcon,
  Box,
  Title,
  Button,
} from '@mantine/core';
import {
  IconUsers,
  IconEdit,
  IconUser,
  IconBriefcase,
  IconPhone,
  IconSettings,
  IconFolder,
  IconFileText,
  IconEye,
  IconDownload,
  IconUserCircle,
} from '@tabler/icons-react';
import { CentralPageHeader } from '@/components/headers/CentralPageHeader';
import { FilePreviewModal } from '@/modules/file-manager/components/FilePreviewModal';
import { FileItem } from '@/modules/file-manager/types/file';
import { useTranslation } from '@/lib/i18n/client';
import { useUser } from '@/hooks/useUsers';
import { DetailPageSkeleton } from '@/components/skeletons/DetailPageSkeleton';
import dayjs from 'dayjs';

interface UserDetailPageClientProps {
  locale: string;
  userId: string;
}

export function UserDetailPageClient({ locale, userId }: UserDetailPageClientProps) {
  const router = useRouter();
  const { t } = useTranslation('modules/users');
  const { t: tGlobal } = useTranslation('global');
  const { data: user, isLoading, error } = useUser(userId);

  // File preview modal state
  const [previewFile, setPreviewFile] = useState<FileItem | null>(null);
  const [previewModalOpened, setPreviewModalOpened] = useState(false);
  const [downloadingDocs, setDownloadingDocs] = useState(false);

  // Convert document URL to FileItem for preview modal
  const openDocumentPreview = (title: string, url: string) => {
    // Extract filename from url or use title
    const filename = url.split('/').pop() || title;
    const extension = filename.split('.').pop()?.toLowerCase() || '';

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

    const fileItem: FileItem = {
      id: url,
      name: filename,
      path: url,
      extension: extension,
      mimeType: mimeTypeMap[extension] || 'application/octet-stream',
      size: 0,
      type: 'file',
      parentId: null,
      createdAt: new Date(),
      modifiedAt: new Date(),
    };

    setPreviewFile(fileItem);
    setPreviewModalOpened(true);
  };

  // Handle document download
  const handleDocumentDownload = (file: FileItem) => {
    const link = document.createElement('a');
    link.href = file.path.startsWith('/storage/') ? `/api${file.path}` : file.path;
    link.download = file.name;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Download all documents as ZIP
  const handleDownloadAllDocs = useCallback(async () => {
    if (!user) return;
    const docs = [user.passportUrl, user.idCardUrl, user.contractUrl, user.cvUrl].filter((url): url is string => Boolean(url));
    if (docs.length === 0) return;

    setDownloadingDocs(true);
    try {
      // Extract file IDs from URLs
      const fileIds = docs.map((url: string) => {
        if (url.includes('/api/core-files/')) {
          return url.split('/api/core-files/')[1]?.split('/')[0];
        }
        return null;
      }).filter(Boolean);

      if (fileIds.length > 0) {
        const response = await fetch('/api/core-files/download-zip', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ fileIds, filename: `${user.name}-documents.zip` }),
        });
        if (response.ok) {
          const blob = await response.blob();
          const url = window.URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = `${user.name}-documents.zip`;
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
  }, [user]);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge color="green">{t('status.active')}</Badge>;
      case 'inactive':
        return <Badge color="gray">{t('status.inactive')}</Badge>;
      case 'pending':
        return <Badge color="yellow">{t('status.pending')}</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  const getRoleBadge = (role: string) => {
    const roleColors: Record<string, string> = {
      SuperAdmin: 'red',
      Admin: 'violet',
      Manager: 'blue',
      User: 'green',
      Viewer: 'gray',
    };
    return (
      <Badge color={roleColors[role] || 'gray'}>
        {role}
      </Badge>
    );
  };

  // Get documents list
  const getDocuments = () => {
    if (!user) return [];
    const docs = [];
    if (user.passportUrl) docs.push({ name: t('form.documents.passport'), url: user.passportUrl, type: 'passport' });
    if (user.idCardUrl) docs.push({ name: t('form.documents.idCard'), url: user.idCardUrl, type: 'id' });
    if (user.contractUrl) docs.push({ name: t('form.documents.contract'), url: user.contractUrl, type: 'contract' });
    if (user.cvUrl) docs.push({ name: t('form.documents.cv'), url: user.cvUrl, type: 'cv' });
    return docs;
  };

  if (isLoading) {
    return <DetailPageSkeleton />;
  }

  if (error || !user) {
    return (
      <Container size="xl" pt="xl">
        <Text c="red">{tGlobal('common.errorLoading')}</Text>
      </Container>
    );
  }

  const documents = getDocuments();

  return (
    <Container size="xl" pt="xl">
      <CentralPageHeader
        title={t('detail.title')}
        description={t('detail.description')}
        namespace="modules/users"
        icon={<IconUsers size={32} />}
        breadcrumbs={[
          { label: 'navigation.dashboard', href: `/${locale}/dashboard`, namespace: 'global' },
          { label: 'title', href: `/${locale}/management/users`, namespace: 'modules/users' },
          { label: 'detail.title', namespace: 'modules/users' },
        ]}
        actions={[
          {
            label: t('actions.edit'),
            icon: <IconEdit size={16} />,
            onClick: () => router.push(`/${locale}/management/users/${userId}/edit`),
          },
        ]}
      />

      <Stack gap="md">
        {/* User Info */}
        <Paper p="md" withBorder>
          <Stack gap="md">
            {/* Mobile: Stack layout, Desktop: Group layout */}
            <Box hiddenFrom="sm">
              {/* Mobile Layout - Image on top */}
              <Stack align="center" gap="md">
                <Avatar
                  src={user.profilePicture || undefined}
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
                  <Title order={3} ta="center">{user.name}</Title>
                  <Text size="sm" c="dimmed">
                    {t('quickView.createdAt')}: {dayjs(user.createdAt).format('DD.MM.YYYY HH:mm')}
                  </Text>
                  <Group gap="xs" mt="xs">
                    {getRoleBadge(user.role)}
                    {getStatusBadge(user.status)}
                  </Group>
                </Stack>
              </Stack>
              <Divider my="md" />
              {/* Mobile Grid */}
              <Grid>
                <Grid.Col span={12}>
                  <Text size="sm" c="dimmed">
                    {t('form.personal.email')}
                  </Text>
                  <Text fw={500} style={{ wordBreak: 'break-word' }}>{user.email || '-'}</Text>
                </Grid.Col>
                <Grid.Col span={12}>
                  <Text size="sm" c="dimmed">
                    {t('form.personal.phone')}
                  </Text>
                  <Text fw={500}>{user.phone || '-'}</Text>
                </Grid.Col>
                {user.department && (
                  <Grid.Col span={12}>
                    <Text size="sm" c="dimmed">
                      {t('form.work.department')}
                    </Text>
                    <Text fw={500}>{user.department}</Text>
                  </Grid.Col>
                )}
                {user.position && (
                  <Grid.Col span={12}>
                    <Text size="sm" c="dimmed">
                      {t('form.work.position')}
                    </Text>
                    <Text fw={500}>{user.position}</Text>
                  </Grid.Col>
                )}
                {user.employeeId && (
                  <Grid.Col span={12}>
                    <Text size="sm" c="dimmed">
                      {t('form.work.employeeId')}
                    </Text>
                    <Text fw={500}>{user.employeeId}</Text>
                  </Grid.Col>
                )}
                {user.hireDate && (
                  <Grid.Col span={12}>
                    <Text size="sm" c="dimmed">
                      {t('form.work.hireDate')}
                    </Text>
                    <Text fw={500}>{dayjs(user.hireDate).format('DD.MM.YYYY')}</Text>
                  </Grid.Col>
                )}
              </Grid>
            </Box>

            {/* Desktop Layout - Side by side */}
            <Group align="flex-start" gap="xl" visibleFrom="sm">
              {/* Profile Image */}
              <Box>
                <Avatar
                  src={user.profilePicture || undefined}
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

              {/* User Details */}
              <div style={{ flex: 1 }}>
                <Group justify="space-between" align="flex-start" mb="md">
                  <div>
                    <Title order={3}>{user.name}</Title>
                    <Text size="sm" c="dimmed" mt={4}>
                      {t('quickView.createdAt')}: {dayjs(user.createdAt).format('DD.MM.YYYY HH:mm')}
                    </Text>
                  </div>
                  <Group>
                    {getRoleBadge(user.role)}
                    {getStatusBadge(user.status)}
                  </Group>
                </Group>

                <Divider />

                <Grid mt="md">
                  <Grid.Col span={{ base: 12, sm: 6 }}>
                    <Text size="sm" c="dimmed">
                      {t('form.personal.email')}
                    </Text>
                    <Text fw={500} style={{ wordBreak: 'break-word' }}>{user.email || '-'}</Text>
                  </Grid.Col>
                  <Grid.Col span={{ base: 12, sm: 6 }}>
                    <Text size="sm" c="dimmed">
                      {t('form.personal.phone')}
                    </Text>
                    <Text fw={500}>{user.phone || '-'}</Text>
                  </Grid.Col>
                  {user.department && (
                    <Grid.Col span={{ base: 12, sm: 6 }}>
                      <Text size="sm" c="dimmed">
                        {t('form.work.department')}
                      </Text>
                      <Text fw={500}>{user.department}</Text>
                    </Grid.Col>
                  )}
                  {user.position && (
                    <Grid.Col span={{ base: 12, sm: 6 }}>
                      <Text size="sm" c="dimmed">
                        {t('form.work.position')}
                      </Text>
                      <Text fw={500}>{user.position}</Text>
                    </Grid.Col>
                  )}
                  {user.employeeId && (
                    <Grid.Col span={{ base: 12, sm: 6 }}>
                      <Text size="sm" c="dimmed">
                        {t('form.work.employeeId')}
                      </Text>
                      <Text fw={500}>{user.employeeId}</Text>
                    </Grid.Col>
                  )}
                  {user.hireDate && (
                    <Grid.Col span={{ base: 12, sm: 6 }}>
                      <Text size="sm" c="dimmed">
                        {t('form.work.hireDate')}
                      </Text>
                      <Text fw={500}>{dayjs(user.hireDate).format('DD.MM.YYYY')}</Text>
                    </Grid.Col>
                  )}
                </Grid>
              </div>
            </Group>
          </Stack>
        </Paper>

        {/* Tabs for Details */}
        <Tabs defaultValue="personal" mt="md">
          <Tabs.List>
            <Tabs.Tab value="personal" leftSection={<IconUserCircle size={16} />}>
              {t('tabs.personal')}
            </Tabs.Tab>
            <Tabs.Tab value="work" leftSection={<IconBriefcase size={16} />}>
              {t('tabs.work')}
            </Tabs.Tab>
            <Tabs.Tab value="contact" leftSection={<IconPhone size={16} />}>
              {t('tabs.contact')}
            </Tabs.Tab>
            <Tabs.Tab value="documents" leftSection={<IconFolder size={16} />}>
              {t('detail.tabs.documents')} ({documents.length})
            </Tabs.Tab>
            <Tabs.Tab value="preferences" leftSection={<IconSettings size={16} />}>
              {t('tabs.preferences')}
            </Tabs.Tab>
          </Tabs.List>

          {/* Personal Info Tab */}
          <Tabs.Panel value="personal" pt="md">
            <Paper shadow="xs" p="md">
              <Stack gap="md">
                <Group gap="xs">
                  <IconUserCircle size={20} />
                  <Text size="lg" fw={600}>{t('tabs.personal')}</Text>
                </Group>
                <Divider />
                <Grid gutter="md">
                  <Grid.Col span={{ base: 12, sm: 6, lg: 4 }}>
                    <Text size="sm" c="dimmed">{t('form.personal.fullName')}</Text>
                    <Text fw={500}>{user.name || '-'}</Text>
                  </Grid.Col>
                  <Grid.Col span={{ base: 12, sm: 6, lg: 4 }}>
                    <Text size="sm" c="dimmed">{t('form.personal.email')}</Text>
                    <Text fw={500}>{user.email || '-'}</Text>
                  </Grid.Col>
                  <Grid.Col span={{ base: 12, sm: 6, lg: 4 }}>
                    <Text size="sm" c="dimmed">{t('form.personal.phone')}</Text>
                    <Text fw={500}>{user.phone || '-'}</Text>
                  </Grid.Col>
                  <Grid.Col span={{ base: 12, sm: 6, lg: 4 }}>
                    <Text size="sm" c="dimmed">{t('table.role')}</Text>
                    {getRoleBadge(user.role)}
                  </Grid.Col>
                  <Grid.Col span={{ base: 12, sm: 6, lg: 4 }}>
                    <Text size="sm" c="dimmed">{t('table.status')}</Text>
                    {getStatusBadge(user.status)}
                  </Grid.Col>
                  <Grid.Col span={{ base: 12, sm: 6, lg: 4 }}>
                    <Text size="sm" c="dimmed">{t('table.lastActive')}</Text>
                    <Text fw={500}>{user.lastActive ? dayjs(user.lastActive).format('DD.MM.YYYY HH:mm') : '-'}</Text>
                  </Grid.Col>
                </Grid>
              </Stack>
            </Paper>
          </Tabs.Panel>

          {/* Work Info Tab */}
          <Tabs.Panel value="work" pt="md">
            <Paper shadow="xs" p="md">
              <Stack gap="md">
                <Group gap="xs">
                  <IconBriefcase size={20} />
                  <Text size="lg" fw={600}>{t('tabs.work')}</Text>
                </Group>
                <Divider />
                <Grid gutter="md">
                  <Grid.Col span={{ base: 12, sm: 6, lg: 4 }}>
                    <Text size="sm" c="dimmed">{t('form.work.department')}</Text>
                    <Text fw={500}>{user.department ? t(`departments.${user.department.toLowerCase()}`) : '-'}</Text>
                  </Grid.Col>
                  <Grid.Col span={{ base: 12, sm: 6, lg: 4 }}>
                    <Text size="sm" c="dimmed">{t('form.work.position')}</Text>
                    <Text fw={500}>{user.position || '-'}</Text>
                  </Grid.Col>
                  <Grid.Col span={{ base: 12, sm: 6, lg: 4 }}>
                    <Text size="sm" c="dimmed">{t('form.work.employeeId')}</Text>
                    <Text fw={500}>{user.employeeId || '-'}</Text>
                  </Grid.Col>
                  <Grid.Col span={{ base: 12, sm: 6, lg: 4 }}>
                    <Text size="sm" c="dimmed">{t('form.work.hireDate')}</Text>
                    <Text fw={500}>{user.hireDate ? dayjs(user.hireDate).format('DD.MM.YYYY') : '-'}</Text>
                  </Grid.Col>
                </Grid>
              </Stack>
            </Paper>
          </Tabs.Panel>

          {/* Contact Info Tab */}
          <Tabs.Panel value="contact" pt="md">
            <Paper shadow="xs" p="md">
              <Stack gap="md">
                <Group gap="xs">
                  <IconPhone size={20} />
                  <Text size="lg" fw={600}>{t('tabs.contact')}</Text>
                </Group>
                <Divider />
                <Grid gutter="md">
                  <Grid.Col span={{ base: 12, lg: 8 }}>
                    <Text size="sm" c="dimmed">{t('form.contact.address')}</Text>
                    <Text fw={500}>{user.address || '-'}</Text>
                  </Grid.Col>
                  <Grid.Col span={{ base: 12, sm: 6, lg: 4 }}>
                    <Text size="sm" c="dimmed">{t('form.contact.postalCode')}</Text>
                    <Text fw={500}>{user.postalCode || '-'}</Text>
                  </Grid.Col>
                  <Grid.Col span={{ base: 12, sm: 6 }}>
                    <Text size="sm" c="dimmed">{t('form.contact.city')}</Text>
                    <Text fw={500}>{user.city || '-'}</Text>
                  </Grid.Col>
                  <Grid.Col span={{ base: 12, sm: 6 }}>
                    <Text size="sm" c="dimmed">{t('form.contact.country')}</Text>
                    <Text fw={500}>{user.country || '-'}</Text>
                  </Grid.Col>
                  <Grid.Col span={{ base: 12 }}>
                    <Divider my="sm" label={t('form.contact.emergencySection')} labelPosition="left" />
                  </Grid.Col>
                  <Grid.Col span={{ base: 12, sm: 6 }}>
                    <Text size="sm" c="dimmed">{t('form.contact.emergencyContact')}</Text>
                    <Text fw={500}>{user.emergencyContact || '-'}</Text>
                  </Grid.Col>
                  <Grid.Col span={{ base: 12, sm: 6 }}>
                    <Text size="sm" c="dimmed">{t('form.contact.emergencyPhone')}</Text>
                    <Text fw={500}>{user.emergencyPhone || '-'}</Text>
                  </Grid.Col>
                </Grid>
              </Stack>
            </Paper>
          </Tabs.Panel>

          {/* Documents Tab */}
          <Tabs.Panel value="documents" pt="md">
            <Paper shadow="xs" p="md">
              <Stack gap="md">
                <Group justify="space-between">
                  <Group gap="xs">
                    <IconFolder size={20} />
                    <Text size="lg" fw={600}>{t('detail.tabs.documents')}</Text>
                  </Group>
                  {documents.length > 0 && (
                    <Button
                      variant="light"
                      leftSection={<IconDownload size={16} />}
                      onClick={handleDownloadAllDocs}
                      loading={downloadingDocs}
                      size="sm"
                    >
                      {tGlobal('actions.downloadAll') || 'Tümünü İndir (ZIP)'}
                    </Button>
                  )}
                </Group>
                <Divider />
                {documents.length > 0 ? (
                  <Grid>
                    {documents.map((doc, index) => (
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
                                onClick={() => openDocumentPreview(doc.name, doc.url)}
                                title={tGlobal('actions.view')}
                              >
                                <IconEye size={16} />
                              </ActionIcon>
                              <ActionIcon
                                variant="light"
                                color="green"
                                component="a"
                                href={doc.url.startsWith('/storage/') ? `/api${doc.url}` : doc.url}
                                download
                                title={tGlobal('actions.download')}
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
                    {t('detail.noDocuments')}
                  </Text>
                )}
              </Stack>
            </Paper>
          </Tabs.Panel>

          {/* Preferences Tab */}
          <Tabs.Panel value="preferences" pt="md">
            <Paper shadow="xs" p="md">
              <Stack gap="md">
                <Group gap="xs">
                  <IconSettings size={20} />
                  <Text size="lg" fw={600}>{t('tabs.preferences')}</Text>
                </Group>
                <Divider />
                <Grid gutter="md">
                  <Grid.Col span={{ base: 12, sm: 6, lg: 4 }}>
                    <Text size="sm" c="dimmed">{t('form.preferences.defaultLanguage')}</Text>
                    <Text fw={500}>{user.defaultLanguage === 'tr' ? 'Türkçe' : user.defaultLanguage === 'en' ? 'English' : user.defaultLanguage || '-'}</Text>
                  </Grid.Col>
                  <Grid.Col span={{ base: 12, sm: 6, lg: 4 }}>
                    <Text size="sm" c="dimmed">{t('form.preferences.defaultTheme')}</Text>
                    <Text fw={500}>{user.defaultTheme === 'auto' ? t('form.preferences.themeAuto') : user.defaultTheme === 'light' ? t('form.preferences.themeLight') : user.defaultTheme === 'dark' ? t('form.preferences.themeDark') : '-'}</Text>
                  </Grid.Col>
                  <Grid.Col span={{ base: 12, sm: 6, lg: 4 }}>
                    <Text size="sm" c="dimmed">{t('form.preferences.defaultLayout')}</Text>
                    <Text fw={500}>{user.defaultLayout === 'sidebar' ? t('form.preferences.layoutSidebar') : user.defaultLayout === 'top' ? t('form.preferences.layoutTopHeader') : '-'}</Text>
                  </Grid.Col>
                </Grid>
              </Stack>
            </Paper>
          </Tabs.Panel>
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
