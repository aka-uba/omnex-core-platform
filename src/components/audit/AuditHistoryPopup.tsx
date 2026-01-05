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
  IconChevronRight,
  IconChevronDown,
  IconChevronUp,
  IconPhoto,
  IconFile,
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
  translationNamespace?: string; // Module namespace for field label translations (e.g., 'modules/real-estate')
}

const ACTION_ICONS: Record<string, React.ReactNode> = {
  create: <IconPlus size={12} />,
  update: <IconPencil size={12} />,
  delete: <IconTrash size={12} />,
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
  translationNamespace,
}: AuditHistoryPopupProps) {
  const { t } = useTranslation('global');
  const { t: tModule } = useTranslation(translationNamespace || 'global');
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

  const handleToggle = useCallback(() => {
    if (!opened) {
      setOpened(true);
      fetchHistory();
    } else {
      setOpened(false);
    }
  }, [opened, fetchHistory]);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('tr-TR', {
      day: '2-digit',
      month: '2-digit',
      year: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  // ISO tarih string'i tespit et ve formatla
  const isISODateString = (value: string): boolean => {
    // ISO 8601 formatı: 2026-01-16T00:00:00.000Z veya 2026-01-16
    const isoDateRegex = /^\d{4}-\d{2}-\d{2}(T\d{2}:\d{2}:\d{2}(\.\d{3})?Z?)?$/;
    return isoDateRegex.test(value);
  };

  const formatValueForDisplay = (value: any): string => {
    if (value === null || value === undefined) return '-';

    // String ise tarih kontrolü yap
    if (typeof value === 'string') {
      if (isISODateString(value)) {
        const date = new Date(value);
        // Sadece tarih ise saat gösterme
        if (value.length === 10) {
          return date.toLocaleDateString('tr-TR', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
          });
        }
        // Tam ISO ise tarih ve saat
        return date.toLocaleDateString('tr-TR', {
          day: '2-digit',
          month: '2-digit',
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
        });
      }
      // Normal string - kısalt
      return value.length > 20 ? value.substring(0, 20) + '...' : value;
    }

    // Sayı
    if (typeof value === 'number') {
      return value.toLocaleString('tr-TR');
    }

    return String(value);
  };

  // Otomatik güncellenen ve gösterilmemesi gereken alanlar
  const IGNORED_FIELDS = [
    'updatedAt', 'createdAt', 'id', 'tenantId', 'companyId',
    'property', 'contracts', 'payments', 'appointments', 'maintenance',
    '_count', 'user', 'company', 'tenant',
    // Relation IDs
    'propertyId', 'apartmentId', 'contractId', 'tenantRecordId', 'locationId',
  ];

  // Alan adını çeviriden al - önce modül namespace'inden, sonra global'den
  const getFieldLabel = (field: string): string => {
    // 1. Modül namespace'inden form.${field} dene
    if (translationNamespace) {
      const moduleFormLabel = tModule(`form.${field}`, { defaultValue: '' });
      if (moduleFormLabel && moduleFormLabel !== `form.${field}`) {
        return moduleFormLabel;
      }
      // 2. Modül namespace'inden table.${field} dene
      const moduleTableLabel = tModule(`table.${field}`, { defaultValue: '' });
      if (moduleTableLabel && moduleTableLabel !== `table.${field}`) {
        return moduleTableLabel;
      }
    }
    // 3. Global namespace'den form.${field} dene
    const globalFormLabel = t(`form.${field}`, { defaultValue: '' });
    if (globalFormLabel && globalFormLabel !== `form.${field}`) {
      return globalFormLabel;
    }
    // 4. Global namespace'den form.fields.${field} dene (legacy)
    const globalFieldsLabel = t(`form.fields.${field}`, { defaultValue: '' });
    if (globalFieldsLabel && globalFieldsLabel !== `form.fields.${field}`) {
      return globalFieldsLabel;
    }
    // 5. camelCase'i readable format'a çevir (unitNumber -> Unit Number)
    return field.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase()).trim();
  };

  // Tek bir değişiklik satırını render et
  const renderChangeItem = (
    field: string,
    oldVal: any,
    newVal: any,
    label: string
  ): React.ReactNode => {
    // Array değişiklikleri (resimler, belgeler)
    if (Array.isArray(oldVal) && Array.isArray(newVal)) {
      const added = newVal.length - oldVal.length;
      if (added > 0) {
        return (
          <Group key={field} gap={4} wrap="nowrap">
            {field === 'images' ? <IconPhoto size={10} /> : <IconFile size={10} />}
            <Text size="xs" c="dimmed">{added} {label.toLowerCase()} {t('audit.changes.added')}</Text>
          </Group>
        );
      } else if (added < 0) {
        return (
          <Group key={field} gap={4} wrap="nowrap">
            {field === 'images' ? <IconPhoto size={10} /> : <IconFile size={10} />}
            <Text size="xs" c="dimmed">{Math.abs(added)} {label.toLowerCase()} {t('audit.changes.removed')}</Text>
          </Group>
        );
      }
      return null;
    }

    // Boolean değişiklikleri
    if (typeof newVal === 'boolean') {
      return (
        <Text key={field} size="xs" c="dimmed">
          {label}: {newVal ? t('common.status.active') : t('common.status.inactive')}
        </Text>
      );
    }

    // Sayı değişiklikleri
    if (typeof newVal === 'number') {
      const formattedOld = oldVal != null ? Number(oldVal).toLocaleString('tr-TR') : '-';
      const formattedNew = newVal.toLocaleString('tr-TR');
      return (
        <Text key={field} size="xs" c="dimmed">
          {label}: {formattedOld} → {formattedNew}
        </Text>
      );
    }

    // String değişiklikleri (tarihler dahil)
    if (typeof newVal === 'string') {
      const formattedOld = formatValueForDisplay(oldVal);
      const formattedNew = formatValueForDisplay(newVal);
      return (
        <Text key={field} size="xs" c="dimmed">
          {label}: {formattedOld} → {formattedNew}
        </Text>
      );
    }

    // Diğer (null, undefined, object)
    if (newVal === null && oldVal !== null) {
      return (
        <Text key={field} size="xs" c="dimmed">
          {label} {t('audit.changes.cleared')}
        </Text>
      );
    } else if (newVal !== null && oldVal === null) {
      return (
        <Text key={field} size="xs" c="dimmed">
          {label} {t('audit.changes.set')}
        </Text>
      );
    }

    return null;
  };

  // Genişletilebilir değişiklik listesi component'i
  const ExpandableChanges = ({ log }: { log: AuditLog }) => {
    const [expanded, setExpanded] = useState(false);

    if (!log.metadata) return null;

    const { oldValue, newValue, changedFields } = log.metadata;

    if (!changedFields || changedFields.length === 0 || !oldValue || !newValue) {
      return null;
    }

    // Anlamlı değişiklikleri filtrele
    const meaningfulFields = changedFields.filter(field => !IGNORED_FIELDS.includes(field));

    if (meaningfulFields.length === 0) return null;

    // Gösterilecek alanları belirle
    const visibleFields = expanded ? meaningfulFields : meaningfulFields.slice(0, 2);
    const hiddenCount = meaningfulFields.length - 2;

    return (
      <Stack gap={2}>
        {visibleFields.map(field => {
          const oldVal = oldValue[field];
          const newVal = newValue[field];
          const label = getFieldLabel(field);
          return renderChangeItem(field, oldVal, newVal, label);
        })}

        {/* Daha fazla değişiklik varsa genişletme butonu */}
        {hiddenCount > 0 && (
          <Group
            gap={4}
            style={{ cursor: 'pointer' }}
            onClick={(e) => {
              e.stopPropagation();
              setExpanded(!expanded);
            }}
          >
            {expanded ? (
              <IconChevronUp size={12} color="var(--mantine-color-blue-6)" />
            ) : (
              <IconChevronDown size={12} color="var(--mantine-color-blue-6)" />
            )}
            <Text size="xs" c="blue" fs="italic">
              {expanded
                ? t('audit.changes.showLess')
                : `+${hiddenCount} ${t('audit.changes.more')}`}
            </Text>
          </Group>
        )}
      </Stack>
    );
  };

  return (
    <Popover
      opened={opened}
      onChange={setOpened}
      position="bottom-end"
      withArrow
      shadow="md"
      width={320}
      clickOutsideEvents={['mousedown', 'touchstart']}
    >
      <Popover.Target>
        <Tooltip label={t('audit.title')} withArrow>
          <ActionIcon
            variant="subtle"
            color="gray"
            onClick={(e) => {
              e.stopPropagation();
              handleToggle();
            }}
          >
            <IconHistory size={18} />
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
              {loading ? <Loader size={12} /> : <IconHistory size={12} />}
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
            <ScrollArea.Autosize mah={280}>
              <Stack gap={8}>
                {logs.map((log, index) => (
                  <Box key={log.id}>
                    {index > 0 && <Divider my={6} />}
                    <Stack gap={4}>
                      {/* Üst satır: Badge + Tarih + Kullanıcı */}
                      <Group gap="xs" justify="space-between" wrap="nowrap">
                        <Badge
                          size="xs"
                          color={ACTION_COLORS[log.action] || 'gray'}
                          variant="light"
                          leftSection={ACTION_ICONS[log.action]}
                        >
                          {t(`audit.actions.${log.action}`) || log.action}
                        </Badge>
                        <Text size="xs" c="dimmed" style={{ whiteSpace: 'nowrap' }}>
                          {formatDate(log.createdAt)}
                        </Text>
                      </Group>

                      {/* Kullanıcı */}
                      <Text size="xs" c="dimmed">
                        {log.user?.name || log.user?.email || t('audit.system')}
                      </Text>

                      {/* Değişiklik detayları */}
                      {log.action === 'update' && <ExpandableChanges log={log} />}
                    </Stack>
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
