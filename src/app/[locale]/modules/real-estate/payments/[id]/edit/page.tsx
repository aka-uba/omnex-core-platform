import { EditPaymentPageClient } from './EditPaymentPageClient';

export const dynamic = 'force-dynamic';

export default async function EditPaymentPage({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}) {
  const { locale } = await params;
  return <EditPaymentPageClient locale={locale} />;
}








