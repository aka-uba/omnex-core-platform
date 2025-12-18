import { EditEmployeePageClient } from './EditEmployeePageClient';

interface EditEmployeePageProps {
  params: Promise<{ locale: string; id: string }>;
}

export default async function EditEmployeePage({ params }: EditEmployeePageProps) {
  const { locale, id } = await params;
  return <EditEmployeePageClient locale={locale} employeeId={id} />;
}

