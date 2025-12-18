import { PaymentDetailPageClient } from './PaymentDetailPageClient';

export const dynamic = 'force-dynamic';

export default async function PaymentDetailPage({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}) {
  const { locale, id } = await params;
  return <PaymentDetailPageClient locale={locale} paymentId={id} />;
}

