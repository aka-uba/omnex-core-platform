'use client';

import { useState } from 'react';
import {
  Paper,
  Table,
  Text,
  Group,
  Badge,
  Button,
  Stack,
  Select,
  Grid,
  Card,
  Title,
  Divider,
  Modal,
  NumberFormatter,
  Alert,
  Skeleton,
  ActionIcon,
  Menu,
} from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import {
  IconCalculator,
  IconCheck,
  IconCash,
  IconAlertCircle,
  IconPlus,
  IconDotsVertical,
  IconEye,
  IconTrash,
  IconFileExport,
} from '@tabler/icons-react';
import {
  useReconciliations,
  useReconciliation,
  useCreateReconciliation,
  useFinalizeReconciliation,
  useDeleteReconciliation,
} from '@/hooks/useReconciliation';
import { useProperties } from '@/hooks/useProperties';
import { useTranslation } from '@/lib/i18n/client';
import { showToast } from '@/modules/notifications/components/ToastNotification';
import type { SideCostReconciliation as ReconciliationType, ReconciliationApartmentDetail, DistributionMethod } from '@/modules/real-estate/types/property-expense';
import dayjs from 'dayjs';

interface SideCostReconciliationProps {
  locale: string;
}

const STATUS_COLORS: Record<string, string> = {
  draft: 'gray',
  calculated: 'blue',
  finalized: 'green',
  cancelled: 'red',
};

export function SideCostReconciliation({ locale }: SideCostReconciliationProps) {
  const { t } = useTranslation('modules/real-estate');
  const { t: tGlobal } = useTranslation('global');
  const [yearFilter, setYearFilter] = useState<string | null>(String(new Date().getFullYear()));
  const [propertyFilter, setPropertyFilter] = useState<string | null>(null);
  const [createModalOpened, { open: openCreateModal, close: closeCreateModal }] = useDisclosure(false);
  const [detailModalOpened, { open: openDetailModal, close: closeDetailModal }] = useDisclosure(false);
  const [selectedReconciliationId, setSelectedReconciliationId] = useState<string | null>(null);

  // Form state for create
  const [createPropertyId, setCreatePropertyId] = useState<string | null>(null);
  const [createYear, setCreateYear] = useState<string>(String(new Date().getFullYear()));
  const [createDistributionMethod, setCreateDistributionMethod] = useState<DistributionMethod>('equal');

  const { data: propertiesData } = useProperties({ pageSize: 100 });
  const { data: reconciliationsData, isLoading, refetch } = useReconciliations({
    year: yearFilter ? parseInt(yearFilter) : undefined,
    propertyId: propertyFilter || undefined,
    pageSize: 100,
  });

  const { data: selectedReconciliation, isLoading: isLoadingDetail } = useReconciliation(selectedReconciliationId || undefined);
  const createReconciliation = useCreateReconciliation();
  const finalizeReconciliation = useFinalizeReconciliation();
  const deleteReconciliation = useDeleteReconciliation();

  const reconciliations = reconciliationsData?.reconciliations || [];
  const properties = propertiesData?.properties || [];

  const propertyOptions = properties.map(p => ({
    value: p.id,
    label: p.name,
  }));

  const yearOptions = Array.from({ length: 5 }, (_, i) => {
    const year = new Date().getFullYear() - i;
    return { value: String(year), label: String(year) };
  });

  const distributionMethodOptions = [
    { value: 'equal', label: t('reconciliation.distributionMethods.equal') },
    { value: 'area_based', label: t('reconciliation.distributionMethods.area_based') },
  ];

  const handleCreate = async () => {
    if (!createPropertyId) {
      showToast.error(t('reconciliation.selectProperty'));
      return;
    }

    try {
      await createReconciliation.mutateAsync({
        propertyId: createPropertyId,
        year: parseInt(createYear),
        distributionMethod: createDistributionMethod,
      });
      showToast.success(t('reconciliation.createSuccess'));
      closeCreateModal();
      refetch();
    } catch (error: any) {
      showToast.error(error.message || t('reconciliation.createError'));
    }
  };

  const handleFinalize = async (id: string) => {
    if (confirm(t('reconciliation.finalizeConfirm'))) {
      try {
        await finalizeReconciliation.mutateAsync(id);
        showToast.success(t('reconciliation.finalizeSuccess'));
        refetch();
      } catch {
        showToast.error(t('reconciliation.finalizeError'));
      }
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm(t('reconciliation.deleteConfirm'))) {
      try {
        await deleteReconciliation.mutateAsync(id);
        showToast.success(t('reconciliation.deleteSuccess'));
        refetch();
      } catch {
        showToast.error(t('reconciliation.deleteError'));
      }
    }
  };

  const handleViewDetail = (id: string) => {
    setSelectedReconciliationId(id);
    openDetailModal();
  };

  return (
    <Stack gap="md">
      {/* Info Alert */}
      <Alert icon={<IconAlertCircle size={16} />} color="blue" variant="light">
        {t('reconciliation.infoText')}
      </Alert>

      {/* Filters */}
      <Paper shadow="xs" p="md">
        <Grid align="flex-end">
          <Grid.Col span={{ base: 6, md: 3 }}>
            <Select
              label={t('reconciliation.year')}
              data={yearOptions}
              value={yearFilter}
              onChange={setYearFilter}
              clearable
            />
          </Grid.Col>
          <Grid.Col span={{ base: 6, md: 4 }}>
            <Select
              label={t('properties.title')}
              data={propertyOptions}
              value={propertyFilter}
              onChange={setPropertyFilter}
              clearable
              searchable
            />
          </Grid.Col>
          <Grid.Col span={{ base: 12, md: 5 }}>
            <Group justify="flex-end">
              <Button leftSection={<IconPlus size={16} />} onClick={openCreateModal}>
                {t('reconciliation.createNew')}
              </Button>
            </Group>
          </Grid.Col>
        </Grid>
      </Paper>

      {/* Reconciliations List */}
      <Paper shadow="xs" p="md">
        {isLoading ? (
          <Stack gap="md">
            {[1, 2, 3, 4, 5].map((i) => (
              <Group key={i} gap="md">
                <Skeleton height={20} width="20%" radius="sm" />
                <Skeleton height={20} width="10%" radius="sm" />
                <Skeleton height={20} width="15%" radius="sm" />
                <Skeleton height={20} width="15%" radius="sm" />
                <Skeleton height={20} width="15%" radius="sm" />
                <Skeleton height={20} width="10%" radius="sm" />
                <Skeleton height={20} width="5%" radius="sm" />
              </Group>
            ))}
          </Stack>
        ) : reconciliations.length === 0 ? (
          <Text ta="center" py="xl" c="dimmed">{t('reconciliation.noReconciliations')}</Text>
        ) : (
          <Table striped highlightOnHover>
            <Table.Thead>
              <Table.Tr>
                <Table.Th>{t('properties.title')}</Table.Th>
                <Table.Th>{t('reconciliation.year')}</Table.Th>
                <Table.Th>{t('reconciliation.distributionMethod')}</Table.Th>
                <Table.Th ta="right">{t('reconciliation.totalExpenses')}</Table.Th>
                <Table.Th ta="right">{t('reconciliation.perApartmentShare')}</Table.Th>
                <Table.Th>{t('reconciliation.status')}</Table.Th>
                <Table.Th w={60}></Table.Th>
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {reconciliations.map((rec) => (
                <Table.Tr key={rec.id}>
                  <Table.Td>
                    <Text size="sm" fw={500}>{rec.property?.name || '-'}</Text>
                  </Table.Td>
                  <Table.Td>
                    <Badge variant="outline">{rec.year}</Badge>
                  </Table.Td>
                  <Table.Td>
                    <Text size="sm">
                      {t(`reconciliation.distributionMethods.${rec.distributionMethod}`)}
                    </Text>
                  </Table.Td>
                  <Table.Td ta="right">
                    <NumberFormatter
                      value={rec.totalExpenses}
                      thousandSeparator=","
                      decimalScale={2}
                      suffix=" ₺"
                    />
                  </Table.Td>
                  <Table.Td ta="right">
                    <NumberFormatter
                      value={rec.perApartmentShare}
                      thousandSeparator=","
                      decimalScale={2}
                      suffix=" ₺"
                    />
                  </Table.Td>
                  <Table.Td>
                    <Badge color={STATUS_COLORS[rec.status] || 'gray'}>
                      {t(`reconciliation.statuses.${rec.status}`)}
                    </Badge>
                  </Table.Td>
                  <Table.Td>
                    <Menu position="bottom-end" withinPortal>
                      <Menu.Target>
                        <ActionIcon variant="subtle" color="gray">
                          <IconDotsVertical size={16} />
                        </ActionIcon>
                      </Menu.Target>
                      <Menu.Dropdown>
                        <Menu.Item
                          leftSection={<IconEye size={14} />}
                          onClick={() => handleViewDetail(rec.id)}
                        >
                          {t('reconciliation.viewDetails')}
                        </Menu.Item>
                        {rec.status === 'calculated' && (
                          <Menu.Item
                            leftSection={<IconCheck size={14} />}
                            color="green"
                            onClick={() => handleFinalize(rec.id)}
                          >
                            {t('reconciliation.finalize')}
                          </Menu.Item>
                        )}
                        {rec.status !== 'finalized' && (
                          <Menu.Item
                            leftSection={<IconTrash size={14} />}
                            color="red"
                            onClick={() => handleDelete(rec.id)}
                          >
                            {tGlobal('buttons.delete')}
                          </Menu.Item>
                        )}
                      </Menu.Dropdown>
                    </Menu>
                  </Table.Td>
                </Table.Tr>
              ))}
            </Table.Tbody>
          </Table>
        )}
      </Paper>

      {/* Create Modal */}
      <Modal
        opened={createModalOpened}
        onClose={closeCreateModal}
        title={t('reconciliation.createNew')}
        size="md"
      >
        <Stack gap="md">
          <Select
            label={t('properties.title')}
            placeholder={t('reconciliation.selectPropertyPlaceholder')}
            data={propertyOptions}
            value={createPropertyId}
            onChange={setCreatePropertyId}
            searchable
            required
          />
          <Select
            label={t('reconciliation.year')}
            data={yearOptions}
            value={createYear}
            onChange={(v) => setCreateYear(v || String(new Date().getFullYear()))}
            required
          />
          <Select
            label={t('reconciliation.distributionMethod')}
            data={distributionMethodOptions}
            value={createDistributionMethod}
            onChange={(v) => setCreateDistributionMethod(v as DistributionMethod || 'equal')}
            required
          />
          <Group justify="flex-end" mt="md">
            <Button variant="subtle" onClick={closeCreateModal}>
              {tGlobal('buttons.cancel')}
            </Button>
            <Button
              leftSection={<IconCalculator size={16} />}
              onClick={handleCreate}
              loading={createReconciliation.isPending}
            >
              {t('reconciliation.calculate')}
            </Button>
          </Group>
        </Stack>
      </Modal>

      {/* Detail Modal */}
      <Modal
        opened={detailModalOpened}
        onClose={closeDetailModal}
        title={t('reconciliation.details')}
        size="xl"
      >
        {isLoadingDetail ? (
          <Stack gap="md">
            <Card withBorder p="md">
              <Grid>
                <Grid.Col span={6}><Skeleton height={16} width="60%" mb="xs" /><Skeleton height={20} width="80%" /></Grid.Col>
                <Grid.Col span={6}><Skeleton height={16} width="40%" mb="xs" /><Skeleton height={20} width="50%" /></Grid.Col>
                <Grid.Col span={6}><Skeleton height={16} width="50%" mb="xs" /><Skeleton height={20} width="70%" /></Grid.Col>
                <Grid.Col span={6}><Skeleton height={16} width="45%" mb="xs" /><Skeleton height={20} width="40%" /></Grid.Col>
              </Grid>
            </Card>
            <Skeleton height={24} width="40%" />
            {[1, 2, 3].map((i) => (
              <Group key={i} gap="md">
                <Skeleton height={20} width="15%" />
                <Skeleton height={20} width="20%" />
                <Skeleton height={20} width="15%" />
                <Skeleton height={20} width="15%" />
                <Skeleton height={20} width="15%" />
                <Skeleton height={20} width="10%" />
              </Group>
            ))}
          </Stack>
        ) : selectedReconciliation ? (
          <Stack gap="md">
            {/* Summary */}
            <Card withBorder p="md">
              <Grid>
                <Grid.Col span={6}>
                  <Text size="sm" c="dimmed">{t('properties.title')}</Text>
                  <Text fw={500}>{selectedReconciliation.property?.name}</Text>
                </Grid.Col>
                <Grid.Col span={6}>
                  <Text size="sm" c="dimmed">{t('reconciliation.year')}</Text>
                  <Text fw={500}>{selectedReconciliation.year}</Text>
                </Grid.Col>
                <Grid.Col span={6}>
                  <Text size="sm" c="dimmed">{t('reconciliation.totalExpenses')}</Text>
                  <Text fw={500} c="blue">
                    <NumberFormatter
                      value={selectedReconciliation.totalExpenses}
                      thousandSeparator=","
                      decimalScale={2}
                      suffix=" ₺"
                    />
                  </Text>
                </Grid.Col>
                <Grid.Col span={6}>
                  <Text size="sm" c="dimmed">{t('reconciliation.apartmentCount')}</Text>
                  <Text fw={500}>{selectedReconciliation.apartmentCount}</Text>
                </Grid.Col>
              </Grid>
            </Card>

            {/* Apartment Details */}
            <Title order={5}>{t('reconciliation.apartmentBreakdown')}</Title>
            <Table striped highlightOnHover>
              <Table.Thead>
                <Table.Tr>
                  <Table.Th>{t('apartments.unitNumber')}</Table.Th>
                  <Table.Th>{t('reconciliation.tenant')}</Table.Th>
                  <Table.Th ta="right">{t('reconciliation.estimatedPaid')}</Table.Th>
                  <Table.Th ta="right">{t('reconciliation.actualShare')}</Table.Th>
                  <Table.Th ta="right">{t('reconciliation.difference')}</Table.Th>
                  <Table.Th>{t('reconciliation.result')}</Table.Th>
                </Table.Tr>
              </Table.Thead>
              <Table.Tbody>
                {(selectedReconciliation.details as ReconciliationApartmentDetail[]).map((detail) => (
                  <Table.Tr key={detail.apartmentId}>
                    <Table.Td>
                      <Text size="sm" fw={500}>{detail.unitNumber}</Text>
                      <Text size="xs" c="dimmed">{detail.area} m²</Text>
                    </Table.Td>
                    <Table.Td>
                      <Text size="sm">{detail.tenantInfo?.name || '-'}</Text>
                    </Table.Td>
                    <Table.Td ta="right">
                      <Stack gap={2}>
                        <Text size="sm">
                          <NumberFormatter
                            value={detail.totalEstimatedPaid}
                            thousandSeparator=","
                            decimalScale={2}
                            suffix=" ₺"
                          />
                        </Text>
                        <Text size="xs" c="dimmed">
                          {detail.monthsOccupied} {t('reconciliation.months')}
                        </Text>
                      </Stack>
                    </Table.Td>
                    <Table.Td ta="right">
                      <NumberFormatter
                        value={detail.actualShare}
                        thousandSeparator=","
                        decimalScale={2}
                        suffix=" ₺"
                      />
                    </Table.Td>
                    <Table.Td ta="right">
                      <Text
                        size="sm"
                        fw={600}
                        c={detail.status === 'debt' ? 'red' : detail.status === 'credit' ? 'green' : 'gray'}
                      >
                        {detail.status === 'credit' ? '-' : ''}
                        <NumberFormatter
                          value={Math.abs(detail.difference)}
                          thousandSeparator=","
                          decimalScale={2}
                          suffix=" ₺"
                        />
                      </Text>
                    </Table.Td>
                    <Table.Td>
                      <Badge
                        color={detail.status === 'debt' ? 'red' : detail.status === 'credit' ? 'green' : 'gray'}
                        variant="light"
                      >
                        {t(`reconciliation.resultStatuses.${detail.status}`)}
                      </Badge>
                    </Table.Td>
                  </Table.Tr>
                ))}
              </Table.Tbody>
            </Table>

            {selectedReconciliation.notes && (
              <>
                <Divider />
                <div>
                  <Text size="sm" c="dimmed">{t('reconciliation.notes')}</Text>
                  <Text size="sm">{selectedReconciliation.notes}</Text>
                </div>
              </>
            )}
          </Stack>
        ) : null}
      </Modal>
    </Stack>
  );
}
