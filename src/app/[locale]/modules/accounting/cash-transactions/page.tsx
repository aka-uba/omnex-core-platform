import { CashTransactionsPageClient } from './CashTransactionsPageClient';

export default async function CashTransactionsPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  return <CashTransactionsPageClient locale={locale} />;
}
