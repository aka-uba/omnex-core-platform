import { EditPropertyPageClient } from './EditPropertyPageClient';

export default async function EditPropertyPage({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}) {
  const { locale } = await params;
  return <EditPropertyPageClient locale={locale} />;
}








