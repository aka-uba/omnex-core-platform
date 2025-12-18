import { CreatePayrollPageClient } from './CreatePayrollPageClient';

interface CreatePayrollPageProps {
  params: Promise<{ locale: string }>;
}

export default async function CreatePayrollPage({ params }: CreatePayrollPageProps) {
  const { locale } = await params;
  return <CreatePayrollPageClient locale={locale} />;
}







