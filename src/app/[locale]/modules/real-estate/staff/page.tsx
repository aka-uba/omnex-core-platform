import { StaffPageClient } from './StaffPageClient';

export const dynamic = 'force-dynamic';

export default async function StaffPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  return <StaffPageClient locale={locale} />;
}








