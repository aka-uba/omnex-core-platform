import { CreateLeavePageClient } from './CreateLeavePageClient';

interface CreateLeavePageProps {
  params: Promise<{ locale: string }>;
}

export default async function CreateLeavePage({ params }: CreateLeavePageProps) {
  const { locale } = await params;
  return <CreateLeavePageClient locale={locale} />;
}







