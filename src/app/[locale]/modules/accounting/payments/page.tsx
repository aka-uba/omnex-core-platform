import { PaymentsPageClient } from './PaymentsPageClient';

export default async function PaymentsPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  return <PaymentsPageClient locale={locale} />;
}








