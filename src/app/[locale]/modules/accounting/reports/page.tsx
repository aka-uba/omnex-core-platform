import { AccountingReportsPageClient } from './AccountingReportsPageClient';

export default async function AccountingReportsPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  return <AccountingReportsPageClient locale={locale} />;
}







