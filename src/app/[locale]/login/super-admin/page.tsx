import { SuperAdminLoginPageClient } from './SuperAdminLoginPageClient';

export default async function SuperAdminLoginPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;

  return <SuperAdminLoginPageClient locale={locale} />;
}



