import { ReportsPageClient } from './ReportsPageClient';

export const dynamic = 'force-dynamic';

export default async function ReportsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  return <ReportsPageClient locale={locale} />;
}




