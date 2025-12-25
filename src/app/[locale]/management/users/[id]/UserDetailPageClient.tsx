'use client';

import { useState } from 'react';
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
  Button,
  Tabs,
  Card,
  ActionIcon,
  Tooltip,
  Skeleton,
  Alert,
  Box,
} from '@mantine/core';
import {
  IconUsers,
  IconEdit,
  IconArrowLeft,
  IconUser,
  IconMail,
  IconPhone,
  IconBriefcase,
  IconMapPin,
  IconCalendar,
  IconFileText,
  IconDownload,
  IconEye,
  IconSettings,
} from '@tabler/icons-react';
import { CentralPageHeader } from '@/components/headers/CentralPageHeader';
import { FilePreviewModal } from '@/modules/file-manager/components/FilePreviewModal';
import { FileItem } from '@/modules/file-manager/types/file';
import { useTranslation } from '@/lib/i18n/client';
import { useUser } from '@/hooks/useUsers';
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
      path: url, // The URL will be used as the path for preview
      extension: extension,
      mimeType: mimeTypeMap[extension] || 'application/octet-stream',
      size: 0,
      type: 'file',
      isDirectory: false,
      createdAt: new Date(),
      modifiedAt: new Date(),
    };

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

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge color="green" size="lg">{t('status.active')}</Badge>;
      case 'inactive':
        return <Badge color="gray" size="lg">{t('status.inactive')}</Badge>;
      case 'pending':
        return <Badge color="yellow" size="lg">{t('status.pending')}</Badge>;
      default:
        return <Badge size="lg">{status}</Badge>;
    }
  };

  const renderDocumentCard = (title: string, url: string | null, icon: React.ReactNode) => {
    if (!url) return null;
    return (
      <Card withBorder p="sm">
        <Group justify="space-between">
          <Group gap="sm">
            {icon}
            <Text size="sm" fw={500}>{title}</Text>
          </Group>
          <Group gap="xs">
            <Tooltip label={t('actions.view')}>
              <ActionIcon
                variant="light"
                color="blue"
                onClick={() => openDocumentPreview(title, url)}
              >
                <IconEye size={16} />
              </ActionIcon>
            </Tooltip>
            <Tooltip label={t('actions.download')}>
              <ActionIcon
                variant="light"
                color="green"
                component="a"
                href={url.startsWith('/storage/') ? `/api${url}` : url}
                download
              >
                <IconDownload size={16} />
              </ActionIcon>
            </Tooltip>
          </Group>
        </Group>
      </Card>
    );
  };

  if (isLoading) {
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
        />
        <Paper shadow="xs" p="xl" mt="lg">
          <Stack gap="lg">
            <Group gap="lg">
              <Skeleton height={100} circle />
              <Stack gap="xs">
                <Skeleton height={24} width={200} />
                <Skeleton height={16} width={150} />
                <Skeleton height={24} width={80} />
              </Stack>
            </Group>
            <Skeleton height={200} />
          </Stack>
        </Paper>
      </Container>
    );
  }

  if (error || !user) {
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
        />
        <Alert color="red" title={tGlobal('common.errorLoading')} mt="lg">
          {error instanceof Error ? error.message : t('detail.userNotFound')}
        </Alert>
      </Container>
    );
  }

  return (
    <Container size="xl" pt="xl">
      <CentralPageHeader
        title={user.name || t('detail.title')}
        description={t('detail.description')}
        namespace="modules/users"
        icon={<IconUsers size={32} />}
        breadcrumbs={[
          { label: 'navigation.dashboard', href: `/${locale}/dashboard`, namespace: 'global' },
          { label: 'title', href: `/${locale}/management/users`, namespace: 'modules/users' },
          { label: user.name || t('detail.title'), namespace: 'modules/users' },
        ]}
        actions={[
          {
            label: tGlobal('actions.back'),
            icon: <IconArrowLeft size={18} />,
            onClick: () => router.push(`/${locale}/management/users`),
            variant: 'light',
          },
          {
            label: t('actions.edit'),
            icon: <IconEdit size={18} />,
            onClick: () => router.push(`/${locale}/management/users/${userId}/edit`),
            variant: 'filled',
          },
        ]}
      />

      <Paper shadow="xs" p="xl" mt="lg">
        {/* User Header */}
        <Group gap="xl" align="flex-start" mb="xl">
          <Avatar
            src={user.profilePicture}
            size={120}
            radius="xl"
            color="blue"
          >
            {user.name?.charAt(0)?.toUpperCase() || 'U'}
          </Avatar>
          <Stack gap="xs" style={{ flex: 1 }}>
            <Group justify="space-between">
              <Stack gap={4}>
                <Text size="xl" fw={700}>{user.name}</Text>
                <Text size="md" c="dimmed">{user.email}</Text>
              </Stack>
              {getStatusBadge(user.status)}
            </Group>
            <Group gap="lg" mt="xs">
              <Badge variant="outline" size="lg">{user.role}</Badge>
              {user.department && (
                <Text size="sm" c="dimmed">
                  <IconBriefcase size={14} style={{ marginRight: 4, verticalAlign: 'middle' }} />
                  {user.department}
                </Text>
              )}
              {user.position && (
                <Text size="sm" c="dimmed">{user.position}</Text>
              )}
            </Group>
          </Stack>
        </Group>

        <Divider my="lg" />

        {/* Tabs for different sections */}
        <Tabs defaultValue="info">
          <Tabs.List>
            <Tabs.Tab value="info" leftSection={<IconUser size={16} />}>
              {t('detail.tabs.info')}
            </Tabs.Tab>
            <Tabs.Tab value="contact" leftSection={<IconMapPin size={16} />}>
              {t('detail.tabs.contact')}
            </Tabs.Tab>
            <Tabs.Tab value="documents" leftSection={<IconFileText size={16} />}>
              {t('detail.tabs.documents')}
            </Tabs.Tab>
            <Tabs.Tab value="preferences" leftSection={<IconSettings size={16} />}>
              {t('detail.tabs.preferences')}
            </Tabs.Tab>
          </Tabs.List>

          {/* Info Tab */}
          <Tabs.Panel value="info" pt="lg">
            <Grid>
              <Grid.Col span={{ base: 12, md: 6 }}>
                <Card withBorder p="md">
                  <Text size="sm" fw={600} c="dimmed" mb="sm">{t('form.personal.title')}</Text>
                  <Stack gap="xs">
                    <Group justify="space-between">
                      <Group gap="xs">
                        <IconUser size={16} color="gray" />
                        <Text size="sm" c="dimmed">{t('form.personal.fullName')}</Text>
                      </Group>
                      <Text size="sm" fw={500}>{user.name || '-'}</Text>
                    </Group>
                    <Group justify="space-between">
                      <Group gap="xs">
                        <IconMail size={16} color="gray" />
                        <Text size="sm" c="dimmed">{t('form.personal.email')}</Text>
                      </Group>
                      <Text size="sm" fw={500}>{user.email || '-'}</Text>
                    </Group>
                    <Group justify="space-between">
                      <Group gap="xs">
                        <IconPhone size={16} color="gray" />
                        <Text size="sm" c="dimmed">{t('form.personal.phone')}</Text>
                      </Group>
                      <Text size="sm" fw={500}>{user.phone || '-'}</Text>
                    </Group>
                  </Stack>
                </Card>
              </Grid.Col>
              <Grid.Col span={{ base: 12, md: 6 }}>
                <Card withBorder p="md">
                  <Text size="sm" fw={600} c="dimmed" mb="sm">{t('form.work.title')}</Text>
                  <Stack gap="xs">
                    <Group justify="space-between">
                      <Text size="sm" c="dimmed">{t('form.work.role')}</Text>
                      <Text size="sm" fw={500}>{user.role || '-'}</Text>
                    </Group>
                    <Group justify="space-between">
                      <Text size="sm" c="dimmed">{t('form.work.department')}</Text>
                      <Text size="sm" fw={500}>{user.department || '-'}</Text>
                    </Group>
                    <Group justify="space-between">
                      <Text size="sm" c="dimmed">{t('form.work.position')}</Text>
                      <Text size="sm" fw={500}>{user.position || '-'}</Text>
                    </Group>
                    <Group justify="space-between">
                      <Text size="sm" c="dimmed">{t('form.work.employeeId')}</Text>
                      <Text size="sm" fw={500}>{user.employeeId || '-'}</Text>
                    </Group>
                    <Group justify="space-between">
                      <Group gap="xs">
                        <IconCalendar size={16} color="gray" />
                        <Text size="sm" c="dimmed">{t('form.work.hireDate')}</Text>
                      </Group>
                      <Text size="sm" fw={500}>
                        {user.hireDate ? dayjs(user.hireDate).format('DD.MM.YYYY') : '-'}
                      </Text>
                    </Group>
                  </Stack>
                </Card>
              </Grid.Col>
              <Grid.Col span={12}>
                <Card withBorder p="md">
                  <Text size="sm" fw={600} c="dimmed" mb="sm">{t('detail.systemInfo')}</Text>
                  <Grid>
                    <Grid.Col span={{ base: 12, md: 4 }}>
                      <Group justify="space-between">
                        <Text size="sm" c="dimmed">{t('quickView.createdAt')}</Text>
                        <Text size="sm" fw={500}>
                          {user.createdAt ? dayjs(user.createdAt).format('DD.MM.YYYY HH:mm') : '-'}
                        </Text>
                      </Group>
                    </Grid.Col>
                    <Grid.Col span={{ base: 12, md: 4 }}>
                      <Group justify="space-between">
                        <Text size="sm" c="dimmed">{t('detail.updatedAt')}</Text>
                        <Text size="sm" fw={500}>
                          {user.updatedAt ? dayjs(user.updatedAt).format('DD.MM.YYYY HH:mm') : '-'}
                        </Text>
                      </Group>
                    </Grid.Col>
                    <Grid.Col span={{ base: 12, md: 4 }}>
                      <Group justify="space-between">
                        <Text size="sm" c="dimmed">{t('table.lastActive')}</Text>
                        <Text size="sm" fw={500}>
                          {user.lastActive ? dayjs(user.lastActive).format('DD.MM.YYYY HH:mm') : '-'}
                        </Text>
                      </Group>
                    </Grid.Col>
                  </Grid>
                </Card>
              </Grid.Col>
            </Grid>
          </Tabs.Panel>

          {/* Contact Tab */}
          <Tabs.Panel value="contact" pt="lg">
            <Grid>
              <Grid.Col span={{ base: 12, md: 6 }}>
                <Card withBorder p="md">
                  <Text size="sm" fw={600} c="dimmed" mb="sm">{t('form.contact.title')}</Text>
                  <Stack gap="xs">
                    <Group justify="space-between">
                      <Text size="sm" c="dimmed">{t('form.contact.address')}</Text>
                      <Text size="sm" fw={500}>{user.address || '-'}</Text>
                    </Group>
                    <Group justify="space-between">
                      <Text size="sm" c="dimmed">{t('form.contact.city')}</Text>
                      <Text size="sm" fw={500}>{user.city || '-'}</Text>
                    </Group>
                    <Group justify="space-between">
                      <Text size="sm" c="dimmed">{t('form.contact.country')}</Text>
                      <Text size="sm" fw={500}>{user.country || '-'}</Text>
                    </Group>
                    <Group justify="space-between">
                      <Text size="sm" c="dimmed">{t('form.contact.postalCode')}</Text>
                      <Text size="sm" fw={500}>{user.postalCode || '-'}</Text>
                    </Group>
                  </Stack>
                </Card>
              </Grid.Col>
              <Grid.Col span={{ base: 12, md: 6 }}>
                <Card withBorder p="md">
                  <Text size="sm" fw={600} c="dimmed" mb="sm">{t('form.contact.emergency')}</Text>
                  <Stack gap="xs">
                    <Group justify="space-between">
                      <Text size="sm" c="dimmed">{t('form.contact.emergencyContact')}</Text>
                      <Text size="sm" fw={500}>{user.emergencyContact || '-'}</Text>
                    </Group>
                    <Group justify="space-between">
                      <Text size="sm" c="dimmed">{t('form.contact.emergencyPhone')}</Text>
                      <Text size="sm" fw={500}>{user.emergencyPhone || '-'}</Text>
                    </Group>
                  </Stack>
                </Card>
              </Grid.Col>
            </Grid>
          </Tabs.Panel>

          {/* Documents Tab */}
          <Tabs.Panel value="documents" pt="lg">
            <Grid>
              <Grid.Col span={{ base: 12, md: 6 }}>
                {renderDocumentCard(
                  t('form.documents.passport'),
                  user.passportUrl,
                  <IconFileText size={20} color="gray" />
                )}
              </Grid.Col>
              <Grid.Col span={{ base: 12, md: 6 }}>
                {renderDocumentCard(
                  t('form.documents.idCard'),
                  user.idCardUrl,
                  <IconFileText size={20} color="gray" />
                )}
              </Grid.Col>
              <Grid.Col span={{ base: 12, md: 6 }}>
                {renderDocumentCard(
                  t('form.documents.contract'),
                  user.contractUrl,
                  <IconFileText size={20} color="gray" />
                )}
              </Grid.Col>
              <Grid.Col span={{ base: 12, md: 6 }}>
                {renderDocumentCard(
                  t('form.documents.cv'),
                  user.cvUrl,
                  <IconFileText size={20} color="gray" />
                )}
              </Grid.Col>
              {!user.passportUrl && !user.idCardUrl && !user.contractUrl && !user.cvUrl && (
                <Grid.Col span={12}>
                  <Text c="dimmed" ta="center" py="xl">
                    {t('detail.noDocuments')}
                  </Text>
                </Grid.Col>
              )}
            </Grid>
          </Tabs.Panel>

          {/* Preferences Tab */}
          <Tabs.Panel value="preferences" pt="lg">
            <Card withBorder p="md">
              <Text size="sm" fw={600} c="dimmed" mb="sm">{t('form.preferences.title')}</Text>
              <Stack gap="xs">
                <Group justify="space-between">
                  <Text size="sm" c="dimmed">{t('form.preferences.language')}</Text>
                  <Text size="sm" fw={500}>{user.defaultLanguage || 'tr'}</Text>
                </Group>
                <Group justify="space-between">
                  <Text size="sm" c="dimmed">{t('form.preferences.theme')}</Text>
                  <Text size="sm" fw={500}>{user.defaultTheme || 'auto'}</Text>
                </Group>
                <Group justify="space-between">
                  <Text size="sm" c="dimmed">{t('form.preferences.layout')}</Text>
                  <Text size="sm" fw={500}>{user.defaultLayout || 'sidebar'}</Text>
                </Group>
              </Stack>
            </Card>
          </Tabs.Panel>
        </Tabs>
      </Paper>

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
