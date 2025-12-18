import { AdminLoginPageClient } from './AdminLoginPageClient';

export default async function AdminLoginPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;

  return <AdminLoginPageClient locale={locale} />;
}



