'use client';

import { useState } from 'react';
import {
  Paper,
  Table,
  ActionIcon,
  Group,
  Text,
  Button,
  Modal,
  Loader,
  Stack,
} from '@mantine/core';
import {
  IconEdit,
  IconTrash,
  IconPlus,
} from '@tabler/icons-react';
import { useBOMItems, useDeleteBOMItem } from '@/hooks/useBOM';
import { useTranslation } from '@/lib/i18n/client';
import { showToast } from '@/modules/notifications/components/ToastNotification';
import { useConfirmDialog } from '@/hooks/useConfirmDialog';
import { BOMEditor } from './BOMEditor';
import type { BOMItem } from '@/modules/production/types/product';

interface BOMViewerProps {
  locale: string;
  bomId?: string;
  productId?: string;
  onItemChange?: () => void;
}

export function BOMViewer({ locale, bomId, productId, onItemChange }: BOMViewerProps) {
  const { t } = useTranslation('modules/production');
  const { t: tGlobal } = useTranslation('global');
  const { data, isLoading } = useBOMItems(bomId, productId);
  const deleteBOMItem = useDeleteBOMItem();
  const { confirm, ConfirmDialog } = useConfirmDialog();
  const [editingItem, setEditingItem] = useState<BOMItem | null>(null);
  const [createModalOpened, setCreateModalOpened] = useState(false);

  const handleDelete = async (id: string) => {
    const confirmed = await confirm({
      title: t('bom.delete.title'),
      message: t('bom.delete.confirm'),
      confirmLabel: tGlobal('common.delete'),
      confirmColor: 'red',
    });

    if (confirmed) {
      try {
        await deleteBOMItem.mutateAsync(id);
        showToast({
          type: 'success',
          title: t('messages.success'),
          message: t('bom.delete.success'),
        });
        onItemChange?.();
      } catch (error) {
        showToast({
          type: 'error',
          title: t('messages.error'),
          message: t('bom.delete.error'),
        });
      }
    }
  };

  if (isLoading) {
    return (
      <Paper p="md">
        <Loader size="sm" />
      </Paper>
    );
  }

  const bomItems = data?.bomItems || [];

  return (
    <Stack gap="md">
      <Group justify="space-between">
        <Text size="lg" fw={600}>
          {t('bom.title')}
        </Text>
        <Button
          leftSection={<IconPlus size={16} />}
          onClick={() => setCreateModalOpened(true)}
          size="sm"
        >
          {t('bom.add')}
        </Button>
      </Group>

      {bomItems.length === 0 ? (
        <Paper p="md" withBorder>
          <Text c="dimmed" ta="center">
            {t('bom.empty')}
          </Text>
        </Paper>
      ) : (
        <Table>
          <Table.Thead>
            <Table.Tr>
              <Table.Th>{t('bom.order')}</Table.Th>
              <Table.Th>{t('bom.product')}</Table.Th>
              <Table.Th>{t('bom.component')}</Table.Th>
              <Table.Th>{t('bom.quantity')}</Table.Th>
              <Table.Th>{t('bom.unit')}</Table.Th>
              <Table.Th>{t('bom.wasteRate')}</Table.Th>
              <Table.Th>{tGlobal('common.actions')}</Table.Th>
            </Table.Tr>
          </Table.Thead>
          <Table.Tbody>
            {bomItems.map((item) => (
              <Table.Tr key={item.id}>
                <Table.Td>{item.order}</Table.Td>
                <Table.Td>
                  <Text size="sm">{item.product?.name || '-'}</Text>
                  {item.product?.code && (
                    <Text size="xs" c="dimmed">
                      {item.product.code}
                    </Text>
                  )}
                </Table.Td>
                <Table.Td>
                  {item.component ? (
                    <>
                      <Text size="sm">{item.component.name}</Text>
                      {item.component.code && (
                        <Text size="xs" c="dimmed">
                          {item.component.code}
                        </Text>
                      )}
                    </>
                  ) : (
                    <Text size="sm" c="dimmed">
                      -
                    </Text>
                  )}
                </Table.Td>
                <Table.Td>{item.quantity}</Table.Td>
                <Table.Td>{item.unit}</Table.Td>
                <Table.Td>{item.wasteRate}%</Table.Td>
                <Table.Td>
                  <Group gap="xs">
                    <ActionIcon
                      variant="subtle"
                      color="blue"
                      onClick={() => setEditingItem(item)}
                    >
                      <IconEdit size={16} />
                    </ActionIcon>
                    <ActionIcon
                      variant="subtle"
                      color="red"
                      onClick={() => handleDelete(item.id)}
                    >
                      <IconTrash size={16} />
                    </ActionIcon>
                  </Group>
                </Table.Td>
              </Table.Tr>
            ))}
          </Table.Tbody>
        </Table>
      )}

      {/* Create Modal */}
      <Modal
        opened={createModalOpened}
        onClose={() => setCreateModalOpened(false)}
        title={t('bom.add')}
        size="lg"
      >
        <BOMEditor
          locale={locale}
          bomId={productId || bomId || ''}
          {...(productId ? { productId } : {})}
          onSuccess={() => {
            setCreateModalOpened(false);
            onItemChange?.();
          }}
          onCancel={() => setCreateModalOpened(false)}
        />
      </Modal>

      {/* Edit Modal */}
      {editingItem && (
        <Modal
          opened={!!editingItem}
          onClose={() => setEditingItem(null)}
          title={t('bom.edit')}
          size="lg"
        >
          <BOMEditor
            locale={locale}
            bomId={productId || bomId || editingItem.bomId}
            {...(productId ? { productId } : {})}
            itemId={editingItem.id}
            onSuccess={() => {
              setEditingItem(null);
              onItemChange?.();
            }}
            onCancel={() => setEditingItem(null)}
          />
        </Modal>
      )}
      <ConfirmDialog />
    </Stack>
  );
}


