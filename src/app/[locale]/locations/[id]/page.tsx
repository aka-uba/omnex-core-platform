import { LocationDetailPageClient } from './LocationDetailPageClient';

export default async function LocationDetailPage({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}) {
  const { locale } = await params;
  return <LocationDetailPageClient locale={locale} />;
}








