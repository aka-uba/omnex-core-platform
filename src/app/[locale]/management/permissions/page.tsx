import { PermissionsPageClient } from './PermissionsPageClient';

export default async function PermissionsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  return <PermissionsPageClient locale={locale} />;
}




