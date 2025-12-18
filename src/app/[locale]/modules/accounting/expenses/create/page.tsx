import { CreateExpensePageClient } from './CreateExpensePageClient';

export default async function CreateExpensePage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  return <CreateExpensePageClient locale={locale} />;
}








