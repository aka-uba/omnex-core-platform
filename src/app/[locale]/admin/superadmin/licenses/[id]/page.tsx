import { redirect } from 'next/navigation';

export default async function LicensePackageDetailPage({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}) {
  const { locale, id } = await params;
  redirect(`/${locale}/modules/license/packages/${id}`);
}


