import { LicenseHistoryPageClient } from './LicenseHistoryPageClient';

export default async function LicenseHistoryPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;

  return <LicenseHistoryPageClient locale={locale} />;
}





