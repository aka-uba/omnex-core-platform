import { EditContractTemplatePageClient } from './EditContractTemplatePageClient';

export default async function EditContractTemplatePage({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}) {
  const { locale } = await params;
  return <EditContractTemplatePageClient locale={locale} />;
}








