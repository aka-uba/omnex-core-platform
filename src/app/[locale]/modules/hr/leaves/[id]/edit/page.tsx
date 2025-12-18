import { EditLeavePageClient } from './EditLeavePageClient';

interface EditLeavePageProps {
  params: Promise<{ locale: string; id: string }>;
}

export default async function EditLeavePage({ params }: EditLeavePageProps) {
  const { locale, id } = await params;
  return <EditLeavePageClient locale={locale} leaveId={id} />;
}







