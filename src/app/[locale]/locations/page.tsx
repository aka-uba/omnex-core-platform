import { LocationsPageClient } from './LocationsPageClient';

// Route segment config
export const dynamic = 'force-dynamic';

export default async function LocationsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;

  return <LocationsPageClient locale={locale} />;
}








