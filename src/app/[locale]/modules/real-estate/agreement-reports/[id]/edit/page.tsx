import { EditAgreementReportPageClient } from './EditAgreementReportPageClient';

export const dynamic = 'force-dynamic';

export default async function EditAgreementReportPage({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}) {
  const { locale, id } = await params;
  return <EditAgreementReportPageClient locale={locale} reportId={id} />;
}








