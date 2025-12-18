import { ApartmentsPageClient } from './ApartmentsPageClient';

export const dynamic = 'force-dynamic';

export default async function ApartmentsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  return <ApartmentsPageClient locale={locale} />;
}








