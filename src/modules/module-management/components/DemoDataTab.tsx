'use client';

import {
  Paper,
  Stack,
  Group,
  Title,
  Text,
  Badge,
  Button,
  Alert,
  Divider,
  Progress,
  Box,
  ThemeIcon,
  List,
  LoadingOverlay,
} from '@mantine/core';
import {
  IconDatabase,
  IconTrash,
  IconDownload,
  IconCheck,
  IconAlertCircle,
  IconInfoCircle,
  IconArrowRight,
} from '@tabler/icons-react';
import { ClientIcon } from '@/components/common/ClientIcon';
import { useState, useEffect, useCallback } from 'react';
import { useTranslation } from '@/lib/i18n/client';
import { useNotification } from '@/hooks/useNotification';

interface DemoDataStatus {
  moduleSlug: string;
  moduleName: string;
  description: string;
  hasData: boolean;
  count: number;
  dependencies?: string[];
}

interface DemoDataTabProps {
  moduleSlug: string;
}

export function DemoDataTab({ moduleSlug }: DemoDataTabProps) {
  const { t } = useTranslation('modules/module-management');
  const { showSuccess, showError } = useNotification();

  // Helper for demoData translations (they are under moduleSettings.demoData)
  const td = (key: string, options?: Record<string, string | number>) => t(`moduleSettings.demoData.${key}`, options);

  const [status, setStatus] = useState<DemoDataStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [seeding, setSeeding] = useState(false);
  const [removing, setRemoving] = useState(false);

  const fetchStatus = useCallback(async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/modules/${moduleSlug}/demo-data`);
      const result = await response.json();

      if (result.success) {
        setStatus(result.data);
      } else {
        console.error('Failed to fetch demo data status:', result.error);
      }
    } catch (error) {
      console.error('Error fetching demo data status:', error);
    } finally {
      setLoading(false);
    }
  }, [moduleSlug]);

  useEffect(() => {
    fetchStatus();
  }, [fetchStatus]);

  const handleSeed = async () => {
    try {
      setSeeding(true);
      const response = await fetch(`/api/modules/${moduleSlug}/demo-data`, {
        method: 'POST',
      });
      const result = await response.json();

      if (result.success) {
        showSuccess(
          td('notifications.seedSuccess'),
          td('notifications.seedSuccessMessage', { count: result.data.itemsCreated })
        );
        await fetchStatus();
      } else {
        showError(td('notifications.seedError'), result.error || td('notifications.seedErrorMessage'));
      }
    } catch (error) {
      showError(
        td('notifications.seedError'),
        error instanceof Error ? error.message : td('notifications.seedErrorMessage')
      );
    } finally {
      setSeeding(false);
    }
  };

  const handleRemove = async () => {
    try {
      setRemoving(true);
      const response = await fetch(`/api/modules/${moduleSlug}/demo-data`, {
        method: 'DELETE',
      });
      const result = await response.json();

      if (result.success) {
        showSuccess(
          td('notifications.removeSuccess'),
          td('notifications.removeSuccessMessage', { count: result.data.itemsDeleted })
        );
        await fetchStatus();
      } else {
        showError(td('notifications.removeError'), result.error || td('notifications.removeErrorMessage'));
      }
    } catch (error) {
      showError(
        td('notifications.removeError'),
        error instanceof Error ? error.message : td('notifications.removeErrorMessage')
      );
    } finally {
      setRemoving(false);
    }
  };

  if (loading) {
    return (
      <Paper shadow="xs" p="xl" withBorder pos="relative" mih={300}>
        <LoadingOverlay visible={true} />
      </Paper>
    );
  }

  return (
    <Paper shadow="xs" p="xl" withBorder>
      <Stack gap="lg">
        {/* Header */}
        <Group justify="space-between" align="flex-start">
          <Stack gap={4}>
            <Group gap="sm">
              <ThemeIcon size="lg" variant="light" color="violet">
                <ClientIcon>
                  <IconDatabase size={20} />
                </ClientIcon>
              </ThemeIcon>
              <Title order={4}>{td('title')}</Title>
            </Group>
            <Text size="sm" c="dimmed">
              {td('description')}
            </Text>
          </Stack>

          {status?.hasData && (
            <Badge size="lg" variant="light" color="green">
              {td('status.loaded', { count: status.count })}
            </Badge>
          )}
        </Group>

        <Divider />

        {/* Info Alert */}
        <Alert
          icon={
            <ClientIcon>
              <IconInfoCircle size={16} />
            </ClientIcon>
          }
          title={td('infoTitle')}
          color="blue"
          variant="light"
        >
          {td('infoMessage')}
        </Alert>

        {/* Status */}
        {status && (
          <Paper p="md" withBorder radius="md">
            <Stack gap="md">
              <Group justify="space-between">
                <Text fw={500}>{status.moduleName}</Text>
                <Badge variant="dot" color={status.hasData ? 'green' : 'gray'}>
                  {status.hasData ? td('status.hasData') : td('status.noData')}
                </Badge>
              </Group>

              <Text size="sm" c="dimmed">
                {status.description}
              </Text>

              {status.hasData && (
                <Box>
                  <Group justify="space-between" mb={4}>
                    <Text size="xs" c="dimmed">
                      {td('recordCount')}
                    </Text>
                    <Text size="xs" fw={500}>
                      {status.count}
                    </Text>
                  </Group>
                  <Progress value={100} color="green" size="sm" />
                </Box>
              )}

              {status.dependencies && status.dependencies.length > 0 && (
                <Box>
                  <Text size="xs" c="dimmed" mb={4}>
                    {td('dependencies')}
                  </Text>
                  <List size="xs" spacing={4} icon={<IconArrowRight size={12} />}>
                    {status.dependencies.map((dep) => (
                      <List.Item key={dep}>{dep}</List.Item>
                    ))}
                  </List>
                </Box>
              )}
            </Stack>
          </Paper>
        )}

        {/* Warning for existing data */}
        {status?.hasData && (
          <Alert
            icon={
              <ClientIcon>
                <IconAlertCircle size={16} />
              </ClientIcon>
            }
            title={td('warningTitle')}
            color="orange"
            variant="light"
          >
            {td('warningMessage')}
          </Alert>
        )}

        {/* Actions */}
        <Group justify="flex-end" gap="sm">
          {status?.hasData ? (
            <Button
              variant="light"
              color="red"
              leftSection={
                <ClientIcon>
                  <IconTrash size={16} />
                </ClientIcon>
              }
              onClick={handleRemove}
              loading={removing}
              disabled={seeding}
            >
              {td('actions.remove')}
            </Button>
          ) : (
            <Button
              variant="filled"
              color="violet"
              leftSection={
                <ClientIcon>
                  <IconDownload size={16} />
                </ClientIcon>
              }
              onClick={handleSeed}
              loading={seeding}
              disabled={removing}
            >
              {td('actions.load')}
            </Button>
          )}

          {status?.hasData && (
            <Button
              variant="light"
              leftSection={
                <ClientIcon>
                  <IconCheck size={16} />
                </ClientIcon>
              }
              disabled
            >
              {td('actions.verify')}
            </Button>
          )}
        </Group>
      </Stack>
    </Paper>
  );
}
