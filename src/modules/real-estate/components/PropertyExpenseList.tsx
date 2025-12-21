'use client';

import { useState } from 'react';
import {
  Paper,
  Table,
  Text,
  Group,
  Badge,
  ActionIcon,
  Menu,
  Button,
  Stack,
  TextInput,
  Select,
  Grid,
  Card,
  Title,
  Divider,
  Modal,
  NumberFormatter,
} from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import {
  IconDotsVertical,
  IconEdit,
  IconTrash,
  IconPlus,
  IconSearch,
  IconCash,
  IconFilter,
} from '@tabler/icons-react';
import { usePropertyExpenses, useDeletePropertyExpense } from '@/hooks/usePropertyExpenses';
import { useTranslation } from '@/lib/i18n/client';
import { showToast } from '@/modules/notifications/components/ToastNotification';
import { PropertyExpenseForm } from './PropertyExpenseForm';
import type { PropertyExpense, ExpenseCategory } from '@/modules/real-estate/types/property-expense';
import dayjs from 'dayjs';

interface PropertyExpenseListProps {
  locale: string;
  propertyId: string;
  propertyName?: string;
}

const CATEGORY_COLORS: Record<ExpenseCategory, string> = {
  utilities: 'blue',
  maintenance: 'orange',
  insurance: 'green',
  taxes: 'red',
  management: 'violet',
  cleaning: 'cyan',
  heating: 'yellow',
  other: 'gray',
};

export function PropertyExpenseList({ locale, propertyId, propertyName }: PropertyExpenseListProps) {
  const { t } = useTranslation('modules/real-estate');
  const { t: tGlobal } = useTranslation('global');
  const [search, setSearch] = useState('');
  const [yearFilter, setYearFilter] = useState<string | null>(String(new Date().getFullYear()));
  const [categoryFilter, setCategoryFilter] = useState<string | null>(null);
  const [opened, { open, close }] = useDisclosure(false);
  const [editingExpenseId, setEditingExpenseId] = useState<string | null>(null);

  const deleteExpense = useDeletePropertyExpense();

  const { data, isLoading, refetch } = usePropertyExpenses({
    propertyId,
    year: yearFilter ? parseInt(yearFilter) : undefined,
    category: categoryFilter || undefined,
    pageSize: 100,
  });

  const expenses = data?.expenses || [];

  // Calculate totals by category
  const categoryTotals = expenses.reduce((acc, exp) => {
    acc[exp.category] = (acc[exp.category] || 0) + exp.amount;
    return acc;
  }, {} as Record<string, number>);

  const totalAmount = expenses.reduce((sum, exp) => sum + exp.amount, 0);

  const handleEdit = (expenseId: string) => {
    setEditingExpenseId(expenseId);
    open();
  };

  const handleAdd = () => {
    setEditingExpenseId(null);
    open();
  };

  const handleDelete = async (expenseId: string) => {
    if (confirm(t('propertyExpenses.deleteConfirm'))) {
      try {
        await deleteExpense.mutateAsync(expenseId);
        showToast.success(t('propertyExpenses.deleteSuccess'));
      } catch {
        showToast.error(t('propertyExpenses.deleteError'));
      }
    }
  };

  const handleFormSuccess = () => {
    close();
    setEditingExpenseId(null);
    refetch();
  };

  const categoryOptions = [
    { value: 'utilities', label: t('propertyExpenses.categories.utilities') },
    { value: 'maintenance', label: t('propertyExpenses.categories.maintenance') },
    { value: 'insurance', label: t('propertyExpenses.categories.insurance') },
    { value: 'taxes', label: t('propertyExpenses.categories.taxes') },
    { value: 'management', label: t('propertyExpenses.categories.management') },
    { value: 'cleaning', label: t('propertyExpenses.categories.cleaning') },
    { value: 'heating', label: t('propertyExpenses.categories.heating') },
    { value: 'other', label: t('propertyExpenses.categories.other') },
  ];

  const yearOptions = Array.from({ length: 5 }, (_, i) => {
    const year = new Date().getFullYear() - i;
    return { value: String(year), label: String(year) };
  });

  const filteredExpenses = expenses.filter(exp =>
    exp.name.toLowerCase().includes(search.toLowerCase()) ||
    exp.vendorName?.toLowerCase().includes(search.toLowerCase()) ||
    exp.invoiceNumber?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <Stack gap="md">
      {/* Summary Card */}
      <Card withBorder p="md" radius="md">
        <Stack gap="md">
          <Group justify="space-between">
            <Group gap="xs">
              <IconCash size={20} />
              <Title order={4}>{t('propertyExpenses.summary')}</Title>
            </Group>
            <Badge size="lg" variant="filled" color="blue">
              {yearFilter || t('propertyExpenses.allYears')}
            </Badge>
          </Group>
          <Divider />
          <Grid>
            {Object.entries(categoryTotals).map(([category, amount]) => (
              <Grid.Col span={{ base: 6, md: 3 }} key={category}>
                <Stack gap={4}>
                  <Text size="xs" c="dimmed">
                    {t(`propertyExpenses.categories.${category}`)}
                  </Text>
                  <Text size="sm" fw={500}>
                    <NumberFormatter
                      value={amount}
                      thousandSeparator=","
                      decimalScale={2}
                      suffix=" ₺"
                    />
                  </Text>
                </Stack>
              </Grid.Col>
            ))}
            <Grid.Col span={12}>
              <Divider my="xs" />
              <Group justify="space-between">
                <Text fw={600}>{t('propertyExpenses.total')}</Text>
                <Text fw={700} size="lg" c="blue">
                  <NumberFormatter
                    value={totalAmount}
                    thousandSeparator=","
                    decimalScale={2}
                    suffix=" ₺"
                  />
                </Text>
              </Group>
            </Grid.Col>
          </Grid>
        </Stack>
      </Card>

      {/* Filters */}
      <Paper shadow="xs" p="md">
        <Grid align="flex-end">
          <Grid.Col span={{ base: 12, md: 4 }}>
            <TextInput
              placeholder={t('propertyExpenses.searchPlaceholder')}
              leftSection={<IconSearch size={16} />}
              value={search}
              onChange={(e) => setSearch(e.currentTarget.value)}
            />
          </Grid.Col>
          <Grid.Col span={{ base: 6, md: 2 }}>
            <Select
              placeholder={t('propertyExpenses.year')}
              data={yearOptions}
              value={yearFilter}
              onChange={setYearFilter}
              clearable
              leftSection={<IconFilter size={16} />}
            />
          </Grid.Col>
          <Grid.Col span={{ base: 6, md: 3 }}>
            <Select
              placeholder={t('propertyExpenses.category')}
              data={categoryOptions}
              value={categoryFilter}
              onChange={setCategoryFilter}
              clearable
            />
          </Grid.Col>
          <Grid.Col span={{ base: 12, md: 3 }}>
            <Button fullWidth leftSection={<IconPlus size={16} />} onClick={handleAdd}>
              {t('propertyExpenses.addExpense')}
            </Button>
          </Grid.Col>
        </Grid>
      </Paper>

      {/* Expenses Table */}
      <Paper shadow="xs" p="md">
        {isLoading ? (
          <Text ta="center" py="xl">{tGlobal('common.loading')}</Text>
        ) : filteredExpenses.length === 0 ? (
          <Text ta="center" py="xl" c="dimmed">{t('propertyExpenses.noExpenses')}</Text>
        ) : (
          <Table striped highlightOnHover>
            <Table.Thead>
              <Table.Tr>
                <Table.Th>{t('propertyExpenses.form.expenseDate')}</Table.Th>
                <Table.Th>{t('propertyExpenses.form.name')}</Table.Th>
                <Table.Th>{t('propertyExpenses.form.category')}</Table.Th>
                <Table.Th>{t('propertyExpenses.form.vendorName')}</Table.Th>
                <Table.Th ta="right">{t('propertyExpenses.form.amount')}</Table.Th>
                <Table.Th w={60}></Table.Th>
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {filteredExpenses.map((expense) => (
                <Table.Tr key={expense.id}>
                  <Table.Td>
                    {dayjs(expense.expenseDate).format('DD.MM.YYYY')}
                  </Table.Td>
                  <Table.Td>
                    <Stack gap={2}>
                      <Text size="sm" fw={500}>{expense.name}</Text>
                      {expense.invoiceNumber && (
                        <Text size="xs" c="dimmed">#{expense.invoiceNumber}</Text>
                      )}
                    </Stack>
                  </Table.Td>
                  <Table.Td>
                    <Badge
                      color={CATEGORY_COLORS[expense.category as ExpenseCategory] || 'gray'}
                      variant="light"
                    >
                      {t(`propertyExpenses.categories.${expense.category}`)}
                    </Badge>
                  </Table.Td>
                  <Table.Td>
                    <Text size="sm">{expense.vendorName || '-'}</Text>
                  </Table.Td>
                  <Table.Td ta="right">
                    <Text size="sm" fw={500}>
                      <NumberFormatter
                        value={expense.amount}
                        thousandSeparator=","
                        decimalScale={2}
                        suffix=" ₺"
                      />
                    </Text>
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
                          leftSection={<IconEdit size={14} />}
                          onClick={() => handleEdit(expense.id)}
                        >
                          {tGlobal('buttons.edit')}
                        </Menu.Item>
                        <Menu.Item
                          leftSection={<IconTrash size={14} />}
                          color="red"
                          onClick={() => handleDelete(expense.id)}
                        >
                          {tGlobal('buttons.delete')}
                        </Menu.Item>
                      </Menu.Dropdown>
                    </Menu>
                  </Table.Td>
                </Table.Tr>
              ))}
            </Table.Tbody>
          </Table>
        )}
      </Paper>

      {/* Add/Edit Modal */}
      <Modal
        opened={opened}
        onClose={close}
        title={editingExpenseId ? t('propertyExpenses.editExpense') : t('propertyExpenses.addExpense')}
        size="lg"
      >
        <PropertyExpenseForm
          locale={locale}
          propertyId={propertyId}
          propertyName={propertyName}
          expenseId={editingExpenseId || undefined}
          onSuccess={handleFormSuccess}
          onCancel={close}
        />
      </Modal>
    </Stack>
  );
}
