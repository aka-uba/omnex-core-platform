import { EditPayrollPageClient } from './EditPayrollPageClient';

interface EditPayrollPageProps {
  params: Promise<{ locale: string; id: string }>;
}

export default async function EditPayrollPage({ params }: EditPayrollPageProps) {
  const { locale, id } = await params;
  return <EditPayrollPageClient locale={locale} payrollId={id} />;
}







