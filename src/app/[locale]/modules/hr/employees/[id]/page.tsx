import { EmployeeDetailPageClient } from './EmployeeDetailPageClient';

interface EmployeeDetailPageProps {
  params: Promise<{ locale: string; id: string }>;
}

export default async function EmployeeDetailPage({ params }: EmployeeDetailPageProps) {
  const { locale, id } = await params;
  return <EmployeeDetailPageClient locale={locale} employeeId={id} />;
}

