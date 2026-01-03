'use client';

import { useState, useMemo } from 'react';
import {
  Container,
  Paper,
  Group,
  Text,
  Badge,
  ActionIcon,
  Modal,
  Stack,
  NumberInput,
  Textarea,
  SimpleGrid,
  Select,
  TextInput,
  Button,
  Tooltip,
  ThemeIcon,
  Menu,
  Divider,
} from '@mantine/core';
import { DatePickerInput } from '@mantine/dates';
import { useDisclosure } from '@mantine/hooks';
import {
  IconCash,
  IconPlus,
  IconTrash,
  IconArrowUp,
  IconArrowDown,
  IconDotsVertical,
  IconWallet,
  IconHome,
  IconReceipt,
  IconFileInvoice,
  IconBuildingBank,
  IconHandClick,
} from '@tabler/icons-react';
import { CentralPageHeader } from '@/components/headers/CentralPageHeader';
import { AlertModal } from '@/components/modals/AlertModal';
import { useParams } from 'next/navigation';
import { useTranslation } from '@/lib/i18n/client';
import {
  useCashTransactions,
  useCreateCashTransaction,
  useDeleteCashTransaction,
  type CashTransactionCreateInput,
} from '@/hooks/useCashTransactions';
import { usePaymentMethods } from '@/hooks/usePaymentMethods';
import { useExportTemplates, useDefaultExportTemplate } from '@/hooks/useExportTemplates';
import { showToast } from '@/modules/notifications/components/ToastNotification';
import { DataTable, DataTableColumn, FilterOption } from '@/components/tables/DataTable';
import dayjs from 'dayjs';

// Design Variants
import { CashFlowDesignV1, CashFlowDesignV2, CashFlowDesignV3 } from './designs';

// Source icons - labels are loaded from translations
const SOURCE_ICONS: Record<string, { icon: typeof IconHome; color: string }> = {
  payment: { icon: IconHome, color: 'green' },
  expense: { icon: IconReceipt, color: 'red' },
  invoice: { icon: IconFileInvoice, color: 'blue' },
  property_expense: { icon: IconBuildingBank, color: 'orange' },
  manual: { icon: IconHandClick, color: 'gray' },
};

// Category values - labels are loaded from translations
const CATEGORY_VALUES = {
  income: ['rent', 'deposit', 'fee', 'maintenance', 'utility', 'invoice', 'sale', 'commission', 'other_income'],
  expense: ['maintenance', 'repair', 'utilities', 'cleaning', 'insurance', 'taxes', 'management', 'heating', 'salary', 'other', 'other_expense'],
};

interface FormData {
  type: 'income' | 'expense';
  category: string;
  amount: number;
  currency: string;
  transactionDate: Date | null;
  paymentMethod: string;
  description: string;
  reference: string;
  notes: string;
}

const initialFormData: FormData = {
  type: 'income',
  category: '',
  amount: 0,
  currency: 'TRY',
  transactionDate: new Date(),
  paymentMethod: '',
  description: '',
  reference: '',
  notes: '',
};

export function CashTransactionsPageClient({ locale }: { locale: string }) {
  const params = useParams();
  const currentLocale = (params?.locale as string) || locale;
  const { t } = useTranslation('modules/accounting');
  
  // Locale mapping for number formatting
  const localeMap: Record<string, string> = {
    tr: 'tr-TR',
    en: 'en-US',
    de: 'de-DE',
    ar: 'ar-SA',
  };
  const numberLocale = localeMap[currentLocale] || 'tr-TR';

  // Helper to format currency based on current locale
  const formatCurrency = (value: number, currency = '₺') => {
    return `${value.toLocaleString(numberLocale)} ${currency}`;
  };

  // Helper to get source label from translations
  const getSourceLabel = (source: string) => t(`cashTransactions.sources.${source}`);

  // Helper to get category label from translations
  const getCategoryTranslation = (category: string) => t(`cashTransactions.categories.${category}`);

  // State
  const [typeFilter, setTypeFilter] = useState<string | null>(null);
  const [sourceFilter, setSourceFilter] = useState<string | null>(null);
  const [opened, { open, close }] = useDisclosure(false);
  const [deleteOpened, { open: openDelete, close: closeDelete }] = useDisclosure(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [formData, setFormData] = useState<FormData>(initialFormData);
  const [selectedTemplateId, setSelectedTemplateId] = useState<string | undefined>(undefined);

  // Queries
  const { data, refetch } = useCashTransactions({
    page: 1,
    pageSize: 1000,
    type: typeFilter as 'income' | 'expense' | undefined,
    source: sourceFilter as any,
  });

  const { data: paymentMethodsData } = usePaymentMethods();

  // Export templates
  const { data: exportTemplates } = useExportTemplates({ type: 'full' });
  const { data: defaultTemplate } = useDefaultExportTemplate('full');

  // Use default template if no template selected
  const activeTemplateId = selectedTemplateId || defaultTemplate?.id;

  // Template options for selector
  const templateOptions = useMemo(() => {
    if (!exportTemplates) return [];
    return exportTemplates.map((template) => ({
      value: template.id,
      label: template.isDefault ? `${template.name} (${t('cashTransactions.export.default')})` : template.name,
    }));
  }, [exportTemplates, t]);

  // Mutations
  const createMutation = useCreateCashTransaction();
  const deleteMutation = useDeleteCashTransaction();

  // Payment methods options
  const paymentMethodOptions = useMemo(() => {
    if (!paymentMethodsData?.paymentMethods) return [];
    return paymentMethodsData.paymentMethods
      .filter((pm) => pm.isActive)
      .map((pm) => ({
        value: pm.code,
        label: pm.name,
      }));
  }, [paymentMethodsData]);

  // Category options based on type
  const categoryOptions = useMemo(() => {
    const values = CATEGORY_VALUES[formData.type] || [];
    return values.map((value) => ({
      value,
      label: getCategoryTranslation(value),
    }));
  }, [formData.type, getCategoryTranslation]);

  // All categories for display
  const allCategoryOptions = useMemo(() => {
    const allValues = [...CATEGORY_VALUES.income, ...CATEGORY_VALUES.expense];
    return allValues.map((value) => ({
      value,
      label: getCategoryTranslation(value),
    }));
  }, [getCategoryTranslation]);

  // Source filter options
  const sourceOptions = useMemo(() => {
    return Object.entries(SOURCE_ICONS).map(([value]) => ({
      value,
      label: getSourceLabel(value),
    }));
  }, [getSourceLabel]);

  // Handlers
  const handleOpenCreate = () => {
    setFormData(initialFormData);
    open();
  };

  const handleOpenDelete = (id: string) => {
    const actualId = id.replace(/^manual_/, '');
    setDeletingId(actualId);
    openDelete();
  };

  const handleSubmit = async () => {
    if (!formData.category || !formData.amount || !formData.transactionDate || !formData.paymentMethod) {
      showToast({
        type: 'error',
        title: t('common.error'),
        message: t('cashTransactions.validation.required'),
      });
      return;
    }

    try {
      const payload: CashTransactionCreateInput = {
        type: formData.type,
        category: formData.category,
        amount: formData.amount,
        currency: formData.currency,
        transactionDate: formData.transactionDate.toISOString(),
        paymentMethod: formData.paymentMethod,
        description: formData.description || null,
        reference: formData.reference || null,
        notes: formData.notes || null,
        status: 'completed',
      };

      await createMutation.mutateAsync(payload);
      showToast({
        type: 'success',
        title: t('common.success'),
        message: t('cashTransactions.created'),
      });
      close();
      refetch();
    } catch (error) {
      showToast({
        type: 'error',
        title: t('common.error'),
        message: (error as Error).message,
      });
    }
  };

  const handleDelete = async () => {
    if (!deletingId) return;
    try {
      await deleteMutation.mutateAsync(deletingId);
      showToast({
        type: 'success',
        title: t('common.success'),
        message: t('cashTransactions.deleted'),
      });
      closeDelete();
      refetch();
    } catch (error) {
      showToast({
        type: 'error',
        title: t('common.error'),
        message: (error as Error).message,
      });
    }
  };

  // Get category label
  const getCategoryLabel = (category: string) => {
    const found = allCategoryOptions.find((c) => c.value === category);
    return found?.label || category;
  };

  // Get payment method label
  const getPaymentMethodLabel = (code: string | null) => {
    if (!code) return '-';
    const found = paymentMethodsData?.paymentMethods?.find((pm) => pm.code === code);
    if (found?.name) return found.name;
    const translationKey = `payments.methods.${code}`;
    const translated = t(translationKey);
    if (translated !== translationKey) return translated;
    return code;
  };

  // Get source info
  const getSourceInfo = (source: string) => {
    const iconConfig = SOURCE_ICONS[source] || { icon: IconCash, color: 'gray' };
    return { ...iconConfig, label: getSourceLabel(source) };
  };

  // DataTable columns
  const columns: DataTableColumn[] = [
    {
      key: 'transactionDate',
      label: t('cashTransactions.table.date'),
      sortable: true,
      render: (value) => dayjs(value).format('DD.MM.YYYY'),
    },
    {
      key: 'source',
      label: t('cashTransactions.table.source'),
      sortable: true,
      render: (value) => {
        const sourceConfig = getSourceInfo(value);
        const SourceIcon = sourceConfig.icon;
        return (
          <Tooltip label={sourceConfig.label}>
            <Badge
              color={sourceConfig.color}
              variant="light"
              leftSection={<SourceIcon size={12} />}
              size="sm"
            >
              {sourceConfig.label}
            </Badge>
          </Tooltip>
        );
      },
    },
    {
      key: 'type',
      label: t('cashTransactions.table.type'),
      sortable: true,
      render: (value) => (
        <Badge
          color={value === 'income' ? 'green' : 'red'}
          leftSection={value === 'income' ? <IconArrowUp size={12} /> : <IconArrowDown size={12} />}
        >
          {value === 'income' ? t('cashTransactions.income') : t('cashTransactions.expense')}
        </Badge>
      ),
    },
    {
      key: 'category',
      label: t('cashTransactions.table.category'),
      sortable: true,
      render: (value) => getCategoryLabel(value),
    },
    {
      key: 'description',
      label: t('cashTransactions.table.description'),
      sortable: false,
      searchable: true,
      render: (value) => (
        <Text size="sm" lineClamp={1}>
          {value || '-'}
        </Text>
      ),
    },
    {
      key: 'paymentMethod',
      label: t('cashTransactions.table.paymentMethod'),
      sortable: true,
      render: (value) => getPaymentMethodLabel(value),
    },
    {
      key: 'amount',
      label: t('cashTransactions.table.amount'),
      sortable: true,
      render: (value, row) => (
        <Text fw={600} c={row.type === 'income' ? 'green' : 'red'}>
          {row.type === 'income' ? '+' : '-'}
          {Number(value).toLocaleString(numberLocale)} {row.currency}
        </Text>
      ),
    },
    {
      key: 'actions',
      label: t('table.actions'),
      sortable: false,
      searchable: false,
      render: (_, row) => {
        const isManual = row.source === 'manual';
        if (!isManual) {
          return <Text size="xs" c="dimmed" ta="center">-</Text>;
        }
        return (
          <Group justify="center" gap="xs">
            <Menu position="bottom-end" withArrow>
              <Menu.Target>
                <ActionIcon variant="subtle" size="sm" onClick={(e) => e.stopPropagation()}>
                  <IconDotsVertical size={16} />
                </ActionIcon>
              </Menu.Target>
              <Menu.Dropdown>
                <Menu.Item
                  leftSection={<IconTrash size={14} />}
                  color="red"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleOpenDelete(row.id);
                  }}
                >
                  {t('common.delete')}
                </Menu.Item>
              </Menu.Dropdown>
            </Menu>
          </Group>
        );
      },
    },
  ];

  // Filter options
  const filters: FilterOption[] = [
    {
      key: 'type',
      label: t('cashTransactions.filterByType'),
      type: 'select',
      options: [
        { value: 'income', label: t('cashTransactions.income') },
        { value: 'expense', label: t('cashTransactions.expense') },
      ],
    },
    {
      key: 'source',
      label: t('cashTransactions.table.source'),
      type: 'select',
      options: sourceOptions,
    },
    {
      key: 'transactionDate',
      label: t('cashTransactions.table.date'),
      type: 'date',
    },
  ];

  return (
    <Container size="xl" pt="xl">
      <CentralPageHeader
        title={t('cashTransactions.title')}
        description={t('cashTransactions.description')}
        namespace="modules/accounting"
        icon={<IconCash size={32} />}
        breadcrumbs={[
          { label: 'navigation.dashboard', href: `/${currentLocale}/dashboard`, namespace: 'global' },
          { label: 'menu.label', href: `/${currentLocale}/modules/accounting`, namespace: 'modules/accounting' },
          { label: 'cashTransactions.title', namespace: 'modules/accounting' },
        ]}
        actions={[
          {
            label: t('cashTransactions.create'),
            icon: <IconPlus size={18} />,
            onClick: handleOpenCreate,
            variant: 'filled',
          },
        ]}
      />

      {/* Summary Cards */}
      {data?.summary && (
        <SimpleGrid cols={{ base: 1, sm: 3 }} spacing="md" mt="md">
          <Paper p="md" withBorder>
            <Group justify="space-between">
              <div>
                <Text size="xs" c="dimmed" tt="uppercase" fw={700}>
                  {t('cashTransactions.totalIncome')}
                </Text>
                <Text size="xl" fw={700} c="green">
                  {formatCurrency(data.summary.totalIncome)}
                </Text>
              </div>
              <IconArrowUp size={32} color="var(--mantine-color-green-6)" />
            </Group>
          </Paper>
          <Paper p="md" withBorder>
            <Group justify="space-between">
              <div>
                <Text size="xs" c="dimmed" tt="uppercase" fw={700}>
                  {t('cashTransactions.totalExpense')}
                </Text>
                <Text size="xl" fw={700} c="red">
                  {formatCurrency(data.summary.totalExpense)}
                </Text>
              </div>
              <IconArrowDown size={32} color="var(--mantine-color-red-6)" />
            </Group>
          </Paper>
          <Paper p="md" withBorder>
            <Group justify="space-between">
              <div>
                <Text size="xs" c="dimmed" tt="uppercase" fw={700}>
                  {t('cashTransactions.balance')}
                </Text>
                <Text size="xl" fw={700} c={data.summary.balance >= 0 ? 'green' : 'red'}>
                  {formatCurrency(data.summary.balance)}
                </Text>
              </div>
              <IconWallet size={32} color="var(--mantine-color-blue-6)" />
            </Group>
          </Paper>
        </SimpleGrid>
      )}

      {/* Source Summary */}
      {data?.summary?.bySource && Object.keys(data.summary.bySource).length > 0 && (
        <Paper p="md" withBorder mt="md">
          <Text size="sm" fw={600} mb="sm">{t('cashTransactions.sourceSummary')}</Text>
          <Group gap="lg">
            {Object.entries(data.summary.bySource).map(([source, info]) => {
              const sourceConfig = getSourceInfo(source);
              const SourceIcon = sourceConfig.icon;
              return (
                <Group key={source} gap="xs">
                  <ThemeIcon size="sm" variant="light" color={sourceConfig.color}>
                    <SourceIcon size={14} />
                  </ThemeIcon>
                  <Text size="sm">
                    {sourceConfig.label}: <Text component="span" fw={600} c="green">{formatCurrency(info.income)}</Text>
                    {info.expense > 0 && (
                      <Text component="span" c="red"> / -{formatCurrency(info.expense)}</Text>
                    )}
                    <Text component="span" c="dimmed"> ({info.count} {t('cashTransactions.transaction')})</Text>
                  </Text>
                </Group>
              );
            })}
          </Group>
        </Paper>
      )}

      {/* Export Template Selector */}
      {templateOptions.length > 0 && (
        <Paper p="sm" withBorder mt="md">
          <Group justify="space-between" align="center">
            <Text size="sm" c="dimmed">{t('cashTransactions.export.template')}:</Text>
            <Select
              size="xs"
              placeholder={t('cashTransactions.export.selectTemplate')}
              data={templateOptions}
              value={selectedTemplateId || defaultTemplate?.id || null}
              onChange={(value) => setSelectedTemplateId(value || undefined)}
              clearable
              style={{ minWidth: 200 }}
            />
          </Group>
        </Paper>
      )}

      {/* Data Table */}
      <Paper mt="md">
        <DataTable
          columns={columns}
          data={data?.transactions || []}
          searchable
          sortable
          pageable
          defaultPageSize={25}
          filters={filters}
          onFilter={(activeFilters) => {
            setTypeFilter(activeFilters.type as string | null);
            setSourceFilter(activeFilters.source as string | null);
          }}
          showColumnSettings
          showExportIcons
          exportTemplateId={activeTemplateId}
          exportTitle={t('cashTransactions.title')}
          exportNamespace="modules/accounting"
          tableId="accounting-cash-transactions"
          emptyMessage={t('cashTransactions.noData')}
          showAuditHistory={true}
          auditEntityName="CashTransaction"
          auditIdKey="id"
        />
      </Paper>

      {/* Create Modal (only for manual entries) */}
      <Modal
        opened={opened}
        onClose={close}
        title={t('cashTransactions.create')}
        size="lg"
      >
        <Stack>
          <Text size="sm" c="dimmed">
            {t('cashTransactions.manualEntryDescription')}
          </Text>
          <Select
            label={t('cashTransactions.form.type')}
            data={[
              { value: 'income', label: t('cashTransactions.income') },
              { value: 'expense', label: t('cashTransactions.expense') },
            ]}
            value={formData.type}
            onChange={(value) => {
              setFormData({
                ...formData,
                type: value as 'income' | 'expense',
                category: '',
              });
            }}
            required
          />
          <Select
            label={t('cashTransactions.form.category')}
            data={categoryOptions}
            value={formData.category}
            onChange={(value) => setFormData({ ...formData, category: value || '' })}
            required
          />
          <NumberInput
            label={t('cashTransactions.form.amount')}
            value={formData.amount}
            onChange={(value) => setFormData({ ...formData, amount: Number(value) || 0 })}
            min={0}
            decimalScale={2}
            thousandSeparator=","
            suffix=" ₺"
            required
          />
          <DatePickerInput
            label={t('cashTransactions.form.date')}
            value={formData.transactionDate}
            onChange={(value) => setFormData({ ...formData, transactionDate: value as Date | null })}
            required
          />
          <Select
            label={t('cashTransactions.form.paymentMethod')}
            data={paymentMethodOptions}
            value={formData.paymentMethod}
            onChange={(value) => setFormData({ ...formData, paymentMethod: value || '' })}
            required
          />
          <TextInput
            label={t('cashTransactions.form.reference')}
            value={formData.reference}
            onChange={(e) => setFormData({ ...formData, reference: e.currentTarget.value })}
            placeholder={t('cashTransactions.form.referencePlaceholder')}
          />
          <Textarea
            label={t('cashTransactions.form.description')}
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.currentTarget.value })}
            rows={2}
          />
          <Textarea
            label={t('cashTransactions.form.notes')}
            value={formData.notes}
            onChange={(e) => setFormData({ ...formData, notes: e.currentTarget.value })}
            rows={2}
          />
          <Group justify="flex-end" mt="md">
            <Button variant="outline" onClick={close}>
              {t('common.cancel')}
            </Button>
            <Button
              onClick={handleSubmit}
              loading={createMutation.isPending}
            >
              {t('common.create')}
            </Button>
          </Group>
        </Stack>
      </Modal>

      {/* Delete Confirmation Modal */}
      <AlertModal
        opened={deleteOpened}
        onClose={closeDelete}
        title={t('cashTransactions.delete.title')}
        message={t('cashTransactions.delete.confirm')}
        confirmLabel={t('common.delete')}
        cancelLabel={t('common.cancel')}
        onConfirm={handleDelete}
        variant="danger"
      />

      {/* Design Variants Section */}
      <Divider my="xl" label={t('cashTransactions.designVariants')} labelPosition="center" />

      {/* V1 - Card-Centric Cash Flow Display */}
      <Paper withBorder p="md" mt="xl" radius="md">
        <CashFlowDesignV1
          transactions={data?.transactions || []}
          summary={data?.summary || null}
          exportTemplates={exportTemplates || []}
          selectedTemplateId={selectedTemplateId}
          onTemplateChange={setSelectedTemplateId}
        />
      </Paper>

      {/* V2 - Dynamic Cash Flow Breakdown */}
      <Paper withBorder p="md" mt="xl" radius="md">
        <CashFlowDesignV2
          transactions={data?.transactions || []}
          summary={data?.summary || null}
          exportTemplates={exportTemplates || []}
          selectedTemplateId={selectedTemplateId}
          onTemplateChange={setSelectedTemplateId}
        />
      </Paper>

      {/* V3 - Two-Column Cash Flow Overview */}
      <Paper withBorder p="md" mt="xl" radius="md">
        <CashFlowDesignV3
          transactions={data?.transactions || []}
          summary={data?.summary || null}
          exportTemplates={exportTemplates || []}
          selectedTemplateId={selectedTemplateId}
          onTemplateChange={setSelectedTemplateId}
        />
      </Paper>
    </Container>
  );
}
