import { ContractTrackingPageClient } from './ContractTrackingPageClient';

export const dynamic = 'force-dynamic';

export default async function ContractTrackingPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  return <ContractTrackingPageClient locale={locale} />;
}








