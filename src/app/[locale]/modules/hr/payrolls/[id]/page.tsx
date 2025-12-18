import { PayrollDetailPageClient } from './PayrollDetailPageClient';

interface PayrollDetailPageProps {
  params: Promise<{ locale: string; id: string }>;
}

export default async function PayrollDetailPage({ params }: PayrollDetailPageProps) {
  const { locale, id } = await params;
  return <PayrollDetailPageClient locale={locale} payrollId={id} />;
}







