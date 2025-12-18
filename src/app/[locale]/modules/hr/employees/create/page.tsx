import { CreateEmployeePageClient } from './CreateEmployeePageClient';

interface CreateEmployeePageProps {
  params: Promise<{ locale: string }>;
}

export default async function CreateEmployeePage({ params }: CreateEmployeePageProps) {
  const { locale } = await params;
  return <CreateEmployeePageClient locale={locale} />;
}

