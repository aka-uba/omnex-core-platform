import { PaymentsPageClient } from './PaymentsPageClient';

export const dynamic = 'force-dynamic';

export default async function PaymentsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  return <PaymentsPageClient locale={locale} />;
}








