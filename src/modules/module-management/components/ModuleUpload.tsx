'use client';

import { useState, useEffect } from 'react';
import { Container, Card, Title, Text, Button, TextInput, Textarea, Stack, Group, Alert, Code, Paper } from '@mantine/core';
import { Dropzone, FileWithPath } from '@mantine/dropzone';
import { IconUpload, IconX, IconAlertCircle, IconCheck } from '@tabler/icons-react';
import { useModules } from '@/context/ModuleContext';
import { useNotification } from '@/hooks/useNotification';
import { CentralPageHeader } from '@/components/headers/CentralPageHeader';
import { useTranslation } from '@/lib/i18n/client';

export function ModuleUpload() {
  const { installModule } = useModules();
  const { showSuccess, showError } = useNotification();
  const { t } = useTranslation('modules/management');
  const [file, setFile] = useState<FileWithPath | null>(null);
  const [loading, setLoading] = useState(false);
  const [manifest, setManifest] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleFileSelect = async (files: FileWithPath[]) => {
    const selectedFile = files[0];
    setFile(selectedFile || null);
    setError(null);
    setManifest(null);

    // Validate file
    if (!selectedFile?.name.endsWith('.zip')) {
      setError(t('upload.errors.onlyZip'));
      return;
    }

    if (selectedFile?.size > 50 * 1024 * 1024) {
      setError(t('upload.errors.fileSize'));
      return;
    }

    // Try to extract and read module.json
    try {
      // In a real implementation, you would extract the ZIP and read module.json
      // For now, we'll just set a placeholder
      setManifest({
        name: t('upload.form.moduleName'),
        version: '1.0.0',
        description: t('upload.form.descriptionPlaceholder'),
      });
    } catch (err) {
      setError(t('upload.errors.readManifest'));
    }
  };

  const handleUpload = async () => {
    if (!file) {
      setError(t('upload.errors.selectFile'));
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const module = await installModule(file);
      showSuccess(
        t('upload.notifications.installed'),
        t('upload.notifications.installedSuccess').replace('{{name}}', module.name)
      );
      // Redirect to module listing
      window.location.href = '/modules';
    } catch (err) {
      const message = err instanceof Error ? err.message : t('upload.notifications.installationFailedMessage');
      setError(message);
      showError(t('upload.notifications.installationFailed'), message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container py="xl">
      <CentralPageHeader
        title="upload.title"
        description="upload.description"
        namespace="modules/management"
        icon={mounted ? <IconUpload size={32} /> : null}
        breadcrumbs={[
          { label: 'navigation.dashboard', href: '/dashboard', namespace: 'global' },
          { label: 'listing.title', href: '/modules', namespace: 'modules/management' },
          { label: 'upload.title', namespace: 'modules/management' },
        ]}
      />

      <Card shadow="sm" padding="lg" radius="md" withBorder>
        <Stack gap="xl">
          {/* Dropzone */}
          <Dropzone
            onDrop={handleFileSelect}
            accept={['application/zip']}
            maxSize={50 * 1024 * 1024}
            loading={loading}
          >
            <Group justify="center" gap="xl" mih={220} style={{ pointerEvents: 'none' }}>
              <Dropzone.Accept>
                <IconCheck size={52} color="var(--mantine-color-blue-6)" />
              </Dropzone.Accept>
              <Dropzone.Reject>
                <IconX size={52} color="var(--mantine-color-red-6)" />
              </Dropzone.Reject>
              <Dropzone.Idle>
                <IconUpload size={52} color="var(--mantine-color-dimmed)" />
              </Dropzone.Idle>

              <div>
                <Text inline>
                  {t('upload.dropzone.dragDrop')}
                </Text>
                <Text c="dimmed" inline mt={7}>
                  {t('upload.dropzone.clickToSelect')}
                </Text>
                <Text c="dimmed" mt={7}>
                  {t('upload.dropzone.acceptedFormat')}
                </Text>
              </div>
            </Group>
          </Dropzone>

          {file && (
            <Text c="dimmed">
              {t('upload.dropzone.selected')}: {file.name} ({(file.size / 1024 / 1024).toFixed(2)} MB)
            </Text>
          )}

          {/* Form Fields */}
          <Stack gap="md">
            <TextInput
              label={t('upload.form.moduleName')}
              placeholder={t('upload.form.moduleNamePlaceholder')}
              value={manifest?.name || ''}
              disabled
            />
            <TextInput
              label={t('upload.form.version')}
              placeholder={t('upload.form.versionPlaceholder')}
              value={manifest?.version || ''}
              disabled
            />
            <Textarea
              label={t('upload.form.description')}
              placeholder={t('upload.form.descriptionPlaceholder')}
              value={manifest?.description || ''}
              disabled
              minRows={3}
            />
          </Stack>

          {/* Helper Section */}
          <Paper p="md" withBorder className="bg-slate-50 dark:bg-slate-900/50">
            <Stack gap="md">
              <Group gap="sm">
                <IconAlertCircle size={20} color="var(--mantine-color-blue-6)" />
                <Title order={4}>{t('upload.manifest.title')}</Title>
              </Group>
              <Text c="dimmed">
                {t('upload.manifest.description1')}
              </Text>
              <Text c="dimmed">
                {t('upload.manifest.description2')}
              </Text>
              <Text c="dimmed" fw={500}>
                {t('upload.manifest.fileName')}: <Code>module.config.yaml</Code>
              </Text>
              <Code block className="bg-slate-200 dark:bg-slate-800 p-4 rounded">
                {t('upload.manifest.example')}
              </Code>
            </Stack>
          </Paper>

          {error && (
            <Alert icon={<IconAlertCircle size={16} />} title={t('upload.errors.error')} color="red">
              {error}
            </Alert>
          )}

          {/* Actions */}
          <Group justify="flex-end" mt="md">
            <Button
              variant="default"
              onClick={() => {
                window.location.href = '/modules';
              }}
            >
              {t('upload.buttons.cancel')}
            </Button>
            <Button
              onClick={handleUpload}
              loading={loading}
              disabled={!file || !!error}
            >
              {t('upload.buttons.uploadInstall')}
            </Button>
          </Group>
        </Stack>
      </Card>
    </Container>
  );
}

