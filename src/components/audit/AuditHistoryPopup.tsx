'use client';

import { useState, useCallback } from 'react';
import {
  Popover,
  ActionIcon,
  Stack,
  Text,
  Group,
  Loader,
  Badge,
  Box,
  Divider,
  Button,
  Tooltip,
  ScrollArea,
} from '@mantine/core';
import {
  IconHistory,
  IconPlus,
  IconPencil,
  IconTrash,
  IconUser,
  IconClock,
  IconChevronRight,
} from '@tabler/icons-react';
import { useTranslation } from '@/lib/i18n/client';
import { fetchWithAuth } from '@/lib/api/fetchWithAuth';

interface AuditLog {
  id: string;
  action: string;
  createdAt: string;
  metadata?: {
    oldValue?: Record<string, any>;
    newValue?: Record<string, any>;
    changedFields?: string[];
  } | null;
  user?: {
    id: string;
    name: string | null;
    email: string;
  } | null;
}

interface AuditHistoryPopupProps {
  entityId: string;
  entityName: string;
  limit?: number;
  onViewAll?: () => void;
}

const ACTION_ICONS: Record<string, React.ReactNode> = {
  create: <IconPlus size={14} />,
  update: <IconPencil size={14} />,
  delete: <IconTrash size={14} />,
};

const ACTION_COLORS: Record<string, string> = {
  create: 'green',
  update: 'blue',
  delete: 'red',
};

export function AuditHistoryPopup({
  entityId,
  entityName,
  limit = 5,
  onViewAll,
}: AuditHistoryPopupProps) {
  const { t } = useTranslation('global');
  const [opened, setOpened] = useState(false);
  const [loading, setLoading] = useState(false);
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [error, setError] = useState<string | null>(null);

  const fetchHistory = useCallback(async () => {
    if (!entityId || !entityName) return;

    setLoading(true);
    setError(null);

    try {
      const response = await fetchWithAuth(
        `/api/audit-logs?entity=${entityName}&entityId=${entityId}&pageSize=${limit}`
      );
      const data = await response.json();

      if (data.success) {
        setLogs(data.logs || []);
      } else {
        setError(data.error || t('audit.loadError'));
      }
    } catch (err) {
      setError(t('audit.loadError'));
    } finally {
      setLoading(false);
    }
  }, [entityId, entityName, limit, t]);

  const handleOpen = useCallback(() => {
    setOpened(true);
    fetchHistory();
  }, [fetchHistory]);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('tr-TR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  // Otomatik güncellenen ve gösterilmemesi gereken alanlar
  const IGNORED_FIELDS = ['updatedAt', 'createdAt', 'id', 'tenantId', 'companyId'];

  const getChangeSummary = (log: AuditLog): string[] => {
    if (!log.metadata) return [];

    const { oldValue, newValue, changedFields } = log.metadata;

    if (changedFields && changedFields.length > 0 && oldValue && newValue) {
      // Filtrelenmiş ve anlamlı değişiklikler
      const meaningfulChanges = changedFields
        .filter(field => !IGNORED_FIELDS.includes(field))
        .slice(0, 3) // En fazla 3 değişiklik göster
        .map(field => {
          const oldVal = oldValue[field];
          const newVal = newValue[field];

          // Değerleri kısalt
          const formatValue = (val: any): string => {
            if (val === null || val === undefined) return '-';
            if (typeof val === 'string' && val.length > 20) return val.substring(0, 20) + '...';
            if (typeof val === 'object') return JSON.stringify(val).substring(0, 20) + '...';
            return String(val);
          };

          return `${field}: ${formatValue(oldVal)} → ${formatValue(newVal)}`;
        });

      return meaningfulChanges;
    }

    return [];
  };

  return (
    <Popover
      opened={opened}
      onClose={() => setOpened(false)}
      position="bottom-end"
      withArrow
      shadow="md"
      width={400}
    >
      <Popover.Target>
        <Tooltip label={t('audit.title')} withArrow>
          <ActionIcon
            variant="subtle"
            color="gray"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              handleOpen();
            }}
          >
            <IconHistory size={16} />
          </ActionIcon>
        </Tooltip>
      </Popover.Target>

      <Popover.Dropdown onClick={(e) => e.stopPropagation()}>
        <Stack gap="xs">
          <Group justify="space-between">
            <Text fw={600} size="sm">
              {t('audit.recentChanges')}
            </Text>
            <ActionIcon
              variant="subtle"
              size="xs"
              onClick={fetchHistory}
              disabled={loading}
            >
              {loading ? <Loader size={12} /> : <IconClock size={12} />}
            </ActionIcon>
          </Group>

          <Divider />

          {loading && (
            <Box py="md" ta="center">
              <Loader size="sm" />
            </Box>
          )}

          {error && (
            <Text c="red" size="sm" ta="center">
              {error}
            </Text>
          )}

          {!loading && !error && logs.length === 0 && (
            <Text c="dimmed" size="sm" ta="center" py="md">
              {t('audit.noHistory')}
            </Text>
          )}

          {!loading && !error && logs.length > 0 && (
            <ScrollArea.Autosize mah={300}>
              <Stack gap="xs">
                {logs.map((log, index) => (
                  <Box key={log.id}>
                    {index > 0 && <Divider my="xs" />}
                    <Group gap="xs" wrap="nowrap" align="flex-start">
                      <Badge
                        size="xs"
                        color={ACTION_COLORS[log.action] || 'gray'}
                        variant="light"
                        leftSection={ACTION_ICONS[log.action]}
                        style={{ flexShrink: 0 }}
                      >
                        {t(`audit.actions.${log.action}`) || log.action}
                      </Badge>
                      <Stack gap={2} style={{ flex: 1, minWidth: 0 }}>
                        <Group gap={4} wrap="nowrap">
                          <IconUser size={12} style={{ flexShrink: 0 }} />
                          <Text size="xs" truncate>
                            {log.user?.name || log.user?.email || t('audit.system')}
                          </Text>
                        </Group>
                        <Text size="xs" c="dimmed">
                          {formatDate(log.createdAt)}
                        </Text>
                        {log.action === 'update' && getChangeSummary(log).length > 0 && (
                          <Stack gap={2}>
                            {getChangeSummary(log).map((change, idx) => (
                              <Text key={idx} size="xs" c="dimmed" fs="italic">
                                {change}
                              </Text>
                            ))}
                          </Stack>
                        )}
                      </Stack>
                    </Group>
                  </Box>
                ))}
              </Stack>
            </ScrollArea.Autosize>
          )}

          {!loading && logs.length > 0 && onViewAll && (
            <>
              <Divider />
              <Button
                variant="subtle"
                size="xs"
                fullWidth
                rightSection={<IconChevronRight size={14} />}
                onClick={onViewAll}
              >
                {t('audit.viewAll')}
              </Button>
            </>
          )}
        </Stack>
      </Popover.Dropdown>
    </Popover>
  );
}

export default AuditHistoryPopup;
