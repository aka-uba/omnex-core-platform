import { ContractsPageClient } from './ContractsPageClient';

export const dynamic = 'force-dynamic';

export default async function ContractsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  return <ContractsPageClient locale={locale} />;
}








