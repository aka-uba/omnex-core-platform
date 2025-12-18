'use client';

import { Container } from '@mantine/core';
import { IconReceipt } from '@tabler/icons-react';
import { CentralPageHeader } from '@/components/headers/CentralPageHeader';
import { ExpenseForm } from '@/modules/accounting/components/ExpenseForm';
import { useParams } from 'next/navigation';
import { useTranslation } from '@/lib/i18n/client';

export function EditExpensePageClient({ locale, expenseId }: { locale: string; expenseId: string }) {
  const params = useParams();
  const currentLocale = (params?.locale as string) || locale;
  const { t } = useTranslation('modules/accounting');

  return (
    <Container size="xl" pt="xl">
      <CentralPageHeader
        title={t('templates.edit.expense.title')}
        description={t('templates.edit.expense.description')}
        namespace="modules/accounting"
        icon={<IconReceipt size={32} />}
        breadcrumbs={[
          { label: 'navigation.dashboard', href: `/${currentLocale}/dashboard`, namespace: 'global' },
          { label: 'menu.label', href: `/${currentLocale}/modules/accounting`, namespace: 'modules/accounting' },
          { label: 'expenses.title', href: `/${currentLocale}/modules/accounting/expenses`, namespace: 'modules/accounting' },
          { label: t('form.edit'), namespace: 'modules/accounting' },
        ]}
      />
      <ExpenseForm locale={currentLocale} expenseId={expenseId} />
    </Container>
  );
}








