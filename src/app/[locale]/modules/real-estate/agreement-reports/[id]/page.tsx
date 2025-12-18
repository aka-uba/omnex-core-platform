import { AgreementReportDetailPageClient } from './AgreementReportDetailPageClient';

export const dynamic = 'force-dynamic';

export default async function AgreementReportDetailPage({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}) {
  const { locale, id } = await params;
  return <AgreementReportDetailPageClient locale={locale} reportId={id} />;
}








