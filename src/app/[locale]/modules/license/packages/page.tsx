import { LicensePackagesPageClient } from '@/app/[locale]/admin/licenses/LicensePackagesPageClient';

export default async function LicensePackagesPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;

  return <LicensePackagesPageClient locale={locale} />;
}
