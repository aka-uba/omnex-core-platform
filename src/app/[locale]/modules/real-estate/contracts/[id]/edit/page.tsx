import { EditContractPageClient } from './EditContractPageClient';

export default async function EditContractPage({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}) {
  const { locale } = await params;
  return <EditContractPageClient locale={locale} />;
}








