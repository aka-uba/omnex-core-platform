import { MapPageClient } from './MapPageClient';

export const dynamic = 'force-dynamic';

export default async function MapPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  return <MapPageClient locale={locale} />;
}








