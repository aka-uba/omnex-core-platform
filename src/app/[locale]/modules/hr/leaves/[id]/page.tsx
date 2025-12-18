import { LeaveDetailPageClient } from './LeaveDetailPageClient';

interface LeaveDetailPageProps {
  params: Promise<{ locale: string; id: string }>;
}

export default async function LeaveDetailPage({ params }: LeaveDetailPageProps) {
  const { locale, id } = await params;
  return <LeaveDetailPageClient locale={locale} leaveId={id} />;
}







