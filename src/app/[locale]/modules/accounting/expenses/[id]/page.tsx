import { ExpenseDetailPageClient } from './ExpenseDetailPageClient';

export default async function ExpenseDetailPage({ params }: { params: Promise<{ locale: string; id: string }> }) {
  const { locale, id } = await params;
  return <ExpenseDetailPageClient locale={locale} expenseId={id} />;
}








