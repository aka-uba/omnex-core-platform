import { TenantLicenseFormPageClient } from '@/app/[locale]/admin/tenant-licenses/create/TenantLicenseFormPageClient';

export default async function CreateTenantLicensePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;

  return <TenantLicenseFormPageClient locale={locale} />;
}






