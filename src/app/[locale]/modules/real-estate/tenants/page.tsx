import { TenantsPageClient } from './TenantsPageClient';

export const dynamic = 'force-dynamic';

export default async function TenantsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  return <TenantsPageClient locale={locale} />;
}








