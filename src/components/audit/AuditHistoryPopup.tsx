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

// Alan adlarını kullanıcı dostu metinlere çevir
const FIELD_LABELS: Record<string, string> = {
  images: 'Resimler',
  documents: 'Belgeler',
  isActive: 'Aktif',
  status: 'Durum',
  unitNumber: 'Birim No',
  floor: 'Kat',
  area: 'Alan',
  roomCount: 'Oda Sayısı',
  bathroomCount: 'Banyo',
  balcony: 'Balkon',
  rentPrice: 'Kira',
  salePrice: 'Satış Fiyatı',
  description: 'Açıklama',
  coldRent: 'Soğuk Kira',
  additionalCosts: 'Ek Masraflar',
  heatingCosts: 'Isıtma',
  deposit: 'Depozito',
  livingRoom: 'Oturma Odası',
  block: 'Blok',
  ownerType: 'Malik Tipi',
  ownershipType: 'Mülkiyet Tipi',
  ownerId: 'Malik',
  metadata: 'Meta Veri',
  inventory: 'Envanter',
  keys: 'Anahtarlar',
  qrCode: 'QR Kod',
  deliveryDate: 'Teslim Tarihi',
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

  // Otomatik güncellenen ve gösterilmemesi gereken alanlar
  const IGNORED_FIELDS = [
    'updatedAt', 'createdAt', 'id', 'tenantId', 'companyId',
    'property', 'contracts', 'payments', 'appointments', 'maintenance',
    '_count', 'user', 'company', 'tenant', 'propertyId'
  ];

  // Değişiklik özetini kullanıcı dostu formatta oluştur
  const getChangeDescription = (log: AuditLog): React.ReactNode => {
    if (!log.metadata) return null;

    const { oldValue, newValue, changedFields } = log.metadata;

    if (!changedFields || changedFields.length === 0 || !oldValue || !newValue) {
      return null;
    }

    // Anlamlı değişiklikleri filtrele
    const meaningfulFields = changedFields.filter(field => !IGNORED_FIELDS.includes(field));

    if (meaningfulFields.length === 0) return null;

    // Değişiklik açıklamalarını oluştur
    const descriptions: React.ReactNode[] = [];

    for (const field of meaningfulFields.slice(0, 2)) {
      const oldVal = oldValue[field];
      const newVal = newValue[field];
      const label = FIELD_LABELS[field] || field;

      // Array değişiklikleri (resimler, belgeler)
      if (Array.isArray(oldVal) && Array.isArray(newVal)) {
        const added = newVal.length - oldVal.length;
        if (added > 0) {
          descriptions.push(
            <Group key={field} gap={4} wrap="nowrap">
              {field === 'images' ? <IconPhoto size={10} /> : <IconFile size={10} />}
              <Text size="xs" c="dimmed">{added} {label.toLowerCase()} eklendi</Text>
            </Group>
          );
        } else if (added < 0) {
          descriptions.push(
            <Group key={field} gap={4} wrap="nowrap">
              {field === 'images' ? <IconPhoto size={10} /> : <IconFile size={10} />}
              <Text size="xs" c="dimmed">{Math.abs(added)} {label.toLowerCase()} silindi</Text>
            </Group>
          );
        }
        continue;
      }

      // Boolean değişiklikleri
      if (typeof newVal === 'boolean') {
        descriptions.push(
          <Text key={field} size="xs" c="dimmed">
            {label}: {newVal ? 'Aktif' : 'Pasif'}
          </Text>
        );
        continue;
      }

      // Sayı değişiklikleri
      if (typeof newVal === 'number') {
        const formattedOld = oldVal != null ? Number(oldVal).toLocaleString('tr-TR') : '-';
        const formattedNew = newVal.toLocaleString('tr-TR');
        descriptions.push(
          <Text key={field} size="xs" c="dimmed">
            {label}: {formattedOld} → {formattedNew}
          </Text>
        );
        continue;
      }

      // String değişiklikleri
      if (typeof newVal === 'string') {
        const shortOld = oldVal ? (String(oldVal).length > 15 ? String(oldVal).substring(0, 15) + '...' : String(oldVal)) : '-';
        const shortNew = newVal.length > 15 ? newVal.substring(0, 15) + '...' : newVal;
        descriptions.push(
          <Text key={field} size="xs" c="dimmed">
            {label}: {shortOld} → {shortNew}
          </Text>
        );
        continue;
      }

      // Diğer (null, undefined, object)
      if (newVal === null && oldVal !== null) {
        descriptions.push(
          <Text key={field} size="xs" c="dimmed">
            {label} temizlendi
          </Text>
        );
      } else if (newVal !== null && oldVal === null) {
        descriptions.push(
          <Text key={field} size="xs" c="dimmed">
            {label} eklendi
          </Text>
        );
      }
    }

    // Daha fazla değişiklik varsa
    if (meaningfulFields.length > 2) {
      descriptions.push(
        <Text key="more" size="xs" c="dimmed" fs="italic">
          +{meaningfulFields.length - 2} değişiklik daha
        </Text>
      );
    }

    return descriptions.length > 0 ? (
      <Stack gap={2}>{descriptions}</Stack>
    ) : null;
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
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              handleToggle();
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
                      {log.action === 'update' && getChangeDescription(log)}
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
