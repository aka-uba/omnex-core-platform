import { EditApartmentPageClient } from './EditApartmentPageClient';

export default async function EditApartmentPage({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}) {
  const { locale } = await params;
  return <EditApartmentPageClient locale={locale} />;
}








