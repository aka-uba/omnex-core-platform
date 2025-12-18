'use client';

import { Container, Paper, Group, Text, Badge, Stack, Grid } from '@mantine/core';
import { IconReceipt, IconEdit } from '@tabler/icons-react';
import { CentralPageHeader } from '@/components/headers/CentralPageHeader';
import { useExpense } from '@/hooks/useExpenses';
import { useParams, useRouter } from 'next/navigation';
import { useTranslation } from '@/lib/i18n/client';
import { DetailPageSkeleton } from '@/components/skeletons/DetailPageSkeleton';
import dayjs from 'dayjs';

export function ExpenseDetailPageClient({ locale, expenseId }: { locale: string; expenseId: string }) {
  const params = useParams();
  const router = useRouter();
  const currentLocale = (params?.locale as string) || locale;
  const { t } = useTranslation('modules/accounting');
  const { data: expense, isLoading } = useExpense(expenseId);

  if (isLoading) {
    return <DetailPageSkeleton />;
  }

  if (!expense) {
    return (
      <Container size="xl" pt="xl">
        <Text c="red">{t('common.notFound')}</Text>
      </Container>
    );
  }

  const getTypeBadge = (type: string) => {
    const typeColors: Record<string, string> = {
      operational: 'blue',
      subscription: 'green',
      maintenance: 'orange',
      rent: 'purple',
      utility: 'cyan',
      other: 'gray',
    };
    return (
      <Badge color={typeColors[type] || 'gray'}>
        {t(`expenses.types.${type}`)}
      </Badge>
    );
  };

  const getStatusBadge = (status: string) => {
    const statusColors: Record<string, string> = {
      pending: 'yellow',
      approved: 'green',
      rejected: 'red',
    };
    return (
      <Badge color={statusColors[status] || 'gray'}>
        {t(`expenses.status.${status}`)}
      </Badge>
    );
  };

  return (
    <Container size="xl" pt="xl">
      <CentralPageHeader
        title={expense.name}
        description={expense.category}
        namespace="modules/accounting"
        icon={<IconReceipt size={32} />}
        breadcrumbs={[
          { label: 'navigation.dashboard', href: `/${currentLocale}/dashboard`, namespace: 'global' },
          { label: 'menu.label', href: `/${currentLocale}/modules/accounting`, namespace: 'modules/accounting' },
          { label: 'expenses.title', href: `/${currentLocale}/modules/accounting/expenses`, namespace: 'modules/accounting' },
          { label: expense.name, namespace: 'modules/accounting' },
        ]}
        actions={[
          {
            label: t('form.edit'),
            icon: <IconEdit size={18} />,
            onClick: () => {
              router.push(`/${currentLocale}/modules/accounting/expenses/${expenseId}/edit`);
            },
            variant: 'light',
          },
        ]}
      />
      <Paper shadow="xs" p="md" mt="md">
        <Stack gap="md">
          <Group>
            <Text fw={500} size="lg">{expense.name}</Text>
            {getTypeBadge(expense.type)}
            {getStatusBadge(expense.status)}
            <Badge color={expense.isActive ? 'green' : 'gray'}>
              {expense.isActive ? t('status.active') : t('status.inactive')}
            </Badge>
          </Group>

          <Grid>
            <Grid.Col span={{ base: 12, md: 6 }}>
              <Text size="sm" c="dimmed">{t('expenses.form.category')}</Text>
              <Text fw={500}>{expense.category}</Text>
            </Grid.Col>
            <Grid.Col span={{ base: 12, md: 6 }}>
              <Text size="sm" c="dimmed">{t('expenses.form.amount')}</Text>
              <Text fw={500} size="lg">
                {Number(expense.amount).toLocaleString('tr-TR', {
                  style: 'currency',
                  currency: expense.currency || 'TRY',
                })}
              </Text>
            </Grid.Col>
            <Grid.Col span={{ base: 12, md: 6 }}>
              <Text size="sm" c="dimmed">{t('expenses.form.expenseDate')}</Text>
              <Text fw={500}>{dayjs(expense.expenseDate).format('DD.MM.YYYY')}</Text>
            </Grid.Col>
            {expense.description && (
              <Grid.Col span={{ base: 12 }}>
                <Text size="sm" c="dimmed">{t('expenses.form.description')}</Text>
                <Text>{expense.description}</Text>
              </Grid.Col>
            )}
            <Grid.Col span={{ base: 12, md: 6 }}>
              <Text size="sm" c="dimmed">{t('form.createdAt')}</Text>
              <Text fw={500}>{dayjs(expense.createdAt).format('DD.MM.YYYY HH:mm')}</Text>
            </Grid.Col>
            <Grid.Col span={{ base: 12, md: 6 }}>
              <Text size="sm" c="dimmed">{t('form.updatedAt')}</Text>
              <Text fw={500}>{dayjs(expense.updatedAt).format('DD.MM.YYYY HH:mm')}</Text>
            </Grid.Col>
          </Grid>
        </Stack>
      </Paper>
    </Container>
  );
}








