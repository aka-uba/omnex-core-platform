import { EditExpensePageClient } from './EditExpensePageClient';

export default async function EditExpensePage({ params }: { params: Promise<{ locale: string; id: string }> }) {
  const { locale, id } = await params;
  return <EditExpensePageClient locale={locale} expenseId={id} />;
}








