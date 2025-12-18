import { redirect } from 'next/navigation';

export default async function TenantLicenseDetailPage({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}) {
  const { locale, id } = await params;
  redirect(`/${locale}/modules/license/tenants/${id}`);
}


