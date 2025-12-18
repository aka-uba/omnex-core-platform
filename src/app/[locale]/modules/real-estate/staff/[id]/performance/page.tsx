import { StaffPerformancePageClient } from './StaffPerformancePageClient';

export const dynamic = 'force-dynamic';

export default async function StaffPerformancePage({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}) {
  const { locale, id } = await params;
  return <StaffPerformancePageClient locale={locale} staffId={id} />;
}








