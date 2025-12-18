import { CreateAgreementReportPageClient } from './CreateAgreementReportPageClient';

export const dynamic = 'force-dynamic';

export default async function CreateAgreementReportPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ appointmentId?: string }>;
}) {
  const { locale } = await params;
  const { appointmentId } = await searchParams;
  return <CreateAgreementReportPageClient locale={locale} {...(appointmentId ? { appointmentId } : {})} />;
}








