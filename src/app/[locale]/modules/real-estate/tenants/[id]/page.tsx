import { TenantDetailPageClient } from './TenantDetailPageClient';

export const dynamic = 'force-dynamic';

export default async function TenantDetailPage({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}) {
  const { locale } = await params;
  return <TenantDetailPageClient locale={locale} />;
}








