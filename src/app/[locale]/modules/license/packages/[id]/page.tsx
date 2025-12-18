import { LicensePackageDetailPageClient } from '@/app/[locale]/admin/licenses/[id]/LicensePackageDetailPageClient';

export default async function LicensePackageDetailPage({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}) {
  const { locale, id } = await params;

  return <LicensePackageDetailPageClient locale={locale} packageId={id} />;
}






