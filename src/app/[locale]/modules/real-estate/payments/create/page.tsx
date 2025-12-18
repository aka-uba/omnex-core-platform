import { CreatePaymentPageClient } from './CreatePaymentPageClient';

export const dynamic = 'force-dynamic';

export default async function CreatePaymentPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  return <CreatePaymentPageClient locale={locale} />;
}








