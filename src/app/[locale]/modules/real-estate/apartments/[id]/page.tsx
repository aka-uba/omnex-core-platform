import { ApartmentDetailPageClient } from './ApartmentDetailPageClient';

export const dynamic = 'force-dynamic';

export default async function ApartmentDetailPage({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}) {
  const { locale } = await params;
  return <ApartmentDetailPageClient locale={locale} />;
}








