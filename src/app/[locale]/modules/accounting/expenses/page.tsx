import { ExpensesPageClient } from './ExpensesPageClient';

export default async function ExpensesPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  return <ExpensesPageClient locale={locale} />;
}








