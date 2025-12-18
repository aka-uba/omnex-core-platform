import { TenantLicenseFormPageClient } from '@/app/[locale]/admin/tenant-licenses/create/TenantLicenseFormPageClient';

export default async function EditTenantLicensePage({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}) {
  const { locale, id } = await params;

  return <TenantLicenseFormPageClient locale={locale} licenseId={id} />;
}






