import { TenantLicenseDetailPageClient } from '@/app/[locale]/admin/tenant-licenses/[id]/TenantLicenseDetailPageClient';

export default async function TenantLicenseDetailPage({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}) {
  const { locale, id } = await params;

  return <TenantLicenseDetailPageClient locale={locale} licenseId={id} />;
}






