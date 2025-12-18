import { EmployeesPageClient } from './EmployeesPageClient';

interface EmployeesPageProps {
  params: Promise<{ locale: string }>;
}

export default async function EmployeesPage({ params }: EmployeesPageProps) {
  const { locale } = await params;
  return <EmployeesPageClient locale={locale} />;
}

