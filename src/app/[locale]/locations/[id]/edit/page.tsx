import { EditLocationPageClient } from './EditLocationPageClient';

export default async function EditLocationPage({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}) {
  const { locale } = await params;
  return <EditLocationPageClient locale={locale} />;
}








