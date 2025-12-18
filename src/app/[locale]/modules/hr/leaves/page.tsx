import { LeavesPageClient } from './LeavesPageClient';

interface LeavesPageProps {
  params: Promise<{ locale: string }>;
}

export default async function LeavesPage({ params }: LeavesPageProps) {
  const { locale } = await params;
  return <LeavesPageClient locale={locale} />;
}

