import { CreateApartmentPageClient } from './CreateApartmentPageClient';

export default async function CreateApartmentPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  return <CreateApartmentPageClient locale={locale} />;
}








