import { ContractTemplateDetailPageClient } from './ContractTemplateDetailPageClient';

export default async function ContractTemplateDetailPage({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}) {
  const { locale, id } = await params;

  return <ContractTemplateDetailPageClient locale={locale} templateId={id} />;
}












