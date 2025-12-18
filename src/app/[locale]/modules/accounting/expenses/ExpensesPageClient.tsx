'use client';

import { Container } from '@mantine/core';
import { IconReceipt } from '@tabler/icons-react';
import { CentralPageHeader } from '@/components/headers/CentralPageHeader';
import { ExpenseList } from '@/modules/accounting/components/ExpenseList';
import { useParams } from 'next/navigation';
import { useTranslation } from '@/lib/i18n/client';

export function ExpensesPageClient({ locale }: { locale: string }) {
  const params = useParams();
  const currentLocale = (params?.locale as string) || locale;
  const { t } = useTranslation('modules/accounting');

  return (
    <Container size="xl" pt="xl">
      <CentralPageHeader
        title={t('expenses.title')}
        description={t('expenses.description')}
        namespace="modules/accounting"
        icon={<IconReceipt size={32} />}
        breadcrumbs={[
          { label: 'navigation.dashboard', href: `/${currentLocale}/dashboard`, namespace: 'global' },
          { label: 'menu.label', href: `/${currentLocale}/modules/accounting`, namespace: 'modules/accounting' },
          { label: 'expenses.title', namespace: 'modules/accounting' },
        ]}
        actions={[
          {
            label: t('actions.newExpense'),
            icon: <IconReceipt size={18} />,
            onClick: () => {
              window.location.href = `/${currentLocale}/modules/accounting/expenses/create`;
            },
            variant: 'filled',
          },
        ]}
      />
      <ExpenseList locale={currentLocale} />
    </Container>
  );
}








