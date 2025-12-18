import { CreateContractTemplatePageClient } from './CreateContractTemplatePageClient';

export default async function CreateContractTemplatePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  return <CreateContractTemplatePageClient locale={locale} />;
}








