import { TenantLicensesPageClient } from '@/app/[locale]/admin/tenant-licenses/TenantLicensesPageClient';

export default async function LicenseTenantsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;

  return <TenantLicensesPageClient locale={locale} />;
}
