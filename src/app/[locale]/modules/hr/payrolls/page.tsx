import { PayrollsPageClient } from './PayrollsPageClient';

interface PayrollsPageProps {
  params: Promise<{ locale: string }>;
}

export default async function PayrollsPage({ params }: PayrollsPageProps) {
  const { locale } = await params;
  return <PayrollsPageClient locale={locale} />;
}







