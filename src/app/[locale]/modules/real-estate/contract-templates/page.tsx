import { ContractTemplatesPageClient } from './ContractTemplatesPageClient';

export const dynamic = 'force-dynamic';

export default async function ContractTemplatesPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  return <ContractTemplatesPageClient locale={locale} />;
}








