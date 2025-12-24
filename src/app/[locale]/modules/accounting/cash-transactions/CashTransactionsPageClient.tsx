'use client';

import { useState, useMemo } from 'react';
import {
  Container,
  Paper,
  Group,
  Text,
  Badge,
  ActionIcon,
  Table,
  Pagination,
  Select,
  TextInput,
  Button,
  Modal,
  Stack,
  NumberInput,
  Textarea,
  SimpleGrid,
  Loader,
  Center,
  Menu,
} from '@mantine/core';
import { DatePickerInput } from '@mantine/dates';
import { useDisclosure } from '@mantine/hooks';
import {
  IconCash,
  IconPlus,
  IconSearch,
  IconFilter,
  IconEdit,
  IconTrash,
  IconArrowUp,
  IconArrowDown,
  IconDotsVertical,
  IconWallet,
} from '@tabler/icons-react';
import { CentralPageHeader } from '@/components/headers/CentralPageHeader';
import { useParams } from 'next/navigation';
import { useTranslation } from '@/lib/i18n/client';
import {
  useCashTransactions,
  useCreateCashTransaction,
  useUpdateCashTransaction,
  useDeleteCashTransaction,
  type CashTransaction,
  type CashTransactionCreateInput,
} from '@/hooks/useCashTransactions';
import { usePaymentMethods } from '@/hooks/usePaymentMethods';
import { showToast } from '@/modules/notifications/components/ToastNotification';
import dayjs from 'dayjs';

const CATEGORIES = {
  income: [
    { value: 'rent', label: 'Kira' },
    { value: 'deposit', label: 'Depozito' },
    { value: 'sale', label: 'Satış' },
    { value: 'commission', label: 'Komisyon' },
    { value: 'other_income', label: 'Diğer Gelir' },
  ],
  expense: [
    { value: 'maintenance', label: 'Bakım' },
    { value: 'repair', label: 'Onarım' },
    { value: 'salary', label: 'Maaş' },
    { value: 'utility', label: 'Fatura' },
    { value: 'tax', label: 'Vergi' },
    { value: 'insurance', label: 'Sigorta' },
    { value: 'other_expense', label: 'Diğer Gider' },
  ],
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

  // State
  const [page, setPage] = useState(1);
  const [pageSize] = useState(10);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState<string | null>(null);
  const [categoryFilter, setCategoryFilter] = useState<string | null>(null);
  const [opened, { open, close }] = useDisclosure(false);
  const [deleteOpened, { open: openDelete, close: closeDelete }] = useDisclosure(false);
  const [editingTransaction, setEditingTransaction] = useState<CashTransaction | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [formData, setFormData] = useState<FormData>(initialFormData);

  // Queries
  const { data, isLoading, refetch } = useCashTransactions({
    page,
    pageSize,
    search: search || undefined,
    type: typeFilter as 'income' | 'expense' | undefined,
    category: categoryFilter || undefined,
  });

  const { data: paymentMethodsData } = usePaymentMethods();

  // Mutations
  const createMutation = useCreateCashTransaction();
  const updateMutation = useUpdateCashTransaction();
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
    return CATEGORIES[formData.type] || [];
  }, [formData.type]);

  // All categories for filter
  const allCategoryOptions = useMemo(() => {
    return [...CATEGORIES.income, ...CATEGORIES.expense];
  }, []);

  // Handlers
  const handleOpenCreate = () => {
    setEditingTransaction(null);
    setFormData(initialFormData);
    open();
  };

  const handleOpenEdit = (transaction: CashTransaction) => {
    setEditingTransaction(transaction);
    setFormData({
      type: transaction.type,
      category: transaction.category,
      amount: transaction.amount,
      currency: transaction.currency,
      transactionDate: new Date(transaction.transactionDate),
      paymentMethod: transaction.paymentMethod,
      description: transaction.description || '',
      reference: transaction.reference || '',
      notes: transaction.notes || '',
    });
    open();
  };

  const handleOpenDelete = (id: string) => {
    setDeletingId(id);
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

      if (editingTransaction) {
        await updateMutation.mutateAsync({ id: editingTransaction.id, ...payload });
        showToast({
          type: 'success',
          title: t('common.success'),
          message: t('cashTransactions.updated'),
        });
      } else {
        await createMutation.mutateAsync(payload);
        showToast({
          type: 'success',
          title: t('common.success'),
          message: t('cashTransactions.created'),
        });
      }
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
  const getPaymentMethodLabel = (code: string) => {
    const found = paymentMethodsData?.paymentMethods?.find((pm) => pm.code === code);
    return found?.name || code;
  };

  const totalPages = data ? Math.ceil(data.total / pageSize) : 0;

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
                  {data.summary.totalIncome.toLocaleString('tr-TR')} TRY
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
                  {data.summary.totalExpense.toLocaleString('tr-TR')} TRY
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
                  {data.summary.balance.toLocaleString('tr-TR')} TRY
                </Text>
              </div>
              <IconWallet size={32} color="var(--mantine-color-blue-6)" />
            </Group>
          </Paper>
        </SimpleGrid>
      )}

      {/* Filters */}
      <Paper p="md" withBorder mt="md">
        <Group>
          <TextInput
            placeholder={t('common.search')}
            leftSection={<IconSearch size={16} />}
            value={search}
            onChange={(e) => setSearch(e.currentTarget.value)}
            style={{ flex: 1 }}
          />
          <Select
            placeholder={t('cashTransactions.filterByType')}
            leftSection={<IconFilter size={16} />}
            data={[
              { value: 'income', label: t('cashTransactions.income') },
              { value: 'expense', label: t('cashTransactions.expense') },
            ]}
            value={typeFilter}
            onChange={setTypeFilter}
            clearable
            w={150}
          />
          <Select
            placeholder={t('cashTransactions.filterByCategory')}
            data={allCategoryOptions}
            value={categoryFilter}
            onChange={setCategoryFilter}
            clearable
            w={150}
          />
        </Group>
      </Paper>

      {/* Table */}
      <Paper withBorder mt="md">
        {isLoading ? (
          <Center py="xl">
            <Loader />
          </Center>
        ) : (
          <>
            <Table striped highlightOnHover>
              <Table.Thead>
                <Table.Tr>
                  <Table.Th>{t('cashTransactions.table.date')}</Table.Th>
                  <Table.Th>{t('cashTransactions.table.type')}</Table.Th>
                  <Table.Th>{t('cashTransactions.table.category')}</Table.Th>
                  <Table.Th>{t('cashTransactions.table.description')}</Table.Th>
                  <Table.Th>{t('cashTransactions.table.paymentMethod')}</Table.Th>
                  <Table.Th ta="right">{t('cashTransactions.table.amount')}</Table.Th>
                  <Table.Th ta="center">{t('common.actions')}</Table.Th>
                </Table.Tr>
              </Table.Thead>
              <Table.Tbody>
                {data?.transactions && data.transactions.length > 0 ? (
                  data.transactions.map((transaction) => (
                    <Table.Tr key={transaction.id}>
                      <Table.Td>{dayjs(transaction.transactionDate).format('DD.MM.YYYY')}</Table.Td>
                      <Table.Td>
                        <Badge
                          color={transaction.type === 'income' ? 'green' : 'red'}
                          leftSection={
                            transaction.type === 'income' ? (
                              <IconArrowUp size={12} />
                            ) : (
                              <IconArrowDown size={12} />
                            )
                          }
                        >
                          {transaction.type === 'income' ? t('cashTransactions.income') : t('cashTransactions.expense')}
                        </Badge>
                      </Table.Td>
                      <Table.Td>{getCategoryLabel(transaction.category)}</Table.Td>
                      <Table.Td>
                        <Text size="sm" lineClamp={1}>
                          {transaction.description || '-'}
                        </Text>
                      </Table.Td>
                      <Table.Td>{getPaymentMethodLabel(transaction.paymentMethod)}</Table.Td>
                      <Table.Td ta="right">
                        <Text fw={600} c={transaction.type === 'income' ? 'green' : 'red'}>
                          {transaction.type === 'income' ? '+' : '-'}
                          {transaction.amount.toLocaleString('tr-TR')} {transaction.currency}
                        </Text>
                      </Table.Td>
                      <Table.Td>
                        <Group justify="center" gap="xs">
                          <Menu position="bottom-end" withArrow>
                            <Menu.Target>
                              <ActionIcon variant="subtle" size="sm">
                                <IconDotsVertical size={16} />
                              </ActionIcon>
                            </Menu.Target>
                            <Menu.Dropdown>
                              <Menu.Item
                                leftSection={<IconEdit size={14} />}
                                onClick={() => handleOpenEdit(transaction)}
                              >
                                {t('common.edit')}
                              </Menu.Item>
                              <Menu.Item
                                leftSection={<IconTrash size={14} />}
                                color="red"
                                onClick={() => handleOpenDelete(transaction.id)}
                              >
                                {t('common.delete')}
                              </Menu.Item>
                            </Menu.Dropdown>
                          </Menu>
                        </Group>
                      </Table.Td>
                    </Table.Tr>
                  ))
                ) : (
                  <Table.Tr>
                    <Table.Td colSpan={7} ta="center" py="xl">
                      <Text c="dimmed">{t('cashTransactions.noData')}</Text>
                    </Table.Td>
                  </Table.Tr>
                )}
              </Table.Tbody>
            </Table>
            {totalPages > 1 && (
              <Group justify="center" p="md">
                <Pagination total={totalPages} value={page} onChange={setPage} />
              </Group>
            )}
          </>
        )}
      </Paper>

      {/* Create/Edit Modal */}
      <Modal
        opened={opened}
        onClose={close}
        title={editingTransaction ? t('cashTransactions.edit') : t('cashTransactions.create')}
        size="lg"
      >
        <Stack>
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
                category: '', // Reset category when type changes
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
            required
          />
          <DatePickerInput
            label={t('cashTransactions.form.date')}
            value={formData.transactionDate}
            onChange={(value) => setFormData({ ...formData, transactionDate: value })}
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
              loading={createMutation.isPending || updateMutation.isPending}
            >
              {editingTransaction ? t('common.save') : t('common.create')}
            </Button>
          </Group>
        </Stack>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal opened={deleteOpened} onClose={closeDelete} title={t('cashTransactions.deleteConfirm.title')} size="sm">
        <Text>{t('cashTransactions.deleteConfirm.message')}</Text>
        <Group justify="flex-end" mt="md">
          <Button variant="outline" onClick={closeDelete}>
            {t('common.cancel')}
          </Button>
          <Button color="red" onClick={handleDelete} loading={deleteMutation.isPending}>
            {t('common.delete')}
          </Button>
        </Group>
      </Modal>
    </Container>
  );
}
