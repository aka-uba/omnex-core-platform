import { ContractDetailPageClient } from './ContractDetailPageClient';

export default async function ContractDetailPage({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}) {
  const { locale, id } = await params;

  return <ContractDetailPageClient locale={locale} contractId={id} />;
}

