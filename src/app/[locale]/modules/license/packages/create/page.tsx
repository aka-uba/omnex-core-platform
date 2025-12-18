import { LicensePackageFormPageClient } from '@/app/[locale]/admin/licenses/create/LicensePackageFormPageClient';

export default async function CreateLicensePackagePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;

  return <LicensePackageFormPageClient locale={locale} />;
}






