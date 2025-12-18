'use client';

import { useState } from 'react';
import {
  Paper,
  Table,
  Badge,
  ActionIcon,
  Group,
  Text,
  Button,
  Modal,
  Loader,
  Stack,
  Select,
} from '@mantine/core';
import {
  IconEdit,
  IconTrash,
  IconPlus,
} from '@tabler/icons-react';
import { useProductionSteps, useDeleteProductionStep } from '@/hooks/useProductionSteps';
import { useTranslation } from '@/lib/i18n/client';
import { showToast } from '@/modules/notifications/components/ToastNotification';
import { useConfirmDialog } from '@/hooks/useConfirmDialog';
import { ProductionStepForm } from './ProductionStepForm';
import type { ProductionStep, ProductionStepStatus } from '@/modules/production/types/product';

interface ProductionStepListProps {
  locale: string;
  orderId: string;
  onStepChange?: () => void;
}

export function ProductionStepList({ locale, orderId, onStepChange }: ProductionStepListProps) {
  const { t } = useTranslation('modules/production');
  const { t: tGlobal } = useTranslation('global');
  const [statusFilter, setStatusFilter] = useState<string | undefined>();
  const { data, isLoading } = useProductionSteps(orderId, statusFilter);
  const deleteStep = useDeleteProductionStep();
  const { confirm, ConfirmDialog } = useConfirmDialog();
  const [editingStep, setEditingStep] = useState<ProductionStep | null>(null);
  const [createModalOpened, setCreateModalOpened] = useState(false);

  const handleDelete = async (id: string) => {
    const confirmed = await confirm({
      title: t('steps.delete.title'),
      message: t('steps.delete.confirm'),
      confirmLabel: tGlobal('common.delete'),
      confirmColor: 'red',
    });

    if (confirmed) {
      try {
        await deleteStep.mutateAsync(id);
        showToast({
          type: 'success',
          title: t('messages.success'),
          message: t('steps.delete.success'),
        });
        onStepChange?.();
      } catch (error) {
        showToast({
          type: 'error',
          title: t('messages.error'),
          message: t('steps.delete.error'),
        });
      }
    }
  };

  const getStatusBadge = (status: ProductionStepStatus) => {
    const colors: Record<ProductionStepStatus, string> = {
      pending: 'gray',
      in_progress: 'blue',
      completed: 'green',
      cancelled: 'red',
    };
    return (
      <Badge color={colors[status]} variant="light">
        {t(`steps.status.${status}`) || status}
      </Badge>
    );
  };

  if (isLoading) {
    return (
      <Paper p="md">
        <Loader size="sm" />
      </Paper>
    );
  }

  const steps = data?.steps || [];

  return (
    <Stack gap="md">
      <Group justify="space-between">
        <Text size="lg" fw={600}>
          {t('steps.title')}
        </Text>
        <Group>
          <Select
            placeholder={t('steps.filter.status')}
            data={[
              { value: '', label: t('steps.filter.all') },
              { value: 'pending', label: t('steps.status.pending') },
              { value: 'in_progress', label: t('steps.status.in_progress') },
              { value: 'completed', label: t('steps.status.completed') },
              { value: 'cancelled', label: t('steps.status.cancelled') },
            ]}
            value={statusFilter || ''}
            onChange={(value) => setStatusFilter(value || undefined)}
            clearable
            w={200}
          />
          <Button
            leftSection={<IconPlus size={16} />}
            onClick={() => setCreateModalOpened(true)}
            size="sm"
          >
            {t('steps.add')}
          </Button>
        </Group>
      </Group>

      {steps.length === 0 ? (
        <Paper p="md" withBorder>
          <Text c="dimmed" ta="center">
            {t('steps.empty')}
          </Text>
        </Paper>
      ) : (
        <Table>
          <Table.Thead>
            <Table.Tr>
              <Table.Th>{t('steps.stepNumber')}</Table.Th>
              <Table.Th>{t('steps.name')}</Table.Th>
              <Table.Th>{t('steps.status')}</Table.Th>
              <Table.Th>{t('steps.plannedStart')}</Table.Th>
              <Table.Th>{t('steps.plannedEnd')}</Table.Th>
              <Table.Th>{t('steps.assignedTo')}</Table.Th>
              <Table.Th>{t('steps.laborHours')}</Table.Th>
              <Table.Th>{tGlobal('common.actions')}</Table.Th>
            </Table.Tr>
          </Table.Thead>
          <Table.Tbody>
            {steps.map((step) => (
              <Table.Tr key={step.id}>
                <Table.Td>{step.stepNumber}</Table.Td>
                <Table.Td>
                  <Text size="sm" fw={500}>{step.name}</Text>
                  {step.description && (
                    <Text size="xs" c="dimmed">
                      {step.description}
                    </Text>
                  )}
                </Table.Td>
                <Table.Td>{getStatusBadge(step.status)}</Table.Td>
                <Table.Td>
                  {step.plannedStart ? new Date(step.plannedStart).toLocaleDateString() : '-'}
                </Table.Td>
                <Table.Td>
                  {step.plannedEnd ? new Date(step.plannedEnd).toLocaleDateString() : '-'}
                </Table.Td>
                <Table.Td>
                  {step.assignedTo ? (
                    <Text size="sm">{step.assignedTo}</Text>
                  ) : (
                    <Text size="sm" c="dimmed">-</Text>
                  )}
                </Table.Td>
                <Table.Td>
                  {step.laborHours ? `${step.laborHours}h` : '-'}
                </Table.Td>
                <Table.Td>
                  <Group gap="xs">
                    <ActionIcon
                      variant="subtle"
                      color="blue"
                      onClick={() => setEditingStep(step)}
                    >
                      <IconEdit size={16} />
                    </ActionIcon>
                    <ActionIcon
                      variant="subtle"
                      color="red"
                      onClick={() => handleDelete(step.id)}
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
        title={t('steps.add')}
        size="lg"
      >
        <ProductionStepForm
          locale={locale}
          orderId={orderId}
          onSuccess={() => {
            setCreateModalOpened(false);
            onStepChange?.();
          }}
          onCancel={() => setCreateModalOpened(false)}
        />
      </Modal>

      {/* Edit Modal */}
      {editingStep && (
        <Modal
          opened={!!editingStep}
          onClose={() => setEditingStep(null)}
          title={t('steps.edit')}
          size="lg"
        >
          <ProductionStepForm
            locale={locale}
            orderId={orderId}
            stepId={editingStep.id}
            onSuccess={() => {
              setEditingStep(null);
              onStepChange?.();
            }}
            onCancel={() => setEditingStep(null)}
          />
        </Modal>
      )}
      <ConfirmDialog />
    </Stack>
  );
}








