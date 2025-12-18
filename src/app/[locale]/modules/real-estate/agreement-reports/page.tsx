import { AgreementReportsPageClient } from './AgreementReportsPageClient';

export const dynamic = 'force-dynamic';

export default async function AgreementReportsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  return <AgreementReportsPageClient locale={locale} />;
}








