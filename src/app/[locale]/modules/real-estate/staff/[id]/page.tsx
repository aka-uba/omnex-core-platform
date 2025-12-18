import { StaffDetailPageClient } from './StaffDetailPageClient';

export const dynamic = 'force-dynamic';

export default async function StaffDetailPage({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}) {
  const { locale, id } = await params;
  return <StaffDetailPageClient locale={locale} staffId={id} />;
}








