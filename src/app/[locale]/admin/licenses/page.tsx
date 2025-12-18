import { redirect } from 'next/navigation';

export default async function LicensePackagesPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  redirect(`/${locale}/admin/licenses/dashboard`);
}

