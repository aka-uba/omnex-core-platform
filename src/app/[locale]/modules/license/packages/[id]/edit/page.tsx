import { LicensePackageFormPageClient } from '@/app/[locale]/admin/licenses/create/LicensePackageFormPageClient';

export default async function EditLicensePackagePage({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}) {
  const { locale, id } = await params;

  return <LicensePackageFormPageClient locale={locale} packageId={id} />;
}






