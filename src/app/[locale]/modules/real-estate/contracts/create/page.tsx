import { CreateContractPageClient } from './CreateContractPageClient';

export default async function CreateContractPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  return <CreateContractPageClient locale={locale} />;
}








