import { PropertyDetailPageClient } from './PropertyDetailPageClient';

export const dynamic = 'force-dynamic';

export default async function PropertyDetailPage({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}) {
  const { locale } = await params;
  return <PropertyDetailPageClient locale={locale} />;
}












